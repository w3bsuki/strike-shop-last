import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// BUNDLE OPTIMIZATION: Admin components are heavy - lazy load to reduce initial bundle
const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse space-y-4 p-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false, // Admin doesn't need SSR for security
  }
);

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Admin Dashboard...</p>
        </div>
      </div>
    }>
      <AdminDashboard />
    </Suspense>
  );
}
