'use server';

import { connectToDatabase } from '../db';
import Cart from '../db/models/cart.model';
import { Cart as CartType } from '@/types';
import { formatError } from '../utils';

export async function getCart(userId: string) {
    await connectToDatabase();
    const cart = await Cart.findOne({ userId }).lean();
    return cart;
}

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
