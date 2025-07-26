// hooks/useCartService.ts (Updated and Secure)

import { getCart, saveCart } from '@/lib/actions/cart.actions';
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions';
import { Cart, OrderItem, ShippingAddress } from '@/types';
import { useSession } from 'next-auth/react';
import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import Cookies from 'js-cookie';

// ❌ No longer importing server-side JWT functions
// import { signCart, verifyCartToken } from '@/utils/jwt';

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
    const token = Cookies.get('cart');
    if (!token) return initialState;

    try {
      // ✅ FIX: Corrected the API endpoint to match the file structure.
      const response = await fetch('/api/session-cart');

      if (!response.ok) {
        console.error('Failed to get cart from server, status:', response.status);
        Cookies.remove('cart'); // Remove invalid cookie
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
  // hooks/useCartService.ts

  useEffect(() => {
    const loadCart = async () => {
      if (isInitialized || status === 'loading') return;

      if (status === 'authenticated' && session?.user?.id) {
        try {
          const cookieCart = await getCartFromServerSession();
          const dbCart = (await getCart(session.user.id)) || initialState;

          // SCENARIO 1: Guest logs in, merge the cookie cart with their DB cart.
          if (cookieCart.items.length > 0) {
            const mergedItems = [...dbCart.items];
            const itemSet = new Set(mergedItems.map(item => `${item.product}-${item.color}-${item.size}`));

            cookieCart.items.forEach(cookieItem => {
              const itemKey = `${cookieItem.product}-${cookieItem.color}-${cookieItem.size}`;
              if (!itemSet.has(itemKey)) {
                mergedItems.push(cookieItem);
              }
            });

            // Prioritize the guest's most recent shipping address and delivery choice
            const finalShippingAddress = cookieCart.shippingAddress || dbCart.shippingAddress;
            const finalDeliveryIndex = cookieCart.deliveryDateIndex ?? dbCart.deliveryDateIndex;

            const calculatedCart = await calcDeliveryDateAndPrice({
              items: mergedItems,
              shippingAddress: finalShippingAddress,
              deliveryDateIndex: finalDeliveryIndex,
            });

            // Combine the DB cart, the more recent cookie cart info, and fresh calculations
            const finalCart = {
              ...dbCart,
              ...cookieCart,
              ...calculatedCart,
              items: mergedItems,
              shippingAddress: finalShippingAddress,
              deliveryDateIndex: finalDeliveryIndex,
            };

            await saveCart(session.user.id, finalCart);
            setCart(finalCart);
            Cookies.remove('cart'); // Clear the guest cookie AFTER successful merge

          } else if (dbCart.items.length > 0) {
            // SCENARIO 2: A returning user with a saved cart (no merge needed).
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: dbCart.items,
              shippingAddress: dbCart.shippingAddress,
              deliveryDateIndex: dbCart.deliveryDateIndex,
            });
            // ✅ FIX: Combine dbCart with calculatedCart, preserving saved address/payment.
            const finalCart = { ...dbCart, ...calculatedCart };
            setCart(finalCart);
          } else {
            // SCENARIO 3: A new or existing user with a completely empty cart.
            setCart(initialState);
          }
        } catch (error) {
          console.error("Failed to load or merge cart:", error);
          setCart(initialState);
        }
      } else if (status === 'unauthenticated') {
        // Logic for guests remains the same
        const cookieCart = await getCartFromServerSession();
        setCart(cookieCart);
      }
      setIsInitialized(true);
    };

    loadCart();
  }, [status, session?.user?.id, isInitialized, getCartFromServerSession, setCart, setIsInitialized]);

  // ✅ This function now securely updates the cart by calling the server API route.
  const updateCart = useCallback(async (newCart: Cart) => {
    setCart(newCart);
    if (session?.user?.id) {
      await saveCart(session.user.id, newCart);
    } else {
      // For guests, send the cart data to the server to get a signed token.
      try {
        // ✅ FIX: Corrected the API endpoint to match the file structure.
        const response = await fetch('/api/session-cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCart),
        });
        const data = await response.json();
        if (data.token) {
          Cookies.set('cart', data.token, { expires: 7, path: '/' });
        }
      } catch (error) {
        console.error('Failed to save cart to session:', error);
      }
    }
  }, [session?.user?.id, setCart]);


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
          : x
      )
      : [...cart.items, { ...item, quantity }];

    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress, deliveryDateIndex: cart.deliveryDateIndex });
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

    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress, deliveryDateIndex: cart.deliveryDateIndex });
    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });
  };

  const removeItem = async (item: OrderItem) => {
    const updatedItems = cart.items.filter(
      (x) =>
        x.product !== item.product ||
        x.color !== item.color ||
        x.size !== item.size
    );
    const calculatedCart = await calcDeliveryDateAndPrice({ items: updatedItems, shippingAddress: cart.shippingAddress, deliveryDateIndex: cart.deliveryDateIndex });
    await updateCart({ ...cart, ...calculatedCart, items: updatedItems });
  };

  const clearCart = async () => {
    await updateCart({ ...initialState, items: [] });
  };

  const setShippingAddress = async (shippingAddress: ShippingAddress) => {
    const calculatedCart = await calcDeliveryDateAndPrice({ items: cart.items, shippingAddress, deliveryDateIndex: cart.deliveryDateIndex });
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
    const calculatedCart = await calcDeliveryDateAndPrice({ items: cart.items, shippingAddress: newShippingAddress, deliveryDateIndex: cart.deliveryDateIndex });
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
