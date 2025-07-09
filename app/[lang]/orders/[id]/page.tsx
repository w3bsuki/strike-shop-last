import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrder, cancelOrder, initiateReturn } from '@/lib/shopify/orders';
import { OrderDetail } from '@/components/orders/order-detail';

async function handleOrderCancel(orderId: string) {
  'use server';
  
  try {
    await cancelOrder(orderId, 'customer');
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
}

async function handleInitiateReturn(orderId: string, items: any[]) {
  'use server';
  
  try {
    await initiateReturn(orderId, items);
  } catch (error) {
    console.error('Failed to initiate return:', error);
    throw error;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect(`/${lang}/sign-in?redirect=/orders/${id}`);
  }

  // Fetch order from Shopify
  const order = await getOrder(id);
  
  if (!order) {
    notFound();
  }

  // Verify the order belongs to the user
  // Get user's email and Shopify customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('shopify_customer_id')
    .eq('id', user.id)
    .single();

  // Check if order belongs to user by email or customer ID
  const isOrderOwner = 
    order.email === user.email ||
    (profile?.shopify_customer_id && order.customer?.id === profile.shopify_customer_id);

  if (!isOrderOwner) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <OrderDetail 
        order={order}
        onCancel={handleOrderCancel}
        onInitiateReturn={handleInitiateReturn}
      />
    </div>
  );
}