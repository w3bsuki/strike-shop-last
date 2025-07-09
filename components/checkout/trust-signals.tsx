import { Shield, Truck, RefreshCw, Lock } from 'lucide-react';

export function TrustSignals({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
      <div className="text-center p-3 border border-border rounded-lg">
        <Lock className="h-6 w-6 mx-auto mb-2 text-success" />
        <p className="text-xs font-medium">Secure Checkout</p>
        <p className="text-[10px] text-muted-foreground">256-bit SSL</p>
      </div>
      
      <div className="text-center p-3 border border-border rounded-lg">
        <Truck className="h-6 w-6 mx-auto mb-2 text-info" />
        <p className="text-xs font-medium">Fast Delivery</p>
        <p className="text-[10px] text-muted-foreground">1-3 days</p>
      </div>
      
      <div className="text-center p-3 border border-border rounded-lg">
        <RefreshCw className="h-6 w-6 mx-auto mb-2 text-info" />
        <p className="text-xs font-medium">Easy Returns</p>
        <p className="text-[10px] text-muted-foreground">30 days</p>
      </div>
      
      <div className="text-center p-3 border border-border rounded-lg">
        <Shield className="h-6 w-6 mx-auto mb-2 text-warning" />
        <p className="text-xs font-medium">Buyer Protection</p>
        <p className="text-[10px] text-muted-foreground">Guaranteed</p>
      </div>
    </div>
  );
}

export function CheckoutTestimonial({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-muted p-4 rounded-lg ${className}`}>
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className="w-4 h-4 fill-warning" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic mb-1">
        "Super fast delivery and amazing quality! The checkout was seamless."
      </p>
      <p className="text-xs text-muted-foreground">— Sarah M., verified buyer</p>
    </div>
  );
}

export function StockUrgency({ stock = 5, className = '' }: { stock?: number; className?: string }) {
  if (stock > 10) return null;
  
  return (
    <div className={`bg-warning/10 border border-warning/20 rounded-lg p-3 ${className}`}>
      <p className="text-sm font-medium text-warning-foreground">
        🔥 Only {stock} left in stock - order soon!
      </p>
    </div>
  );
}