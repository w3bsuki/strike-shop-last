'use client';

import * as React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// TODO: Resizable components disabled due to missing react-resizable-panels dependency
// Install react-resizable-panels to re-enable this component

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, direction = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full',
        direction === 'vertical' && 'flex-col',
        className
      )}
      {...props}
    />
  )
);
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

export interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1', className)}
      {...props}
    />
  )
);
ResizablePanel.displayName = 'ResizablePanel';

export interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean;
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ withHandle, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex w-px items-center justify-center bg-border',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
      <div className="text-xs text-muted-foreground p-2">
        Resizable components disabled
      </div>
    </div>
  )
);
ResizableHandle.displayName = 'ResizableHandle';

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };