"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useAuthStore } from "@/lib/auth-store"
import { User, Package, MapPin, Settings, LogOut, Edit, Plus, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateProfile, orders, fetchOrders } = useAuthStore()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
      })
      fetchOrders()
    }
  }, [isAuthenticated, user, router, fetchOrders])

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSaveProfile = () => {
    updateProfile(formData)
    setIsEditing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50"
      case "shipped":
        return "text-blue-600 bg-blue-50"
      case "processing":
        return "text-yellow-600 bg-yellow-50"
      case "confirmed":
        return "text-purple-600 bg-purple-50"
      case "cancelled":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "preferences", label: "Preferences", icon: Settings },
  ]

  return (
    <main className="bg-white min-h-screen">
      <Header />
      <div className="section-padding">
        <div className="strike-container">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-heading-xl uppercase mb-2">My Account</h1>
                <p className="text-muted-foreground">Welcome back, {user.firstName}!</p>
              </div>
              <Button onClick={logout} variant="strike-outline" size="strike" className="flex items-center mt-4 sm:mt-0">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 p-3 text-left transition-colors ${
                          activeTab === tab.id ? "bg-black text-white" : "hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-heading-lg uppercase">Profile Information</h2>
                      <Button
                        onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                        variant="strike-text"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditing ? "Save Changes" : "Edit Profile"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 uppercase tracking-wider">First Name</label>
                          <Input
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!isEditing}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Last Name</label>
                          <Input
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!isEditing}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Email</label>
                          <Input
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!isEditing}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Phone</label>
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            disabled={!isEditing}
                            className="input-field"
                            placeholder="Add phone number"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-subtle">
                      <h3 className="text-heading-md uppercase mb-4">Account Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--subtle-text-color)]">Member since:</span>
                          <span className="ml-2 font-medium">{formatDate(user.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--subtle-text-color)]">Total orders:</span>
                          <span className="ml-2 font-medium">{orders.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div className="space-y-6">
                    <h2 className="text-heading-lg uppercase">Order History</h2>

                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No orders yet</h3>
                        <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
                        <Link href="/">
                          <Button variant="strike" size="strike">Start Shopping</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-subtle p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                              <div>
                                <h3 className="font-bold text-lg">Order {order.orderNumber}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Placed on {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                                <span
                                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${getStatusColor(order.status)}`}
                                >
                                  {order.status}
                                </span>
                                <span className="font-bold">{formatPrice(order.total)}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              {order.items.map((item) => (
                                <div key={`${item.id}-${item.size}`} className="flex space-x-3">
                                  <div className="w-16 h-20 bg-gray-100 flex-shrink-0">
                                    <Image
                                      src={item.image || "/placeholder.svg"}
                                      alt={item.name}
                                      width={64}
                                      height={80}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium line-clamp-2">"{item.name}"</h4>
                                    <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    <p className="text-sm font-bold">{item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-subtle">
                              <div className="text-sm text-muted-foreground">
                                {order.trackingNumber && (
                                  <p>
                                    Tracking: <span className="font-mono">{order.trackingNumber}</span>
                                  </p>
                                )}
                                {order.estimatedDelivery && (
                                  <p>Estimated delivery: {formatDate(order.estimatedDelivery)}</p>
                                )}
                              </div>
                              <div className="flex space-x-2 mt-2 sm:mt-0">
                                <Button variant="strike-text" className="text-xs">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                                {order.status === "delivered" && (
                                  <Button variant="strike-text" className="text-xs">Reorder</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "addresses" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-heading-lg uppercase">Saved Addresses</h2>
                      <Button variant="strike" size="strike">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>

                    {user.addresses.length === 0 ? (
                      <div className="text-center py-12">
                        <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No addresses saved</h3>
                        <p className="text-muted-foreground mb-6">Add an address for faster checkout</p>
                        <Button variant="strike" size="strike">Add Your First Address</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {user.addresses.map((address) => (
                          <div key={address.id} className="border border-subtle p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-sm uppercase tracking-wider">{address.type} Address</h3>
                                {address.isDefault && (
                                  <span className="bg-black text-white text-xs px-2 py-1 uppercase tracking-wider">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button className="text-muted-foreground hover:text-foreground">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm space-y-1">
                              <p className="font-medium">
                                {address.firstName} {address.lastName}
                              </p>
                              <p>{address.address1}</p>
                              {address.address2 && <p>{address.address2}</p>}
                              <p>
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                              <p>{address.country}</p>
                              {address.phone && <p>{address.phone}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <h2 className="text-heading-lg uppercase">Communication Preferences</h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold mb-4">Email Notifications</h3>
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3">
                            <input type="checkbox" checked={user.preferences.newsletter} className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Newsletter</div>
                              <div className="text-sm text-muted-foreground">
                                Get updates on new arrivals, sales, and exclusive offers
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold mb-4">Product Categories</h3>
                        <div className="space-y-3">
                          {Object.entries(user.preferences).map(([key, value]) => {
                            if (key === "newsletter" || key === "sms") return null
                            return (
                              <label key={key} className="flex items-center space-x-3">
                                <input type="checkbox" checked={value} className="h-4 w-4" />
                                <div className="font-medium capitalize">{key}</div>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-subtle">
                        <Button variant="strike" size="strike">Save Preferences</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
