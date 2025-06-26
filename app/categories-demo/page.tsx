import { CategoriesPage } from '@/components/category/CategoriesPage';
import CategoryScroll, { CategoryScrollSkeleton } from '@/components/category-scroll';
import { Suspense } from 'react';

// Mock data for demonstration
const mockCategories = [
  { id: '1', name: 'New Arrivals', count: 120, image: '/api/placeholder/300/400', slug: 'new-arrivals', description: 'Fresh drops and latest styles' },
  { id: '2', name: 'Clothing', count: 450, image: '/api/placeholder/300/400', slug: 'clothing', description: 'Essential wardrobe pieces' },
  { id: '3', name: 'Shoes', count: 230, image: '/api/placeholder/300/400', slug: 'shoes', description: 'Step up your shoe game' },
  { id: '4', name: 'Accessories', count: 180, image: '/api/placeholder/300/400', slug: 'accessories', description: 'Complete your look' },
  { id: '5', name: 'Bags', count: 95, image: '/api/placeholder/300/400', slug: 'bags', description: 'Carry in style' },
  { id: '6', name: 'Sale', count: 340, image: '/api/placeholder/300/400', slug: 'sale', description: 'Limited time offers' },
  { id: '7', name: 'Outerwear', count: 75, image: '/api/placeholder/300/400', slug: 'outerwear', description: 'Weather-ready styles' },
  { id: '8', name: 'Activewear', count: 110, image: '/api/placeholder/300/400', slug: 'activewear', description: 'Performance meets style' },
];

const featuredCategories = [
  { id: '1', name: 'Summer Collection', count: 220, image: '/api/placeholder/600/400', slug: 'summer-collection', description: 'Beat the heat with our curated summer essentials' },
  { id: '2', name: 'Limited Edition', count: 45, image: '/api/placeholder/600/400', slug: 'limited-edition', description: 'Exclusive pieces you won\'t find anywhere else' },
];

export default function CategoriesDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="strike-container text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-typewriter mb-4">
            Category Components Demo
          </h1>
          <p className="text-base sm:text-lg text-gray-600 font-typewriter max-w-2xl mx-auto">
            Showcasing the redesigned category components with mobile-first design, 
            smooth animations, and modern UX patterns.
          </p>
        </div>
      </section>

      {/* Category Scroll Component Demo */}
      <section className="py-8 sm:py-12">
        <div className="strike-container">
          <h2 className="text-2xl font-bold font-typewriter mb-6">Category Scroll Component</h2>
          <p className="text-gray-600 font-typewriter mb-8 max-w-3xl">
            Horizontal scrolling category cards with navigation buttons on desktop and smooth touch scrolling on mobile.
            Features responsive aspect ratios, subtle gradients, and improved typography.
          </p>
        </div>
        
        <Suspense fallback={<CategoryScrollSkeleton />}>
          <CategoryScroll 
            title="Shop by Category" 
            categories={mockCategories.slice(0, 6)} 
          />
        </Suspense>
      </section>

      {/* Categories Landing Page Demo */}
      <section className="py-8 sm:py-12 bg-gray-50">
        <div className="strike-container">
          <h2 className="text-2xl font-bold font-typewriter mb-6">Categories Landing Page</h2>
          <p className="text-gray-600 font-typewriter mb-8 max-w-3xl">
            Full categories page with search, grid/masonry view toggle, and featured collections.
            Includes loading states, empty states, and responsive grid layouts.
          </p>
        </div>
        
        <CategoriesPage 
          categories={mockCategories}
          featuredCategories={featuredCategories}
        />
      </section>

      {/* Mobile UX Improvements */}
      <section className="py-12 sm:py-16">
        <div className="strike-container">
          <h2 className="text-2xl font-bold font-typewriter mb-8">Mobile UX Improvements</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Responsive Text Sizes</h3>
              <p className="font-typewriter text-sm text-gray-600">
                All text uses clamp() for responsive scaling with a minimum of 16px on mobile 
                for optimal readability.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Touch Targets</h3>
              <p className="font-typewriter text-sm text-gray-600">
                All interactive elements have a minimum 48x48px touch target with proper 
                padding and tap areas.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Smooth Animations</h3>
              <p className="font-typewriter text-sm text-gray-600">
                Framer Motion provides buttery smooth animations with gesture support 
                and reduced motion preferences.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Loading Skeletons</h3>
              <p className="font-typewriter text-sm text-gray-600">
                Skeleton loaders provide instant feedback and improve perceived performance 
                during data fetching.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Aspect Ratios</h3>
              <p className="font-typewriter text-sm text-gray-600">
                Responsive aspect ratios that adapt from square on mobile to portrait 
                on larger screens.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6">
              <h3 className="font-typewriter font-bold text-lg mb-3">Modern Patterns</h3>
              <p className="font-typewriter text-sm text-gray-600">
                Implements infinite scroll, sticky headers, and collapsible filters 
                for better mobile UX.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Typography Examples */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="strike-container">
          <h2 className="text-2xl font-bold font-typewriter mb-8">Responsive Typography Scale</h2>
          
          <div className="space-y-4">
            <div className="bg-white p-6 border border-gray-200">
              <p className="font-typewriter text-xs text-gray-600 mb-2">text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)</p>
              <p className="text-xs font-typewriter">The quick brown fox jumps over the lazy dog</p>
            </div>
            
            <div className="bg-white p-6 border border-gray-200">
              <p className="font-typewriter text-xs text-gray-600 mb-2">text-sm: clamp(0.875rem, 0.825rem + 0.25vw, 1rem)</p>
              <p className="text-sm font-typewriter">The quick brown fox jumps over the lazy dog</p>
            </div>
            
            <div className="bg-white p-6 border border-gray-200">
              <p className="font-typewriter text-xs text-gray-600 mb-2">text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem)</p>
              <p className="text-base font-typewriter">The quick brown fox jumps over the lazy dog</p>
            </div>
            
            <div className="bg-white p-6 border border-gray-200">
              <p className="font-typewriter text-xs text-gray-600 mb-2">text-lg: clamp(1.125rem, 1.075rem + 0.25vw, 1.25rem)</p>
              <p className="text-lg font-typewriter">The quick brown fox jumps over the lazy dog</p>
            </div>
            
            <div className="bg-white p-6 border border-gray-200">
              <p className="font-typewriter text-xs text-gray-600 mb-2">text-xl: clamp(1.25rem, 1.2rem + 0.25vw, 1.5rem)</p>
              <p className="text-xl font-typewriter">The quick brown fox jumps over the lazy dog</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}