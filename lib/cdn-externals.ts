/**
 * CDN EXTERNALS CONFIGURATION
 * Moves large packages to CDN for production to reduce node_modules size
 */

// CDN URLs for production
export const CDN_EXTERNALS = {
  react: 'https://unpkg.com/react@18/umd/react.production.min.js',
  'react-dom': 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'lucide-react': 'https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js',
  'zustand': 'https://unpkg.com/zustand@latest/esm/index.js',
  'clsx': 'https://unpkg.com/clsx@latest/dist/clsx.js',
  'class-variance-authority': 'https://unpkg.com/class-variance-authority@latest/dist/index.js',
};

// Webpack externals configuration for production
export const webpackExternals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  // Keep other packages bundled as they're more complex
};

// HTML script tags for CDN loading
export const getCDNScripts = () => `
<!-- CDN External Libraries for Production -->
<script crossorigin src="${CDN_EXTERNALS.react}"></script>
<script crossorigin src="${CDN_EXTERNALS['react-dom']}"></script>
`;

// Production environment check
export const shouldUseCDN = () => process.env.NODE_ENV === 'production';

// Dynamic import fallback for CDN failures
export const createCDNFallback = (packageName: string, fallbackImport: () => Promise<any>) => {
  if (typeof window !== 'undefined' && shouldUseCDN()) {
    // Check if CDN package is available
    const globalName = webpackExternals[packageName as keyof typeof webpackExternals];
    if (globalName && (window as any)[globalName]) {
      return Promise.resolve((window as any)[globalName]);
    }
  }
  
  // Fallback to bundle
  return fallbackImport();
};