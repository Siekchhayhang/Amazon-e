'use server';

import { auth } from '@/auth';
import { OrderItem } from '@/types';
import { connectToDatabase } from '../db';
import { formatError } from '../utils';
import { CartSchema } from '../validator';
import Cart, { ICart } from '../db/models/cart.model';

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
            { items: validatedCart.items, deliveryDate: validatedCart.deliveryDate }, // Save only validated items
            { upsert: true, new: true }
        );

        return { success: true };
    } catch (error) {
        console.error("Error saving cart:", error);
        return { success: false, message: formatError(error) };
    }
}

export async function mergeCarts(userId: string, guestItems: OrderItem[]): Promise<ICart> {
    await connectToDatabase();
    const userCart = await Cart.findOne({ userId });

    const mergedItems = [...(userCart?.items || [])];
    const itemSet = new Set(mergedItems.map(item => `${item.product}-${item.color}-${item.size}`));

    guestItems.forEach(guestItem => {
        const itemKey = `${guestItem.product}-${guestItem.color}-${guestItem.size}`;
        if (!itemSet.has(itemKey)) {
            mergedItems.push(guestItem);
        }
    });

    const updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { items: mergedItems },
        { upsert: true, new: true }
    ).lean();

    return JSON.parse(JSON.stringify(updatedCart));
}