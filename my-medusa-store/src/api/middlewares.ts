import { defineMiddlewares } from "@medusajs/framework"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/health",
      method: "GET",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          // Immediate health check response - no database check
          res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            service: "medusa-backend",
            version: "2.0",
          })
        },
      ],
    },
  ],
})