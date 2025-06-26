import Link from 'next/link';
import { SiteHeader } from '@/components/navigation';

export default function AccountPage() {
  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <div className="container px-4 py-16">
        <h1 className="text-2xl font-bold mb-8">My Account</h1>
        <p className="mb-4">Please sign in to view your account.</p>
        <Link href="/sign-in" className="bg-black text-white px-6 py-3 inline-block hover:bg-gray-800">
          Sign In
        </Link>
      </div>
    </main>
  );
}