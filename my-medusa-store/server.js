const express = require('express')
const { exec } = require('child_process')

const app = express()
const PORT = process.env.PORT || 9000
const HOST = process.env.HOST || '0.0.0.0'

// Health check endpoint - responds immediately
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST
  })
})

// Info endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Medusa backend starting...',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      PORT: PORT,
      HOST: HOST
    }
  })
})

// Start the health check server immediately
app.listen(PORT, HOST, () => {
  console.log(`Health check server running on ${HOST}:${PORT}`)
  console.log(`Health endpoint: http://${HOST}:${PORT}/health`)
  
  // Now start Medusa in the background
  console.log('Starting Medusa backend...')
  
  const medusa = exec('npx medusa start', {
    env: { ...process.env, PORT: String(Number(PORT) + 1) } // Run Medusa on next port
  })
  
  medusa.stdout.on('data', (data) => {
    console.log(`Medusa: ${data}`)
  })
  
  medusa.stderr.on('data', (data) => {
    console.error(`Medusa Error: ${data}`)
  })
  
  medusa.on('close', (code) => {
    console.log(`Medusa process exited with code ${code}`)
  })
})