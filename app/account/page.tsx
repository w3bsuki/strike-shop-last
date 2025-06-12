"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useUser, useClerk } from '@clerk/nextjs'
import { User, Package, MapPin, Settings, LogOut, Edit, Plus, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

export default function AccountPage() {
  const router = useRouter()
  const { user, isSignedIn, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [activeTab, setActiveTab] = useState("profile")
  const [orders, setOrders] = useState([])
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
      return
    }
  }, [isLoaded, isSignedIn, router])

  // Mock orders data - you'll integrate with Medusa later
  const mockOrders = [
    {
      id: "order_1",
      display_id: 1001,
      status: "delivered",
      email: user?.primaryEmailAddress?.emailAddress,
      total: 15900, // in cents
      currency_code: "GBP",
      created_at: "2024-01-15T10:30:00Z",
      items: [
        {
          id: "item_1",
          title: "Strike™ Monochrome Knit Sweater",
          quantity: 1,
          unit_price: 15900,
        }
      ]
    },
    {
      id: "order_2",
      display_id: 1002,
      status: "processing",
      email: user?.primaryEmailAddress?.emailAddress,
      total: 8900,
      currency_code: "GBP",
      created_at: "2024-01-20T14:15:00Z",
      items: [
        {
          id: "item_2",
          title: "Strike™ Logo T-Shirt",
          quantity: 2,
          unit_price: 4450,
        }
      ]
    }
  ]

  const formatPrice = (amount: number, currency: string = "GBP") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(amount / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50"
      case "processing":
        return "text-blue-600 bg-blue-50"
      case "shipped":
        return "text-purple-600 bg-purple-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <main className="bg-white min-h-screen">
        <Header />
        <div className="section-padding">
          <div className="strike-container max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="bg-white min-h-screen">
      <Header />
      <div className="section-padding">
        <div className="strike-container max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">My Account</h1>
            <p className="text-[var(--subtle-text-color)]">
              Welcome back, {user.firstName || user.username || 'there'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center space-x-3 w-full p-3 text-left rounded-md transition-colors ${
                    activeTab === "profile" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center space-x-3 w-full p-3 text-left rounded-md transition-colors ${
                    activeTab === "orders" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab("addresses")}
                  className={`flex items-center space-x-3 w-full p-3 text-left rounded-md transition-colors ${
                    activeTab === "addresses" ? "bg-black text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span>Addresses</span>
                </button>
                <button
                  onClick={() => openUserProfile()}
                  className="flex items-center space-x-3 w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full p-3 text-left rounded-md hover:bg-gray-50 transition-colors text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold uppercase tracking-wider">Profile Information</h2>
                      <Button
                        onClick={() => openUserProfile()}
                        className="button-secondary"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <p className="text-sm text-gray-900">{user.firstName || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <p className="text-sm text-gray-900">{user.lastName || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{user.primaryEmailAddress?.emailAddress}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <p className="text-sm text-gray-900">{user.primaryPhoneNumber?.phoneNumber || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                        <p className="text-sm text-gray-900">{user.createdAt ? formatDate(user.createdAt.toString()) : "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Order History</h2>
                  </div>
                  
                  {mockOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                      <p className="text-gray-500 mb-6">When you place your first order, it will appear here.</p>
                      <Link href="/">
                        <Button className="button-primary">Start Shopping</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium">Order #{order.display_id}</h3>
                              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatPrice(order.total, order.currency_code)}</p>
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                                <div>
                                  <p className="text-sm font-medium">{item.title}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-sm">{formatPrice(item.unit_price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                            <Button size="sm" className="button-secondary">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {order.status === "delivered" && (
                              <Button size="sm" className="button-secondary">
                                Reorder
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "addresses" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold uppercase tracking-wider">Saved Addresses</h2>
                    <Button className="button-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                  
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No saved addresses</h3>
                      <p className="text-gray-500 mb-6">Add an address to make checkout faster.</p>
                      <Button className="button-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address: any) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{address.first_name} {address.last_name}</h3>
                              {address.company && <p className="text-sm text-gray-500">{address.company}</p>}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{address.address_1}</p>
                            {address.address_2 && <p>{address.address_2}</p>}
                            <p>{address.city}, {address.postal_code}</p>
                            <p>{address.country_code}</p>
                            {address.phone && <p>{address.phone}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}