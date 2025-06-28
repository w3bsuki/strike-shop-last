/**
 * Medusa configuration with proper SSR support
 * This handles environment variables correctly for both client and server
 */

// Get config from environment variables (works for both server and client)
const getConfig = () => ({
  backendUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000',
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae',
  regionId: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || 'reg_01JXFMWZWX24XQD1BYNTS3N15Q',
});

// Helper functions to get config values (always fresh)
export const getMedusaUrl = () => getConfig().backendUrl;
export const getMedusaPublishableKey = () => getConfig().publishableKey;
export const getMedusaRegionId = () => getConfig().regionId;

// Export config for backwards compatibility
export const medusaConfig = getConfig();