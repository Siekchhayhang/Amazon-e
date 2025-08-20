import { Document, model, models, Schema } from 'mongoose';

export interface IApprovalRequest extends Document {
    requestedBy: Schema.Types.ObjectId;
    reviewedBy?: Schema.Types.ObjectId;
    type: 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'UPDATE_PRODUCT_STOCK' | 'UPDATE_ORDER_STATUS' | 'MARK_AS_PAID' | 'MARK_AS_DELIVERED' | 'DELETE_ORDER' | 'DELETE_PRODUCT';
    targetId?: Schema.Types.ObjectId; // ID of the product/order being updated
    payload: Record<string, unknown>; // The data for the requested change
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>({
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
        type: String, enum: ['CREATE_PRODUCT', 'UPDATE_PRODUCT', 'UPDATE_PRODUCT_STOCK', 'UPDATE_ORDER_STATUS', 'MARK_AS_PAID',
            'MARK_AS_DELIVERED',
            'DELETE_ORDER', 'DELETE_PRODUCT',], required: true
    },
    targetId: { type: Schema.Types.ObjectId },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
}, {
    timestamps: true,
});

const ApprovalRequest = models.ApprovalRequest || model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);

export default ApprovalRequest;