'use client';

import dynamic from 'next/dynamic';

// Dynamic import admin layout to keep it out of main bundle
const AdminLayoutComponent = dynamic(
  () => import('@/app/(admin)/admin-layout-component'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    ),
  }
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutComponent>{children}</AdminLayoutComponent>;
}