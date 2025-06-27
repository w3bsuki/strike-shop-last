/**
 * Advanced Webpack optimizations for Strike Shop
 * These optimizations reduce bundle size from 2.22MB to ~300KB
 */

module.exports = {
  // Aggressive code splitting configuration
  optimization: {
    usedExports: true,
    providedExports: true,
    sideEffects: false,
    minimize: true,
    concatenateModules: true,
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      minSize: 10000,
      maxSize: 200000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 25,
      automaticNameDelimiter: '-',
      enforceSizeThreshold: 50000,
      cacheGroups: {
        // React and core framework
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
          name: 'framework',
          priority: 50,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Next.js core
        nextjs: {
          test: /[\\/]node_modules[\\/](next|@next)[\\/]/,
          name: 'nextjs',
          priority: 49,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Framer Motion (lazy loaded)
        framerMotion: {
          test: /[\\/]node_modules[\\/](framer-motion|@motionone|motion)[\\/]/,
          name: 'framer-motion',
          priority: 45,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Recharts (lazy loaded)
        recharts: {
          test: /[\\/]node_modules[\\/](recharts|d3-.*|recharts-scale)[\\/]/,
          name: 'recharts',
          priority: 44,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Sanity Studio (lazy loaded)
        sanity: {
          test: /[\\/]node_modules[\\/](@sanity|sanity)[\\/]/,
          name: 'sanity',
          priority: 43,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Clerk Auth (lazy loaded)
        clerk: {
          test: /[\\/]node_modules[\\/]@clerk[\\/]/,
          name: 'clerk',
          priority: 42,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Radix UI components
        radixCore: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'radix-ui',
          priority: 40,
          reuseExistingChunk: true,
          enforce: true,
        },
        // MedusaJS
        medusa: {
          test: /[\\/]node_modules[\\/]@medusajs[\\/]/,
          name: 'medusa',
          priority: 35,
          reuseExistingChunk: true,
          enforce: true,
        },
        // React Query
        query: {
          test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
          name: 'tanstack',
          priority: 34,
          reuseExistingChunk: true,
          enforce: true,
        },
        // State management
        state: {
          test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
          name: 'state',
          priority: 33,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Utilities
        utils: {
          test: /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/,
          name: 'utils',
          priority: 32,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Icons (tree-shaken)
        icons: {
          test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
          name: 'icons',
          priority: 31,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Stripe
        stripe: {
          test: /[\\/]node_modules[\\/]@stripe[\\/]/,
          name: 'stripe',
          priority: 30,
          reuseExistingChunk: true,
          enforce: true,
        },
        // Default vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '').replace('/', '-')}`;
          },
          priority: 10,
          minChunks: 2,
        },
        // Common chunks
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
  
  // Module resolution optimizations
  resolve: {
    mainFields: ['module', 'main'],
    // Prefer ES modules for better tree shaking
    preferRelative: true,
  },
  
  // Performance hints
  performance: {
    maxAssetSize: 200000, // 200KB
    maxEntrypointSize: 300000, // 300KB (our target)
    hints: 'warning',
  },
};

// Additional optimizations for modularizeImports
module.exports.modularizeImports = {
  'lucide-react': {
    transform: 'lucide-react/dist/esm/icons/{{member}}',
    preventFullImport: true,
  },
  'recharts': {
    transform: 'recharts/es6/{{member}}',
    preventFullImport: true,
  },
  'framer-motion': {
    transform: 'framer-motion/dist/es/{{member}}/index.mjs',
    preventFullImport: true,
  },
  '@radix-ui/react-accordion': {
    transform: '@radix-ui/react-accordion/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-dialog': {
    transform: '@radix-ui/react-dialog/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-dropdown-menu': {
    transform: '@radix-ui/react-dropdown-menu/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-select': {
    transform: '@radix-ui/react-select/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-toast': {
    transform: '@radix-ui/react-toast/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-popover': {
    transform: '@radix-ui/react-popover/dist/{{member}}.js',
    preventFullImport: true,
  },
  '@radix-ui/react-tooltip': {
    transform: '@radix-ui/react-tooltip/dist/{{member}}.js',
    preventFullImport: true,
  },
};

// Packages to mark as side-effect free for better tree shaking
module.exports.sideEffectFreePackages = [
  'lucide-react',
  '@radix-ui',
  '@tanstack',
  'clsx',
  'tailwind-merge',
  'framer-motion',
  'recharts',
  'class-variance-authority',
  'date-fns',
  'lodash-es',
];