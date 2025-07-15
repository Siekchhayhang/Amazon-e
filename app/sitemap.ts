import { MetadataRoute } from 'next';
import { getAllCategories, getAllProducts } from '@/lib/actions/product.actions';
import { i18n } from '@/i18n-config';
import { NEXT_PUBLIC_SERVER_URL } from '@/lib/constants';

type Product = {
  slug: string;
  updatedAt: string | Date;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = NEXT_PUBLIC_SERVER_URL;
  const lastModifiedStatic = new Date('2024-01-01');

  // Fetch all products
  const allProducts: Product[] = [];
  let currentPage = 1;
  let totalPages = 1;
  do {
    const response = await getAllProducts({
      query: 'all',
      category: 'all',
      tag: 'all',
      page: currentPage,
    });

    if (response && response.products) {
      allProducts.push(...response.products);
      totalPages = response.totalPages || 1;
    }
    currentPage++;
  } while (currentPage <= totalPages);

  // Fetch all category names
  const categoryNames: string[] = await getAllCategories();

  const sitemapEntries: MetadataRoute.Sitemap = [];
  const { locales, defaultLocale } = i18n;

  // --- Static Pages ---
  const staticPages = [
    { path: '', changeFrequency: 'daily', priority: 1.0, lastModified: new Date() },
    { path: '/products', changeFrequency: 'daily', priority: 0.9, lastModified: new Date() },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8, lastModified: lastModifiedStatic },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.8, lastModified: lastModifiedStatic },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.5, lastModified: lastModifiedStatic },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.5, lastModified: lastModifiedStatic },
  ] as const;

  staticPages.forEach(page => {
    // Helper to generate language alternatives including x-default
    const languages = locales.reduce((acc, locale) => {
      acc[locale.code] = `${baseUrl}/${locale.code}${page.path}`;
      return acc;
    }, {} as Record<string, string>);
    languages['x-default'] = `${baseUrl}/${defaultLocale}${page.path}`;

    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}${page.path}`,
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages },
    });
  });


  // --- Product Pages ---
  allProducts.forEach((product) => {
    const languages = locales.reduce((acc, locale) => {
      acc[locale.code] = `${baseUrl}/${locale.code}/product/${product.slug}`;
      return acc;
    }, {} as Record<string, string>);
    languages['x-default'] = `${baseUrl}/${defaultLocale}/product/${product.slug}`;

    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}/product/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages },
    });
  });


  // --- Category Pages ---
  categoryNames.forEach((categoryName) => {
    const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));
    const languages = locales.reduce((acc, locale) => {
      acc[locale.code] = `${baseUrl}/${locale.code}/category/${slug}`;
      return acc;
    }, {} as Record<string, string>);
    languages['x-default'] = `${baseUrl}/${defaultLocale}/category/${slug}`;

    // For a more accurate lastModified date, you could find the most
    // recently updated product in this category.
    // For now, we'll keep it as new Date().
    const lastModified = new Date();

    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}/category/${slug}`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: { languages },
    });
  });


  return sitemapEntries;
}