import { createClient, type SanityClient } from "next-sanity"
import imageUrlBuilder from "@sanity/image-url"
import type { SanityImageSource } from "@sanity/image-url/lib/types/types"

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
}

if (!dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET environment variable')
}
const apiVersion = "2024-06-10" // Use a recent API version

export const client: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production", // Use CDN in production
})

// Helper function to generate image URLs
const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Define interfaces for your Sanity data
export interface SanityImage {
  _type: "image"
  asset: {
    _ref: string
    _type: "reference"
  }
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

export interface SanitySlug {
  _type: "slug"
  current: string
}

export interface SanityCategory {
  _id: string
  _type: "category"
  name: string
  slug: SanitySlug
  image?: SanityImage
  description?: string
  count?: number // Product count for this category
}

export interface SanityProductDetailItem {
  _key: string
  title?: string
  content?: string
}

export interface SanityProduct {
  _id: string
  _type: "product"
  name: string
  slug: SanitySlug
  images: SanityImage[]
  shortDescription?: string
  description?: any // Portable Text
  price: number
  originalPrice?: number
  discount?: string // Calculated discount percentage
  sku?: string
  category: SanityCategory // Reference, might be fetched expanded
  sizes?: string[]
  colors?: string[]
  stock?: number
  isNewArrival?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
  details?: SanityProductDetailItem[]
}
