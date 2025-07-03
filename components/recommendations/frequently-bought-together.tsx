'use client';

// Frequently Bought Together Component
// Specialized component for market basket analysis recommendations

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartActions } from '@/lib/stores';
import { formatPrice } from '@/lib/utils';
import type { IntegratedProduct } from '@/types/integrated';

interface FrequentlyBoughtTogetherProps {
  mainProduct: IntegratedProduct;
  userId?: string;
  sessionId?: string;
  className?: string;
  maxItems?: number;
  onProductClick?: (product: IntegratedProduct) => void;
}

interface BundleItem {
  product: IntegratedProduct;
  selected: boolean;
  variantId?: string;
  quantity: number;
}

export function FrequentlyBoughtTogether({
  mainProduct,
  userId,
  sessionId,
  className = '',
  maxItems = 3,
  onProductClick
}: FrequentlyBoughtTogetherProps) {
  const [recommendations, setRecommendations] = useState<IntegratedProduct[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const cartActions = useCartActions();

  // Fetch frequently bought together recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'frequently_bought',
            productId: mainProduct.id,
            userId,
            sessionId,
            limit: maxItems
          })
        });

        const result = await response.json();

        if (result.success && result.data.products.length > 0) {
          setRecommendations(result.data.products);
          
          // Initialize bundle items (main product + recommendations)
          const items: BundleItem[] = [
            {
              product: mainProduct,
              selected: true, // Main product is always selected
              quantity: 1
            },
            ...result.data.products.map((product: IntegratedProduct) => ({
              product,
              selected: true, // Pre-select recommended items
              quantity: 1
            }))
          ];
          
          setBundleItems(items);
        } else {
          // No recommendations found
          setBundleItems([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        console.error('Frequently bought together error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [mainProduct.id, userId, sessionId, maxItems]);

  // Toggle item selection
  const toggleItemSelection = (index: number) => {
    if (index === 0) return; // Can't deselect main product
    
    setBundleItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  // Update item quantity
  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    
    setBundleItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    );
  };

  // Calculate total price
  const calculateTotal = () => {
    return bundleItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        const price = item.product.pricing?.basePrice || 0;
        return total + (price * item.quantity);
      }, 0);
  };

  // Calculate savings
  const calculateSavings = () => {
    const individualTotal = bundleItems
      .filter(item => item.selected)
      .reduce((total, item) => {
        const price = item.product.pricing?.basePrice || 0;
        return total + (price * item.quantity);
      }, 0);
    
    // Apply a 5% bundle discount
    const bundleDiscount = individualTotal * 0.05;
    return bundleDiscount;
  };

  // Add bundle to cart
  const addBundleToCart = async () => {
    try {
      setIsAddingToCart(true);
      
      const selectedItems = bundleItems.filter(item => item.selected);
      
      // Add each item to cart
      for (const item of selectedItems) {
        const variantId = item.variantId || item.product.commerce?.variants?.[0]?.id || item.product.id;
        await cartActions.addItem(
          item.product.id, 
          variantId, 
          item.quantity,
          {
            name: item.product.content?.name,
            image: item.product.content?.images?.[0]?.url,
          }
        );
      }

      // Track bundle purchase
      await fetch('/api/tracking/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId,
          productId: mainProduct.id,
          interactionType: 'cart_add',
          interactionData: {
            source: 'frequently_bought_together',
            bundleItems: selectedItems.map(item => ({
              productId: item.product.id,
              quantity: item.quantity
            })),
            bundleTotal: calculateTotal(),
            bundleSavings: calculateSavings()
          }
        })
      });

      // Show success message or redirect
      console.log('Bundle added to cart successfully');
      
    } catch (error) {
      console.error('Failed to add bundle to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle product click
  const handleProductClick = (product: IntegratedProduct) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // Don't render if no recommendations or error
  if (isLoading || error || bundleItems.length <= 1) {
    return null;
  }

  const selectedCount = bundleItems.filter(item => item.selected).length;
  const totalPrice = calculateTotal();
  const savings = calculateSavings();

  return (
    <div className={cn('bg-gray-50 rounded-lg p-6', className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Frequently Bought Together
        </h3>
        <p className="text-sm text-gray-600">
          Customers who bought this item also bought these products
        </p>
      </div>

      {/* Bundle Items */}
      <div className="space-y-4 mb-6">
        {bundleItems.map((item, index) => (
          <div key={item.product.id} className="flex items-center space-x-4">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => toggleItemSelection(index)}
                disabled={index === 0} // Main product always selected
                className="h-4 w-4 text-info rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            {/* Product Image */}
            <div className="flex-shrink-0">
              <button
                onClick={() => handleProductClick(item.product)}
                className="block"
              >
                <img
                  src={item.product.content?.images?.[0]?.url || '/placeholder.png'}
                  alt={item.product.content?.name || 'Product'}
                  className="h-16 w-16 object-cover rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
                />
              </button>
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => handleProductClick(item.product)}
                className="text-left"
              >
                <h4 className="text-sm font-medium text-gray-900 hover:text-info transition-colors line-clamp-2">
                  {item.product.content?.name || 'Product'}
                </h4>
                {item.product.content?.brand && (
                  <p className="text-xs text-gray-500 mt-1">{item.product.content.brand}</p>
                )}
              </button>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(index, item.quantity - 1)}
                disabled={item.quantity <= 1 || !item.selected}
                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="text-sm font-medium w-8 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(index, item.quantity + 1)}
                disabled={!item.selected}
                className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatPrice(item.product.pricing?.basePrice || 0, item.product.pricing?.currency)}
              </div>
              {item.quantity > 1 && (
                <div className="text-xs text-gray-500">
                  {formatPrice((item.product.pricing?.basePrice || 0) * item.quantity, item.product.pricing?.currency)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bundle Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </div>
            {savings > 0 && (
              <div className="text-sm text-success font-medium">
                Save {formatPrice(savings, mainProduct.pricing?.currency)} on bundle
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {formatPrice(totalPrice - savings, mainProduct.pricing?.currency)}
            </div>
            {savings > 0 && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(totalPrice, mainProduct.pricing?.currency)}
              </div>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={addBundleToCart}
          disabled={selectedCount === 0 || isAddingToCart}
          className="w-full"
          size="lg"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isAddingToCart ? 'Adding to Cart...' : `Add ${selectedCount} Item${selectedCount !== 1 ? 's' : ''} to Cart`}
        </Button>
      </div>
    </div>
  );
}