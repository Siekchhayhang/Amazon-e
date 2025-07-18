
import { getAllProducts } from '@/lib/actions/product.actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { products } = await getAllProducts({
      query: 'all',
      page: 1,
      limit: 10,
      category: 'all',
      tag: 'all',
    });
    const prompts = products.map((p) => `What is ${p.name}?`);
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}
