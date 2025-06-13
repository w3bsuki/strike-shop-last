#!/bin/sh

echo "Starting Medusa on Railway..."
echo "PORT: ${PORT:-9000}"
echo "HOST: ${HOST:-0.0.0.0}"
echo "NODE_ENV: ${NODE_ENV}"
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# Export critical variables
export PORT=${PORT:-9000}
export HOST=${HOST:-"0.0.0.0"}

# Run migrations
echo "Running database migrations..."
npx medusa db:migrate || echo "Migrations failed or already up to date"

# Start Medusa
echo "Starting Medusa server..."
exec npx medusa start