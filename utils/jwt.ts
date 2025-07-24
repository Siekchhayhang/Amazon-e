import { CART_JWT_SECRET } from '@/lib/constants';
import jwt from 'jsonwebtoken';

const JWT_SECRET = CART_JWT_SECRET;

export function signCart(payload: object, expiresIn = '7d'): string {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn });
}

export function verifyCartToken(token: string): object | null {
    try {
        return jwt.verify(token, JWT_SECRET!) as object;
    } catch (error) {
        console.error('Invalid cart JWT:', error);
        return null;
    }
}
