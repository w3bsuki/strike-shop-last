'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/i18n-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Package, ArrowRight } from 'lucide-react';
import type { ShopifyOrder } from '@/lib/shopify/orders';

interface OrderListProps {
  orders: ShopifyOrder[];
  showPagination?: boolean;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

export function OrderList({ 
  orders, 
  showPagination = false, 
  onLoadMore,
  hasNextPage = false,
  isLoading = false 
}: OrderListProps) {
  const locale = useLocale();

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (orders.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            When you make your first purchase, it will appear here.
          </p>
          <Link href={`/${locale}`}>
            <Button className="mt-4">Start Shopping</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  Order #{order.order_number}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Order Items Preview */}
              <div className="space-y-2">
                {order.line_items.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate">
                      {item.title} {item.variant_title && `- ${item.variant_title}`}
                    </span>
                    <span className="text-muted-foreground">
                      Qty: {item.quantity}
                    </span>
                  </div>
                ))}
                {order.line_items.length > 2 && (
                  <p className="text-sm text-muted-foreground">
                    +{order.line_items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Order Total and Action */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold">
                    {formatCurrency(order.total_price, order.currency)}
                  </p>
                </div>
                <Link href={`/${locale}/orders/${order.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Load More Button */}
      {showPagination && hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More Orders'}
          </Button>
        </div>
      )}
    </div>
  );
}