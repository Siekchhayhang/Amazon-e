import { CART_JWT_SECRET } from '@/lib/constants';
import { sign, verify } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const secret = CART_JWT_SECRET;

// Get the cart from the session
export async function GET(req: NextRequest) {
    const token = req.cookies.get('cart')?.value;
    if (!token) {
        return NextResponse.json({ items: [] });
    }
    try {
        const cart = await verify(token, secret!);
        return NextResponse.json(cart);
    } catch (e) {
        console.error('Invalid cart token:', e);
        const response = NextResponse.json({ items: [] });
        response.cookies.delete('cart');
        return response;
    }
}

// Save the cart to the session
export async function POST(req: NextRequest) {
    try {
        const cart = await req.json();
        const token = await sign(cart, secret!, { expiresIn: '7d' });
        const response = NextResponse.json({ token });
        response.cookies.set('cart', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        return response;
    } catch (e) {
        console.error('Failed to save cart:', e);
        return NextResponse.json(
            { message: 'Failed to save cart' },
            { status: 500 }
        );
    }
}