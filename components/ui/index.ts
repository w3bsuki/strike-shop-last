/**
 * UI Component Library
 * 
 * Core UI components built on top of Radix UI and Tailwind CSS.
 * All components follow WCAG 2.1 AA accessibility standards.
 * 
 * @module components/ui
 */

// Core components
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

export { Skeleton } from './skeleton';
export { Separator } from './separator';
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { AspectRatio } from './aspect-ratio';

// Form components
export { 
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField
} from './form';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './select';
export { Switch } from './switch';
export { Slider } from './slider';

// Navigation components
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport, navigationMenuTriggerStyle } from './navigation-menu';
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from './breadcrumb';
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';

// Overlay components
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './dialog';
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet';
export { Drawer, DrawerPortal, DrawerOverlay, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from './drawer';
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from './alert-dialog';
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from './popover';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card';

// Feedback components
export { Alert, AlertTitle, AlertDescription } from './alert';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';
export { useToast, toast } from './use-toast';
export { Toaster } from './toaster';
export { Sonner } from './sonner';
export { Progress } from './progress';

// Data display components
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
export { ScrollArea, ScrollBar } from './scroll-area';
export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';
export type { CarouselApi } from './carousel';

// Layout components
export { Sidebar, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarGroupAction, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarSeparator, SidebarInset, SidebarRail, useSidebar } from './sidebar';
export { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './resizable';

// Menu components
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from './dropdown-menu';
export { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuRadioGroup } from './context-menu';
export { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator, MenubarLabel, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarPortal, MenubarSubContent, MenubarSubTrigger, MenubarGroup, MenubarSub, MenubarShortcut } from './menubar';
export { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator } from './command';

// Utility components
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export { Toggle, toggleVariants } from './toggle';
export type { ToggleProps, ToggleVariants } from './toggle';

export { Calendar } from './calendar';
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from './input-otp';

// Custom Strike Shop components
export { OptimizedImage } from './optimized-image';
export type { OptimizedImageProps } from './optimized-image';

export { ProductImage } from './optimized-image';

// Loading states
export {
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailsSkeleton,
  CartItemSkeleton,
  CategoryCardSkeleton,
  OrderItemSkeleton,
  TextSkeleton,
  ProductScrollSkeleton,
  CategoryScrollSkeleton,
  HeroBannerSkeleton
} from './loading-states';

// Error states
export { EmptyState, ErrorState, LoadingState } from './error-states';

// Section components
export { SectionHeader } from './section-header';
export { SectionDivider } from './section-divider';

// Modal components
export { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalTitle, ModalDescription, useModal } from './modal';

// Performance components
export { ViewportLoader } from './viewport-loader';

// Chart components (lazy loaded)
export { Chart } from './chart-dynamic';
export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './chart';