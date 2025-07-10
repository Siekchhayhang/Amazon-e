import type { MetadataRoute } from 'next';
import { getAllCategories, getAllProducts } from '@/lib/actions/product.actions';

type Product = {
  slug: string;
  updatedAt: string | Date;
};

export default async function sitemap({ params: { locale } }: { params: { locale: string } }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://collectionshop.it.com';
  const lastModifiedStatic = new Date('2024-01-01');

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/${locale}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    { url: `${baseUrl}/${locale}/about`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/${locale}/contact`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/${locale}/terms`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/${locale}/privacy`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const productPages: MetadataRoute.Sitemap = await (async () => {
    try {
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

      return allProducts.map((product) => ({
        url: `${baseUrl}/${locale}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));

    } catch (error) {
      console.error('Failed to fetch products for sitemap:', error);
      return [];
    }
  })();

  const categoryPages: MetadataRoute.Sitemap = await (async () => {
    try {
      const categoryNames: string[] = await getAllCategories();

      return categoryNames.map((categoryName) => {
        const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));

        return {
          url: `${baseUrl}/${locale}/category/${slug}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        };
      });

    } catch (error) {
      console.error('Failed to fetch categories for sitemap:', error);
      return [];
    }
  })();

  return [...staticPages, ...productPages, ...categoryPages];
}