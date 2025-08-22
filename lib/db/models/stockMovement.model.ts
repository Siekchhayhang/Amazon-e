import { Document, model, models, Schema } from 'mongoose';

export interface IStockMovement extends Document {
    product: Schema.Types.ObjectId;
    type: 'RESTOCK' | 'SALE' | 'ADJUSTMENT';
    quantityChange: number; // Positive for 'in', negative for 'out'
    reason?: string; // e.g., "Damaged goods", "Initial stock"
    orderId?: Schema.Types.ObjectId; // Link to the order for 'SALE' types
    initiatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    type: { type: String, enum: ['RESTOCK', 'SALE', 'ADJUSTMENT'], required: true },
    quantityChange: { type: Number, required: true },
    reason: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
});

const StockMovement = models.StockMovement || model<IStockMovement>('StockMovement', StockMovementSchema);

export default StockMovement;