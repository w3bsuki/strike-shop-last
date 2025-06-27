# Supabase Deployment Guide - Step by Step

## Option 1: Using Supabase Dashboard (Easiest)

### Step 1: Run Database Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy ALL the content from `supabase/migrations/001_stripe_webhooks.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)

### Step 2: Deploy Edge Functions via Dashboard

1. In your Supabase Dashboard, go to **Edge Functions** in the left sidebar
2. Click **Create a new function**
3. Name it `stripe-webhook`
4. Copy the code from `supabase/functions/stripe-webhook/index.ts`
5. Paste it into the function editor
6. Click **Deploy**

### Step 3: Set Environment Variables

1. Still in Edge Functions, click on your `stripe-webhook` function
2. Click **Manage secrets**
3. Add these secrets:
   ```
   STRIPE_SECRET_KEY = your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET = (you'll get this from Stripe after creating the webhook)
   ```

## Option 2: Using Terminal (For Developers)

### Step 1: Install Supabase CLI

**On macOS (using Homebrew):**

```bash
brew install supabase/tap/supabase
```

**On Windows (using Scoop):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**On Linux:**

```bash
# Download the latest release
wget -O- https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz

# Move to a directory in your PATH
sudo mv supabase /usr/local/bin/
```

### Step 2: Login and Link Project

Open your terminal in the project directory:

```bash
cd /home/w3bsuki/MATRIX/projects/current/strike-shop-1-main

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref vxvitkusmtukyjrdjhqk
```

### Step 3: Deploy Functions

```bash
# Deploy the Stripe webhook function
supabase functions deploy stripe-webhook

# Set the secrets
supabase secrets set STRIPE_SECRET_KEY="your_stripe_secret_key_here"
```

## Option 3: Quick Manual Setup (What I Recommend)

Since you already have your Supabase project set up, here's the quickest way:

### 1. Copy this SQL and run it in Supabase SQL Editor:

Go to: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk/sql/new

Then paste and run the migration from `supabase/migrations/001_stripe_webhooks.sql`

### 2. Create the Webhook in Stripe:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter endpoint URL: `https://vxvitkusmtukyjrdjhqk.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.created`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### 3. Update Your .env.local:

Add the webhook secret you just copied:

```
STRIPE_WEBHOOK_SECRET=whsec_YOUR_COPIED_SECRET
```

## That's It! 🎉

Your webhook is now set up. When someone makes a payment:

1. Stripe will send a webhook to your Supabase function
2. The payment will be recorded in your database
3. You can view payments in your Supabase dashboard under Table Editor > payments

## Testing Your Setup

To test if everything works:

1. Make a test payment on your site
2. Check your Supabase dashboard: https://supabase.com/dashboard/project/vxvitkusmtukyjrdjhqk/editor/17250
3. Look for new records in the `stripe_webhooks` and `payments` tables

## Troubleshooting

**If webhooks aren't working:**

- Check Stripe Dashboard > Webhooks for any failed attempts
- Look at Edge Function logs in Supabase Dashboard
- Verify your webhook secret is correct

**View webhook logs:**

```sql
-- Run this in SQL Editor to see recent webhooks
SELECT * FROM stripe_webhooks
ORDER BY created_at DESC
LIMIT 10;
```
