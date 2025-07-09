# Payment Configuration Guide

This guide explains how to configure payment methods, multi-currency support, and checkout options for Strike Shop.

## Table of Contents

1. [Overview](#overview)
2. [Shopify Admin Configuration](#shopify-admin-configuration)
3. [Multi-Currency Setup](#multi-currency-setup)
4. [Payment Methods Configuration](#payment-methods-configuration)
5. [Testing Different Payment Methods](#testing-different-payment-methods)
6. [Stripe Fallback Integration](#stripe-fallback-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

Strike Shop uses Shopify Payments as the primary payment processor, with support for:
- Multiple currencies (BGN, EUR, UAH, USD)
- Various payment methods (cards, PayPal, Shop Pay, etc.)
- Regional payment preferences
- Installment payments
- Express checkout options

## Shopify Admin Configuration

### 1. Enable Shopify Payments

1. Go to **Settings > Payments** in your Shopify admin
2. Click **Complete account setup** under Shopify Payments
3. Fill in your business details:
   - Business type and registration
   - Tax information
   - Bank account details
4. Submit for review (usually approved within 24-48 hours)

### 2. Configure Accepted Payment Methods

In **Settings > Payments**:

1. **Credit/Debit Cards**:
   - Visa ✓
   - Mastercard ✓
   - American Express ✓
   - Discover ✓

2. **Alternative Payment Methods**:
   - PayPal Express Checkout
   - Shop Pay
   - Apple Pay
   - Google Pay

3. **Manual Payment Methods** (optional):
   - Bank Transfer
   - Cash on Delivery (for specific regions)

## Multi-Currency Setup

### 1. Enable Multiple Currencies

1. Go to **Settings > Store details**
2. Under **Store currency**, click **Change formatting**
3. Click **Add currency**
4. Add these currencies:
   - EUR (Euro) - Default
   - BGN (Bulgarian Lev)
   - UAH (Ukrainian Hryvnia)
   - USD (US Dollar)

### 2. Configure Currency Conversion

1. In **Settings > Markets**:
   - Create markets for EU, Bulgaria, Ukraine, and US
   - Assign appropriate countries to each market
   - Set default currency for each market

2. **Conversion Settings**:
   ```
   EUR → BGN: 1.9558 (fixed rate)
   EUR → UAH: Market rate
   EUR → USD: Market rate
   ```

### 3. Currency Rounding Rules

Configure rounding for each currency:
- EUR: €0.99
- BGN: 1.99 лв
- UAH: ₴99
- USD: $0.99

## Payment Methods Configuration

### Regional Payment Preferences

The app automatically shows relevant payment methods based on customer location:

#### European Union (EUR)
- Credit/Debit Cards
- PayPal
- Shop Pay
- Apple Pay / Google Pay
- Bank Transfer
- Installments (3, 6, 12 months)

#### Bulgaria (BGN)
- Credit/Debit Cards
- Bank Transfer
- Cash on Delivery

#### Ukraine (UAH)
- Credit/Debit Cards
- Bank Transfer
- Cash on Delivery

#### United States (USD)
- Credit/Debit Cards
- PayPal
- Shop Pay
- Apple Pay / Google Pay
- Installments (4, 6, 12 months)

### Installment Payments

Configure installment options in `/lib/shopify/payment-config.ts`:

```typescript
installmentOptions: [
  { months: 3, interestRate: 0, minimumAmount: 100, currency: 'EUR' },
  { months: 6, interestRate: 0, minimumAmount: 200, currency: 'EUR' },
  { months: 12, interestRate: 2.5, minimumAmount: 500, currency: 'EUR' }
]
```

## Testing Different Payment Methods

### 1. Test Mode Setup

1. Enable test mode in Shopify Payments
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0000 0000 3220`

### 2. Testing Different Currencies

1. Use VPN or location spoofing to test different regions
2. Or append `?currency=BGN` to product URLs
3. Verify prices update correctly

### 3. Testing Payment Methods

For each payment method:
1. Add items to cart
2. Proceed to checkout
3. Verify payment method appears
4. Complete test transaction
5. Check order confirmation

## Stripe Fallback Integration

If Shopify Payments is not available in your region, use Stripe:

### 1. Install Stripe App

1. Go to Shopify App Store
2. Search for "Stripe"
3. Install the official Stripe app
4. Connect your Stripe account

### 2. Configure Stripe Settings

In the Stripe app:
1. Enable payment methods
2. Set up currency support
3. Configure webhook endpoints
4. Test with Stripe test keys

### 3. Update Payment Config

In `/lib/shopify/payment-config.ts`, add Stripe as a payment method:

```typescript
stripe: {
  name: 'Credit/Debit Card (Stripe)',
  type: 'stripe',
  icon: '💳',
  description: 'Secure payment via Stripe'
}
```

## Troubleshooting

### Common Issues

1. **Payment methods not showing**
   - Check Shopify Payments approval status
   - Verify currency configuration
   - Check regional restrictions

2. **Currency conversion errors**
   - Ensure all currencies are enabled in Shopify
   - Check market configuration
   - Verify exchange rates are set

3. **Checkout creation fails**
   - Check API permissions
   - Verify cart has valid items
   - Check address validation

### Debug Mode

Enable debug logging:

```typescript
// In checkout.ts
logger.setLevel('debug');
```

Check browser console and server logs for detailed error messages.

### Support Contacts

- Shopify Support: support@shopify.com
- Stripe Support: support@stripe.com
- Technical Issues: dev@strikeshop.com

## Security Considerations

1. **PCI Compliance**: Handled by Shopify/Stripe
2. **SSL Certificate**: Ensure valid SSL on custom domain
3. **Fraud Prevention**: Enable Shopify's fraud analysis
4. **3D Secure**: Automatically enabled for supported cards

## Next Steps

1. Complete Shopify Payments setup
2. Configure test products
3. Run through complete checkout flow
4. Enable production mode when ready

For more information, see:
- [Shopify Payments Documentation](https://help.shopify.com/en/manual/payments/shopify-payments)
- [Multi-currency Guide](https://help.shopify.com/en/manual/payments/shopify-payments/multi-currency)
- [Checkout API Reference](https://shopify.dev/api/storefront/latest/objects/checkout)