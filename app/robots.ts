import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://collectionshop.it.com';

    const sitemaps = i18n.locales.map(locale => `${baseUrl}/${locale.code}/sitemap.xml`);

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/admin',
                '/api',
                '/auth',
                '/checkout',
                '/cart',
                '/account',
            ],
        },
        sitemap: sitemaps,
        host: baseUrl,
    };
}