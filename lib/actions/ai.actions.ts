'use server'

import { connectToDatabase } from '@/lib/db'
import Product from '@/lib/db/models/product.model'
import { getSetting } from './setting.actions'
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

export async function getShopLocation() {
  const { shop } = await getSetting()
  return shop.location
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
