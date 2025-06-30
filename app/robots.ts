import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = 'https://collectionshop.it.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            // Ensure you disallow any paths that should not be crawled.
            disallow: [
                '/admin',      // Admin panel
                '/api',        // API routes
                '/auth',       // Authentication pages (login, sign-up)
                '/checkout',   // Checkout process
                '/cart',       // User shopping cart
                '/account',    // User account pages
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
        // Recommendation Implemented: Added the 'host' directive.
        // While optional, it explicitly tells crawlers the preferred domain.
        host: baseUrl,
    };
}