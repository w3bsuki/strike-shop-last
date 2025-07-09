'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistance } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronRight, Package, RefreshCw } from 'lucide-react';

interface OrderHistoryProps {
  orders: any[];
}

export function OrderHistory({ orders: initialOrders }: OrderHistoryProps) {
  const orders = initialOrders;
  const [loading, setLoading] = useState(false);

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

  const refreshOrders = async () => {
    setLoading(true);
    try {
      // Refresh orders by reloading the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders yet</h3>
          <p className="text-gray-500 text-center mb-4">
            When you place your first order, it will appear here.
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground">{orders.length} orders found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshOrders}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const orderNumber = order.metadata?.shopify_order_number || order.id.slice(0, 8);
          const orderDate = new Date(order.created_at);

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order #</span>
                      <span className="font-medium">{orderNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Placed on </span>
                      <span className="font-medium">
                        {orderDate.toLocaleDateString()}
                      </span>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(order.amount, order.currency)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Order Items Preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {formatCurrency(item.price, order.currency)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          + {order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                  )}

                  {/* Shipping Info */}
                  {order.shipping_address && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-muted-foreground mb-1">Shipping to:</p>
                      <p className="text-sm">
                        {order.shipping_address.first_name} {order.shipping_address.last_name}
                        <br />
                        {order.shipping_address.city}, {order.shipping_address.province}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t pt-3">
                    <p className="text-sm text-muted-foreground">
                      {formatDistance(orderDate, new Date(), { addSuffix: true })}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/account/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}