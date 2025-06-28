module.exports = {
  rules: {
    // Prevent hardcoded values in style props
    'no-restricted-syntax': [
      'error',
      {
        selector: 'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(padding|margin|gap|width|height|top|left|right|bottom|fontSize|lineHeight|letterSpacing)$/][value.type="Literal"][value.value=/^[0-9]+(px|rem|em|%)$/]',
        message: 'Use Tailwind classes or design tokens instead of hardcoded values in style props',
      },
      {
        selector: 'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/^(padding|margin|gap|width|height|top|left|right|bottom|fontSize|lineHeight|letterSpacing)$/][value.type="TemplateLiteral"]',
        message: 'Use Tailwind classes or design tokens instead of hardcoded values in style props',
      },
    ],
    
    // Warn about arbitrary Tailwind values
    'tailwindcss/no-arbitrary-value': [
      'warn',
      {
        callees: ['cn', 'clsx', 'cva'],
        config: './tailwind.config.ts',
      },
    ],
  },
  
  overrides: [
    {
      files: ['*.tsx', '*.jsx'],
      rules: {
        // Enforce semantic color usage
        'no-restricted-properties': [
          'error',
          {
            object: 'colors',
            property: 'black',
            message: 'Use semantic color tokens like text-foreground instead of colors.black',
          },
          {
            object: 'colors',
            property: 'white',
            message: 'Use semantic color tokens like bg-background instead of colors.white',
          },
        ],
        
        // Prevent inline styles with hardcoded values
        'react/forbid-component-props': [
          'error',
          {
            forbid: [
              {
                propName: 'style',
                allowedFor: [], // Can add exceptions here if needed
                message: 'Use Tailwind classes instead of inline styles',
              },
            ],
          },
        ],
      },
    },
  ],
  
  // Custom rules for design tokens
  plugins: ['tailwindcss'],
  
  settings: {
    tailwindcss: {
      // These settings help the Tailwind CSS IntelliSense
      callees: ['cn', 'clsx', 'cva'],
      config: './tailwind.config.ts',
      cssFiles: [
        './app/globals.css',
        './styles/design-system.css',
        './styles/tokens/design-tokens.css',
      ],
      removeDuplicates: true,
      skipClassAttribute: false,
      tags: [], // Custom JSX tags that should be checked
      whitelist: [], // Classes to always allow
    },
  },
};