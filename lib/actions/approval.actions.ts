"use server";
import Product from '@/lib/db/models/product.model';
import Order from '@/lib/db/models/order.model';
import ApprovalRequest from '../db/models/approvalRequest.model';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '../db';
import StockMovement from '../db/models/stockMovement.model';
import { auth } from '@/auth';
import { formatError } from '../utils';
import { processOrderPayment } from './order.actions';

export async function getPendingRequests() {
    const requests = await ApprovalRequest.find({ status: 'pending' }).populate('requestedBy', 'name').sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(requests));
}

export async function getPendingOrderRequestsMap() {
    await connectToDatabase();
    const requests = await ApprovalRequest.find({
        status: 'pending',
        type: { $in: ['MARK_AS_PAID', 'MARK_AS_DELIVERED', 'DELETE_ORDER'] }
    }).select('targetId type');

    // This map will now hold an array of strings for each ID: { orderId: ['TYPE_1', 'TYPE_2'] }
    const pendingMap: { [key: string]: string[] } = {};
    requests.forEach(req => {
        if (req.targetId) {
            const id = req.targetId.toString();
            if (!pendingMap[id]) {
                pendingMap[id] = []; // Initialize the array if it doesn't exist
            }
            pendingMap[id].push(req.type); // Push the type into the array
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
                    const existingProduct = await Product.findOne({ slug: request.payload.slug });
                    if (existingProduct) {
                        throw new Error(`A product with the slug "${request.payload.slug}" already exists.`);
                    }
                    await Product.create({ ...request.payload, isPublished: true });
                    break;
                case 'UPDATE_PRODUCT':
                    // 1. Get the product's state *before* the update
                    const originalProduct = await Product.findById(request.targetId);
                    if (!originalProduct) throw new Error('Original product for update not found.');

                    // 2. Perform the update
                    const updatedProduct = await Product.findByIdAndUpdate(request.targetId, request.payload, { new: true });
                    if (updatedProduct) {
                        updatedProductSlug = updatedProduct.slug;

                        // 3. Compare old stock to new stock from the payload
                        const newStock = request.payload.countInStock;
                        if (newStock !== undefined && originalProduct.countInStock !== newStock) {
                            const quantityChange = newStock - originalProduct.countInStock;
                            // 4. Create a log entry for the approved adjustment
                            await StockMovement.create({
                                product: request.targetId,
                                type: 'ADJUSTMENT',
                                quantityChange: quantityChange,
                                reason: 'Stocker update approved by admin',
                                initiatedBy: request.requestedBy,
                            });
                        }
                    }
                    break;
                case 'UPDATE_PRODUCT_STOCK':
                    await Product.findByIdAndUpdate(request.targetId, { countInStock: request.payload.countInStock });
                    break;
                case 'MARK_AS_PAID':
                    // Update the order status
                    await Order.findByIdAndUpdate(request.targetId, { isPaid: true, paidAt: new Date() });
                    // 👇 Call the same helper function
                    await processOrderPayment(request.targetId as string, adminId);
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
                case 'REQUEST_RESTOCK':
                    const { quantity, reason } = request.payload;
                    await Product.findByIdAndUpdate(request.targetId, { $inc: { countInStock: quantity } });
                    await StockMovement.create({
                        product: request.targetId,
                        type: 'RESTOCK',
                        stockIn: quantity, // Use stockIn
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

export async function getPendingRequestTypeForProduct(productId: string) {
    await connectToDatabase();
    const request = await ApprovalRequest.findOne({
        status: 'pending',
        targetId: productId,
        type: { $in: ['UPDATE_PRODUCT', 'UPDATE_PRODUCT_STOCK', 'CREATE_PRODUCT', 'DELETE_PRODUCT'] }
    }).select('type');

    return request ? request.type : null;
}

// --- NEW ACTION: Check for a duplicate pending creation request ---
export async function isDuplicateCreateRequestPending(slug: string) {
    await connectToDatabase();
    const request = await ApprovalRequest.findOne({
        "payload.slug": slug, // Check the slug inside the payload
        type: 'CREATE_PRODUCT',
        status: 'pending',
    });
    return !!request; // Returns true if a duplicate is pending
}