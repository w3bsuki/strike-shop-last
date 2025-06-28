# 📍 How to Get Your Database Connection String

## Step-by-Step with Screenshots:

1. **Go to your Supabase Dashboard**
   - https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk

2. **Click on "Settings" (gear icon) in the left sidebar**

3. **Click on "Database" in the settings menu**

4. **Scroll down to "Connection string" section**

5. **You'll see tabs:**
   - URI
   - PSQL
   - .NET
   - etc.

6. **Click on "URI" tab**

7. **Select "Transaction" from the Mode dropdown**

8. **You'll see something like:**
   ```
   postgresql://postgres.vxvitkusmtukyjrdjhqk:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

9. **IMPORTANT**: 
   - The `[YOUR-PASSWORD]` part will show your actual database password
   - This is NOT "https://vxvitkusmtukyjrdjhqk.supabase.co"
   - It starts with "postgresql://"

## What Each Part Means:

```
postgresql://postgres.vxvitkusmtukyjrdjhqk:941015tyJa7!@aws-0-us-west-1.pooler.supabase.com:6543/postgres
    ^              ^                          ^              ^                                  ^        ^
    |              |                          |              |                                  |        |
Protocol      Username                   Password         Host                              Port   Database
```

## Quick Navigation:
1. Dashboard: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk
2. Direct link to Database settings: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk/settings/database
3. Look for "Connection string" section
4. Copy the ENTIRE string that starts with "postgresql://"