"use server";
import Product from '@/lib/db/models/product.model';
import Order from '@/lib/db/models/order.model';
import ApprovalRequest from '../db/models/approvalRequest.model';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '../db';
import StockMovement from '../db/models/stockMovement.model';
import { auth } from '@/auth';
import { formatError } from '../utils';

export async function getPendingRequests() {
    const requests = await ApprovalRequest.find({ status: 'pending' }).populate('requestedBy', 'name').sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(requests));
}

export async function getPendingOrderRequestsMap() {
    await connectToDatabase();
    const requests = await ApprovalRequest.find({
        status: 'pending',
        // Find all types related to orders
        type: { $in: ['MARK_AS_PAID', 'MARK_AS_DELIVERED', 'DELETE_ORDER'] }
    }).select('targetId type'); // Select only the fields we need

    // Create a simple map for easy lookup: { orderId: 'REQUEST_TYPE' }
    const pendingMap: { [key: string]: string } = {};
    requests.forEach(req => {
        if (req.targetId) {
            pendingMap[req.targetId.toString()] = req.type;
        }
    });
    return pendingMap;
}

// --- NEW ACTION: getPendingProductRequestsMap ---
export async function getPendingProductRequestsMap() {
    await connectToDatabase();
    const requests = await ApprovalRequest.find({
        status: 'pending',
        type: { $in: ['UPDATE_PRODUCT', 'DELETE_PRODUCT', 'CREATE_PRODUCT', 'UPDATE_PRODUCT_STOCK'] }
    }).select('targetId type');

    const pendingMap: { [key: string]: string } = {};
    requests.forEach(req => {
        if (req.targetId) {
            pendingMap[req.targetId.toString()] = req.type;
        }
    });
    return pendingMap;
}


export async function processRequest(requestId: string, action: 'approve' | 'reject') {
    // 👇 Wrap the entire function in a try...catch block
    try {
        const session = await auth();
        if (session?.user?.role !== 'Admin' || !session?.user?.id) {
            throw new Error('Not authorized or not logged in.');
        }
        const adminId = session.user.id;

        await connectToDatabase();
        const request = await ApprovalRequest.findById(requestId);
        if (!request) throw new Error('Request not found.');

        if (action === 'approve') {
            let updatedProductSlug = null;
            switch (request.type) {
                case 'CREATE_PRODUCT':
                    await Product.create({ ...request.payload, isPublished: true });
                    break;
                case 'UPDATE_PRODUCT':
                    const updatedProduct = await Product.findByIdAndUpdate(request.targetId, request.payload, { new: true });
                    if (updatedProduct) {
                        updatedProductSlug = updatedProduct.slug;
                    }
                    break;
                case 'UPDATE_PRODUCT_STOCK':
                    await Product.findByIdAndUpdate(request.targetId, { countInStock: request.payload.countInStock });
                    break;
                case 'MARK_AS_PAID':
                    await Order.findByIdAndUpdate(request.targetId, { isPaid: true, paidAt: new Date() });
                    break;
                case 'MARK_AS_DELIVERED':
                    const order = await Order.findByIdAndUpdate(request.targetId, { isDelivered: true, deliveredAt: new Date() });
                    if (order) {
                        for (const item of order.items) {
                            await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: -item.quantity } });
                            await StockMovement.create({
                                product: item.product,
                                type: 'SALE',
                                quantityChange: -item.quantity,
                                orderId: order._id,
                                initiatedBy: adminId,
                            });
                        }
                    }
                    break;
                case 'DELETE_ORDER':
                    await Order.findByIdAndDelete(request.targetId);
                    break;
                case 'DELETE_PRODUCT':
                    await Product.findByIdAndDelete(request.targetId);
                    break;
                case 'REQUEST_RESTOCK':
                    const { quantity, reason } = request.payload;
                    await Product.findByIdAndUpdate(request.targetId, { $inc: { countInStock: quantity } });
                    await StockMovement.create({
                        product: request.targetId,
                        type: 'RESTOCK',
                        quantityChange: quantity,
                        reason,
                        initiatedBy: request.requestedBy,
                    });
                    break;
            }
            request.status = 'approved';
            if (updatedProductSlug) {
                revalidatePath(`/product/${updatedProductSlug}`);
            }
        } else {
            request.status = 'rejected';
        }

        await request.save();
        revalidatePath('/admin/approvals');
        revalidatePath('/admin/orders');
        revalidatePath('/admin/products');
        return { success: true, message: `Request has been ${action}d.` };

    } catch (error) {
        // This will catch any error and return a clean response
        return { success: false, message: formatError(error) };
    }
}

export async function getPendingRequestTypeForOrder(orderId: string) {
    await connectToDatabase();
    const request = await ApprovalRequest.findOne({
        status: 'pending',
        targetId: orderId,
    }).select('type'); // Find one request for this specific order

    return request ? request.type : null;
}


// 👇 ADD THIS ENTIRE FUNCTION
export async function getPendingRequestTypeForProduct(productId: string) {
    await connectToDatabase();
    const request = await ApprovalRequest.findOne({
        status: 'pending',
        targetId: productId,
        type: { $in: ['UPDATE_PRODUCT', 'UPDATE_PRODUCT_STOCK', 'CREATE_PRODUCT', 'DELETE_PRODUCT'] }
    }).select('type');

    return request ? request.type : null;
}