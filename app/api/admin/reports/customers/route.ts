import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/lib/db/models/user.model';
import { unparse } from 'papaparse';

export async function GET() {
    await connectToDatabase();
    const users = await User.find().sort({ createdAt: -1 });

    const csv = unparse(
        users.map((user) => ({
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt).toLocaleDateString(),
        }))
    );

    return new NextResponse(csv, {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=customers.csv',
        },
    });
}
