import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = 'https://collectionshop.it.com';

    // Example static routes
    const routes = [
        '',
        '/about',
        '/products',
        '/contact',
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${routes
            .map(
                (route) => `
        <url>
            <loc>${baseUrl}${route}</loc>
        </url>
    `
            )
            .join('')}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}