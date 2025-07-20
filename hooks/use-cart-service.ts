import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
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
  const { data: session } = useSession();
  const { cart, setCart } = useCartStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load the user's cart from the database upon login.
  useEffect(() => {
    const loadCart = async () => {
      if (session?.user?.id && !isInitialized) {
        try {
          const dbCart = await getCart(session.user.id);
          if (dbCart && dbCart.items) {
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: dbCart.items,
            });
            setCart({ ...initialState, ...calculatedCart, items: dbCart.items });
          }
        } finally {
          setIsInitialized(true);
        }
      } else if (!session?.user?.id) {
        // For guest users, reset to initial state.
        setCart(initialState);
        setIsInitialized(true);
      }
    };
    loadCart();
  }, [session?.user?.id, isInitialized, setCart]);

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
    // Only update the local state, as this doesn't need to be saved in the DB cart
    setCart({ ...cart, ...calculatedCart });
  };

  return {
    isInitialized,
    cart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setShippingAddress,
    setPaymentMethod,
    editShippingAddress,
    setDeliveryDateIndex,
  };
}
