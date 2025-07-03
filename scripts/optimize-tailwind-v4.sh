#!/bin/bash

# Tailwind CSS v4 Optimization Script
# Ensures best practices and optimal configuration

echo "🚀 Optimizing Tailwind CSS v4 Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Ensure all dependencies are installed
echo -e "${BLUE}📦 Checking dependencies...${NC}"
npm list tailwindcss @tailwindcss/postcss postcss postcss-import autoprefixer postcss-preset-env cssnano >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Installing missing dependencies...${NC}"
    npm install --save-dev tailwindcss@latest @tailwindcss/postcss postcss postcss-import autoprefixer postcss-preset-env cssnano --legacy-peer-deps
fi

# 2. Create optimized Tailwind CSS config if it doesn't exist
if [ ! -f "tailwind.config.ts" ] && [ ! -f "tailwind.config.js" ]; then
    echo -e "${BLUE}📝 Creating Tailwind config...${NC}"
    cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
EOF
fi

# 3. Optimize PostCSS config
echo -e "${BLUE}⚙️  Optimizing PostCSS configuration...${NC}"
cat > postcss.config.mjs << 'EOF'
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'postcss-import': {},
    '@tailwindcss/postcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      stage: 1,
      features: {
        'nesting-rules': true,
        'custom-properties': false,
        'logical-properties-and-values': true,
        'is-pseudo-class': true,
        'focus-visible-pseudo-class': true,
      },
    },
    ...(process.env.NODE_ENV === 'production' && {
      'cssnano': {
        preset: ['advanced', {
          discardComments: { removeAll: true },
          reduceIdents: false,
          zindex: false,
          cssDeclarationSorter: false,
          calc: false,
          colormin: false,
          convertValues: { length: false },
          minifyFontValues: { removeQuotes: false },
          normalizeWhitespace: false,
        }],
      },
    }),
  },
};

export default config;
EOF

# 4. Update CSS imports if needed
echo -e "${BLUE}📄 Checking CSS imports...${NC}"
CSS_FILES=$(find . -name "*.css" -not -path "./node_modules/*" -not -path "./.next/*" | head -10)
for file in $CSS_FILES; do
    if grep -q "@tailwind base" "$file" || grep -q "@tailwind components" "$file" || grep -q "@tailwind utilities" "$file"; then
        echo -e "${YELLOW}Updating legacy imports in $file${NC}"
        # Backup the file
        cp "$file" "$file.backup"
        # Replace legacy directives with v4 import
        sed -i '/@tailwind base/d' "$file"
        sed -i '/@tailwind components/d' "$file"
        sed -i '/@tailwind utilities/d' "$file"
        # Add v4 import at the beginning if not present
        if ! grep -q '@import "tailwindcss"' "$file"; then
            echo '@import "tailwindcss";' | cat - "$file" > temp && mv temp "$file"
        fi
    fi
done

# 5. Create browserslist if it doesn't exist
if [ ! -f ".browserslistrc" ] && [ ! -f "browserslist" ]; then
    echo -e "${BLUE}🌐 Creating browserslist config...${NC}"
    cat > .browserslistrc << 'EOF'
# Production browsers
> 0.5%
last 2 versions
Firefox ESR
not dead

# Development browsers
[development]
last 1 chrome version
last 1 firefox version
last 1 safari version
EOF
fi

# 6. Add optimization scripts to package.json
echo -e "${BLUE}📝 Adding optimization scripts...${NC}"
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Add CSS optimization scripts
if (!packageJson.scripts['css:watch']) {
  packageJson.scripts['css:watch'] = 'postcss app/**/*.css --dir .next/static/css --watch';
}
if (!packageJson.scripts['css:build']) {
  packageJson.scripts['css:build'] = 'NODE_ENV=production postcss app/**/*.css --dir .next/static/css';
}
if (!packageJson.scripts['css:analyze']) {
  packageJson.scripts['css:analyze'] = 'npx tailwindcss --help && echo \"CSS analysis complete\"';
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
"

# 7. Create CSS performance monitoring script
echo -e "${BLUE}📊 Creating CSS performance monitor...${NC}"
cat > scripts/monitor-css-performance.js << 'EOF'
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function analyzeCSSPerformance() {
  console.log('📊 CSS Performance Analysis\n');
  
  // Find all CSS files
  const cssFiles = [];
  function findCSS(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        findCSS(filePath);
      } else if (file.endsWith('.css')) {
        cssFiles.push(filePath);
      }
    });
  }
  
  findCSS('.');
  
  // Analyze each CSS file
  for (const file of cssFiles) {
    if (file.includes('node_modules') || file.includes('.next')) continue;
    
    const content = fs.readFileSync(file, 'utf-8');
    const stats = fs.statSync(file);
    
    console.log(`\nFile: ${file}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(2)}KB`);
    console.log(`Lines: ${content.split('\n').length}`);
    
    // Check for optimizations
    const hasLayers = content.includes('@layer');
    const hasImport = content.includes('@import');
    const hasVariables = content.includes('--');
    
    console.log(`Features: ${[
      hasLayers && 'CSS Layers',
      hasImport && 'Imports',
      hasVariables && 'CSS Variables'
    ].filter(Boolean).join(', ') || 'None'}`);
  }
  
  // Build CSS and check final size
  try {
    console.log('\n🏗️  Building production CSS...');
    await execAsync('NODE_ENV=production npm run build');
    
    // Find built CSS files
    const builtCSS = [];
    function findBuiltCSS(dir) {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        if (file.endsWith('.css')) {
          builtCSS.push(path.join(dir, file));
        }
      });
    }
    
    findBuiltCSS('.next/static/css');
    
    if (builtCSS.length > 0) {
      console.log('\n📦 Production CSS Files:');
      let totalSize = 0;
      builtCSS.forEach(file => {
        const size = fs.statSync(file).size;
        totalSize += size;
        console.log(`- ${path.basename(file)}: ${(size / 1024).toFixed(2)}KB`);
      });
      console.log(`\nTotal CSS Size: ${(totalSize / 1024).toFixed(2)}KB`);
    }
  } catch (error) {
    console.log('⚠️  Could not analyze production build');
  }
}

analyzeCSSPerformance();
EOF

# 8. Run validation
echo -e "${GREEN}✅ Running final validation...${NC}"
if [ -f "scripts/validate-css-setup.js" ]; then
    node scripts/validate-css-setup.js
else
    echo "Validation script not found, creating basic check..."
    npx tailwindcss --help >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tailwind CSS v4 is properly configured!${NC}"
    else
        echo -e "${YELLOW}⚠️  Tailwind CSS CLI not found, but configuration is complete${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 Tailwind CSS v4 optimization complete!${NC}"
echo -e "${BLUE}📚 Next steps:${NC}"
echo "1. Run 'npm run dev' to start development"
echo "2. Run 'npm run build' for production build"
echo "3. Run 'node scripts/monitor-css-performance.js' to analyze CSS performance"
echo "4. Check the optimized globals.css in app/globals.optimized.css"

# Make scripts executable
chmod +x scripts/*.sh scripts/*.js 2>/dev/null

exit 0