import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { Cart, OrderItem, ShippingAddress } from '@/types'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
}

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => void
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  editShippingAddress: (updatedAddress: Partial<ShippingAddress>) => Promise<void>
  init: (userId: string) => void
}

const cartStore = create(
  persist<CartState>(
    (set, get) => ({
      cart: initialState,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < item.quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
            x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
              ? { ...existItem, quantity: existItem.quantity + quantity }
              : x
          )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) {
          throw new Error('Item not found in cart')
        }
        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return
        const updatedCartItems = items.map((x) =>
          x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
            ? { ...exist, quantity: quantity }
            : x
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
      },
      removeItem: async (item: OrderItem) => {
        const { items, shippingAddress } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )
        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedCartItems,
              shippingAddress,
            })),
          },
        })
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const { items } = get().cart
        set({
          cart: {
            ...get().cart,
            shippingAddress,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress,
            })),
          },
        })
      },

      editShippingAddress: async (updatedAddress: Partial<ShippingAddress>) => {
        const { cart } = get()
        const newShippingAddress: ShippingAddress = {
          ...cart.shippingAddress,
          ...updatedAddress,
        } as ShippingAddress

        set({
          cart: {
            ...cart,
            shippingAddress: newShippingAddress,
            ...(await calcDeliveryDateAndPrice({
              items: cart.items,
              shippingAddress: newShippingAddress,
            })),
          },
        })
      },

      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        const { items, shippingAddress } = get().cart

        set({
          cart: {
            ...get().cart,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress,
              deliveryDateIndex: index,
            })),
          },
        })
      },
      clearCart: () => {
        set({
          cart: {
            ...get().cart,
            items: [],
          },
        })
      },
      init: (userId: string) => {
        cartStore.persist.setOptions({
          name: `cart-store-${userId}`,
        })
        const guestCart = cartStore.getState().cart
        if (guestCart.items.length > 0) {
          // transfer guest cart to user cart
          set({ cart: guestCart })
        }
        // Clear guest cart
        localStorage.removeItem('cart-store')
      },
    }),
    {
      name: 'cart-store',
    }
  )
)

export default function useCartService() {
  const { data: session } = useSession()
  const {
    cart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setShippingAddress,
    setPaymentMethod,
    setDeliveryDateIndex,
    editShippingAddress,
    init,
  } = cartStore()

  useEffect(() => {
    if (session?.user?.id) {
      init(session.user.id)
    }
  }, [session?.user?.id, init])

  return {
    cart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    setShippingAddress,
    setPaymentMethod,
    setDeliveryDateIndex,
    editShippingAddress,
  }
}