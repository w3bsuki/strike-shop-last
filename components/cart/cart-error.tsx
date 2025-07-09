import { AlertCircle, WifiOff } from 'lucide-react';

interface CartErrorProps {
  error: string;
}

export function CartError({ error }: CartErrorProps) {
  const isNetworkError = error.includes('connection') || error.includes('network');

  return (
    <div className="mx-6 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
      <div className="flex items-center gap-2">
        {isNetworkError ? (
          <WifiOff className="h-4 w-4 text-destructive" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <span className="text-destructive text-sm">{error}</span>
      </div>
    </div>
  );
}