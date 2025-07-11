import { NextRequest, NextResponse } from 'next/server';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { calculatePastDate } from '@/lib/utils';
import { unparse } from 'papaparse';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const date = {
        from: from ? new Date(from) : calculatePastDate(30),
        to: to ? new Date(to) : new Date(),
    };

    const summary = await getOrderSummary(date);

    const csv = unparse([
        {
            totalSales: summary.totalSales,
            ordersCount: summary.ordersCount,
            usersCount: summary.usersCount,
            productsCount: summary.productsCount,
        },
    ]);

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=revenue.csv',
        },
    });
}
