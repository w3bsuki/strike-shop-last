import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileNavIconProps {
  children: ReactNode;
  className?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'dot' | 'number';
  showBadge?: boolean;
}

export function MobileNavIcon({
  children,
  className,
  badge,
  badgeVariant = 'number',
  showBadge = true,
}: MobileNavIconProps) {
  const hasBadge = showBadge && badge !== undefined && badge !== 0;

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {hasBadge && (
        <>
          {badgeVariant === 'dot' && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
          )}
          
          {badgeVariant === 'number' && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
              {typeof badge === 'number' && badge > 9 ? '9+' : badge}
            </span>
          )}
          
          {badgeVariant === 'default' && badge && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center font-medium">
              {badge}
            </span>
          )}
        </>
      )}
    </div>
  );
}