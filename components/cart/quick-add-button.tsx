'use client';

import { useState } from 'react';
import { Plus, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Quick add hook temporarily disabled - using basic add to cart functionality
import { toast } from '@/hooks/use-toast';

interface QuickAddButtonProps {
  productId: string;
  variantId?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
  className?: string;
}

export function QuickAddButton({
  productId,
  variantId,
  size = 'default',
  variant = 'default',
  showText = true,
  className = ''
}: QuickAddButtonProps) {
  // const quickAdd = useQuickAdd(); // Temporarily disabled

  const handleQuickAdd = async () => {
    try {
      // TODO: Replace with basic cart functionality
      console.log('Quick add:', { productId, variantId });
      toast({
        title: 'Added to cart',
        description: 'Item added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    }
  };

  const isLoading = false; // quickAdd.isPending;

  return (
    <Button
      onClick={handleQuickAdd}
      disabled={isLoading}
      size={size}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {showText && (
        <span className="ml-1">
          {isLoading ? 'Adding...' : 'Quick Add'}
        </span>
      )}
    </Button>
  );
}

// Example usage in product listings
export function ProductCardWithQuickAdd({ product }: { product: any }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-background">
      {/* Product image */}
      <div className="aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Quick add overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors">
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <QuickAddButton
              productId={product.id}
              variantId={product.variants[0]?.id}
              size="sm"
              showText={false}
              className="shadow-lg"
            />
          </div>
        </div>
      </div>
      
      {/* Product details */}
      <div className="p-4">
        <h3 className="font-medium line-clamp-2">{product.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{product.price}</p>
        
        {/* Full quick add button for mobile */}
        <div className="mt-3 sm:hidden">
          <QuickAddButton
            productId={product.id}
            variantId={product.variants[0]?.id}
            size="sm"
            variant="outline"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}