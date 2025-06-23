'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Tag,
  BarChart3,
  LogOut,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    products: true,
    orders: true,
  });

  const mainNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      subItems: [
        { href: '/admin/products', label: 'All Products' },
        { href: '/admin/products/add', label: 'Add Product' },
        { href: '/admin/products/categories', label: 'Categories' },
      ],
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingBag,
      subItems: [
        { href: '/admin/orders', label: 'All Orders' },
        { href: '/admin/orders/pending', label: 'Pending' },
        { href: '/admin/orders/shipped', label: 'Shipped' },
      ],
    },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/discounts', label: 'Discounts', icon: Tag },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
      <div className="h-16 border-b border-gray-200 flex items-center justify-center">
        <Link href="/admin" className="text-lg font-bold tracking-tight">
          STRIKE™ ADMIN
        </Link>
      </div>

      <div className="py-4">
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;

            if ('subItems' in item && item.subItems) {
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.id)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3 text-gray-500" />
                      {item.label}
                    </div>
                    {openMenus[item.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {openMenus[item.id] && (
                    <div className="pl-10 space-y-1">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block px-3 py-2 text-sm font-medium rounded-md ${
                            isActive(subItem.href)
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive(item.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5 mr-3 text-gray-500" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
