
import { CartSchema } from "@/lib/validator";
import { signCart, verifyCartToken } from "@/utils/jwt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const cartData = await req.json();

        // Validate the incoming data against the detailed schema
        const validatedCart = CartSchema.parse(cartData);

        // The secret is only used here on the server
        const token = signCart(validatedCart);

        return NextResponse.json({ token });
    } catch (error) {
        if (error instanceof z.ZodError) {
            // Provide detailed error messages in development for easier debugging
            return NextResponse.json({ error: 'Invalid cart data provided.', details: error.errors }, { status: 400 });
        }
        console.error('[CART API] Error creating cart session:', error);
        return NextResponse.json({ error: 'Failed to create cart session.' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('cart')?.value;

        if (!token) {
            return NextResponse.json({ error: 'No cart token found.' }, { status: 400 });
        }

        // The secret is only used here on the server
        const decodedCart = verifyCartToken(token);

        if (decodedCart && typeof decodedCart === 'object') {
            // Re-validate the decoded data here as well for extra security
            const validationResult = CartSchema.safeParse(decodedCart);
            if (!validationResult.success) {
                return NextResponse.json({ error: 'Invalid cart data in token.' }, { status: 400 });
            }
            return NextResponse.json(validationResult.data);
        }

        return NextResponse.json({ error: 'Invalid or expired cart token.' }, { status: 401 });
    } catch (error) {
        console.error('[CART API] Error verifying cart session:', error);
        return NextResponse.json({ error: 'Failed to verify cart session.' }, { status: 500 });
    }
}
