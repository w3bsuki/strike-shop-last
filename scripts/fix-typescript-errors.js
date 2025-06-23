#!/usr/bin/env node

/**
 * Comprehensive TypeScript Error Fixer
 * Fixes common TypeScript errors in bulk for production build
 */

const fs = require('fs');
const path = require('path');

// Files and their fixes
const fixes = [
  {
    file: 'app/[category]/page.tsx',
    fixes: [
      {
        find: /process\.env\.NEXT_PUBLIC_SITE_URL/g,
        replace: "process.env['NEXT_PUBLIC_SITE_URL']"
      },
      {
        find: /originalPrice:\s*string\s*\|\s*undefined/g,
        replace: 'originalPrice?: string'
      },
      {
        find: /discount:\s*string\s*\|\s*undefined/g,
        replace: 'discount?: string'
      }
    ]
  },
  {
    file: 'app/account/page.tsx',
    fixes: [
      {
        find: /const\s+_orders\s*=/g,
        replace: 'const orders ='
      }
    ]
  },
  {
    file: 'app/admin/products/page.tsx',
    fixes: [
      {
        find: /product\.name\!/g,
        replace: '(product.name ?? "")'
      },
      {
        find: /a\.name\!/g,
        replace: '(a.name ?? "")'
      },
      {
        find: /\.localeCompare\(b\.name\)/g,
        replace: '.localeCompare(b.name ?? "")'
      },
      {
        find: /setSelectedProduct\(product\.id\)/g,
        replace: 'setSelectedProduct(product.id ?? null)'
      },
      {
        find: /setDeleteProduct\(product\.id\)/g,
        replace: 'setDeleteProduct(product.id ?? null)'
      }
    ]
  },
  {
    file: 'app/admin/users/page.tsx',
    fixes: [
      {
        find: /\$\{firstName\}\s+\$\{lastName\}/g,
        replace: '${firstName ?? ""} ${lastName ?? ""}'
      },
      {
        find: /setSelectedUser\(user\.id\)/g,
        replace: 'setSelectedUser(user.id ?? null)'
      },
      {
        find: /role\s*===\s*'admin'/g,
        replace: '(role ?? "") === "admin"'
      },
      {
        find: /user\.role\s*===\s*'admin'/g,
        replace: '(user.role ?? "") === "admin"'
      }
    ]
  },
  {
    file: 'types/integrated.ts',
    fixes: [
      {
        find: /export\s+type\s+MedusaPrice\s*=.+;/g,
        replace: '// Removed unused MedusaPrice type'
      },
      {
        find: /export\s+type\s+CategoryId\s*=.+;/g,
        replace: '// Removed unused CategoryId type'
      }
    ]
  }
];

// Function to apply fixes to a file
function applyFixesToFile(filePath, fileFixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  fileFixes.forEach(fix => {
    if (content.match(fix.find)) {
      content = content.replace(fix.find, fix.replace);
      modified = true;
      console.log(`Applied fix to ${filePath}: ${fix.find} -> ${fix.replace}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  }
}

// Apply all fixes
console.log('Applying TypeScript fixes...');

fixes.forEach(({ file, fixes: fileFixes }) => {
  applyFixesToFile(file, fileFixes);
});

console.log('TypeScript fixes completed!');