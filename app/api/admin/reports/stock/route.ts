import { auth } from '@/auth';
import { getStockMovements } from '@/lib/actions/stock.actions';
import { formatDateTime } from '@/lib/utils';
import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

// 1. Define a type for the data you're working with
type MovementItem = {
    createdAt: string;
    product: { name: string; };
    type: string;
    stockIn?: number;
    stockOut?: number;
    orderId?: string;
    reason?: string;
    initiatedBy: { name: string; };
};

export async function GET() {
    try {
        // 2. Correct the permission check
        const session = await auth();
        const userRole = session?.user?.role;
        if (userRole !== "Admin") {
            return new NextResponse('Access Denied', { status: 403 });
        }

        const result = await getStockMovements({ all: true });
        const movements: MovementItem[] = result.data ?? [];

        // 1. Calculate the totals before creating the report
        const totals = movements.reduce(
            (acc: { stockIn: number; stockOut: number; }, item: MovementItem) => {
                acc.stockIn += item.stockIn || 0;
                acc.stockOut += item.stockOut || 0;
                return acc;
            },
            { stockIn: 0, stockOut: 0 },
        );

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Collection Online Shop';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Stock Movement Report');

        sheet.columns = [
            { header: 'Date', key: 'date', width: 25 },
            { header: 'Product', key: 'product', width: 40 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Stock In', key: 'stockIn', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Stock Out', key: 'stockOut', width: 15, style: { numFmt: '#,##0' } },
            { header: 'Reason / Order ID', key: 'reason', width: 35 },
            { header: 'Initiated By', key: 'user', width: 25 },
        ];

        sheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F4E75' } };
        sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // 3. Apply the type to the 'item' parameter
        movements.forEach((item: MovementItem) => {
            sheet.addRow({
                date: formatDateTime(new Date(item.createdAt)).dateTime,
                product: item.product.name,
                type: item.type,
                stockIn: item.stockIn || 0,
                stockOut: item.stockOut || 0,
                reason: item.type === 'SALE' && item.orderId
                    ? `Order: ${item.orderId}`
                    : item.reason || 'N/A',
                user: item.initiatedBy.name,
            });
        });

        // Style the data rows
        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });

                // Get cells by their correct keys
                const typeCell = row.getCell('type');
                const stockInCell = row.getCell('stockIn');
                const stockOutCell = row.getCell('stockOut');

                // Center align all three
                typeCell.alignment = { vertical: 'middle', horizontal: 'center' };
                stockInCell.alignment = { vertical: 'middle', horizontal: 'center' };
                stockOutCell.alignment = { vertical: 'middle', horizontal: 'center' };

                // Color code the 'Stock In' column
                if (stockInCell.value && (stockInCell.value as number) > 0) {
                    stockInCell.font = { bold: true, color: { argb: 'FF008000' } }; // Green
                    stockInCell.value = `+${stockInCell.value}`;
                }

                // Color code the 'Stock Out' column
                if (stockOutCell.value && (stockOutCell.value as number) > 0) {
                    stockOutCell.font = { bold: true, color: { argb: 'FFC00000' } }; // Red
                    stockOutCell.value = `-${stockOutCell.value}`;
                }
            }
        });

        // 2. Add a blank row and the total row at the end
        sheet.addRow([]); // Blank row for spacing
        const totalRow = sheet.addRow({
            type: 'Totals',
            stockIn: totals.stockIn,
            stockOut: totals.stockOut,
        });

        // 3. Style the total row for a professional look
        totalRow.font = { bold: true, size: 12 };
        totalRow.getCell('type').alignment = { horizontal: 'right' };
        const totalStockInCell = totalRow.getCell('stockIn');
        const totalStockOutCell = totalRow.getCell('stockOut');
        totalStockInCell.font = { bold: true, size: 12, color: { argb: 'FF008000' } }; // Green
        totalStockOutCell.font = { bold: true, size: 12, color: { argb: 'FFC00000' } }; // Red
        totalRow.eachCell((cell) => {
            cell.border = { top: { style: 'medium' } };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=stock-movement-report.xlsx',
            },
        });

    } catch (error) {
        console.error(error);
        return new NextResponse('An error occurred while generating the report.', { status: 500 });
    }
}