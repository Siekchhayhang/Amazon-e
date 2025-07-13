import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import ExcelJS from 'exceljs';

export async function GET() {
    await connectToDatabase();

    const orders = await Order.find().populate('user', 'name').sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Orders');

    // Add header row with currency formatting for the 'total' column
    sheet.columns = [
        { header: 'Order ID', key: 'id', width: 30 },
        { header: 'Buyer', key: 'buyer', width: 25 },
        {
            header: 'Total Price (USD)', // Updated header label
            key: 'total',
            width: 20, // Increased width for better spacing
            style: {
                numFmt: '$* #,##0.00;[Red]-$* #,##0.00', // Accounting format
            },
        },
        { header: 'Date', key: 'date', width: 15 },
    ];

    // Calculate the total price
    const totalPriceSum = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    orders.forEach((order) => {
        sheet.addRow({
            id: order._id.toString(),
            buyer:
                typeof order.user === 'object' && order.user !== null && 'name' in order.user
                    ? order.user.name
                    : typeof order.user === 'string'
                        ? order.user
                        : 'Deleted User',
            total: order.totalPrice,
            date: new Date(order.createdAt).toLocaleDateString(),
        });
    });

    const totalRow = sheet.addRow({
        buyer: 'Total',
        total: totalPriceSum,
    });

    totalRow.font = { bold: true };

    sheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return new NextResponse(blob, {
        status: 200,
        headers: {
            'Content-Disposition': 'attachment; filename=orders.xlsx',
        },
    });
}