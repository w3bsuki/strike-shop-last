# Shopify Integration Setup

## Quick Start

1. **Create a Shopify Partner Account** (if you don't have one)
   - Go to https://partners.shopify.com/signup
   - Create a development store for testing

2. **Set up Storefront API Access**
   - In your Shopify admin, go to Settings > Apps and sales channels
   - Click "Develop apps" 
   - Create a private app
   - Enable Storefront API access
   - Select these scopes:
     - `unauthenticated_read_product_listings`
     - `unauthenticated_write_checkouts`
     - `unauthenticated_read_checkouts`

3. **Get Your Credentials**
   - Store Domain: `your-store.myshopify.com`
   - Storefront Access Token: (from your private app)

4. **Configure Environment Variables**
   Create a `.env.local` file:
   ```
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token-here
   ```

## Working Without Shopify

The app now includes a fallback mode that works without Shopify configuration:
- Add to cart will work with demo data
- Cart operations are stored locally
- You'll see a "Demo Mode" notification

To get full functionality, configure Shopify as described above.

## Testing

1. Products should display properly
2. Add to Cart should work (with or without Shopify)
3. Cart sidebar should show items
4. Quick View should display product details

## Troubleshooting

If you see "Shopify client not configured":
- Check your environment variables are set correctly
- Restart the dev server after adding env vars
- Make sure the token has proper permissions