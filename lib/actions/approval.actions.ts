"use server";
import Product from '@/lib/db/models/product.model';
import Order from '@/lib/db/models/order.model';
import ApprovalRequest from '../db/models/approvalRequest.model';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '../db';

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
    const request = await ApprovalRequest.findById(requestId);
    if (!request) throw new Error('Request not found.');

    if (action === 'approve') {
        let updatedProductSlug = null; // Variable to hold slug for revalidation
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
            case 'UPDATE_ORDER_STATUS':
                await Order.findByIdAndUpdate(request.targetId, { status: request.payload.status });
                break;
            case 'MARK_AS_PAID':
                await Order.findByIdAndUpdate(request.targetId, { isPaid: true, paidAt: new Date() });
                break;
            case 'MARK_AS_DELIVERED':
                await Order.findByIdAndUpdate(request.targetId, { isDelivered: true, deliveredAt: new Date() });
                break;
            case 'DELETE_ORDER':
                await Order.findByIdAndDelete(request.targetId);
                break;
            case 'DELETE_PRODUCT':
                await Product.findByIdAndDelete(request.targetId);
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