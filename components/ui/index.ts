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
export { Label } from './label';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from './select';
export { Switch } from './switch';
export { Slider } from './slider';

// Navigation components  
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from './breadcrumb';
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';

// Layout components
export { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from './dialog';
export { Sheet, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from './sheet';
export { Drawer, DrawerPortal, DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerClose } from './drawer';

// Feedback components
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Progress } from './progress';
export { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';
export { Toaster } from './toaster';

// Interactive components
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup } from './dropdown-menu';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

// Data display
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

// Utility components
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';