import { NextRequest, NextResponse } from 'next/server';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { calculatePastDate } from '@/lib/utils';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const date = {
        from: from ? new Date(from) : calculatePastDate(30),
        to: to ? new Date(to) : new Date(),
    };

    const summary = await getOrderSummary(date);

    // 1. Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Summary');

    // --- Report Header ---
    const reportTitle = `Revenue Summary: ${date.from.toLocaleDateString()} to ${date.to.toLocaleDateString()}`;
    const titleRow = sheet.addRow([reportTitle]);
    titleRow.font = { name: 'Calibri', size: 16, bold: true };
    sheet.mergeCells('A1:B1');
    titleRow.getCell(1).alignment = { horizontal: 'center' };
    sheet.addRow([]); // Add a blank row for spacing

    // --- Data Table ---
    const headerRow = sheet.addRow(['Metric', 'Value']);
    headerRow.font = { bold: true };

    // Add data rows for each summary point
    sheet.addRow(['Total Sales', summary.totalSales]);
    sheet.addRow(['Total Orders', summary.ordersCount]);
    sheet.addRow(['New Customers', summary.usersCount]);
    sheet.addRow(['Products Sold', summary.productsCount]);

    // --- Styling ---
    // Apply currency format specifically to the Total Sales value
    const salesValueCell = sheet.getCell('B4'); // This cell contains totalSales
    salesValueCell.style.numFmt = '$* #,##0.00;[Red]-$* #,##0.00';

    // Set column widths for better layout
    sheet.getColumn('A').width = 25;
    sheet.getColumn('B').width = 20;

    // Apply borders to the data table (from row 3 to 7)
    for (let i = 3; i <= 7; i++) {
        const row = sheet.getRow(i);
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    }

    // --- File Generation ---
    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return new NextResponse(blob, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=revenue-summary.xlsx',
        },
    });
}