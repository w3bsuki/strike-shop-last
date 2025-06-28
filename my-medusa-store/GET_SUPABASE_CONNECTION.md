# 🔧 Get Your Correct Supabase Connection String

## Steps:

1. **Go to your Supabase Dashboard**
   - https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk/settings/database

2. **Find "Connection string" section**
   - Click on "Connection string" tab
   - Select "Transaction" mode (Port 6543)
   - Copy the connection string

3. **It should look like:**
   ```
   postgresql://postgres.vxvitkusmtukyjrdjhqk:[YOUR-DATABASE-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

4. **IMPORTANT**: The password in the connection string is NOT your service role key!
   - It's your database password you set when creating the project
   - If you forgot it, you can reset it in Settings > Database > Database Password

## Alternative: Direct Connection (if pooler doesn't work)

Try the direct connection (port 5432):
```
postgresql://postgres.vxvitkusmtukyjrdjhqk:[YOUR-DATABASE-PASSWORD]@db.vxvitkusmtukyjrdjhqk.supabase.co:5432/postgres
```

## Quick Test

Once you have the correct connection string, test it:
```bash
# Update .env with correct DATABASE_URL
# Then test connection
npx medusa db:migrate --dry-run
```