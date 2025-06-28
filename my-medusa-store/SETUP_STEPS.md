# 🚨 Important Setup Steps

## 1. First, Enable Extensions in Supabase (REQUIRED!)

Before running migrations, you MUST enable the extensions in Supabase:

1. Go to your Supabase Dashboard
2. Click on SQL Editor
3. Run this SQL:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## 2. Get the Correct Connection String

Go to: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk/settings/database

Choose ONE of these options:

### Option A: Connection Pooling (Recommended)
- Select "Connection pooling"
- Mode: "Transaction"
- Copy the connection string
- It should look like:
```
postgresql://postgres.vxvitkusmtukyjrdjhqk:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Option B: Direct Connection
- Select "Direct connection"
- Copy the connection string
- It should look like:
```
postgresql://postgres:[PASSWORD]@db.vxvitkusmtukyjrdjhqk.supabase.co:5432/postgres
```

## 3. Update Your .env

Replace the DATABASE_URL with the correct one from Supabase.

## 4. Test Connection

```bash
# Test if connection works
npx medusa db:migrate --dry-run
```

## Common Issues:

1. **"Tenant or user not found"** = Wrong password or connection string format
2. **Network errors** = Try the other connection type (pooled vs direct)
3. **SSL errors** = The medusa-config.js already handles this

## Need to Reset Database Password?

If you forgot your database password:
1. Go to Settings > Database in Supabase
2. Click "Reset database password"
3. Update the connection string with new password