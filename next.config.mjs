import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    domains: [
      'localhost',
      'cdn.sanity.io',
      'medusa-public-images.s3.eu-west-1.amazonaws.com',
      'images.unsplash.com',
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: [
      'sanity',
      '@sanity/vision',
      'sharp',
    ],
    // Enable critical CSS inlining
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-toast',
      'lucide-react',
    ],
  },
  // Modularize imports for perfect tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      preventFullImport: true,
    },
    'recharts': {
      transform: 'recharts/lib/{{member}}',
      preventFullImport: true,
    },
  },
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable compression
  compress: true,
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  // Optimized caching headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Add comprehensive resource hints for faster loading
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: [
              '<https://fonts.googleapis.com>; rel=preconnect',
              '<https://cdn.sanity.io>; rel=preconnect',
              '<https://medusa-public-images.s3.eu-west-1.amazonaws.com>; rel=preconnect',
              '<https://images.unsplash.com>; rel=preconnect',
              '</fonts/CourierPrime-Regular.ttf>; rel=preload; as=font; type=font/ttf; crossorigin',
              '</fonts/CourierPrime-Bold.ttf>; rel=preload; as=font; type=font/ttf; crossorigin',
            ].join(', '),
          },
        ],
      },
      // Security headers for performance
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations only
    if (!dev && !isServer) {
      // Aggressive chunk splitting
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        providedExports: true,
        sideEffects: false,
        minimize: true,
        concatenateModules: true,
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 25,
          cacheGroups: {
            // Framework chunks
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-sync-external-store)[\\/]/,
              name: 'framework',
              priority: 50,
              reuseExistingChunk: true,
            },
            // Radix UI components (only used ones)
            radixCore: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]react-(dialog|dropdown-menu|select|toast|accordion|label|slot|toggle)[\\/]/,
              name: 'radix-core',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Clerk authentication
            clerk: {
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              name: 'clerk',
              priority: 35,
              reuseExistingChunk: true,
            },
            // React Query
            query: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'query',
              priority: 34,
              reuseExistingChunk: true,
            },
            // State management
            state: {
              test: /[\\/]node_modules[\\/](zustand|immer)[\\/]/,
              name: 'state',
              priority: 33,
              reuseExistingChunk: true,
            },
            // Utilities
            utils: {
              test: /[\\/]node_modules[\\/](clsx|tailwind-merge|class-variance-authority)[\\/]/,
              name: 'utils',
              priority: 32,
              reuseExistingChunk: true,
            },
            // Icons (optimized imports)
            icons: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'icons',
              priority: 31,
              reuseExistingChunk: true,
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
      };

      // Perfect tree shaking
      config.resolve.mainFields = ['module', 'main'];
      
      // Mark packages as side-effect free
      config.module.rules.push({
        test: /node_modules\/(lucide-react|@radix-ui|@tanstack|clsx|tailwind-merge)/,
        sideEffects: false,
      });

      // Exclude development packages
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tanstack/react-query-devtools': false,
        '@sanity/vision': false,
      };

      // Add performance hints
      config.performance = {
        maxAssetSize: 244000,
        maxEntrypointSize: 244000,
        hints: 'warning',
      };

      // Aggressive minification
      if (config.optimization.minimizer) {
        config.optimization.minimizer.forEach((minimizer) => {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
                passes: 2,
              },
              mangle: {
                safari10: true,
              },
              format: {
                comments: false,
              },
            };
          }
        });
      }
    }

    // Both dev and production
    if (!isServer) {
      // Keep original React (Preact causes issues with Next.js 14)
      
      // Add critical CSS extraction plugin
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.emit.tapAsync('CriticalCssPlugin', (compilation, callback) => {
            // Mark critical CSS for inlining
            Object.keys(compilation.assets).forEach((filename) => {
              if (filename.endsWith('.css') && filename.includes('app')) {
                const asset = compilation.assets[filename];
                if (asset && asset.source) {
                  // Add metadata for critical CSS detection
                  asset._isCritical = true;
                }
              }
            });
            callback();
          });
        },
      });
    }

    return config;
  },
};

export default withBundleAnalyzer(nextConfig);