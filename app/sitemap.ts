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

  const categoryNames: string[] = await getAllCategories();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  i18n.locales.forEach((locale) => {
    // Static Pages
    sitemapEntries.push(
      {
        url: `${baseUrl}/${locale.code}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/${locale.code}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      { url: `${baseUrl}/${locale.code}/about`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/${locale.code}/contact`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
      { url: `${baseUrl}/${locale.code}/terms`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
      { url: `${baseUrl}/${locale.code}/privacy`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
    );

    // Product Pages
    allProducts.forEach((product) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale.code}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });

    // Category Pages
    categoryNames.forEach((categoryName) => {
      const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));
      sitemapEntries.push({
        url: `${baseUrl}/${locale.code}/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  });

  return sitemapEntries;
}
