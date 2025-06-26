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
    ignoreDuringBuilds: false,
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
      process.env.NEXT_PUBLIC_CDN_URL?.replace(/^https?:\/\//, '') || '',
      process.env.NEXT_PUBLIC_IMAGE_CDN_URL?.replace(/^https?:\/\//, '') || '',
    ].filter(Boolean),
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Production Deployment Configuration
  output: 'standalone',
  
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: [
      'sanity',
      '@sanity/vision',
      'sharp',
    ],
    // Enable Incremental Static Regeneration
    isrMemoryCacheSize: 50,
    // Optimize server components
    serverMinification: true,
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
    '@radix-ui': {
      transform: '@radix-ui/react-{{member}}',
      preventFullImport: true,
      skipDefaultConversion: true,
    },
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Enable compression
  compress: true,
  
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  
  // Production Security Headers
  async headers() {
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://maps.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com https://static.hotjar.com https://script.hotjar.com ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"};
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://cdn.sanity.io https://*.stripe.com https://www.google-analytics.com https://www.facebook.com ${process.env.NEXT_PUBLIC_CDN_URL || ''} ${process.env.NEXT_PUBLIC_IMAGE_CDN_URL || ''};
      media-src 'self' https://cdn.sanity.io ${process.env.NEXT_PUBLIC_CDN_URL || ''};
      connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://connect.facebook.net https://*.hotjar.com https://*.hotjar.io wss://*.hotjar.com ${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''} ${process.env.NEXT_PUBLIC_POSTHOG_HOST || ''};
      font-src 'self' https://fonts.gstatic.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: `max-age=${process.env.HSTS_MAX_AGE || '31536000'}; includeSubDomains; preload`
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          },
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'Expect-CT',
            value: 'max-age=86400, enforce'
          },
        ],
      },
      // Optimized caching headers for static assets
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
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
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes with no-cache
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      // Add resource hints
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect',
          },
        ],
      },
    ];
  },
  
  // Redirects for common security issues
  async redirects() {
    return [
      // Redirect www to non-www (or vice versa based on preference)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.your-domain.com',
          },
        ],
        destination: 'https://your-domain.com/:path*',
        permanent: true,
      },
      // Redirect HTTP to HTTPS (handled by hosting provider usually)
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://your-domain.com/:path*',
        permanent: true,
      },
    ];
  },
  
  // Rewrites for API versioning
  async rewrites() {
    return {
      beforeFiles: [
        // Health check endpoint
        {
          source: '/health',
          destination: '/api/health',
        },
      ],
      afterFiles: [
        // API versioning
        {
          source: '/api/v1/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
  
  // Webpack optimization for production
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
            // Monitoring & Analytics
            monitoring: {
              test: /[\\/]node_modules[\\/](@sentry|web-vitals)[\\/]/,
              name: 'monitoring',
              priority: 30,
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
      
      // Enable Long Term Caching
      config.optimization.realContentHash = true;
    }

    // Add Sentry webpack plugin for production builds
    if (!dev && process.env.SENTRY_AUTH_TOKEN) {
      const { sentryWebpackPlugin } = require('@sentry/nextjs');
      config.plugins.push(
        sentryWebpackPlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          silent: true,
        })
      );
    }

    return config;
  },
  
  // Enable SWC minification
  swcMinify: true,
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Configure distDir for production builds
  distDir: '.next',
  
  // Enable build cache
  experimental: {
    turbotrace: {
      contextDirectory: process.cwd(),
    },
  },
};

// Sentry configuration for production
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const { withSentryConfig } = require('@sentry/nextjs');
  
  const sentryWebpackPluginOptions = {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  };
  
  module.exports = withSentryConfig(
    withBundleAnalyzer(nextConfig),
    sentryWebpackPluginOptions
  );
} else {
  module.exports = withBundleAnalyzer(nextConfig);
}

export default withBundleAnalyzer(nextConfig);