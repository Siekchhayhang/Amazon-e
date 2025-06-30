import type { MetadataRoute } from 'next';
import { getAllCategories, getAllProducts } from '@/lib/actions/product.actions'; // Adjust path if needed

// --- TYPE DEFINITIONS for improved type safety ---
// Assumes your product object has 'slug' and 'updatedAt'
type Product = {
    slug: string;
    updatedAt: string | Date;
};

// Assumes your category object has a 'slug' for robust URL generation
type Category = {
    slug: string;
    // include other category properties if needed, e.g., name
};


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://collectionshop.it.com';

    // Recommendation Implemented: Use a static date for pages that don't change often.
    // This could be the date of the last major site update or launch date.
    const lastModifiedStatic = new Date('2024-01-01');

    // --- Static Pages ---
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(), // Homepage is dynamic, so new Date() is appropriate here.
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/products`, // All products listing page
            lastModified: new Date(), // This page changes daily as products are added/updated.
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: lastModifiedStatic,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: lastModifiedStatic,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: lastModifiedStatic,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: lastModifiedStatic,
            changeFrequency: 'yearly',
            priority: 0.5,
        },
    ];

    // --- Dynamic Product Pages ---
    const productPages: MetadataRoute.Sitemap = await (async () => {
        try {
            console.log('Fetching products for sitemap...');
            const allProducts: Product[] = [];
            let currentPage = 1;
            let totalPages = 1;

            // Recommendation Implemented: Loop through all pages to fetch every product.
            // This assumes your getAllProducts function returns a pagination object.
            do {
                const response = await getAllProducts({
                    query: 'all',
                    category: 'all',
                    tag: 'all',
                    page: currentPage,
                });

                if (response && response.products) {
                    allProducts.push(...response.products);
                    totalPages = response.totalPages || 1; // Get total pages from the response
                }

                currentPage++;
            } while (currentPage <= totalPages);

            console.log(`Fetched ${allProducts.length} products successfully.`);

            return allProducts.map((product) => ({
                url: `${baseUrl}/product/${product.slug}`,
                lastModified: new Date(product.updatedAt), // Use the product's actual update date
                changeFrequency: 'weekly',
                priority: 0.9,
            }));

        } catch (error) {
            // Recommendation Implemented: Added robust error handling.
            console.error('Failed to fetch products for sitemap:', error);
            return []; // Return an empty array on error to prevent build failure
        }
    })();


    // --- Dynamic Category Pages ---
    const categoryPages: MetadataRoute.Sitemap = await (async () => {
        try {
            console.log('Fetching categories for sitemap...');
            // Assumes getAllCategories returns an array of Category objects: { slug: string }[]
            const categories: Category[] = await getAllCategories();
            console.log(`Fetched ${categories.length} categories successfully.`);

            // Recommendation Implemented: Use a 'slug' field from the database for categories.
            // This is more reliable than generating it on the fly.
            return categories.map((category) => ({
                url: `${baseUrl}/category/${category.slug}`,
                lastModified: new Date(), // Category pages are dynamic, new products can be added daily.
                changeFrequency: 'daily',
                priority: 0.8,
            }));

        } catch (error) {
            // Recommendation Implemented: Added robust error handling.
            console.error('Failed to fetch categories for sitemap:', error);
            return []; // Return an empty array on error
        }
    })();

    return [...staticPages, ...productPages, ...categoryPages];
}