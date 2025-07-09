// CVE-2025-29927 Compliant: Server Component with Data Access Layer auth
import { getAuthenticatedUser } from '@/lib/auth/server';
import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { EnhancedAccountTabs } from './EnhancedAccountTabs';
import { shopifyClient } from '@/lib/shopify';
import type { Customer } from '@/lib/shopify/types/customer';

interface UserProfile {
  email: string;
  full_name?: string;
  phone?: string;
  created_at?: string;
  shopifyCustomerId?: string;
}

async function getShopifyCustomerData(shopifyCustomerId?: string): Promise<Customer | null> {
  if (!shopifyCustomerId || !shopifyClient) {
    return null;
  }

  try {
    // In a real implementation, we'd need to get the customer access token
    // from secure storage (e.g., encrypted in database)
    // For now, we'll return null and handle customer data fetching client-side
    return null;
  } catch (error) {
    console.error('Error fetching Shopify customer:', error);
    return null;
  }
}

export default async function AccountPage() {
  // Secure authentication in Data Access Layer
  const user = await getAuthenticatedUser('/account');

  // Get Shopify customer ID from user metadata
  const shopifyCustomerId = user.user_metadata?.shopify_customer_id;
  const shopifyCustomer = await getShopifyCustomerData(shopifyCustomerId);

  const userProfile: UserProfile = {
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.first_name && user.user_metadata?.last_name 
      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim()
      : '',
    phone: user.user_metadata?.phone || '',
    created_at: user.created_at,
    shopifyCustomerId,
  };

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-typewriter uppercase">My Account</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and view your order history</p>
        </div>

        {/* Pass user data to client component for interactivity */}
        <EnhancedAccountTabs 
          user={userProfile} 
          shopifyCustomer={shopifyCustomer}
        />
      </div>
      
      <Footer />
    </main>
  );
}