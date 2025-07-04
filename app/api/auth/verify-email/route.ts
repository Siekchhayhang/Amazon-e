import { NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/actions/user.actions';

// API Route: /api/verify-email?token=abc123
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ success: false, error: 'Missing verification token' }, { status: 400 });
    }

    const result = await verifyEmail(token);

    if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // ✅ Option 1: Return JSON (for API-based handling)
    return NextResponse.json({ success: true, message: result.message });

    // ✅ Option 2 (optional): Redirect to sign-in page with a success query
    // return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SERVER_URL}/sign-in?verified=success`);
}
