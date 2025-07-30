import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('cart');
    return response;
  } catch (e) {
    console.error('Failed to clear cart cookie:', e);
    return NextResponse.json(
      { message: 'Failed to clear cart cookie' },
      { status: 500 }
    );
  }
}
