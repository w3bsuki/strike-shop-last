# Order Management System

## Overview

The Strike Shop order management system is built on top of Shopify's Admin API, providing customers with a seamless order tracking and management experience.

## Features

### Customer Order History
- View all past orders with status, items, and totals
- Filter and search through order history
- Access order details from a centralized dashboard

### Order Detail View
- Complete order information including:
  - Order status (payment and fulfillment)
  - Line items with quantities and prices
  - Shipping and billing addresses
  - Payment information
  - Order timeline and tracking

### Order Tracking
- Track orders by email and order number (guest checkout)
- Real-time shipment tracking integration
- Delivery status updates

### Order Actions
- Cancel unfulfilled orders (within 30 days)
- Initiate returns for delivered items
- Download receipts and invoices
- Contact support directly from order page

## API Endpoints

### Order Tracking
- `POST /api/orders/track` - Find order by email and order number

### Shopify Order Service (`/lib/shopify/orders.ts`)
- `getOrder(orderId)` - Get order details
- `getOrderByConfirmationNumber(confirmationNumber)` - Find by order number
- `getCustomerOrders(customerAccessToken)` - List customer orders
- `cancelOrder(orderId, reason)` - Cancel an order
- `trackShipment(orderId)` - Get tracking information
- `initiateReturn(orderId, lineItems)` - Start return process

## Implementation Details

### Authentication
Orders are protected by customer authentication. Users can only view their own orders based on:
- Email match
- Shopify customer ID match

### Data Flow
1. Orders are created in Shopify via Admin API after successful checkout
2. Order data is optionally cached in Supabase for faster access
3. Real-time updates from Shopify webhooks keep data synchronized

### UI Components
- `/components/orders/order-list.tsx` - Reusable order list display
- `/components/orders/order-detail.tsx` - Comprehensive order details view

## Migration from Stripe

As of 2025-01-07, all Stripe payment endpoints are deprecated:
- `/api/webhooks/stripe` - Returns 410 Gone after 2025-02-01
- `/api/payments/intent` - Deprecated with migration notice
- `/api/payments/confirm` - Deprecated with migration notice

All payment processing now goes through Shopify Checkout for a unified experience.

## Security Considerations

1. **Authentication Required**: All order endpoints require user authentication
2. **Order Ownership Verification**: Double-check order belongs to requesting user
3. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
4. **Data Sanitization**: All user inputs are validated and sanitized

## Future Enhancements

1. **Order Status Webhooks**: Real-time order status updates via WebSocket
2. **Multi-language Support**: Localized order statuses and notifications
3. **Advanced Filtering**: Filter orders by date range, status, amount
4. **Bulk Actions**: Cancel or return multiple items at once
5. **Order Analytics**: Personal shopping insights and statistics