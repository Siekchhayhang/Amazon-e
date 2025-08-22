"use server";

import { connectToDatabase } from "@/lib/db";
import StockMovement from "@/lib/db/models/stockMovement.model";
import { getSetting } from "./setting.actions";

export async function getStockMovements({ page = 1 }: { page?: number }) {
    try {
        await connectToDatabase();

        const {
            common: { pageSize },
        } = await getSetting();
        const limit = pageSize;
        const skipAmount = (page - 1) * limit;

        const movements = await StockMovement.find({})
            .populate('product', 'name slug') // Get product name and slug
            .populate('initiatedBy', 'name') // Get the user's name
            .sort({ createdAt: -1 })
            .skip(skipAmount)
            .limit(limit);

        const totalMovements = await StockMovement.countDocuments();

        return {
            data: JSON.parse(JSON.stringify(movements)),
            totalPages: Math.ceil(totalMovements / limit),
        };
    } catch (error) {
        console.error("Failed to fetch stock movements:", error);
        return { data: [], totalPages: 0 };
    }
}

// --- NEW ACTION: Get ALL stock movements for a report ---
export async function getAllStockMovements() {
    try {
        await connectToDatabase();
        const movements = await StockMovement.find({})
            .populate('product', 'name')
            .populate('initiatedBy', 'name')
            .sort({ createdAt: -1 });

        return { data: JSON.parse(JSON.stringify(movements)) };
    } catch (error) {
        console.error("Failed to fetch all stock movements:", error);
        return { data: [] };
    }
}