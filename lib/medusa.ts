import Medusa from "@medusajs/medusa-js"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

if (!BACKEND_URL) {
  throw new Error('Missing NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable')
}

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY environment variable')
}

export const medusaClient = new Medusa({
  baseUrl: BACKEND_URL,
  maxRetries: 3,
  publishableApiKey: PUBLISHABLE_KEY,
})
