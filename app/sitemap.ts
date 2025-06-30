import type { MetadataRoute } from 'next';
import { getAllCategories, getAllProducts } from '@/lib/actions/product.actions'; // Adjust path if needed

// --- TYPE DEFINITIONS for improved type safety ---
// Assumes your product object has 'slug' and 'updatedAt'
type Product = {
    slug: string;
    updatedAt: string | Date;
};

// This type is no longer strictly needed for categories but can be kept for clarity


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://collectionshop.it.com';
    const lastModifiedStatic = new Date('2024-01-01');

    // --- Static Pages (No changes needed here) ---
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        { url: `${baseUrl}/about`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/contact`, lastModified: lastModifiedStatic, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/terms`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
        { url: `${baseUrl}/privacy`, lastModified: lastModifiedStatic, changeFrequency: 'yearly', priority: 0.5 },
    ];

    // --- Dynamic Product Pages (No changes needed here) ---
    const productPages: MetadataRoute.Sitemap = await (async () => {
        try {
            console.log('Fetching products for sitemap...');
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

            console.log(`Fetched ${allProducts.length} products successfully.`);

            return allProducts.map((product) => ({
                url: `${baseUrl}/product/${product.slug}`,
                lastModified: new Date(product.updatedAt),
                changeFrequency: 'weekly',
                priority: 0.9,
            }));

        } catch (error) {
            console.error('Failed to fetch products for sitemap:', error);
            return [];
        }
    })();


    // --- Dynamic Category Pages (CORRECTED LOGIC) ---
    const categoryPages: MetadataRoute.Sitemap = await (async () => {
        try {
            console.log('Fetching categories for sitemap...');
            // 1. Fetch the category names, which will be a string array.
            const categoryNames: string[] = await getAllCategories();
            console.log(`Fetched ${categoryNames.length} categories successfully.`);

            // 2. Map over the array of strings to create the sitemap entries.
            return categoryNames.map((categoryName) => {
                // 3. Create a URL-safe slug from the category name.
                const slug = encodeURIComponent(categoryName.toLowerCase().replace(/\s+/g, '-'));

                return {
                    url: `${baseUrl}/category/${slug}`,
                    lastModified: new Date(), // Category pages are dynamic
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