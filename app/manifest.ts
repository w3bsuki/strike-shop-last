import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STRIKE™ - Luxury Streetwear & Fashion',
    short_name: 'STRIKE™',
    description: 'Discover the latest in luxury streetwear and fashion at STRIKE™. Premium quality, cutting-edge designs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en-GB',
    categories: ['shopping', 'lifestyle', 'fashion'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
    shortcuts: [
      {
        name: 'New Arrivals',
        short_name: 'New',
        description: 'Browse the latest arrivals',
        url: '/new',
        icons: [{ src: '/icons/new-icon.png', sizes: '96x96' }],
      },
      {
        name: 'Sale Items',
        short_name: 'Sale',
        description: 'Shop discounted items',
        url: '/sale',
        icons: [{ src: '/icons/sale-icon.png', sizes: '96x96' }],
      },
      {
        name: 'Search',
        short_name: 'Search',
        description: 'Search for products',
        url: '/search',
        icons: [{ src: '/icons/search-icon.png', sizes: '96x96' }],
      },
    ],
    prefer_related_applications: false,
  };
}