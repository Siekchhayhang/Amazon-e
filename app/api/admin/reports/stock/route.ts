import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import ExcelJS from 'exceljs';
import { getAllStockMovements } from '@/lib/actions/stock.actions';
import { formatDateTime, formatId } from '@/lib/utils';

// 1. Define a type for the data you're working with
type MovementItem = {
    createdAt: string;
    product: { name: string; };
    type: string;
    quantityChange: number;
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

        const result = await getAllStockMovements();
        const movements = result.data;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Collection Online Shop';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Stock Movement Report');

        sheet.columns = [
            { header: 'Date', key: 'date', width: 25 },
            { header: 'Product', key: 'product', width: 40 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Quantity Change', key: 'quantity', width: 20 },
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
                quantity: item.quantityChange,
                reason: item.type === 'SALE' && item.orderId
                    ? `Order: ${formatId(item.orderId)}`
                    : item.reason || 'N/A',
                user: item.initiatedBy.name,
            });
        });

        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });

                const typeCell = row.getCell('type');
                const quantityCell = row.getCell('quantity');
                typeCell.alignment = { vertical: 'middle', horizontal: 'center' };
                quantityCell.alignment = { vertical: 'middle', horizontal: 'center' };

                if (quantityCell.value && (quantityCell.value as number) > 0) {
                    quantityCell.font = { bold: true, color: { argb: 'FF008000' } };
                    quantityCell.value = `+${quantityCell.value}`;
                } else {
                    quantityCell.font = { bold: true, color: { argb: 'FFC00000' } };
                }
            }
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