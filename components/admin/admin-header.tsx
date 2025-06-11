"use client"

import { useState } from "react"
import { Bell, Search, Menu, X } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import Image from "next/image"
import AdminSidebar from "./admin-sidebar"

export default function AdminHeader() {
  const { user } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications] = useState([
    { id: 1, message: "New order #STR-2024-003 received", time: "5 minutes ago" },
    { id: 2, message: "Low stock alert: Monochrome Knit Sweater", time: "1 hour ago" },
    { id: 3, message: "User John Doe requested a refund", time: "3 hours ago" },
  ])
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-10">
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-4" aria-label="Open mobile menu">
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 flex items-center">
          <div className="relative w-64 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 rounded-full hover:bg-gray-100 relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 text-center border-t border-gray-200">
                  <button className="text-sm text-black font-medium hover:underline">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image
                src={user?.avatar || "/placeholder.svg?height=32&width=32"}
                alt="Admin"
                fill
                className="object-cover"
              />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full">
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
              <span className="text-lg font-bold tracking-tight">STRIKE™ ADMIN</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
