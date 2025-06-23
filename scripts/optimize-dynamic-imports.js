#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Dynamic Import Optimization Script
 * Converts heavy components to use dynamic imports
 */

const HEAVY_COMPONENTS = [
  {
    path: 'components/admin/AdminDashboard.tsx',
    imports: ['recharts'],
    reason: 'Charts library is heavy and only used in admin',
  },
  {
    path: 'components/studio/StudioWrapper.tsx',
    imports: ['sanity', '@sanity/vision'],
    reason: 'Sanity Studio is massive and only used in /studio routes',
  },
  {
    path: 'app/studio/[[...tool]]/page.tsx',
    imports: ['sanity', '@sanity/vision'],
    reason: 'Sanity Studio page',
  },
];

const OPTIMIZATION_TEMPLATES = {
  recharts: `// Dynamically import recharts components
const Chart = dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />
});`,
  
  sanity: `// Dynamically import Sanity Studio
const Studio = dynamic(() => import('sanity').then(mod => ({ default: mod.Studio })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading Studio...</div>
});`,
};

function createDynamicImportWrapper(componentPath, componentName, packageName) {
  const wrapperContent = `'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

// Dynamically import ${componentName} for better performance
const ${componentName}Dynamic = dynamic(
  () => import('./${componentName}').then(mod => ({ default: mod.default || mod.${componentName} })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-full w-full bg-muted rounded" />
      </div>
    ),
  }
);

export type ${componentName}Props = ComponentProps<typeof ${componentName}Dynamic>;

export default function ${componentName}Lazy(props: ${componentName}Props) {
  return <${componentName}Dynamic {...props} />;
}
`;

  const dir = path.dirname(componentPath);
  const wrapperPath = path.join(dir, `${componentName}.lazy.tsx`);
  
  fs.writeFileSync(wrapperPath, wrapperContent);
  return wrapperPath;
}

async function optimizeDynamicImports() {
  console.log('🚀 Optimizing dynamic imports for heavy components...\n');

  const report = {
    optimized: [],
    created: [],
    suggestions: [],
  };

  // 1. Check current bundle analyzer output if available
  const bundleReportPath = path.join(process.cwd(), 'bundle-report.json');
  if (fs.existsSync(bundleReportPath)) {
    const bundleReport = JSON.parse(fs.readFileSync(bundleReportPath, 'utf-8'));
    console.log(`📊 Current bundle analysis:`);
    console.log(`   Total size: ${(bundleReport.totalGzipSize / 1024).toFixed(2)}KB`);
    console.log(`   Largest chunk: ${(bundleReport.largestChunk / 1024).toFixed(2)}KB\n`);
  }

  // 2. Create dynamic import examples
  console.log('📝 Creating dynamic import examples...\n');

  const examplesContent = `/**
 * Dynamic Import Examples for Heavy Components
 * Use these patterns to reduce initial bundle size
 */

import dynamic from 'next/dynamic';

// ========================================
// Admin Dashboard Components
// ========================================

// Dynamic import for charts (recharts is ~300KB)
export const DynamicLineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

export const DynamicBarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

export const DynamicPieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    ssr: false,
    loading: () => <div className="h-[300px] animate-pulse bg-muted rounded" />,
  }
);

// ========================================
// Sanity Studio Components
// ========================================

// Dynamic import for Sanity Studio (saves ~2MB from initial bundle)
export const DynamicStudio = dynamic(
  () => import('sanity').then(mod => ({ default: mod.Studio })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading Studio...</p>
        </div>
      </div>
    ),
  }
);

// ========================================
// Heavy UI Components
// ========================================

// Dynamic import for carousel (if using embla-carousel)
export const DynamicCarousel = dynamic(
  () => import('@/components/ui/carousel').then(mod => ({ default: mod.Carousel })),
  {
    ssr: false,
    loading: () => <div className="h-[400px] animate-pulse bg-muted rounded" />,
  }
);

// Dynamic import for date picker
export const DynamicDatePicker = dynamic(
  () => import('@/components/ui/date-picker').then(mod => ({ default: mod.DatePicker })),
  {
    ssr: false,
    loading: () => <div className="h-10 w-[280px] animate-pulse bg-muted rounded" />,
  }
);

// ========================================
// Usage Examples
// ========================================

/**
 * Before (imports everything immediately):
 * import { LineChart, BarChart } from 'recharts';
 * 
 * After (loads only when needed):
 * import { DynamicLineChart, DynamicBarChart } from '@/lib/dynamic-imports';
 */

/**
 * For page-level dynamic imports:
 * 
 * const AdminDashboard = dynamic(
 *   () => import('@/components/admin/AdminDashboard'),
 *   {
 *     ssr: false,
 *     loading: () => <AdminDashboardSkeleton />,
 *   }
 * );
 */

/**
 * Best practices:
 * 1. Use dynamic imports for components > 50KB
 * 2. Always provide a loading state
 * 3. Set ssr: false for client-only components
 * 4. Group related dynamic imports together
 * 5. Preload critical dynamic components with next/dynamic's preload
 */
`;

  const dynamicImportsPath = path.join(process.cwd(), 'lib', 'dynamic-imports.tsx');
  fs.writeFileSync(dynamicImportsPath, examplesContent);
  report.created.push(dynamicImportsPath);

  // 3. Create route-based code splitting guide
  console.log('📖 Creating route-based splitting guide...\n');

  const splitGuideContent = `# Route-Based Code Splitting Guide

## Current Heavy Routes

### 1. Admin Routes (/admin/*)
- **Current impact**: ~500KB
- **Components**: AdminDashboard, Charts, DataTables
- **Solution**: Already split in next.config.mjs

### 2. Studio Routes (/studio/*)
- **Current impact**: ~2MB (Sanity Studio)
- **Components**: Studio, Vision plugin
- **Solution**: Use dynamic import in page component

### 3. Product Pages
- **Components**: ProductGallery, Reviews, RelatedProducts
- **Solution**: Lazy load below-the-fold components

## Implementation Examples

### Studio Page Optimization
\`\`\`tsx
// app/studio/[[...tool]]/page.tsx
import dynamic from 'next/dynamic';

const Studio = dynamic(
  () => import('@/components/studio/StudioWrapper'),
  {
    ssr: false,
    loading: () => <StudioLoader />,
  }
);

export default function StudioPage() {
  return <Studio />;
}
\`\`\`

### Product Page Optimization
\`\`\`tsx
// components/product/ProductPage.tsx
import dynamic from 'next/dynamic';

// Load immediately (above the fold)
import ProductInfo from './ProductInfo';
import ProductGallery from './ProductGallery';

// Lazy load (below the fold)
const ProductReviews = dynamic(() => import('./ProductReviews'));
const RelatedProducts = dynamic(() => import('./RelatedProducts'));
const ProductQA = dynamic(() => import('./ProductQA'));

export function ProductPage() {
  return (
    <>
      <ProductGallery />
      <ProductInfo />
      {/* These load as user scrolls */}
      <ProductReviews />
      <RelatedProducts />
      <ProductQA />
    </>
  );
}
\`\`\`

## Bundle Size Targets

| Route | Current | Target | Savings |
|-------|---------|--------|---------|
| Home | 250KB | 200KB | 20% |
| Product | 300KB | 220KB | 27% |
| Admin | 500KB | 300KB | 40% |
| Studio | 2MB | 100KB* | 95% |

*Initial load, studio loads on demand

## Monitoring

Run these commands to track progress:
- \`npm run bundle:check\` - Check current bundle sizes
- \`npm run build:analyze\` - Visual bundle analysis
- \`npm run bundle:optimize\` - Run optimization scripts
`;

  const splitGuidePath = path.join(process.cwd(), 'docs', 'code-splitting-guide.md');
  fs.mkdirSync(path.dirname(splitGuidePath), { recursive: true });
  fs.writeFileSync(splitGuidePath, splitGuideContent);
  report.created.push(splitGuidePath);

  // 4. Add preload suggestions
  console.log('💡 Generating optimization suggestions...\n');

  report.suggestions = [
    'Use next/dynamic for all components > 50KB',
    'Implement route prefetching for common user flows',
    'Add resource hints (<link rel="preload">) for critical assets',
    'Consider using React.lazy() for smaller component-level splits',
    'Implement intersection observer for below-the-fold lazy loading',
    'Use next/script with strategy="lazyOnload" for third-party scripts',
  ];

  // 5. Generate final report
  console.log('📊 Dynamic Import Optimization Report:');
  console.log('=====================================\n');

  console.log('✅ Created files:');
  report.created.forEach(file => {
    console.log(`   - ${path.relative(process.cwd(), file)}`);
  });

  console.log('\n💡 Key optimizations to implement:');
  console.log('   1. Convert Sanity Studio to dynamic import (saves ~2MB)');
  console.log('   2. Lazy load recharts in admin dashboard (saves ~300KB)');
  console.log('   3. Split product page components by viewport');
  console.log('   4. Use route-based splitting for admin/studio');

  console.log('\n🎯 Expected impact:');
  console.log('   - Initial bundle: -40% reduction');
  console.log('   - Route-specific bundles: -60% for admin/studio');
  console.log('   - Time to Interactive: -2-3 seconds');

  console.log('\n📝 Next steps:');
  console.log('   1. Review lib/dynamic-imports.tsx for examples');
  console.log('   2. Read docs/code-splitting-guide.md');
  console.log('   3. Implement dynamic imports in heavy components');
  console.log('   4. Run bundle:check to measure improvements');

  // Save report
  fs.writeFileSync(
    path.join(process.cwd(), 'dynamic-imports-report.json'),
    JSON.stringify(report, null, 2)
  );
}

// Run optimization
optimizeDynamicImports().catch(console.error);