/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Import CSS files
    'postcss-import': {},
    
    // Process Tailwind CSS
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    
    // Add vendor prefixes
    'autoprefixer': {},
    
    // Modern CSS features
    'postcss-preset-env': {
      stage: 1,
      features: {
        'nesting-rules': false, // We use tailwindcss/nesting instead
        'custom-properties': false, // Keep CSS variables as-is
      },
    },
    
    // Optimize CSS in production
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: ['advanced', {
          discardComments: {
            removeAll: true,
          },
          reduceIdents: false, // Keep animation names intact
          zindex: false, // Keep z-index values as defined
          cssDeclarationSorter: false, // Preserve order for cascade
        }],
      },
    }),
  },
};

export default config;