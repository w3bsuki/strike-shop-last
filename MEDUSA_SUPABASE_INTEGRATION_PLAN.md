# 🔗 Medusa 2.0 + Supabase Production Integration Plan

## Executive Summary
This plan details the production-ready integration of Medusa 2.0 with Supabase PostgreSQL, optimized for e-commerce workloads with proper connection pooling, security, and performance considerations.

## 🏗️ Integration Architecture

```
┌─────────────────────────┐
│     Medusa Backend      │
│  ┌─────────────────┐    │
│  │   TypeORM/Drizzle│    │
│  └────────┬────────┘    │
│           │              │
│  ┌────────▼────────┐    │
│  │ Connection Pool │    │
│  └────────┬────────┘    │
└───────────┼─────────────┘
            │
            │ SSL/TLS
            ▼
┌─────────────────────────┐
│      Supabase           │
│  ┌─────────────────┐    │
│  │    Supavisor    │    │
│  │  (Port 6543)    │    │
│  └────────┬────────┘    │
│           │              │
│  ┌────────▼────────┐    │
│  │   PostgreSQL    │    │
│  │   (14.x)        │    │
│  └─────────────────┘    │
└─────────────────────────┘
```

## 📋 Step-by-Step Integration Process

### Step 1: Supabase Project Setup

#### 1.1 Create Supabase Project
```bash
# Go to https://supabase.com/dashboard
# Create new project with:
# - Strong database password (save securely)
# - Region closest to your users
# - Wait for project provisioning (~2 minutes)
```

#### 1.2 Enable Required Extensions
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "citext";         -- For case-insensitive text
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For encryption functions

-- Verify extensions
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm', 'citext', 'pgcrypto');
```

#### 1.3 Configure Database for E-commerce
```sql
-- Optimize for e-commerce workloads
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET max_connections = 100;

-- Configure autovacuum for high-transaction tables
ALTER TABLE public.order SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.cart SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE public.product SET (autovacuum_analyze_scale_factor = 0.05);
```

### Step 2: Connection Configuration

#### 2.1 Connection String Setup
```bash
# For Medusa with connection pooling (RECOMMENDED):
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Connection string components:
# - postgres.[project-ref]: Your database user
# - [password]: Your database password
# - aws-0-[region]: Your project region
# - Port 6543: Transaction pooling mode
# - pgbouncer=true: Enable pooler
# - connection_limit=1: Serverless optimization
```

#### 2.2 Medusa Configuration
```typescript
// medusa-config.ts
import { defineConfig } from '@medusajs/framework/utils'

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false,
      },
      // Connection pool settings
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    },
    databaseLogging: process.env.NODE_ENV === 'development',
  },
})
```

#### 2.3 Connection Retry Logic
```typescript
// src/utils/database-connection.ts
export async function createDatabaseConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      // Test connection
      const connection = await dataSource.initialize()
      console.log('Database connected successfully')
      return connection
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error)
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }
}
```

### Step 3: Schema Migration Strategy

#### 3.1 Initial Migration
```bash
# 1. Ensure clean database
# 2. Run Medusa migrations
npx medusa db:migrate

# 3. Verify schema
npx medusa db:generate
```

#### 3.2 Custom Indexes for Performance
```sql
-- Product search optimization
CREATE INDEX idx_product_title_gin ON product USING gin(title gin_trgm_ops);
CREATE INDEX idx_product_handle ON product(handle);
CREATE INDEX idx_product_status ON product(status) WHERE deleted_at IS NULL;

-- Order performance
CREATE INDEX idx_order_customer_id ON "order"(customer_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_created_at ON "order"(created_at DESC);

-- Cart optimization
CREATE INDEX idx_cart_completed_at ON cart(completed_at) WHERE completed_at IS NULL;

-- Variant search
CREATE INDEX idx_product_variant_sku ON product_variant(sku);
CREATE INDEX idx_product_variant_product_id ON product_variant(product_id);
```

### Step 4: Security Configuration

#### 4.1 Row Level Security (RLS)
```sql
-- Enable RLS on sensitive tables
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;

-- Create policies for API access
CREATE POLICY "API full access" ON customer
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Customer data isolation
CREATE POLICY "Customers see own data" ON customer
  FOR SELECT
  USING (id = auth.uid() OR auth.jwt() ->> 'role' = 'service_role');
```

#### 4.2 Database Roles
```sql
-- Create read-only role for analytics
CREATE ROLE analytics_reader;
GRANT CONNECT ON DATABASE postgres TO analytics_reader;
GRANT USAGE ON SCHEMA public TO analytics_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_reader;

-- Create limited admin role
CREATE ROLE medusa_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO medusa_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medusa_admin;
```

### Step 5: Performance Optimization

#### 5.1 Query Performance Monitoring
```sql
-- Enable query stats extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries slower than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### 5.2 Connection Pool Monitoring
```typescript
// src/monitoring/database-health.ts
export async function monitorDatabaseHealth() {
  const poolStats = dataSource.driver.master.pool
  
  return {
    totalConnections: poolStats.totalCount,
    idleConnections: poolStats.idleCount,
    waitingRequests: poolStats.waitingCount,
    connectionErrors: poolStats.errorCount,
  }
}
```

### Step 6: Backup & Recovery Setup

#### 6.1 Automated Backup Script
```bash
#!/bin/bash
# backup-supabase.sh

# Configuration
PROJECT_REF="your-project-ref"
DB_PASSWORD="your-password"
BACKUP_DIR="/backups"
RETENTION_DAYS=7

# Create backup
FILENAME="backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h aws-0-region.pooler.supabase.com \
  -p 5432 \
  -U postgres.$PROJECT_REF \
  -d postgres \
  --no-owner \
  --no-privileges \
  --exclude-schema=supabase_functions \
  > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://your-backup-bucket/

# Clean old backups
find $BACKUP_DIR -name "backup_*.gz" -mtime +$RETENTION_DAYS -delete
```

#### 6.2 Point-in-Time Recovery Setup
```bash
# For Pro plan users (databases > 4GB)
# Enable in Supabase Dashboard > Database > Backups
# Configure retention period (7-30 days)
```

### Step 7: Monitoring & Alerts

#### 7.1 Health Check Implementation
```typescript
// src/api/health/database.ts
export async function checkDatabaseHealth() {
  try {
    // Basic connectivity
    const result = await dataSource.query('SELECT NOW() as current_time')
    
    // Check critical tables
    const tables = ['product', 'order', 'customer', 'cart']
    for (const table of tables) {
      await dataSource.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`)
    }
    
    // Check connection pool
    const poolHealth = await monitorDatabaseHealth()
    
    return {
      status: 'healthy',
      timestamp: result[0].current_time,
      pool: poolHealth,
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    }
  }
}
```

#### 7.2 Monitoring Dashboard Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_database_size('postgres') / 1024 / 1024 as size_mb;

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio (should be > 99%)
SELECT 
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;
```

## 🚨 Common Integration Issues & Solutions

### Issue 1: Connection Pool Exhaustion
```typescript
// Solution: Implement connection limiting
const dataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  poolSize: 10,  // Limit connections
  extra: {
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true,
  }
}
```

### Issue 2: SSL Connection Errors
```typescript
// Solution: Configure SSL properly
databaseDriverOptions: {
  connection: {
    ssl: {
      rejectUnauthorized: false,
      ca: process.env.SUPABASE_CA_CERT,  // Optional: Use Supabase CA cert
    }
  }
}
```

### Issue 3: Transaction Mode Limitations
```sql
-- If using prepared statements fails:
-- Switch to Session mode (port 5432) or disable prepared statements
databaseDriverOptions: {
  connection: {
    ssl: { rejectUnauthorized: false },
    prepareThreshold: 0,  // Disable prepared statements
  }
}
```

### Issue 4: Migration Failures
```bash
# Reset and retry migrations
npx medusa db:drop
npx medusa db:create
npx medusa db:migrate

# Or manual cleanup
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## 📊 Performance Benchmarks

### Expected Performance Metrics
- Connection time: < 100ms
- Simple queries: < 10ms
- Complex queries: < 100ms
- Transaction throughput: > 1000 TPS
- Cache hit ratio: > 99%

### Load Testing Script
```bash
# Install pgbench
apt-get install postgresql-client

# Run load test
pgbench -i -s 10 $DATABASE_URL
pgbench -c 10 -j 2 -t 1000 $DATABASE_URL
```

## 🔒 Security Checklist

- [ ] Enable SSL/TLS for all connections
- [ ] Use connection pooling (Supavisor)
- [ ] Implement Row Level Security
- [ ] Regular security updates
- [ ] Audit log monitoring
- [ ] Encrypted backups
- [ ] Network restrictions configured
- [ ] Service keys rotated regularly
- [ ] Database user permissions minimized
- [ ] Monitoring alerts configured

## 🚀 Go-Live Checklist

### Pre-Production
- [ ] Run full test suite against Supabase
- [ ] Verify all migrations completed
- [ ] Check index usage with EXPLAIN
- [ ] Test backup restoration
- [ ] Load test with expected traffic

### Production Launch
- [ ] Enable all monitoring
- [ ] Configure alerts
- [ ] Document connection strings
- [ ] Test failover procedures
- [ ] Verify backup automation

### Post-Launch
- [ ] Monitor slow query log
- [ ] Review connection pool usage
- [ ] Optimize based on real usage
- [ ] Plan capacity increases
- [ ] Schedule maintenance windows

## 📈 Scaling Strategy

### When to Scale
- CPU usage > 80% sustained
- Connection pool > 80% utilized  
- Storage > 80% capacity
- Query times increasing

### Scaling Options
1. **Vertical**: Upgrade Supabase plan
2. **Read Replicas**: For read-heavy workloads
3. **Connection Pooling**: Increase pool size
4. **Query Optimization**: Add indexes, optimize queries
5. **Caching Layer**: Add Redis for frequently accessed data

This integration plan ensures a robust, secure, and performant connection between Medusa 2.0 and Supabase for production e-commerce workloads.