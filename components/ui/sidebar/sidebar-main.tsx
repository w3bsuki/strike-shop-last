'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useSidebar, SIDEBAR_WIDTH_MOBILE } from './sidebar-context'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right'
  variant?: 'sidebar' | 'floating' | 'inset'
  collapsible?: 'offcanvas' | 'icon' | 'none'
}

const SidebarDesktop = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ side = 'left', variant = 'sidebar', className, children, ...props }, ref) => {
    const { state } = useSidebar()
    
    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === 'collapsed' ? props.collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* Sidebar gap handler */}
        <div
          className={cn(
            'duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
          )}
        />
        {/* Sidebar content */}
        <div
          className={cn(
            'duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
SidebarDesktop.displayName = 'SidebarDesktop'

const SidebarMobile = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ side = 'left', children, ...props }, ref) => {
    const { openMobile, setOpenMobile } = useSidebar()
    
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          ref={ref}
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
          {...props}
        >
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }
)
SidebarMobile.displayName = 'SidebarMobile'

const SidebarBase = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarBase.displayName = 'SidebarBase'

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile } = useSidebar()

    if (collapsible === 'none') {
      return (
        <SidebarBase ref={ref} className={className} {...props}>
          {children}
        </SidebarBase>
      )
    }

    if (isMobile) {
      return (
        <SidebarMobile ref={ref} side={side} {...props}>
          {children}
        </SidebarMobile>
      )
    }

    return (
      <SidebarDesktop
        ref={ref}
        side={side}
        variant={variant}
        collapsible={collapsible}
        className={className}
        {...props}
      >
        {children}
      </SidebarDesktop>
    )
  }
)
Sidebar.displayName = 'Sidebar'
