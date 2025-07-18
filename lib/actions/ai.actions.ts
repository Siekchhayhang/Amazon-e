'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { getAllProducts } from './product.actions'

export async function getNewestProducts() {
  await connectToDatabase()
  const products = await Product.find({ isPublished: true })
    .sort({ createdAt: 'desc' })
    .limit(4)
    .lean()
  return JSON.parse(JSON.stringify(products))
}

export async function getTopSellingProducts() {
  await connectToDatabase()
  const products = await Product.find({ isPublished: true })
    .sort({ numSales: 'desc' })
    .limit(4)
    .lean()
  return JSON.parse(JSON.stringify(products))
}

export async function getSuggestionProductPrice({
  productName,
}: {
  productName: string
}) {
  const product = await getProductByName(productName)
  if (product) {
    return `The price of ${product.name} is ${product.price}. I would suggest a price around ${product.price}.`
  }
  const { products } = await getAllProducts({
    query: productName,
    limit: 4,
    page: 1,
    category: 'all',
    tag: 'all',
  })
  if (products.length > 0) {
    return `We couldn't find a product with the name ${productName}. Here are some similar products: ${products
      .map((p) => `${p.name} (${p.price})`)
      .join(', ')}`
  }
  return `We couldn't find a product with the name ${productName}.`
}

export async function getProductByName(productName: string) {
  const cleanedName = productName.replace('What is', '').replace('?', '').trim()
  const { products } = await getAllProducts({
    query: cleanedName,
    limit: 1,
    page: 1,
    category: 'all',
    tag: 'all',
  })
  return products.length > 0 ? products[0] : null
}
