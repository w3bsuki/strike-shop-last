import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrdersByUser } from '@/lib/supabase/orders';
import { OrderHistory } from '@/components/account/OrderHistory';

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
  }

  // Fetch user's orders
  const orders = await getOrdersByUser(user.id, 20);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Order History</h1>
      <OrderHistory orders={orders} />
    </div>
  );
}