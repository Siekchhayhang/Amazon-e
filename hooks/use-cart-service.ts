import { getCart, saveCart } from '@/lib/actions/cart.actions';
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions';
import { Cart, OrderItem, ShippingAddress } from '@/types';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { create } from 'zustand';
import Cookies from 'js-cookie';

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
  cart: Cart;
  setCart: (cart: Cart) => void;
}

const useCartStore = create<CartState>((set) => ({
  cart: initialState,
  setCart: (cart) => set({ cart }),
}));

export default function useCartService() {
  const { data: session, status } = useSession();
  const { cart, setCart } = useCartStore();

  const getCartFromCookies = () => {
    const cartFromCookies = Cookies.get('cart');
    if (cartFromCookies) {
      return JSON.parse(cartFromCookies);
    }
    return initialState;
  };

  useEffect(() => {
    const loadCart = async () => {
      if (status === 'authenticated' && session.user.id) {
        try {
          const cookieCart = getCartFromCookies();
          const dbCart = await getCart(session.user.id);

          if (cookieCart.items.length > 0) {
            const mergedItems = [...dbCart.items, ...cookieCart.items];
            const uniqueItems = Array.from(new Set(mergedItems.map(item => item.product)))
              .map(product => {
                return mergedItems.find(item => item.product === product);
              });

            const calculatedCart = await calcDeliveryDateAndPrice({
              items: uniqueItems,
            });
            await saveCart(session.user.id, { ...dbCart, ...calculatedCart, items: uniqueItems });
            setCart({ ...initialState, ...calculatedCart, items: uniqueItems });
            Cookies.remove('cart');
          } else if (dbCart && dbCart.items) {
            const calculatedCart = await calcDeliveryDateAndPrice({
              items: dbCart.items,
            });
            setCart({ ...initialState, ...calculatedCart, items: dbCart.items });
          } else {
            setCart(initialState);
          }
        } catch (error) {
          console.error("Failed to load cart from database:", error);
          setCart(initialState);
        }
      } else if (status === 'unauthenticated') {
        setCart(getCartFromCookies());
      }
    };
    loadCart();
  }, [status, session?.user?.id, setCart]);

  const updateCart = async (newCart: Cart) => {
    setCart(newCart);
    if (session?.user?.id) {
      await saveCart(session.user.id, newCart);
    } else {
      Cookies.set('cart', JSON.stringify(newCart));
    }
  };

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
  };
}
