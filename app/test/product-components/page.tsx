"use client";

import { ProductSection, ProductHeader, ProductGrid, ProductScroll, ProductCard, ProductBadge, ProductPrice, ProductActions, ProductShowcase } from "@/components/product";
import { ProductCardEnhanced } from "@/components/product/product-card-enhanced";
import { QuickViewProvider } from "@/contexts/QuickViewContext";

// Demo product data
const demoProduct = {
  id: "demo-1",
  name: "Premium Streetwear Hoodie",
  price: "€120.00",
  originalPrice: "€180.00",
  discount: "-33%",
  image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop",
  slug: "premium-streetwear-hoodie",
  isNew: true,
  soldOut: false,
  colors: 3,
};

const productList = Array.from({ length: 8 }, (_, i) => ({
  ...demoProduct,
  id: `product-${i}`,
  name: `Streetwear Item ${i + 1}`,
  price: `€${(80 + i * 10).toFixed(2)}`,
  isNew: i % 3 === 0,
  soldOut: i === 3,
  discount: i % 2 === 0 ? `-${20 + i * 2}%` : undefined,
  originalPrice: i % 2 === 0 ? `€${(120 + i * 10).toFixed(2)}` : undefined,
}));

export default function ProductComponentsDemo() {
  return (
    <QuickViewProvider>
      <main className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold mb-4">Product Components Showcase</h1>
          <p className="text-gray-600">Modular product display components following shadcn patterns</p>
        </header>

        {/* Badge Variants */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Badges</h2>
          <div className="flex flex-wrap gap-4">
            <ProductBadge variant="sale">-50% OFF</ProductBadge>
            <ProductBadge variant="new">NEW</ProductBadge>
            <ProductBadge variant="soldOut">SOLD OUT</ProductBadge>
            <ProductBadge variant="limited">LIMITED</ProductBadge>
            <ProductBadge variant="exclusive">EXCLUSIVE</ProductBadge>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <ProductBadge variant="sale" size="sm">SMALL</ProductBadge>
            <ProductBadge variant="sale" size="default">DEFAULT</ProductBadge>
            <ProductBadge variant="sale" size="lg">LARGE</ProductBadge>
          </div>
        </section>

        {/* Price Display */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Price</h2>
          <div className="space-y-4">
            <ProductPrice price="99.99" />
            <ProductPrice price="99.99" originalPrice="149.99" />
            <ProductPrice price="99.99" originalPrice="149.99" size="sm" />
            <ProductPrice price="99.99" originalPrice="149.99" size="lg" />
            <ProductPrice price="99.99" originalPrice="149.99" size="xl" />
          </div>
        </section>

        {/* Product Actions */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Actions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Horizontal Layout</h3>
              <ProductActions product={demoProduct} layout="horizontal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Vertical Layout</h3>
              <ProductActions product={demoProduct} layout="vertical" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">With Add to Cart</h3>
              <ProductActions product={demoProduct} showAddToCart />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Different Sizes</h3>
              <div className="flex gap-4">
                <ProductActions product={demoProduct} size="sm" />
                <ProductActions product={demoProduct} size="default" />
                <ProductActions product={demoProduct} size="lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Product Headers */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Headers</h2>
          <div className="space-y-8">
            <ProductHeader
              title="NEW ARRIVALS"
              description="Fresh drops for the season"
              viewAllHref="/new"
            />
            <ProductHeader
              title="SALE COLLECTION"
              viewAllHref="/sale"
              badge={<ProductBadge variant="sale" size="sm">UP TO 70% OFF</ProductBadge>}
            />
            <ProductHeader
              title="CENTERED HEADER"
              description="This header is center aligned"
              viewAllHref="/all"
              align="center"
            />
          </div>
        </section>

        {/* Product Grid */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Grid</h2>
          <ProductGrid cols={4} gap="default">
            {productList.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductGrid>
        </section>

        {/* Product Scroll */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Product Scroll</h2>
          <ProductScroll showControls>
            {productList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="flex-shrink-0 w-52"
              />
            ))}
          </ProductScroll>
        </section>

        {/* Enhanced Product Card */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Enhanced Product Card</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ProductCardEnhanced product={demoProduct} />
            <ProductCardEnhanced product={demoProduct} actionsLayout="below" />
            <ProductCardEnhanced product={demoProduct} showActions={false} />
          </div>
        </section>

        {/* Complete Showcase */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Complete Product Showcase</h2>
          <ProductShowcase
            title="FEATURED PRODUCTS"
            description="Our most popular items this season"
            products={productList}
            viewAllLink="/featured"
            layout="grid"
            gridCols={4}
            showBadge
            badgeText="HOT"
            badgeVariant="sale"
            sectionBackground="subtle"
          />
        </section>

        {/* Section Variants */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold mb-6">Section Variants</h2>
          
          <ProductSection spacing="sm" background="subtle">
            <div className="p-8 text-center">
              <p>Small spacing, subtle background</p>
            </div>
          </ProductSection>

          <ProductSection spacing="default" background="gradient">
            <div className="p-8 text-center">
              <p>Default spacing, gradient background</p>
            </div>
          </ProductSection>

          <ProductSection spacing="lg" background="contrast">
            <div className="p-8 text-center">
              <p>Large spacing, contrast background</p>
            </div>
          </ProductSection>
        </section>
      </div>
    </main>
    </QuickViewProvider>
  );
}