import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/db/models/user.model';
import ExcelJS from 'exceljs';

export async function GET() {
    await connectToDatabase();
    const users = await User.find().sort({ createdAt: -1 });

    // 1. Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Customers');

    // 2. Define columns with headers, keys, and widths
    sheet.columns = [
        { header: 'User ID', key: 'id', width: 30 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 35 },
        { header: 'Registration Date', key: 'createdAt', width: 20 },
    ];

    // 3. Add the data rows
    users.forEach((user) => {
        sheet.addRow({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt).toLocaleDateString(),
        });
    });

    // 4. (Optional) Apply border styling to all cells for a clean look
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

    // 7. Return the NextResponse
    return new NextResponse(blob, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=customers.xlsx',
        },
    });
}