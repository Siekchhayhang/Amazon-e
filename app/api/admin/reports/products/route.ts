import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import { unparse } from 'papaparse';

export async function GET() {
    await connectToDatabase();
    const products = await Product.find().sort({ createdAt: -1 });

    const csv = unparse(
        products.map((product) => ({
            id: product._id,
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.countInStock,
            createdAt: new Date(product.createdAt).toLocaleDateString(),
        }))
    );

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=products.csv',
        },
    });
}
