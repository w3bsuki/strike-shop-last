import Link from 'next/link';
import { SiteHeader } from '@/components/navigation';

export default function WishlistPage() {
  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <div className="container px-4 py-16">
        <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>
        <p className="mb-4">Your wishlist is empty.</p>
        <Link href="/" className="bg-black text-white px-6 py-3 inline-block hover:bg-gray-800">
          Start Shopping
        </Link>
      </div>
    </main>
  );
}