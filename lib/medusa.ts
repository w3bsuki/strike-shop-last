import Medusa from "@medusajs/medusa-js"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:8000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// Only throw error in runtime, not during build
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
    console.error('Missing NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable')
  }
  if (!process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    console.error('Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable')
  }
}

export const medusaClient = new Medusa({
  baseUrl: BACKEND_URL,
  maxRetries: 3,
  publishableApiKey: PUBLISHABLE_KEY,
})
