import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';
import { NEXT_PUBLIC_SERVER_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = NEXT_PUBLIC_SERVER_URL;

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