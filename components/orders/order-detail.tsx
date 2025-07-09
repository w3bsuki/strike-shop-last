'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  Download,
  HelpCircle,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { ShopifyOrder } from '@/lib/shopify/orders';

interface OrderDetailProps {
  order: ShopifyOrder;
  onCancel?: (orderId: string) => Promise<void>;
  onInitiateReturn?: (orderId: string, items: any[]) => Promise<void>;
}

export function OrderDetail({ order, onCancel, onInitiateReturn }: OrderDetailProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isCopied, setIsCopied] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      refunded: 'bg-destructive/10 text-destructive',
      partially_refunded: 'bg-warning/10 text-warning',
      authorized: 'bg-info/10 text-info-foreground',
      partially_paid: 'bg-warning/10 text-warning',
      voided: 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const getFulfillmentStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted text-muted-foreground';
    
    const colors: Record<string, string> = {
      fulfilled: 'bg-success/10 text-success',
      unfulfilled: 'bg-warning/10 text-warning',
      partial: 'bg-info/10 text-info-foreground',
      restocked: 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyOrderNumber = async () => {
    await navigator.clipboard.writeText(String(order.order_number || order.id));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    
    setIsProcessing(true);
    try {
      await onCancel(order.id);
      setShowCancelDialog(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const canBeCancelled = order.financial_status !== 'refunded' && 
                        order.financial_status !== 'voided' &&
                        order.fulfillment_status === 'unfulfilled';

  const canBeReturned = order.fulfillment_status === 'fulfilled' &&
                       order.financial_status === 'paid' &&
                       true; // Simplified check

  // Calculate if order was placed recently (within 30 days)
  const orderDate = new Date(order.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isRecentOrder = orderDate > thirtyDaysAgo;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Order {order.order_number || order.id}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOrderNumber}
                className="h-8"
              >
                {isCopied ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(order.financial_status)}>
              {order.financial_status.replace('_', ' ')}
            </Badge>
            {order.fulfillment_status && (
              <Badge className={getFulfillmentStatusColor(order.fulfillment_status)}>
                {order.fulfillment_status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Order Cancelled Alert - simplified */}

      {/* Shipment Tracking */}
      {order.fulfillments && order.fulfillments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.fulfillments.map((fulfillment, index) => (
              <div key={fulfillment.id} className="space-y-2">
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">
                      {fulfillment.tracking_company || 'Carrier'}
                    </p>
                    {fulfillment.tracking_number && (
                      <p className="text-sm text-muted-foreground">
                        Tracking: {fulfillment.tracking_number}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Shipped on {formatDate(fulfillment.created_at)}
                    </p>
                  </div>
                  {fulfillment.tracking_url && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={fulfillment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Track Package
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
            {order.line_items.map((item, index) => (
              <div key={index} className="flex items-start justify-between py-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  {item.variant_title && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.variant_title}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(
                      (parseFloat(item.price) * item.quantity).toString(),
                      order.currency
                    )}
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
                <span>{formatCurrency(order.subtotal_price, order.currency)}</span>
              </div>
              {order.shipping_lines && order.shipping_lines.length > 0 && order.shipping_lines[0] && (
                <div className="flex justify-between text-sm">
                  <span>Shipping ({order.shipping_lines[0].title})</span>
                  <span>
                    {formatCurrency(order.shipping_lines[0].price, order.currency)}
                  </span>
                </div>
              )}
              {parseFloat(order.total_discounts) > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.total_discounts, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(order.total_tax, order.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_price, order.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
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
                  {order.shipping_address.firstName} {order.shipping_address.lastName}
                </p>
                <p>{order.shipping_address.address1}</p>
                {order.shipping_address.address2 && (
                  <p>{order.shipping_address.address2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.province}{' '}
                  {order.shipping_address.zip}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phone && (
                  <p className="mt-2">Phone: {order.shipping_address.phone}</p>
                )}
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
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusColor(order.financial_status)} variant="secondary">
                  {order.financial_status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span>{order.gateway || 'Online Payment'}</span>
              </div>
              {order.processed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processed</span>
                  <span>{new Date(order.processed_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {order.order_status_url && (
          <Button asChild variant="outline">
            <a href={order.order_status_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              View Receipt
            </a>
          </Button>
        )}
        
        <Link href={`/${locale}/help`}>
          <Button variant="outline">
            <HelpCircle className="h-4 w-4 mr-2" />
            Get Help
          </Button>
        </Link>

        {canBeCancelled && isRecentOrder && (
          <Button
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        )}

        {canBeReturned && isRecentOrder && (
          <Button
            variant="outline"
            onClick={() => setShowReturnDialog(true)}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Return Items
          </Button>
        )}

        {order.fulfillment_status === 'fulfilled' && (
          <Link href={`/${locale}/products`}>
            <Button variant="outline">
              Write a Review
            </Button>
          </Link>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment will be refunded to the original payment method within 5-10 business days.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isProcessing}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {isProcessing ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Items</DialogTitle>
            <DialogDescription>
              Select the items you would like to return. You have 30 days from delivery to return items.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            Return functionality coming soon. Please contact customer service for returns.
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReturnDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}