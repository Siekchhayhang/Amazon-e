'use server';

import { connectToDatabase } from '../db';
import Cart from '../db/models/cart.model';
import { Cart as CartType } from '@/types';
import { formatError } from '../utils';

/**
 * Fetches a user's cart from the database.
 * @param userId - The ID of the user.
 * @returns The user's cart document or null if not found.
 */
export async function getCart(userId: string) {
    await connectToDatabase();
    const cart = await Cart.findOne({ userId }).lean();

    // Convert the Mongoose object to a plain, serializable object.
    // This ensures that complex types like ObjectId are converted to strings.
    return JSON.parse(JSON.stringify(cart));
}

/**
 * Saves or updates a user's cart in the database.
 * @param userId - The ID of the user.
 * @param cartData - The cart object containing the items to save.
 */
export async function saveCart(userId: string, cartData: CartType) {
    try {
        await connectToDatabase();
        // Find the cart by userId and update it, or create it if it doesn't exist (upsert: true).
        await Cart.findOneAndUpdate(
            { userId },
            { items: cartData.items },
            { upsert: true, new: true }
        );
        return { success: true };
    } catch (error) {
        return { success: false, message: formatError(error) };
    }
}
