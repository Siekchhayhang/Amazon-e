import { Document, model, models, Schema } from 'mongoose';

export interface IStockMovement extends Document {
    product: Schema.Types.ObjectId;
    type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT';
    stockIn?: number;
    stockOut?: number;
    reason?: string;
    orderId?: Schema.Types.ObjectId;
    initiatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['RESTOCK', 'SALE', 'ADJUSTMENT'], required: true },
    stockIn: { type: Number, default: 0 },
    stockOut: { type: Number, default: 0 },
    reason: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
});

const StockMovement = models.StockMovement || model<IStockMovement>('StockMovement', StockMovementSchema);

export default StockMovement;