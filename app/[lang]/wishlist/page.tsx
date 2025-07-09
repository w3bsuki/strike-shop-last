import { SiteHeader } from '@/components/navigation';
import Footer from '@/components/footer';
import { MobileNav } from '@/components/mobile/navigation';
import { WishlistClient } from '@/components/wishlist/wishlist-client';

export default function WishlistPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-white">
        <WishlistClient />
      </main>
      <Footer />
      <MobileNav variant="default" showLabels={true} showThreshold={0} />
    </>
  );
}