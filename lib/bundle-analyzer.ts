/**
 * Bundle size analyzer configuration for Next.js
 * Run with: ANALYZE=true npm run build
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer;