'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button-unified';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card-unified';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input, FormField } from '@/components/ui/input-unified';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Customer, CustomerOrder, CustomerAddress } from '@/lib/shopify/types/customer';
import { formatPrice } from '@/lib/shopify/client';

interface UserProfile {
  email: string;
  full_name?: string;
  phone?: string;
  created_at?: string;
  shopifyCustomerId?: string;
}

interface EnhancedAccountTabsProps {
  user: UserProfile;
  shopifyCustomer: Customer | null;
}

export function EnhancedAccountTabs({ user, shopifyCustomer: initialCustomer }: EnhancedAccountTabsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState(user.phone || '');
  
  // Shopify data
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [shopifyToken, setShopifyToken] = useState<string | null>(null);

  // Initialize form with Shopify data if available
  useEffect(() => {
    if (initialCustomer) {
      setFirstName(initialCustomer.firstName || '');
      setLastName(initialCustomer.lastName || '');
      setPhone(initialCustomer.phone || user.phone || '');
    } else {
      // Parse full name if no Shopify data
      const [first, ...rest] = (user.full_name || '').split(' ');
      setFirstName(first || '');
      setLastName(rest.join(' ') || '');
    }
  }, [initialCustomer, user]);

  // Fetch Shopify data
  const fetchShopifyData = async () => {
    if (!user.shopifyCustomerId) return;

    try {
      // Get Shopify access token from API
      const tokenResponse = await fetch('/api/auth/shopify/token');
      const { token } = await tokenResponse.json();
      
      if (!token) {
        console.log('No Shopify token available');
        return;
      }

      setShopifyToken(token);

      // Fetch orders
      setIsLoadingOrders(true);
      const ordersResponse = await fetch('/api/account/orders', {
        headers: {
          'X-Shopify-Token': token,
        },
      });
      const { orders: fetchedOrders } = await ordersResponse.json();
      setOrders(fetchedOrders || []);

      // Fetch addresses
      setIsLoadingAddresses(true);
      const addressesResponse = await fetch('/api/account/addresses', {
        headers: {
          'X-Shopify-Token': token,
        },
      });
      const { addresses: fetchedAddresses } = await addressesResponse.json();
      setAddresses(fetchedAddresses || []);
    } catch (error) {
      console.error('Error fetching Shopify data:', error);
    } finally {
      setIsLoadingOrders(false);
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchShopifyData();
  }, [user.shopifyCustomerId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClient();
      
      // Update Supabase user metadata
      const { error: supabaseError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone: phone,
        }
      });

      if (supabaseError) throw supabaseError;

      // Update Shopify customer if token available
      if (shopifyToken) {
        const shopifyResponse = await fetch('/api/account/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Token': shopifyToken,
          },
          body: JSON.stringify({
            firstName,
            lastName,
            phone,
          }),
        });

        if (!shopifyResponse.ok) {
          throw new Error('Failed to update Shopify profile');
        }
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    
    // Logout from Shopify if token available
    if (shopifyToken) {
      await fetch('/api/auth/shopify/logout', {
        method: 'POST',
        headers: {
          'X-Shopify-Token': shopifyToken,
        },
      });
    }
    
    await supabase.auth.signOut();
    router.push('/');
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'FULFILLED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PENDING_FULFILLMENT':
        return <Truck className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Tabs defaultValue="profile" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">Orders</span>
          {orders.length > 0 && (
            <span className="ml-1 text-xs bg-black text-white rounded-full px-1.5">
              {orders.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="addresses" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Addresses</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Email" required>
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                </FormField>
                
                <FormField label="First Name">
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </FormField>
                
                <FormField label="Last Name">
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </FormField>
                
                <FormField label="Phone Number">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </FormField>
                
                <FormField label="Member Since">
                  <Input
                    type="text"
                    value={new Date(user.created_at || '').toLocaleDateString()}
                    disabled
                    className="bg-gray-50"
                  />
                </FormField>

                {user.shopifyCustomerId && (
                  <FormField label="Customer ID">
                    <Input
                      type="text"
                      value={user.shopifyCustomerId}
                      disabled
                      className="bg-gray-50 font-mono text-xs"
                    />
                  </FormField>
                )}
              </div>
              
              <Button 
                type="submit" 
                loading={isSaving}
                loadingText="Saving changes..."
              >
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  View and track your past orders
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/account/orders">View All Orders</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48 mb-4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:border-black transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                        {getOrderStatusIcon(order.fulfillmentStatus)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.processedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatPrice(order.currentTotalPrice.amount, order.currentTotalPrice.currencyCode)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.lineItems.edges.slice(0, 2).map(({ node: item }) => (
                        <div key={item.variant.id} className="flex items-center gap-3">
                          {item.variant.image && (
                            <img 
                              src={item.variant.image.url} 
                              alt={item.variant.image.altText || item.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-gray-500">
                              {item.variant.title} × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.lineItems.edges.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{order.lineItems.edges.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No orders yet</p>
                <Button asChild className="mt-4">
                  <a href="/">Start Shopping</a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="addresses">
        <Card>
          <CardHeader>
            <CardTitle>Saved Addresses</CardTitle>
            <CardDescription>
              Manage your delivery addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAddresses ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full mb-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            ) : addresses.length > 0 ? (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">
                          {address.firstName} {address.lastName}
                        </h4>
                        {address.company && (
                          <p className="text-sm text-gray-600">{address.company}</p>
                        )}
                        <div className="text-sm text-gray-600 mt-1">
                          {address.formatted.map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                        {address.phone && (
                          <p className="text-sm text-gray-600 mt-1">Phone: {address.phone}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Add New Address
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No saved addresses</p>
                <p className="text-sm mt-2">Add an address during checkout to save it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <a href="/auth/reset-password">Change Password</a>
              </Button>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Email Preferences</h4>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4"
                    defaultChecked={initialCustomer?.acceptsMarketing || false}
                  />
                  <span className="text-sm">Send me exclusive offers and updates</span>
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}