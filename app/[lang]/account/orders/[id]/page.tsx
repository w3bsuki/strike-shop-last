import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOrderById } from '@/lib/supabase/orders';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, Truck, CreditCard, Download, HelpCircle } from 'lucide-react';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Fetch order
  const order = await getOrderById(id);
  
  if (!order || order.user_id !== user.id) {
    notFound();
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

  const orderNumber = order.metadata?.shopify_order_number || order.id.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/account/orders">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order #{orderNumber}</h1>
            <p className="text-muted-foreground mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Order Status Timeline */}
      {order.status === 'shipped' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your order is on its way! Track your package with the tracking number provided in your shipping confirmation email.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-start justify-between py-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.quantity * item.price, order.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price, order.currency)} each
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.total_amount, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>Included</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount, order.currency)}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No items found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.shipping_address ? (
              <address className="not-italic text-sm space-y-1">
                <p className="font-medium">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                <p>{order.shipping_address.address1}</p>
                {order.shipping_address.address2 && (
                  <p>{order.shipping_address.address2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}
                </p>
                <p>{order.shipping_address.country}</p>
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">No shipping address</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Paid via credit card
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Payment ID: {order.stripe_payment_intent_id?.slice(0, 20) || 'N/A'}...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download Invoice
        </Button>
        <Button variant="outline">
          <HelpCircle className="h-4 w-4 mr-2" />
          Get Help
        </Button>
        {order.status === 'delivered' && (
          <Button variant="outline">
            Write a Review
          </Button>
        )}
      </div>
    </div>
  );
}