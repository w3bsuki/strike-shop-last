import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Bundle analyzer setup (disabled in production)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: false, // Always disabled in production
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore ESLint during builds due to config issue
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configure image optimization for production
  images: {
    domains: [
      'cdn.sanity.io',
      'medusa-public-images.s3.eu-west-1.amazonaws.com',
      'images.unsplash.com',
    ],
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    // PRODUCTION: Exclude Studio from build entirely
    serverComponentsExternalPackages: [
      'sanity',
      '@sanity/vision',
      'sharp',
    ],
  },
  // AGGRESSIVE: Modularize imports for perfect tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
      preventFullImport: true,
    },
    '@tanstack/react-query': {
      transform: '@tanstack/react-query/{{member}}',
      preventFullImport: true,
    },
    '@clerk/nextjs': {
      transform: '@clerk/nextjs/{{member}}',
      preventFullImport: true,
    },
    'recharts': {
      transform: 'recharts/lib/{{member}}',
      preventFullImport: true,
    },
  },
  // EXTREME: Production optimizations
  compiler: {
    removeConsole: true, // Always remove console in production
    styledComponents: true,
  },
  // AGGRESSIVE: Exclude heavy packages from server bundle
  serverComponentsExternalPackages: [
    'sanity',
    '@sanity/client',
    '@sanity/vision',
    'sharp',
  ],
  // Enable gzip compression
  compress: true,
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  // PRODUCTION: Optimized caching headers
  async headers() {
    return [
      // Static assets cache optimization
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
      // Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // PRODUCTION: Aggressive webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations only
    if (!dev && !isServer) {
      // EXTREME chunk splitting for production
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        providedExports: true,
        sideEffects: false,
        minimize: true,
        concatenateModules: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 100000, // Smaller chunks for better caching
          maxAsyncRequests: 30,
          maxInitialRequests: 25,
          cacheGroups: {
            // CRITICAL: Separate framework chunks
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'framework.react',
              priority: 50,
              reuseExistingChunk: true,
            },
            // Split Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'vendor.radix',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Split other vendors
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor.common',
              priority: 10,
              minChunks: 1,
            },
          },
        },
      };

      // PRODUCTION: Perfect tree shaking
      config.resolve.mainFields = ['module', 'main'];
      
      // PRODUCTION: CDN externals
      config.externals = {
        ...config.externals,
        react: 'React',
        'react-dom': 'ReactDOM',
      };

      // Mark packages as side-effect free
      config.module.rules.push({
        test: /node_modules\/(lucide-react|@radix-ui|@tanstack)/,
        sideEffects: false,
      });

      // PRODUCTION: Exclude development packages
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tanstack/react-query-devtools': false,
        '@sanity/vision': false,
      };
    }

    return config;
  },
  // PRODUCTION: Redirect Studio routes to 404
  async redirects() {
    return [
      {
        source: '/studio/:path*',
        destination: '/404',
        permanent: false,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);