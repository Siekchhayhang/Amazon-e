import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api', '/auth', '/checkout', '/cart'],
            crawlDelay: 2,
        },
        sitemap: 'https://collectionshop.it.com/sitemap.xml',
    }
}