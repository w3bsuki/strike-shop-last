'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Package, MapPin, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  email: string;
  full_name?: string;
  phone?: string;
  created_at?: string;
}

interface AccountTabsProps {
  user: UserProfile;
}

export function AccountTabs({ user }: AccountTabsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
        }
      });

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      // Refresh the page to get updated data from server
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
    await supabase.auth.signOut();
    router.push('/');
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <Input
                    type="text"
                    value={new Date(user.created_at || '').toLocaleDateString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="orders">
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              View your past orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No orders yet</p>
              <Button asChild className="mt-4">
                <a href="/">Start Shopping</a>
              </Button>
            </div>
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
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No saved addresses</p>
              <p className="text-sm mt-2">Add an address during checkout to save it here</p>
            </div>
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