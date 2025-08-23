'use server'

import { auth } from '@/auth'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/emails'
import { Cart, IOrderList, OrderItem, ShippingAddress } from '@/types'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'
import { DateRange } from 'react-day-picker'
import { connectToDatabase } from '../db'
import Order, { IOrder } from '../db/models/order.model'
import Product from '../db/models/product.model'
import User from '../db/models/user.model'
import { paypal } from '../paypal'
import { formatError, round2 } from '../utils'
import { OrderInputSchema } from '../validator'
import { getSetting } from './setting.actions'
import { MONGODB_URI } from '../constants'
import ApprovalRequest from '../db/models/approvalRequest.model'
import StockMovement from '../db/models/stockMovement.model'


// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')
    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )
    return {
      success: true,
      message: 'Order placed successfully',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string
) => {
  const calculatedPart = await calcDeliveryDateAndPrice({
    items: clientSideCart.items,
    shippingAddress: clientSideCart.shippingAddress,
    deliveryDateIndex: clientSideCart.deliveryDateIndex,
  });

  const order = OrderInputSchema.parse({
    user: userId,
    // ✅ FIX: Use the secure items array returned from the calculation
    items: calculatedPart.items,
    shippingAddress: clientSideCart.shippingAddress,
    paymentMethod: clientSideCart.paymentMethod,
    itemsPrice: calculatedPart.itemsPrice,
    shippingPrice: calculatedPart.shippingPrice,
    taxPrice: calculatedPart.taxPrice,
    totalPrice: calculatedPart.totalPrice,
    expectedDeliveryDate: calculatedPart.expectedDeliveryDate,
  });
  return await Order.create(order);
};

export async function updateOrderToPaid(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()
    if (!MONGODB_URI?.startsWith('mongodb://localhost'))
      await updateProductStock(order._id)
    if (order.user.email) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await Order.findOneAndUpdate(
      { _id: orderId },
      { isPaid: true, paidAt: new Date() },
      opts
    )
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      product.countInStock -= item.quantity
      await Product.updateOne(
        { _id: product._id },
        { countInStock: product.countInStock },
        opts
      )
    }
    await session.commitTransaction()
    session.endSession()
    return true
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}
export async function deliverOrder(orderId: string) {
  try {
    await connectToDatabase()
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error('User not authenticated.');
    }

    await connectToDatabase();

    if (userRole === 'Admin') {
      // Admins can delete orders directly.
      const res = await Order.findByIdAndDelete(id);
      if (!res) throw new Error('Order not found');

      revalidatePath('/admin/orders');
      return {
        success: true,
        message: 'Order deleted successfully',
      };
    }

    if (userRole === 'Sale') {
      // Sale users create a request for approval.
      await ApprovalRequest.create({
        requestedBy: userId,
        type: 'DELETE_ORDER',
        targetId: id,
        payload: { note: 'Deletion request for order' },
      });
      return { success: true, message: 'Deletion request submitted for admin approval.' };
    }

    throw new Error('You do not have permission to perform this action.');

  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
  query, // <-- Add query parameter
}: {
  limit?: number;
  page: number;
  query?: string; // <-- Add query type
}) {
  const {
    common: { pageSize },
  } = await getSetting();
  limit = limit || pageSize;
  await connectToDatabase();
  const skipAmount = (Number(page) - 1) * limit;

  // Create a filter object. It's empty by default.
  const filter: Record<string, unknown> = {};

  // If a query is provided and it's a valid MongoDB ObjectId, add it to the filter.
  if (query && mongoose.Types.ObjectId.isValid(query)) {
    filter._id = query;
  }

  // Apply the filter to both the find and countDocuments calls
  const orders = await Order.find(filter) // <-- Apply filter
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit);

  const ordersCount = await Order.countDocuments(filter); // <-- Apply filter

  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  };
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await Order.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase()
  const order = await Order.findById(orderId)
  return JSON.parse(JSON.stringify(order))
}

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (order) {
      const paypalOrder = await paypal.createOrder(order.totalPrice)
      order.paymentResult = {
        id: paypalOrder.id,
        email_address: '',
        status: '',
        pricePaid: '0',
      }
      await order.save()
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      }
    } else {
      throw new Error('Order not found')
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string }
) {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId).populate('user', 'email')
    if (!order) throw new Error('Order not found')

    const captureData = await paypal.capturePayment(data.orderID)
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    )
      throw new Error('Error in paypal payment')
    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    }
    await order.save()
    await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
}) => {

  const productIds = items.map((item) => item.product);
  const productsFromDb = await Product.find({ _id: { $in: productIds } });

  // ✅ FIX: Create a new, secure items array using data from your database
  const secureItems: OrderItem[] = [];

  for (const dbProduct of productsFromDb) {
    const clientItem = items.find((item) => item.product === dbProduct._id.toString());
    if (clientItem) {
      secureItems.push({
        // Authoritative data from the database
        product: dbProduct._id.toString(),
        name: dbProduct.name,
        slug: dbProduct.slug,
        image: dbProduct.images[0],
        price: dbProduct.price,
        category: dbProduct.category,
        countInStock: dbProduct.countInStock,
        // User-provided data that is safe to keep
        quantity: clientItem.quantity,
        color: clientItem.color,
        size: clientItem.size,
        clientId: clientItem.clientId,
      });
    }
  }

  const secureItemsPrice = round2(
    secureItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
  );

  const { availableDeliveryDates } = await getSetting();

  if (!availableDeliveryDates || availableDeliveryDates.length === 0) {
    return {
      items: secureItems, // Still return the secure items
      itemsPrice: secureItemsPrice,
      shippingPrice: undefined,
      taxPrice: undefined,
      totalPrice: secureItemsPrice,
      deliveryDateIndex: undefined,
      expectedDeliveryDate: undefined,
    };
  }

  let validIndex = deliveryDateIndex;
  if (
    validIndex === undefined ||
    validIndex < 0 ||
    validIndex >= availableDeliveryDates.length
  ) {
    validIndex = 0;
  }

  const selectedDeliveryOption = availableDeliveryDates[validIndex];

  const shippingPrice =
    !shippingAddress || !selectedDeliveryOption
      ? undefined
      : selectedDeliveryOption.freeShippingMinPrice > 0 &&
        secureItemsPrice >= selectedDeliveryOption.freeShippingMinPrice
        ? 0
        : selectedDeliveryOption.shippingPrice;

  const taxPrice = !shippingAddress ? undefined : round2(secureItemsPrice * 0);

  const totalPrice = round2(
    secureItemsPrice +
    (shippingPrice ? round2(shippingPrice) : 0) +
    (taxPrice ? round2(taxPrice) : 0)
  );

  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(
    expectedDeliveryDate.getDate() + selectedDeliveryOption.daysToDeliver
  );

  return {
    items: secureItems, // ✅ Return the new secure items array
    itemsPrice: secureItemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    deliveryDateIndex: validIndex,
    expectedDeliveryDate,
  };
};


export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  const ordersCount = await Order.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)

  const pendingApprovalsCount = await ApprovalRequest.countDocuments({
    status: 'pending',
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as IOrderList[],
    pendingApprovalsCount,
  }
}

async function getSalesChartData(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
}

async function getTopSalesProducts(date: DateRange) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
}

async function getTopSalesCategories(date: DateRange, limit = 5) {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
}

// --- NEW updateOrderStatus ACTION ---
export async function updateOrderStatus(orderId: string, newStatus: string) {
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (!userId) throw new Error('User not authenticated.');

  if (userRole === 'Admin') {
    // Admins can update order status directly.
    // NOTE: You might need to adjust your Order schema to have a 'status' field.
    const order = await Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true });
    if (!order) throw new Error('Order not found.');
    return { success: true, message: 'Order status updated successfully.' };
  }

  if (userRole === 'Sale') {
    // Sale role creates a request for approval.
    await ApprovalRequest.create({
      requestedBy: userId,
      type: 'UPDATE_ORDER_STATUS',
      targetId: orderId,
      payload: { status: newStatus },
    });
    return { success: true, message: 'Order status update submitted for admin approval.' };
  }

  throw new Error('You do not have permission to perform this action.');
}

// --- ACTION: markOrderAsPaid ---
export async function markOrderAsPaid(orderId: string) {
  try {
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;
    if (!userId) throw new Error('User not authenticated.');

    await connectToDatabase();

    if (userRole === 'Admin') {
      const order = await Order.findByIdAndUpdate(orderId, { isPaid: true, paidAt: new Date() });
      if (!order) throw new Error('Order not found.');

      // 👇 Call the helper function to process stock and logging
      await processOrderPayment(orderId, userId);

      revalidatePath('/admin/orders');
      return { success: true, message: 'Order marked as paid.' };
    }

    if (userRole === 'Sale') {
      // This part remains the same
      await ApprovalRequest.create({
        requestedBy: userId,
        type: 'MARK_AS_PAID',
        targetId: orderId,
        payload: { isPaid: true },
      });
      return { success: true, message: 'Request to mark as paid has been submitted for approval.' };
    }

    throw new Error('You do not have permission to perform this action.');
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// --- ACTION: markOrderAsDelivered ---
export async function markOrderAsDelivered(orderId: string) {
  try { // 2. Add try block
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (!userId) throw new Error('User not authenticated.');

    await connectToDatabase();

    if (userRole === 'Admin') {
      const order = await Order.findByIdAndUpdate(orderId, { isDelivered: true, deliveredAt: new Date() });
      if (!order) throw new Error('Order not found.');
      revalidatePath('/admin/orders');
      return { success: true, message: 'Order marked as delivered.' };
    }

    if (userRole === 'Sale') {
      await ApprovalRequest.create({
        requestedBy: userId,
        type: 'MARK_AS_DELIVERED',
        targetId: orderId,
        payload: { isDelivered: true },
      });
      return { success: true, message: 'Request to mark as delivered has been submitted for approval.' };
    }

    throw new Error('You do not have permission to perform this action.');

  } catch (error) { // 3. Add catch block
    return { success: false, message: formatError(error) };
  }
}

// 👇 CREATE THIS NEW, REUSABLE FUNCTION
export async function processOrderPayment(orderId: string, adminId: string) {
  const order = await Order.findById(orderId);
  if (order) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.quantity } });
      await StockMovement.create({
        product: item.product,
        type: 'SALE',
        stockOut: item.quantity,
        orderId: order._id,
        initiatedBy: adminId,
      });
    }
  }
}

