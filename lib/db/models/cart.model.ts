import mongoose, { Document, Model, Schema } from 'mongoose';
import { OrderItem } from '@/types';

// Interface describing the Cart document in MongoDB
export interface ICart extends Document {
    userId: string;
    items: OrderItem[];
}

// Mongoose Schema for the Cart
const CartSchema: Schema = new Schema(
    {
        // The ID of the user who owns this cart. It's unique.
        userId: { type: String, required: true, unique: true },
        // An array of items in the cart, matching the OrderItem type.
        items: [
            {
                product: { type: String, required: true },
                name: { type: String, required: true },
                slug: { type: String, required: true },
                category: { type: String, required: true },
                quantity: { type: Number, required: true },
                countInStock: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                size: { type: String },
                color: { type: String },
                clientId: { type: String, required: true },
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

// Create the Mongoose model
const Cart: Model<ICart> =
    mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema);
export default Cart;
