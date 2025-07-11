import { getOrderSummary } from '@/lib/actions/order.actions';
import { calculatePastDate } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { unparse } from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const date = {
      from: from ? new Date(from) : calculatePastDate(30),
      to: to ? new Date(to) : new Date(),
    };

    const summary = await getOrderSummary(date);

    let csvContent = '';

    // Section 1: Summary
    csvContent += '--- Summary ---\n';
    csvContent += unparse([
      {
        ordersCount: summary.ordersCount,
        productsCount: summary.productsCount,
        usersCount: summary.usersCount,
        totalSales: summary.totalSales,
      },
    ]);
    csvContent += '\n\n';

    // Section 2: Monthly Sales
    if (summary.monthlySales?.length) {
      csvContent += '--- Monthly Sales ---\n';
      csvContent += unparse(summary.monthlySales);
      csvContent += '\n\n';
    }

    // Section 3: Sales Chart Data
    if (summary.salesChartData?.length) {
      csvContent += '--- Sales Chart Data ---\n';
      csvContent += unparse(summary.salesChartData);
      csvContent += '\n\n';
    }

    // Section 4: Top Sales Categories
    if (summary.topSalesCategories?.length) {
      csvContent += '--- Top Sales Categories ---\n';
      csvContent += unparse(summary.topSalesCategories);
      csvContent += '\n\n';
    }

    // Section 5: Top Sales Products
    if (summary.topSalesProducts?.length) {
      csvContent += '--- Top Sales Products ---\n';
      csvContent += unparse(summary.topSalesProducts);
      csvContent += '\n\n';
    }

    // Section 6: Latest Orders
    if (summary.latestOrders?.length) {
      csvContent += '--- Latest Orders ---\n';
      const flattenedOrders = summary.latestOrders.map((order) => ({
        orderId: order._id,
        customer: order.user?.name || 'Guest/Deleted',
        date: new Date(order.createdAt).toISOString().split('T')[0],
        total: order.totalPrice,
      }));
      csvContent += unparse(flattenedOrders);
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="report.csv"',
      },
    });
  } catch (error) {
    console.error('CSV generation error:', error);
    return new NextResponse('Error generating report', { status: 500 });
  }
}
