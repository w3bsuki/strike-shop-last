/**
 * Radix UI Barrel Exports
 * Optimized exports for tree shaking - only exports components actually used in the project
 * This reduces bundle size by preventing unused Radix components from being included
 */

// Only export components that are actually used in the project
export * as Accordion from '@radix-ui/react-accordion';
export * as AlertDialog from '@radix-ui/react-alert-dialog';
export * as AspectRatio from '@radix-ui/react-aspect-ratio';
export * as Avatar from '@radix-ui/react-avatar';
export * as Checkbox from '@radix-ui/react-checkbox';
export * as Collapsible from '@radix-ui/react-collapsible';
export * as ContextMenu from '@radix-ui/react-context-menu';
export * as Dialog from '@radix-ui/react-dialog';
export * as DropdownMenu from '@radix-ui/react-dropdown-menu';
export * as HoverCard from '@radix-ui/react-hover-card';
export * as Label from '@radix-ui/react-label';
export * as Menubar from '@radix-ui/react-menubar';
export * as NavigationMenu from '@radix-ui/react-navigation-menu';
export * as Popover from '@radix-ui/react-popover';
export * as Progress from '@radix-ui/react-progress';
export * as RadioGroup from '@radix-ui/react-radio-group';
export * as ScrollArea from '@radix-ui/react-scroll-area';
export * as Select from '@radix-ui/react-select';
export * as Separator from '@radix-ui/react-separator';
export * as Slider from '@radix-ui/react-slider';
export * as Slot from '@radix-ui/react-slot';
export * as Switch from '@radix-ui/react-switch';
export * as Tabs from '@radix-ui/react-tabs';
export * as Toast from '@radix-ui/react-toast';
export * as Toggle from '@radix-ui/react-toggle';
export * as ToggleGroup from '@radix-ui/react-toggle-group';
export * as Tooltip from '@radix-ui/react-tooltip';

// Type exports for TypeScript support
export type {
  AccordionSingleProps,
  AccordionMultipleProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from '@radix-ui/react-accordion';

export type {
  AlertDialogProps,
  AlertDialogTriggerProps,
  AlertDialogContentProps,
} from '@radix-ui/react-alert-dialog';

export type {
  DialogProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogCloseProps,
} from '@radix-ui/react-dialog';

export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
} from '@radix-ui/react-dropdown-menu';

export type {
  SelectProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
} from '@radix-ui/react-select';

export type { ToastProps, ToastViewportProps } from '@radix-ui/react-toast';
