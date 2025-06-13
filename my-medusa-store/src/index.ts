import { MedusaApp } from "@medusajs/framework"
import { loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

async function start() {
  const port = process.env.PORT || 9000
  const host = process.env.HOST || "0.0.0.0"

  console.log(`Starting Medusa on ${host}:${port}`)
  
  const { app } = await MedusaApp({
    projectConfig: {
      databaseUrl: process.env.DATABASE_URL,
      http: {
        port: Number(port),
        host,
      },
    },
  })

  // Add a simple health endpoint that doesn't require full initialization
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
  })

  app.listen(port, host, () => {
    console.log(`Server is ready on ${host}:${port}`)
  })
}

start().catch((err) => {
  console.error("Failed to start server:", err)
  process.exit(1)
})