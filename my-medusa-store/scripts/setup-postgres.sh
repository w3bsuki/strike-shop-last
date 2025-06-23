#!/bin/bash

# PostgreSQL Setup Script for Medusa Production
# This script sets up PostgreSQL for production use

echo "🚀 Setting up PostgreSQL for Medusa Production"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   MacOS: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "❌ PostgreSQL is not running. Please start it:"
    echo "   Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   MacOS: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is installed and running"

# Create production database and user
echo "Creating production database and user..."

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create SQL commands
cat > /tmp/medusa_db_setup.sql << EOF
-- Create production user
CREATE USER medusa_user WITH PASSWORD '$DB_PASSWORD';

-- Create production database
CREATE DATABASE medusa_production OWNER medusa_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE medusa_production TO medusa_user;

-- Connect to the database and create extensions
\c medusa_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

echo "📝 Running database setup..."
echo "   You may be prompted for the postgres user password"

# Run as postgres user
sudo -u postgres psql < /tmp/medusa_db_setup.sql

# Clean up
rm /tmp/medusa_db_setup.sql

echo "✅ Database setup complete!"
echo ""
echo "🔐 Your database credentials:"
echo "   Database: medusa_production"
echo "   User: medusa_user"
echo "   Password: $DB_PASSWORD"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env.production file with:"
echo "   DATABASE_URL=postgres://medusa_user:$DB_PASSWORD@localhost:5432/medusa_production"
echo ""
echo "2. Generate secure secrets for JWT and cookies:"
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo "   COOKIE_SECRET=$(openssl rand -base64 32)"
echo ""
echo "3. Run Medusa migrations:"
echo "   cd my-medusa-store"
echo "   npm run migrations:run"