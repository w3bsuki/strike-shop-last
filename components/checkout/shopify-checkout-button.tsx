'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useCart, useCartActions } from '@/lib/stores';
import { shopifyClient } from '@/lib/shopify';
import { createCheckoutService } from '@/lib/shopify/checkout';
import { logger } from '@/lib/monitoring';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/i18n-provider';

interface ShopifyCheckoutButtonProps {
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  children?: React.ReactNode;
}

export function ShopifyCheckoutButton({ 
  className = '', 
  size = 'default',
  variant = 'default',
  children
}: ShopifyCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const cart = useCart();
  const router = useRouter();
  const locale = useLocale();

  const handleCheckout = async () => {
    if (!cart.cartId) {
      setError('No active cart found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!shopifyClient) {
        throw new Error('Shopify client not initialized');
      }
      const checkoutService = createCheckoutService(shopifyClient);
      
      const result = await checkoutService.createCheckout(cart.cartId);

      if (result.errors.length > 0) {
        const errorMessage = result.errors.map(e => e.message).join(', ');
        throw new Error(errorMessage);
      }

      if (result.checkoutUrl) {
        logger.info('Redirecting to Shopify checkout', { checkoutUrl: result.checkoutUrl });
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout URL');
      }

    } catch (err) {
      logger.error('Failed to create Shopify checkout', { error: err });
      setError(err instanceof Error ? err.message : 'Checkout creation failed');
      
      // If error, redirect to checkout form for manual entry
      setTimeout(() => {
        router.push(`/${locale}/checkout`);
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !cart.items || cart.items.length === 0;

  return (
    <>
      <Button 
        onClick={handleCheckout}
        disabled={isDisabled}
        className={className}
        size={size}
        variant={variant}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating checkout...
          </>
        ) : (
          <>
            {children || (
              <>
                <ShoppingBag className="w-4 h-4 mr-2" />
                Checkout with Shopify
              </>
            )}
          </>
        )}
      </Button>
      
      {error && (
        <div className="mt-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </>
  );
}