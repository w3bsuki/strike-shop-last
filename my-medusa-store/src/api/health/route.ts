import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() })
}