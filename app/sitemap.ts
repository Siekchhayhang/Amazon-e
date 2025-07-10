import { MetadataRoute } from 'next';
import { i18n } from '@/i18n-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://collectionshop.it.com';

  return i18n.locales.map((locale) => ({
    url: `${baseUrl}/${locale.code}/sitemap.xml`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  }));
}