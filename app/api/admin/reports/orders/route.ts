import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import ExcelJS from 'exceljs';
import { IOrder } from '@/lib/db/models/order.model';

export async function GET() {
    await connectToDatabase();

    const orders = await Order.find().populate('user', 'name').sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
        { header: 'Invoice ID', key: 'invoiceId', width: 25 },
        { header: 'Order ID', key: 'orderId', width: 30 },
        { header: 'Order Date', key: 'date', width: 15 },
        { header: 'Buyer', key: 'buyer', width: 25 },
        { header: 'Product Name', key: 'productName', width: 35 },
        { header: 'Quantity', key: 'quantity', width: 10, style: { alignment: { horizontal: 'center' } } },
        {
            header: 'Line Total (USD)',
            key: 'lineTotal',
            width: 20,
            style: {
                numFmt: '$* #,##0.00;[Red]-$* #,##0.00',
            },
        },
    ];

    const grandTotalPrice = orders.reduce((sum, order) => sum + order.totalPrice, 0);

    orders.forEach((order: IOrder) => {
        const buyerName =
            typeof order.user === 'object' && order.user !== null && 'name' in order.user
                ? order.user.name
                : 'Deleted User';

        order.items.forEach((item) => {
            sheet.addRow({
                invoiceId: `INV-${order._id.toString().slice(-6).toUpperCase()}`,
                orderId: order._id.toString(), // <-- ADD THE FULL ORDER ID HERE
                date: new Date(order.createdAt).toLocaleDateString(),
                buyer: buyerName,
                productName: item.name,
                quantity: item.quantity,
                lineTotal: item.price * item.quantity,
            });
        });
    });

    sheet.addRow([]);
    const totalRow = sheet.addRow({
        productName: 'Grand Total',
        lineTotal: grandTotalPrice,
    });

    totalRow.font = { bold: true, size: 14 };
    totalRow.getCell('productName').alignment = { horizontal: 'right' };

    sheet.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return new NextResponse(blob, {
        status: 200,
        headers: {
            'Content-Disposition': 'attachment; filename=sales-report.xlsx',
        },
    });
}