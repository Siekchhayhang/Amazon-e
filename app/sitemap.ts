import type { MetadataRoute } from 'next';
import { getAllCategories, getAllProducts } from '@/lib/actions/product.actions'; // Adjust path if needed

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://collectionshop.it.com';

    // Fetch all product slugs and their last modified dates
    const productSlugs = await getAllProducts({
        query: 'all',
        category: 'all',
        tag: 'all',
        page: 1
    });
    // Fetch all categories
    const categories = await getAllCategories();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily', // Homepage often changes
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`, // Example static page
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`, // Example static page
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`, // Example static page
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacy`, // Example static page
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/products`, // All products listing page
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
    ];

    // Define the type for a product slug object
    type ProductSlug = {
        slug: string;
        updatedAt?: string | Date;
    };

    // Dynamically generated product pages
    const productPages: MetadataRoute.Sitemap = productSlugs.products.map((product: ProductSlug) => ({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updatedAt || new Date(), // Use product's update date if available
        changeFrequency: 'weekly', // Product details might change frequently
        priority: 0.9, // Products are very important
    }));

    // Dynamically generated category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/category/${encodeURIComponent(category.toLowerCase().replace(/\s+/g, '-'))}`, // Assuming categories are converted to URL-friendly slugs
        lastModified: new Date(), // Categories might not have a specific last modified date in DB
        changeFrequency: 'daily', // Categories might have new products frequently
        priority: 0.8,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
}