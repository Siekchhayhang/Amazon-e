import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import ExcelJS from 'exceljs';

export async function GET() {
    await connectToDatabase();
    const products = await Product.find().sort({ createdAt: -1 });

    // 1. Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');

    // 2. Define columns, including currency formatting for the price
    sheet.columns = [
        { header: 'Product ID', key: 'id', width: 30 },
        { header: 'Name', key: 'name', width: 35 },
        {
            header: 'Price (USD)',
            key: 'price',
            width: 15,
            style: {
                numFmt: '$* #,##0.00;[Red]-$* #,##0.00' // Accounting format
            }
        },
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Stock', key: 'stock', width: 15 },
        { header: 'Date Created', key: 'createdAt', width: 20 },
    ];

    // 3. Add the data rows
    products.forEach((product) => {
        sheet.addRow({
            id: product._id.toString(),
            name: product.name,
            price: product.price, // Pass the raw number
            category: product.category,
            stock: product.countInStock,
            createdAt: new Date(product.createdAt).toLocaleDateString(),
        });
    });

    // 4. Apply border styling to all cells
    sheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    // 5. Write to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 6. Create a Blob to send in the response
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 7. Return the NextResponse for .xlsx download
    return new NextResponse(blob, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=products.xlsx',
        },
    });
}