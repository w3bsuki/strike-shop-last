import { createRequire } from "module"

const require = createRequire(import.meta.url)

// Bundle analyzer setup
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

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
    domains: ['cdn.sanity.io', 'medusa-public-images.s3.eu-west-1.amazonaws.com', 'images.unsplash.com'], // Add all image domains
    formats: ['image/webp', 'image/avif'],
    unoptimized: false,
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable gzip compression
  compress: true,
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      }
    }
    return config
  },
}

export default withBundleAnalyzer(nextConfig)
