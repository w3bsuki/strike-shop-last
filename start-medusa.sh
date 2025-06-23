#!/bin/bash

# Kill any existing Medusa processes
echo "🔄 Stopping existing Medusa processes..."
pkill -f "medusa" 2>/dev/null || echo "No existing processes found"

# Wait a moment
sleep 2

# Change to Medusa directory
cd /home/w3bsuki/strike-shop-1-main/my-medusa-store

# Set environment variables
export PORT=9000
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/medusa_db"
export STORE_CORS="http://localhost:3000,http://localhost:9000"
export ADMIN_CORS="http://localhost:3000,http://localhost:9000,http://localhost:7001"
export AUTH_CORS="http://localhost:3000,http://localhost:9000"

echo "🚀 Starting Medusa server on port 9000..."
echo "📍 Admin URL: http://localhost:9000/app"
echo "🔐 Login: admin@example.com / password123"
echo ""

# Start the server
npm run dev