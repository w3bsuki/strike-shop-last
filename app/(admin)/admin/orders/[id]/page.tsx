import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrderById } from '@/lib/supabase/orders';
import { getShopifyOrder } from '@/lib/shopify/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, CreditCard, User } from 'lucide-react';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Check authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Fetch order from Supabase
  const order = await getOrderById(id);
  
  if (!order) {
    notFound();
  }

  // Optionally fetch additional details from Shopify
  let shopifyOrder = null;
  if (order.medusa_order_id) {
    try {
      shopifyOrder = await getShopifyOrder(order.medusa_order_id);
    } catch (error) {
      console.error('Failed to fetch Shopify order:', error);
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-warning/10 text-warning',
      confirmed: 'bg-info/10 text-info-foreground',
      processing: 'bg-accent/10 text-accent-foreground',
      shipped: 'bg-info/10 text-info-foreground',
      delivered: 'bg-success/10 text-success',
      cancelled: 'bg-destructive/10 text-destructive',
      refunded: 'bg-muted text-muted-foreground',
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order.metadata?.shopify_order_number || order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      {/* Order Details Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{order.metadata?.email || 'N/A'}</p>
            </div>
            {order.billing_address && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {order.billing_address.first_name} {order.billing_address.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.billing_address.phone || 'N/A'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium text-lg">
                {formatCurrency(order.total_amount, order.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Intent</p>
              <p className="font-mono text-xs">{order.stripe_payment_intent_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">Paid</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipping_address ? (
              <div className="space-y-1">
                <p className="font-medium">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                <p className="text-sm">{order.shipping_address.address1}</p>
                {order.shipping_address.address2 && (
                  <p className="text-sm">{order.shipping_address.address2}</p>
                )}
                <p className="text-sm">
                  {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}
                </p>
                <p className="text-sm">{order.shipping_address.country}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × {formatCurrency(item.price, order.currency)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.quantity * item.price, order.currency)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No items found</p>
            )}
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-medium">{formatCurrency(order.total_amount, order.currency)}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-medium">Total</p>
                <p className="font-bold text-lg">{formatCurrency(order.total_amount, order.currency)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Order Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline">Send Confirmation Email</Button>
            <Button variant="outline">Update Status</Button>
            <Button variant="outline">Process Refund</Button>
            {shopifyOrder && (
              <Button variant="outline" asChild>
                <a 
                  href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/orders/${shopifyOrder.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View in Shopify
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}