'use server';

import { auth } from '@/auth';
import { connectToDatabase } from '../db';
import Cart from '../db/models/cart.model';
import { formatError } from '../utils';
import { CartSchema } from '../validator';

export async function getCart(userId: string) {
    const session = await auth();
    if (!session || session.user.id !== userId) {
        throw new Error('Unauthorized access to cart');
    }

    await connectToDatabase();
    const cart = await Cart.findOne({ userId }).lean();
    return JSON.parse(JSON.stringify(cart));
}

export async function saveCart(userId: string, cartData: unknown) {
    const session = await auth();
    if (!session || session.user.id !== userId) {
        return { success: false, message: 'Unauthorized access' };
    }

    try {
        // ✅ Validate incoming cart structure and types
        const validatedCart = CartSchema.parse(cartData);

        await connectToDatabase();
        await Cart.findOneAndUpdate(
            { userId },
            { items: validatedCart.items }, // Save only validated items
            { upsert: true, new: true }
        );

        return { success: true };
    } catch (error) {
        console.error("Error saving cart:", error);
        return { success: false, message: formatError(error) };
    }
}