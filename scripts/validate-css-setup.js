#!/usr/bin/env node

/**
 * Validate Tailwind CSS v4 Setup
 * Ensures all configurations follow best practices
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function validateSetup() {
  console.log(`${colors.blue}🔍 Validating Tailwind CSS v4 Setup...${colors.reset}\n`);

  const checks = [];

  // Check 1: PostCSS config exists
  const postcssConfigs = [
    'postcss.config.mjs',
    'postcss.config.js',
    '.postcssrc.json'
  ];
  
  const postcssConfig = postcssConfigs.find(config => 
    fs.existsSync(path.join(process.cwd(), config))
  );
  
  checks.push({
    name: 'PostCSS Configuration',
    passed: !!postcssConfig,
    message: postcssConfig 
      ? `Found: ${postcssConfig}` 
      : 'No PostCSS config found'
  });

  // Check 2: Tailwind config exists
  const tailwindConfigs = [
    'tailwind.config.ts',
    'tailwind.config.js',
    'tailwind.config.mjs'
  ];
  
  const tailwindConfig = tailwindConfigs.find(config => 
    fs.existsSync(path.join(process.cwd(), config))
  );
  
  checks.push({
    name: 'Tailwind Configuration',
    passed: !!tailwindConfig,
    message: tailwindConfig 
      ? `Found: ${tailwindConfig}` 
      : 'No Tailwind config found'
  });

  // Check 3: Required dependencies
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
  );
  
  const requiredDeps = {
    'tailwindcss': '^4.0.0',
    '@tailwindcss/postcss': '*',
    'postcss': '*',
    'postcss-import': '*',
    'autoprefixer': '*'
  };
  
  const missingDeps = [];
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!allDeps[dep]) {
      missingDeps.push(dep);
    }
  }
  
  checks.push({
    name: 'Required Dependencies',
    passed: missingDeps.length === 0,
    message: missingDeps.length === 0 
      ? 'All required dependencies installed' 
      : `Missing: ${missingDeps.join(', ')}`
  });

  // Check 4: CSS import structure
  const cssFiles = [
    'app/globals.css',
    'app/globals.optimized.css',
    'styles/globals.css'
  ];
  
  let hasCorrectImport = false;
  let cssFile = null;
  
  for (const file of cssFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('@import "tailwindcss"') || content.includes("@import 'tailwindcss'")) {
        hasCorrectImport = true;
        cssFile = file;
        break;
      }
    }
  }
  
  checks.push({
    name: 'CSS Import Structure',
    passed: hasCorrectImport,
    message: hasCorrectImport 
      ? `Correct v4 import found in ${cssFile}` 
      : 'Using legacy @tailwind directives'
  });

  // Check 5: PostCSS plugins configuration
  if (postcssConfig) {
    const configContent = fs.readFileSync(
      path.join(process.cwd(), postcssConfig), 
      'utf-8'
    );
    
    const hasV4Plugin = configContent.includes('@tailwindcss/postcss');
    const hasOptimization = configContent.includes('cssnano') || 
                           configContent.includes('production');
    
    checks.push({
      name: 'PostCSS v4 Plugin',
      passed: hasV4Plugin,
      message: hasV4Plugin 
        ? 'Using @tailwindcss/postcss (v4)' 
        : 'Using legacy tailwindcss plugin'
    });
    
    checks.push({
      name: 'Production Optimization',
      passed: hasOptimization,
      message: hasOptimization 
        ? 'Production optimizations configured' 
        : 'No production optimizations found'
    });
  }

  // Check 6: Content configuration
  if (tailwindConfig) {
    const configContent = fs.readFileSync(
      path.join(process.cwd(), tailwindConfig), 
      'utf-8'
    );
    
    const hasContent = configContent.includes('content:');
    const contentPaths = [
      './app/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './lib/**/*.{js,ts,jsx,tsx,mdx}'
    ];
    
    checks.push({
      name: 'Content Configuration',
      passed: hasContent,
      message: hasContent 
        ? 'Content paths configured' 
        : 'Missing content configuration'
    });
  }

  // Print results
  console.log('Configuration Checks:\n');
  
  let allPassed = true;
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    const color = check.passed ? colors.green : colors.red;
    console.log(`${icon} ${color}${check.name}${colors.reset}: ${check.message}`);
    if (!check.passed) allPassed = false;
  });

  // Performance recommendations
  console.log(`\n${colors.blue}📊 Performance Recommendations:${colors.reset}\n`);
  
  const recommendations = [
    {
      title: 'Use CSS Layers',
      description: 'Organize styles with @layer for better cascade control',
      implemented: cssFile && fs.readFileSync(path.join(process.cwd(), cssFile), 'utf-8').includes('@layer')
    },
    {
      title: 'Enable JIT Mode',
      description: 'Tailwind v4 has JIT enabled by default',
      implemented: true
    },
    {
      title: 'Configure Purging',
      description: 'Content paths ensure unused styles are removed',
      implemented: checks.find(c => c.name === 'Content Configuration')?.passed
    },
    {
      title: 'Use Modern CSS Features',
      description: 'postcss-preset-env enables future CSS today',
      implemented: postcssConfig && fs.readFileSync(path.join(process.cwd(), postcssConfig), 'utf-8').includes('postcss-preset-env')
    }
  ];

  recommendations.forEach(rec => {
    const icon = rec.implemented ? '✅' : '💡';
    console.log(`${icon} ${rec.title}: ${rec.description}`);
  });

  // Summary
  console.log(`\n${colors.blue}📈 Summary:${colors.reset}\n`);
  
  if (allPassed) {
    console.log(`${colors.green}✨ Your Tailwind CSS v4 setup follows best practices!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  Some improvements needed for optimal setup.${colors.reset}`);
  }

  // Test CSS compilation
  console.log(`\n${colors.blue}🧪 Testing CSS Compilation...${colors.reset}\n`);
  
  try {
    await execAsync('npx tailwindcss --help');
    console.log(`${colors.green}✅ Tailwind CSS CLI is working${colors.reset}`);
    
    // Create a test CSS file
    const testCss = '@import "tailwindcss";';
    fs.writeFileSync('test-tailwind.css', testCss);
    
    try {
      const { stdout, stderr } = await execAsync('npx tailwindcss -i test-tailwind.css -o test-output.css');
      if (fs.existsSync('test-output.css')) {
        const outputSize = fs.statSync('test-output.css').size;
        console.log(`${colors.green}✅ CSS compilation successful (${(outputSize / 1024).toFixed(2)}KB)${colors.reset}`);
        
        // Clean up
        fs.unlinkSync('test-tailwind.css');
        fs.unlinkSync('test-output.css');
      }
    } catch (error) {
      console.log(`${colors.red}❌ CSS compilation failed: ${error.message}${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Tailwind CSS CLI not available${colors.reset}`);
  }

  console.log(`\n${colors.blue}📚 Documentation:${colors.reset}`);
  console.log('- Tailwind CSS v4 Docs: https://tailwindcss.com/docs');
  console.log('- PostCSS Docs: https://postcss.org/');
  console.log('- Best Practices: https://tailwindcss.com/docs/performance');
}

// Run validation
validateSetup().catch(console.error);