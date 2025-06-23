/**
 * Optimized imports for common libraries
 * Use these imports instead of direct imports for better tree-shaking
 */

// Instead of: import { debounce } from 'lodash'
// Use: import debounce from 'lodash/debounce'

// Instead of: import { Dialog } from '@radix-ui/react-dialog'
// Use the existing shadcn/ui components which already optimize Radix imports

// For icons, use specific imports:
// Instead of: import { ChevronRight } from 'lucide-react'
// The modularizeImports config will handle this automatically

export const importGuidelines = {
  lodash: 'Use specific imports like lodash/debounce',
  radixUI: 'Use shadcn/ui components instead of direct Radix imports',
  icons: 'Import icons individually, tree-shaking is automatic',
  reactQuery: 'Import only what you need from @tanstack/react-query',
};
