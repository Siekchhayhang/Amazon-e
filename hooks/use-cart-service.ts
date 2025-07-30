import { getCart, saveCart, mergeCarts } from '@/lib/actions/cart.actions';
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions';
import { Cart, OrderItem, ShippingAddress } from '@/types';
import { useSession } from 'next-auth/react';
import { useEffect, useCallback } from 'react';
import { create } from 'zustand';

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

interface CartState {
  isInitialized: boolean; // State to prevent re-initialization
  cart: Cart;
  setCart: (cart: Cart) => void;
  setIsInitialized: (isInitialized: boolean) => void;

}

const useCartStore = create<CartState>((set) => ({
  isInitialized: false,
  cart: initialState,
  setCart: (cart) => set({ cart }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),

}));

export default function useCartService() {
  const { data: session, status } = useSession();
  const { cart, setCart, isInitialized, setIsInitialized } = useCartStore();
  // ✅ This function now securely gets the cart by calling the server API route.
  const getCartFromServerSession = useCallback(async (): Promise<Cart> => {
    try {
      const response = await fetch('/api/cart/session-cart');
      if (!response.ok) {
        console.error(
          'Failed to get cart from server, status:',
          response.status
        );
        return initialState;
      }
      const data = await response.json();
      if (data && typeof data === 'object' && 'items' in data) {
        return data as Cart;
      }
    } catch (error) {
      console.error('Error fetching cart from server session:', error);
    }
    return initialState;
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      if (isInitialized || status === 'loading') return;
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const cookieCart = await getCartFromServerSession();
          const dbCart = (await getCart(session.user.id)) || { items: [] };
          let finalCart = dbCart;

          if (cookieCart.items.length > 0) {
            const mergedCart = await mergeCarts(
              session.user.id,
              cookieCart.items
            );
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: mergedCart.items,
            });
            finalCart = { ...dbCart, ...mergedCart, ...calculatedCart };
            // Clear the cookie by calling the new API endpoint
            await fetch('/api/cart/clear-session-cart', { method: 'POST' });
          } else if (dbCart && dbCart.items) {
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: dbCart.items,
            });
            finalCart = {
              ...initialState,
              ...calculatedCart,
              items: dbCart.items,
            };
          }
          setCart(finalCart);
        } catch (error) {
          console.error('Failed to load or merge cart:', error);
          setCart(initialState);
        }
      } else if (status === 'unauthenticated') {
        const cookieCart = await getCartFromServerSession();
        setCart(cookieCart);
      }
      setIsInitialized(true);
    };
    loadCart();
  }, [
    status,
    session?.user?.id,
    isInitialized,
    getCartFromServerSession,
    setCart,
    setIsInitialized,
  ]);

  const updateCart = useCallback(
    async (newCart: Cart) => {
      setCart(newCart);
      if (session?.user?.id) {
        await saveCart(session.user.id, newCart);
      } else {
        try {
          await fetch('/api/cart/session-cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCart),
          });
        } catch (error) {
          console.error('Failed to save cart to session:', error);
        }
      }
    },
    [session?.user?.id, setCart]
  );

  const addItem = async (item: OrderItem, quantity: number) => {
    // Client-side stock check is good for UX, but remember to re-validate on the server!
    const existItem = cart.items.find(
      (x) => x.product === item.product && x.color === item.color && x.size === item.size
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
          : x) : [...cart.items, { ...item, quantity }];

    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress });

    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });

    return item.clientId;

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
    await updateCart({ ...initialState, items: [] });
  };
  const setShippingAddress = async (shippingAddress: ShippingAddress) => {
    const calculatedCart = await calcDeliveryDateAndPrice({ items: cart.items, shippingAddress });
    await updateCart({ ...cart, ...calculatedCart, shippingAddress });
  };

  const setPaymentMethod = (paymentMethod: string) => {
    setCart({ ...cart, paymentMethod });
  };

  const editShippingAddress = async (updatedAddress: Partial<ShippingAddress>) => {
    const newShippingAddress: ShippingAddress = {
      ...(cart.shippingAddress as ShippingAddress),
      ...updatedAddress,
    };
    const calculatedCart = await calcDeliveryDateAndPrice({ items: cart.items, shippingAddress: newShippingAddress });
    await updateCart({ ...cart, ...calculatedCart, shippingAddress: newShippingAddress });
  };

  const setDeliveryDateIndex = async (index: number) => {
    const calculatedCart = await calcDeliveryDateAndPrice({
      items: cart.items,
      shippingAddress: cart.shippingAddress,
      deliveryDateIndex: index,
    });
    await updateCart({ ...cart, ...calculatedCart });
  };
  return {
    cart,
    isInitialized,
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