import { OrdersTable } from '@/components/admin/OrdersTableNew';
import { getAllOrders } from '@/lib/supabase/orders';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function OrdersPage() {
  // Check if user is authenticated and is admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // TODO: Check if user is admin
  // For now, we'll allow any authenticated user

  // Fetch initial orders data
  const { orders, count } = await getAllOrders(50, 0);
  
  return <OrdersTable initialOrders={orders} totalCount={count} />;
}