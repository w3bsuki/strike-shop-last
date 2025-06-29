'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// TODO: Calendar component disabled due to missing react-day-picker dependency
// Install react-day-picker to re-enable this component

export interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  // Placeholder props for compatibility
  showOutsideDays?: boolean;
  classNames?: Record<string, string>;
}

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div 
      className={cn('p-3 border rounded-md', className)} 
      {...props}
    >
      <div className="text-center text-muted-foreground p-8">
        Calendar component is disabled.
        <br />
        Install react-day-picker dependency to enable.
      </div>
    </div>
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
