'use client';

import { Heart, Trash2, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkActionsBarProps {
  selectedItems: string[];
  onMoveToWishlist: () => void;
  onRemove: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({ 
  selectedItems, 
  onMoveToWishlist, 
  onRemove, 
  onClearSelection 
}: BulkActionsBarProps) {
  return (
    <div className="border-b bg-muted/30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveToWishlist}
            className="text-xs"
          >
            <Heart className="h-4 w-4 mr-1" />
            Move to Wishlist
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-xs"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}