/**
 * Medusa configuration with proper SSR support
 * This handles environment variables correctly for both client and server
 */

// Server-side config (build time)
const serverConfig = {
  backendUrl: 'https://medusa-starter-default-production-3201.up.railway.app',
  publishableKey: '',
  regionId: 'reg_01J7K5CZXGP2FBS7C5B9MRV4DT',
};

// Client-side config (runtime)
const clientConfig = {
  backendUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || serverConfig.backendUrl,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || serverConfig.publishableKey,
  regionId: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || serverConfig.regionId,
};

// Export the appropriate config based on environment
export const medusaConfig = typeof window === 'undefined' ? serverConfig : clientConfig;

// Helper to get config values
export const getMedusaUrl = () => medusaConfig.backendUrl;
export const getMedusaPublishableKey = () => medusaConfig.publishableKey;
export const getMedusaRegionId = () => medusaConfig.regionId;