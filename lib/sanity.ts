/**
 * Sanity CMS client stub
 * TODO: Replace with actual Sanity client when CMS is configured
 */

// Stub Sanity client that provides minimal functionality
export const sanityClient = {
  fetch: async (_query: string, _params?: any): Promise<any> => {
    console.warn('Sanity CMS not configured - returning null');
    return null;
  }
};

// Stub image URL builder
export const urlForImage = (_source: any) => {
  console.warn('Sanity image URL builder not configured');
  return {
    url: () => '/placeholder.svg?height=600&width=600'
  };
};