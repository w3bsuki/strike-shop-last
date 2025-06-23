#!/usr/bin/env node

/**
 * UNUSED UI COMPONENTS REMOVAL SCRIPT
 * Safely removes unused UI components to reduce bundle size
 */

const fs = require('fs');
const path = require('path');

const unusedComponents = [
  'alert-dialog',
  'aspect-ratio', 
  'avatar',
  'collapsible',
  'context-menu',
  'hover-card',
  'menubar',
  'navigation-menu',
  'popover',
  'progress',
  'radio-group',
  'scroll-area',
  'switch',
  'toggle-group'
];

const uiDir = path.join(__dirname, '..', 'components', 'ui');

function removeUnusedComponents() {
  console.log('🧹 Removing unused UI components to optimize bundle size...\n');
  
  let totalSaved = 0;
  let removedCount = 0;
  
  unusedComponents.forEach(component => {
    const componentPath = path.join(uiDir, `${component}.tsx`);
    
    if (fs.existsSync(componentPath)) {
      try {
        // Get file size before removal
        const stats = fs.statSync(componentPath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        
        // Remove the file
        fs.unlinkSync(componentPath);
        
        console.log(`🗑️  Removed: ${component}.tsx (${sizeKB}KB)`);
        totalSaved += parseFloat(sizeKB);
        removedCount++;
      } catch (error) {
        console.error(`❌ Failed to remove ${component}.tsx:`, error.message);
      }
    } else {
      console.log(`⚠️  Not found: ${component}.tsx`);
    }
  });
  
  console.log(`\n✅ Optimization complete!`);
  console.log(`📊 Results:`);
  console.log(`   - Removed components: ${removedCount}/${unusedComponents.length}`);
  console.log(`   - Space saved: ~${totalSaved.toFixed(1)}KB`);
  
  // Update the radix-exports.ts to remove unused exports
  updateRadixExports();
}

function updateRadixExports() {
  const radixExportsPath = path.join(__dirname, '..', 'lib', 'radix-exports.ts');
  
  if (!fs.existsSync(radixExportsPath)) {
    console.log('⚠️  radix-exports.ts not found, skipping optimization');
    return;
  }
  
  try {
    let content = fs.readFileSync(radixExportsPath, 'utf8');
    
    // Remove exports for unused components
    const componentsToRemove = {
      'alert-dialog': ['AlertDialog', 'alert-dialog'],
      'aspect-ratio': ['AspectRatio', 'aspect-ratio'],
      'avatar': ['Avatar', 'avatar'],
      'collapsible': ['Collapsible', 'collapsible'],
      'context-menu': ['ContextMenu', 'context-menu'],
      'hover-card': ['HoverCard', 'hover-card'],
      'menubar': ['Menubar', 'menubar'],
      'navigation-menu': ['NavigationMenu', 'navigation-menu'],
      'popover': ['Popover', 'popover'],
      'progress': ['Progress', 'progress'],
      'radio-group': ['RadioGroup', 'radio-group'],
      'scroll-area': ['ScrollArea', 'scroll-area'],
      'switch': ['Switch', 'switch'],
      'toggle-group': ['ToggleGroup', 'toggle-group']
    };
    
    Object.entries(componentsToRemove).forEach(([component, [exportName, packageName]]) => {
      // Remove export line
      const exportRegex = new RegExp(`export \\* as ${exportName} from '@radix-ui/react-${packageName}';\\n`, 'g');
      content = content.replace(exportRegex, '');
      
      // Remove type exports if they exist
      const typeRegex = new RegExp(`export type \\{[^}]*\\} from '@radix-ui/react-${packageName}';\\n`, 'g');
      content = content.replace(typeRegex, '');
    });
    
    // Write optimized file
    fs.writeFileSync(radixExportsPath, content);
    console.log('✅ Updated radix-exports.ts to remove unused component exports');
    
  } catch (error) {
    console.error('❌ Failed to update radix-exports.ts:', error.message);
  }
}

function createOptimizedRadixConfig() {
  const optimizedConfig = `/**
 * OPTIMIZED Radix UI Exports
 * Only includes components actually used in the project for maximum tree-shaking
 */

// USED COMPONENTS ONLY - Aggressive tree-shaking optimization
export * as Accordion from '@radix-ui/react-accordion';
export * as Checkbox from '@radix-ui/react-checkbox';
export * as Dialog from '@radix-ui/react-dialog';
export * as DropdownMenu from '@radix-ui/react-dropdown-menu';
export * as Label from '@radix-ui/react-label';
export * as Select from '@radix-ui/react-select';
export * as Separator from '@radix-ui/react-separator';
export * as Slider from '@radix-ui/react-slider';
export * as Slot from '@radix-ui/react-slot';
export * as Tabs from '@radix-ui/react-tabs';
export * as Toast from '@radix-ui/react-toast';
export * as Toggle from '@radix-ui/react-toggle';
export * as Tooltip from '@radix-ui/react-tooltip';

// Type exports for used components only
export type {
  AccordionSingleProps,
  AccordionMultipleProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from '@radix-ui/react-accordion';

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
`;

  const radixExportsPath = path.join(__dirname, '..', 'lib', 'radix-exports.ts');
  fs.writeFileSync(radixExportsPath, optimizedConfig);
  console.log('✅ Created optimized radix-exports.ts with only used components');
}

// Run the optimization
if (process.argv.includes('--confirm')) {
  removeUnusedComponents();
  createOptimizedRadixConfig();
} else {
  console.log('🚨 UNUSED UI COMPONENT REMOVAL');
  console.log('================================');
  console.log('This script will remove the following unused UI components:');
  console.log(unusedComponents.map(c => `  - ${c}.tsx`).join('\n'));
  console.log('\n⚠️  This action cannot be undone!');
  console.log('\n💡 To proceed with removal, run:');
  console.log('node scripts/remove-unused-ui.js --confirm');
}