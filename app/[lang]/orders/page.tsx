import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerOrdersById } from '@/lib/shopify/orders';
import type { ShopifyOrder } from '@/lib/shopify/orders';
import { OrderList } from '@/components/orders/order-list';

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${lang}/sign-in?redirect=/orders`);
  }

  // Get user's Shopify customer ID from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('shopify_customer_id')
    .eq('id', user.id)
    .single();

  let orders: ShopifyOrder[] = [];
  
  if (profile?.shopify_customer_id) {
    // Fetch orders from Shopify
    orders = await getCustomerOrdersById(profile.shopify_customer_id, 20);
  } else {
    // Fallback to email-based lookup if no customer ID
    // This would require implementing email-based order lookup in Shopify
    console.log('No Shopify customer ID found for user:', user.id);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your recent orders
        </p>
      </div>
      
      <OrderList orders={orders} />
    </div>
  );
}