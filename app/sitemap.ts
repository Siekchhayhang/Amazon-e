// app/sitemap.ts
import { MetadataRoute } from 'next';

const baseUrl = 'https://collectionshop.it.com'; // **Verify this is your actual public domain**

export default function sitemap(): MetadataRoute.Sitemap { // No async needed for static array
    // Example static routes
    const routes = [
        '',
        '/about',
        '/products',
        '/contact',
    ];

    return routes.map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(), // Use current date for simplicity
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1.0 : 0.7,
    }));
}