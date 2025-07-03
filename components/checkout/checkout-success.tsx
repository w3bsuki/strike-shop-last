'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Package, Mail, ArrowRight } from 'lucide-react';

interface OrderDetails {
  id: string;
  orderNumber: string;
  email: string;
  total: string;
  status: string;
  estimatedDelivery: string;
}

export function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const paymentIntentId = searchParams.get('payment_intent');
  const clientSecret = searchParams.get('payment_intent_client_secret');
  
  useEffect(() => {
    // Clear cart after successful payment
    if (typeof window !== 'undefined') {
      document.cookie = 'cart=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
    
    // Simulate order details fetch
    // In production, fetch actual order details using payment intent ID
    setTimeout(() => {
      setOrderDetails({
        id: paymentIntentId || 'ORDER-123456',
        orderNumber: '#1001',
        email: 'customer@example.com',
        total: '$89.99',
        status: 'confirmed',
        estimatedDelivery: '3-5 business days'
      });
      setLoading(false);
    }, 1000);
  }, [paymentIntentId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-border border-t-foreground rounded-full" />
        <span className="ml-3 text-muted-foreground">Processing your order...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold font-typewriter uppercase mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. We've received your order and will send you a confirmation email shortly.
        </p>
      </div>
      
      {/* Order Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Order Details</span>
            <Badge variant="secondary" className="bg-success/10 text-success">
              {orderDetails?.status === 'confirmed' ? 'Confirmed' : 'Processing'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-semibold">{orderDetails?.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="font-semibold">{orderDetails?.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{orderDetails?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Delivery</p>
              <p className="font-semibold">{orderDetails?.estimatedDelivery}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* What's Next */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-info/10 rounded-full flex items-center justify-center mt-0.5">
                <Mail className="w-3 h-3 text-info" />
              </div>
              <div>
                <h4 className="font-medium">Confirmation Email</h4>
                <p className="text-sm text-muted-foreground">
                  You'll receive an order confirmation email with all the details.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-warning/10 rounded-full flex items-center justify-center mt-0.5">
                <Package className="w-3 h-3 text-warning" />
              </div>
              <div>
                <h4 className="font-medium">Processing & Shipping</h4>
                <p className="text-sm text-muted-foreground">
                  We'll process your order and send you tracking information once it ships.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-success/10 rounded-full flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-success" />
              </div>
              <div>
                <h4 className="font-medium">Delivery</h4>
                <p className="text-sm text-muted-foreground">
                  Your order will arrive within {orderDetails?.estimatedDelivery}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Continue Shopping
        </Button>
        <Button onClick={() => window.location.href = '/account'}>
          View Order Status
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      
      {/* Support */}
      <div className="text-center mt-8 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Need help with your order? {' '}
          <a href="mailto:support@strike.com" className="text-foreground hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}