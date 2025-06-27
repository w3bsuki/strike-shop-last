import { ProductShowcase } from "@/components/product/product-showcase";
import { ProductSection, ProductHeader, ProductGrid, ProductScroll, ProductCard } from "@/components/product";
import { QuickViewProvider } from "@/contexts/QuickViewContext";

// Mock product data for testing
const mockProducts = Array.from({ length: 12 }, (_, i) => ({
  id: `product-${i + 1}`,
  name: `Premium Streetwear Item ${i + 1}`,
  price: `€${(100 + i * 20).toFixed(2)}`,
  originalPrice: i % 3 === 0 ? `€${(150 + i * 20).toFixed(2)}` : undefined,
  discount: i % 3 === 0 ? "-30%" : undefined,
  image: `https://images.unsplash.com/photo-${1521572163474 + i}-6864f9cf17ab?w=300&h=400&fit=crop&crop=center`,
  slug: `product-${i + 1}`,
  isNew: i % 4 === 1,
  soldOut: i === 5,
  colors: (i % 3) + 1,
}));

export default function ProductShowcasePage() {
  return (
    <QuickViewProvider>
      <main className="min-h-screen bg-white">
        <div className="py-8">
          <h1 className="text-4xl font-bold text-center mb-12">Product Showcase Components</h1>

        {/* Showcase 1: Scroll Layout with Sale Badge */}
        <ProductShowcase
          title="WINTER SALE"
          description="Up to 70% off selected premium streetwear"
          products={mockProducts.slice(0, 6)}
          viewAllLink="/sale"
          layout="scroll"
          showBadge={true}
          badgeText="SALE"
          badgeVariant="sale"
          sectionBackground="subtle"
        />

        {/* Showcase 2: Grid Layout with New Badge */}
        <ProductShowcase
          title="NEW ARRIVALS"
          description="Fresh drops for the season"
          products={mockProducts.slice(3, 11)}
          viewAllLink="/new"
          layout="grid"
          gridCols={4}
          showBadge={true}
          badgeText="NEW"
          badgeVariant="new"
        />

        {/* Showcase 3: Custom Composed Layout */}
        <ProductSection spacing="lg" background="gradient">
          <ProductHeader
            title="LIMITED EDITION"
            description="Exclusive pieces you won't find anywhere else"
            viewAllText="SHOP EXCLUSIVE"
            viewAllHref="/exclusive"
            align="center"
          />
          <ProductGrid cols={3} gap="lg">
            {mockProducts.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </ProductGrid>
        </ProductSection>

        {/* Showcase 4: Horizontal Scroll with Custom Controls */}
        <ProductSection>
          <ProductHeader
            title="FEATURED FOOTWEAR"
            viewAllHref="/footwear"
          />
          <ProductScroll showControls controlsPosition="inside">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className="flex-shrink-0 w-52 md:w-60"
              />
            ))}
          </ProductScroll>
        </ProductSection>

        {/* Showcase 5: Centered Header with Grid */}
        <ProductShowcase
          title="CURATED COLLECTION"
          description="Hand-picked pieces by our style experts"
          products={mockProducts.slice(2, 8)}
          viewAllLink="/curated"
          layout="grid"
          gridCols={3}
          headerAlign="center"
          sectionBackground="contrast"
        />
      </div>
    </main>
    </QuickViewProvider>
  );
}