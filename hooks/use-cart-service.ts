import { signOut, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions';
import { getCart, saveCart } from '@/lib/actions/cart.actions';
import { Cart, OrderItem, ShippingAddress } from '@/types';

// The initial state for a new or empty cart.
const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
};

// The Zustand store now only manages the local state synchronously.
interface CartState {
  cart: Cart;
  setCart: (cart: Cart) => void;
}

const useCartStore = create<CartState>((set) => ({
  cart: initialState,
  setCart: (cart) => set({ cart }),
}));

// The main hook that orchestrates state, API calls, and session management.
export default function useCartService() {
  const { data: session, status } = useSession();
  const { cart, setCart } = useCartStore();

  useEffect(() => {
    const loadCart = async () => {
      // When the session is authenticated, load the user's cart from the database.
      if (status === 'authenticated' && session.user.id) {
        try {
          const dbCart = await getCart(session.user.id);
          if (dbCart && dbCart.items) {
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: dbCart.items,
            });
            setCart({ ...initialState, ...calculatedCart, items: dbCart.items });
          } else {
            // If the user has no cart in the database, ensure the local state is clean.
            setCart(initialState);
          }
        } catch (error) {
          console.error("Failed to load cart from database:", error);
          setCart(initialState); // Reset to empty cart on error
        }
      }
      // When the user is not authenticated, reset the cart to its initial empty state.
      else if (status === 'unauthenticated') {
        setCart(initialState);
      }
      // While the session is loading, we do nothing.
    };
    loadCart();
  }, [status, session?.user?.id, setCart]);

  // Helper function to update both local state and the database.
  const updateCart = async (newCart: Cart) => {
    setCart(newCart);
    if (session?.user?.id) {
      await saveCart(session.user.id, newCart);
    }
  };

  // Public actions that components will use.
  const addItem = async (item: OrderItem, quantity: number) => {
    const existItem = cart.items.find(
      (x) =>
        x.product === item.product &&
        x.color === item.color &&
        x.size === item.size
    );

    if (existItem && existItem.countInStock < quantity + existItem.quantity) {
      throw new Error('Not enough items in stock');
    }
    if (!existItem && item.countInStock < quantity) {
      throw new Error('Not enough items in stock');
    }

    const updatedItems = existItem
      ? cart.items.map((x) =>
        x.product === existItem.product && x.color === existItem.color && x.size === existItem.size
          ? { ...existItem, quantity: existItem.quantity + quantity }
          : x
      )
      : [...cart.items, { ...item, quantity }];

    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress });
    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });
  };

  const updateItem = async (item: OrderItem, quantity: number) => {
    const existItem = cart.items.find(
      (x) =>
        x.product === item.product &&
        x.color === item.color &&
        x.size === item.size
    );
    if (!existItem) return;

    const updatedItems = cart.items.map((x) =>
      x.product === existItem.product && x.color === existItem.color && x.size === existItem.size
        ? { ...existItem, quantity }
        : x
    );

    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress });
    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });
  };


  const removeItem = async (item: OrderItem) => {
    const updatedItems = cart.items.filter(
      (x) =>
        x.product !== item.product ||
        x.color !== item.color ||
        x.size !== item.size
    );
    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress });
    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });
  };

  const clearCart = async () => {
    await updateCart({ ...cart, items: [], itemsPrice: 0, taxPrice: 0, shippingPrice: 0, totalPrice: 0 });
  };

  const setShippingAddress = (shippingAddress: ShippingAddress) => {
    setCart({ ...cart, shippingAddress });
  };
  const setPaymentMethod = (paymentMethod: string) => {
    setCart({ ...cart, paymentMethod });
  };

  const editShippingAddress = async (updatedAddress: Partial<ShippingAddress>) => {
    const newShippingAddress: ShippingAddress = {
      ...(cart.shippingAddress as ShippingAddress),
      ...updatedAddress,
    };
    setCart({ ...cart, shippingAddress: newShippingAddress });
  };

  const setDeliveryDateIndex = async (index: number) => {
    const calculatedCart = await calcDeliveryDateAndPrice({
      items: cart.items,
      shippingAddress: cart.shippingAddress,
      deliveryDateIndex: index,
    });
    setCart({ ...cart, ...calculatedCart });
  };

  //Added a dedicated sign-out function to clear the cart immediately.
  const signOutAndClearCart = async () => {
    // 1. Immediately clear the client-side cart state.
    setCart(initialState);
    // 2. Proceed with the standard sign-out process from NextAuth.
    await signOut({ callbackUrl: '/' });
  };

  return {
    cart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setShippingAddress,
    setPaymentMethod,
    editShippingAddress,
    setDeliveryDateIndex,
    signOut: signOutAndClearCart,
  };
}
