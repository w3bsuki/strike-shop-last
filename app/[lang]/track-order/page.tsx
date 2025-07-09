'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, Search } from 'lucide-react';
import { getOrderByEmailAndNumber } from '@/lib/shopify/orders';

const trackOrderSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  orderNumber: z.string().min(1, 'Please enter your order number'),
});

type TrackOrderValues = z.infer<typeof trackOrderSchema>;

export default function TrackOrderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TrackOrderValues>({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: {
      email: '',
      orderNumber: '',
    },
  });

  const onSubmit = async (data: TrackOrderValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const { lang } = await params;
      
      // Server action to find order
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('orderNumber', data.orderNumber);
      
      const response = await fetch('/api/orders/track', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to find order');
      }

      const result = await response.json();
      
      if (result.orderId) {
        // Redirect to order detail page
        router.push(`/${lang}/orders/${result.orderId}`);
      } else {
        setError('No order found with the provided details. Please check your email and order number.');
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Unable to track your order. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Track Your Order</CardTitle>
          <CardDescription>
            Enter your email address and order number to view your order status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#1001 or 1001"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              You can find your order number in your order confirmation email
            </p>
            <p className="mt-2">
              Need help? <a href="/contact" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}