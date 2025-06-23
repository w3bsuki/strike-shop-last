import Link from 'next/link';

export default function SimpleHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold">
          STRIKE™
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/new" className="hover:text-gray-600">NEW</Link>
          <Link href="/men" className="hover:text-gray-600">MEN</Link>
          <Link href="/women" className="hover:text-gray-600">WOMEN</Link>
          <Link href="/sale" className="hover:text-gray-600">SALE</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/account" className="hover:text-gray-600">Account</Link>
          <Link href="/wishlist" className="hover:text-gray-600">Wishlist</Link>
          <button className="hover:text-gray-600">Cart</button>
        </div>
      </div>
    </header>
  );
}