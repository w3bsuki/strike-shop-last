import { SiteHeader } from '@/components/navigation';
import type { HomePageProps } from '@/types/home-page';

export default function SimpleHomePage({
  categories,
  newArrivals,
  saleItems,
}: HomePageProps) {
  return (
    <main className="bg-white">
      <SiteHeader />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">STRIKE SS25</h1>
          <p className="text-lg mb-8">DEFINING THE GRAY AREA BETWEEN BLACK AND WHITE</p>
          <a href="/new" className="inline-block bg-black text-white px-8 py-3 hover:bg-gray-800">
            EXPLORE COLLECTION
          </a>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="text-2xl font-bold mb-8">SHOP BY CATEGORY</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <a key={cat.id} href={`/${cat.slug}`} className="group">
                <div className="aspect-square bg-gray-100 mb-2 group-hover:opacity-80"></div>
                <h3 className="font-semibold">{cat.name}</h3>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4">
          <h2 className="text-2xl font-bold mb-8">NEW ARRIVALS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {newArrivals.slice(0, 4).map((product) => (
              <a key={product.id} href={`/product/${product.slug}`} className="group">
                <div className="aspect-[3/4] bg-gray-200 mb-2 group-hover:opacity-80"></div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">{product.price}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sale Items */}
      <section className="py-16">
        <div className="container px-4">
          <h2 className="text-2xl font-bold mb-8">SALE</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {saleItems.slice(0, 4).map((product) => (
              <a key={product.id} href={`/product/${product.slug}`} className="group">
                <div className="aspect-[3/4] bg-gray-200 mb-2 group-hover:opacity-80"></div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">{product.price}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">STRIKE™</h3>
              <p className="text-gray-400">Luxury streetwear redefined.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">SHOP</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/new" className="hover:text-white">New Arrivals</a></li>
                <li><a href="/men" className="hover:text-white">Men</a></li>
                <li><a href="/women" className="hover:text-white">Women</a></li>
                <li><a href="/sale" className="hover:text-white">Sale</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">HELP</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/shipping" className="hover:text-white">Shipping</a></li>
                <li><a href="/returns" className="hover:text-white">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">FOLLOW</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 STRIKE™. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}