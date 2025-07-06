'use client';

import { useState } from 'react';
import { X, ShoppingBag, Heart, Share2, Save, AlertTriangle, Truck, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Temporarily removed
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore } from '@/lib/stores';
// Enhanced cart hooks temporarily disabled - using basic cart functionality
import { formatPrice } from '@/lib/utils';
import { CartItem } from './cart-item';
import { CartRecommendations } from './cart-recommendations';
import { BulkActionsBar } from './bulk-actions-bar';
import { TaxEstimator } from './tax-estimator';

export function EnhancedCartDrawer() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('cart');
  
  // Store state
  const cart = useStore((state) => state.cart);
  const cartActions = useStore((state) => state.actions.cart);
  const isAuthenticated = useStore((state) => state.auth.isAuthenticated);
  
  // Enhanced hooks temporarily disabled - using basic cart functionality
  // const cartSummaryData = useEnhancedCartSummary();
  // const { data: recommendations } = useCartRecommendations();
  // const { data: inventoryStatus } = useInventoryValidation();
  // const moveToWishlist = useMoveToWishlist();
  // const shareCart = useCartSharing();
  // const calculateTax = useTaxEstimation();

  const handleToggleSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === cart.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.items.map(item => item.id));
    }
  };

  const handleBulkMoveToWishlist = async () => {
    for (const itemId of selectedItems) {
      console.log("Move to wishlist:", itemId); // moveToWishlist disabled
    }
    setSelectedItems([]);
  };

  const handleShareCart = async () => {
    try {
      console.log("Share cart disabled"); // shareCart.mutateAsync({ permissions: 'view', expiresInHours: 24 });
    } catch (error) {
      console.error('Failed to share cart:', error);
    }
  };

  const hasSelectedItems = selectedItems.length > 0;
  const hasUnavailableItems = false; // cartSummaryData?.data.hasUnavailableItems || false;
  const hasLowStockItems = false; // cartSummaryData?.data.hasLowStockItems || false;

  return (
    <Sheet open={cart.isOpen} onOpenChange={cartActions.setCartOpen}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shopping Cart
              {cart.items.length > 0 && (
                <Badge variant="secondary">{cart.items.length}</Badge>
              )}
            </SheetTitle>
            
            <div className="flex items-center gap-2">
              {cart.items.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShareCart}
                    disabled={false} // shareCart.isPending
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {/* Save cart logic */}}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cartActions.setCartOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Inventory Alerts */}
          {(hasUnavailableItems || hasLowStockItems) && (
            <div className="mt-3 space-y-2">
              {hasUnavailableItems && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  Some items are no longer available
                </div>
              )}
              {hasLowStockItems && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4" />
                  Some items are running low in stock
                </div>
              )}
            </div>
          )}

          {/* Selection Bar */}
          {cart.items.length > 0 && (
            <div className="flex items-center justify-between mt-3 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedItems.length === cart.items.length ? 'Deselect All' : 'Select All'}
              </Button>
              
              {hasSelectedItems && (
                <span className="text-muted-foreground">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Bulk Actions Bar */}
        {hasSelectedItems && (
          <BulkActionsBar
            selectedItems={selectedItems}
            onMoveToWishlist={handleBulkMoveToWishlist}
            onRemove={() => {/* Bulk remove logic */}}
            onClearSelection={() => setSelectedItems([])}
          />
        )}

        {cart.items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Your cart is empty</p>
              <p className="text-muted-foreground mb-4">Add some items to get started</p>
              <Button onClick={() => cartActions.setCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs for Cart, Recommendations, Shipping */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-6 mt-2">
                <TabsTrigger value="cart" className="flex-1">
                  Cart ({cart.items.length})
                </TabsTrigger>
                {false && false && (
                  <TabsTrigger value="recommendations">
                    Recommendations (0)
                  </TabsTrigger>
                )}
                <TabsTrigger value="shipping">
                  <Truck className="h-4 w-4 mr-1" />
                  Shipping
                </TabsTrigger>
              </TabsList>

              {/* Cart Items */}
              <TabsContent value="cart" className="flex-1 mt-0">
                <div className="flex-1 px-6 overflow-y-auto">
                  <div className="space-y-4 py-4">
                    {cart.items.map((item) => {
                      const inventory = null; // inventoryStatus?.find(status => status.variantId === item.variantId);
                      
                      return (
                        <CartItem
                          key={`${item.id}-${item.variantId}`}
                          item={item}
                          isLoading={cart.isLoading}
                          onUpdateQuantity={async (id, quantity) => {
                            cartActions.updateItemQuantity(id, quantity);
                          }}
                          onRemoveItem={async (id) => {
                            cartActions.removeItem(id);
                          }}
                          onCloseCart={() => cartActions.setCartOpen(false)}
                        />
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Recommendations */}
              {false && false && (
                <TabsContent value="recommendations" className="flex-1 mt-0">
                  <div className="flex-1 px-6 overflow-y-auto">
                    <CartRecommendations 
                      recommendations={[]}
                      onAddToCart={(rec) => {
                        if (rec.variantId) {
                          cartActions.addItem(rec.productId, rec.variantId, 1);
                        }
                      }}
                    />
                  </div>
                </TabsContent>
              )}

              {/* Shipping & Tax Calculator */}
              <TabsContent value="shipping" className="flex-1 mt-0">
                <div className="p-6">
                  <TaxEstimator
                    onCalculate={(address) => console.log('Calculate tax:', address)} // calculateTax.mutate(address)
                    isCalculating={false} // calculateTax.isPending
                    estimate={cart.taxEstimate}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Cart Summary Footer */}
            <div className="border-t bg-muted/50 p-6 space-y-4">
              {cart.items.length > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.items.length} items)</span>
                    <span>{formatPrice(cart.items.reduce((total, item) => {
                      const price = item.pricing?.totalPrice as any as number || 0;
                      return total + price;
                    }, 0))}</span>
                  </div>
                  
                  {cart.taxEstimate && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Est. Tax</span>
                      <span>{formatPrice(cart.taxEstimate.tax)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>
                      {formatPrice(
                        cart.items.reduce((total, item) => {
                          const price = item.pricing?.totalPrice as any as number || 0;
                          return total + price;
                        }, 0) + (cart.taxEstimate?.tax || 0)
                      )}
                    </span>
                  </div>
                  
                  {/* Conversion probability not implemented yet */}
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={cart.items.length === 0 || cart.isLoading}
                  onClick={() => {
                    // Navigate to checkout
                    window.location.href = cart.checkoutUrl || '/checkout';
                  }}
                >
                  {cart.isLoading ? 'Updating...' : 'Proceed to Checkout'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => cartActions.setCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => {/* Save for later */}}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Cart
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {/* Move all to wishlist */}}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Save for Later
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}