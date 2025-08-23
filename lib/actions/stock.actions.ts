"use server";

import { connectToDatabase } from "@/lib/db";
import StockMovement from "@/lib/db/models/stockMovement.model";
import { getSetting } from "./setting.actions";

export async function getStockMovements({
    page = 1,
    all = false // Add a new parameter to fetch all records
}: {
    page?: number;
    all?: boolean;
}) {
    try {
        await connectToDatabase();

        const query = StockMovement.find({})
            .populate('product', 'name slug')
            .populate('initiatedBy', 'name')
            .sort({ createdAt: -1 });

        if (all) {
            // If 'all' is true, we don't paginate
            const movements = await query;
            return {
                data: JSON.parse(JSON.stringify(movements)),
                totalPages: 1, // Not relevant for full export
            };
        } else {
            // If 'all' is false, we apply pagination for the web report
            const { common: { pageSize } } = await getSetting();
            const limit = pageSize;
            const skipAmount = (page - 1) * limit;

            const movements = await query.skip(skipAmount).limit(limit);
            const totalMovements = await StockMovement.countDocuments();

            return {
                data: JSON.parse(JSON.stringify(movements)),
                totalPages: Math.ceil(totalMovements / limit),
            };
        }
    } catch (error) {
        console.error("Failed to fetch stock movements:", error);
        return { data: [], totalPages: 0 };
    }
}