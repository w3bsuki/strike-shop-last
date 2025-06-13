#!/bin/sh

echo "Starting Medusa on Railway..."
echo "Database URL: ${DATABASE_URL}"
echo "Port: ${PORT}"

# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run migrations
echo "Running database migrations..."
npx medusa db:migrate || echo "Migration failed, continuing anyway..."

# Start the server
echo "Starting Medusa server on port ${PORT}..."
exec pnpm run start