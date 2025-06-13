import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export const GET = (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.status(200).json({ 
    message: "Medusa backend is running!",
    status: "ok",
    timestamp: new Date().toISOString()
  })
}