import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model'; // adjust path
import { unparse } from 'papaparse';

export async function GET() {
    await connectToDatabase();
    const orders = await Order.find()
        .populate('user', 'name')
        .sort({ createdAt: -1 });

    const csv = unparse(
        orders.map((order) => ({
            id: order._id,
            buyer: typeof order.user === 'object' && order.user !== null && 'name' in order.user
                ? order.user.name
                : (typeof order.user === 'string' ? order.user : 'Deleted User'),
            total: order.totalPrice,
            date: new Date(order.createdAt).toLocaleDateString(),
        }))
    );

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=orders.csv',
        },
    });
}
