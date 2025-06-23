#!/usr/bin/env node

/**
 * Fix Remaining TypeScript Errors
 * Handles undefined safety and unused variables
 */

const fs = require('fs');
const path = require('path');

// Function to apply multiple replacements to a file
function fixFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  replacements.forEach(({ find, replace, description }) => {
    const regex = typeof find === 'string' ? new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : find;
    if (content.match(regex)) {
      content = content.replace(regex, replace);
      modified = true;
      console.log(`✓ ${filePath}: ${description}`);
    }
  });

  if (modified) {
    fs.writeFileSync(fullPath, content);
  }
}

// Fix admin products page
fixFile('app/admin/products/page.tsx', [
  {
    find: /product\.name/g,
    replace: '(product.name ?? "")',
    description: 'Fixed product.name undefined access'
  },
  {
    find: /a\.name/g,
    replace: '(a.name ?? "")',
    description: 'Fixed a.name undefined access in sort'
  },
  {
    find: /setSelectedProduct\(product\.id\)/g,
    replace: 'setSelectedProduct(product.id ?? null)',
    description: 'Fixed setSelectedProduct undefined'
  },
  {
    find: /setDeleteProduct\(product\.id\)/g,
    replace: 'setDeleteProduct(product.id ?? null)',
    description: 'Fixed setDeleteProduct undefined'
  },
  {
    find: /name: formData\.get\('name'\) as string,/g,
    replace: 'name: (formData.get("name") as string) ?? "",',
    description: 'Fixed form data string conversion'
  }
]);

// Fix admin users page
fixFile('app/admin/users/page.tsx', [
  {
    find: /\$\{firstName\}\s+\$\{lastName\}/g,
    replace: '${firstName ?? ""} ${lastName ?? ""}',
    description: 'Fixed firstName/lastName undefined'
  },
  {
    find: /setSelectedUser\(user\.id\)/g,
    replace: 'setSelectedUser(user.id ?? null)',
    description: 'Fixed setSelectedUser undefined'
  },
  {
    find: /role === 'admin'/g,
    replace: '(role ?? "") === "admin"',
    description: 'Fixed role undefined comparison'
  },
  {
    find: /user\.role === 'admin'/g,
    replace: '(user.role ?? "") === "admin"',
    description: 'Fixed user.role undefined comparison'
  }
]);

// Fix analytics routes (remove unused variables)
fixFile('app/api/analytics/errors/route.ts', [
  {
    find: /const\s+sendToSentry\s*=\s*\(errorData:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const sendToSentry = (errorData: any) => { /* TODO: Implement Sentry integration */ };',
    description: 'Commented out unused sendToSentry'
  },
  {
    find: /const\s+sendToDataDog\s*=\s*\(errorData:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const sendToDataDog = (errorData: any) => { /* TODO: Implement DataDog integration */ };',
    description: 'Commented out unused sendToDataDog'
  },
  {
    find: /const\s+sendToCustomMonitoring\s*=\s*\(errorData:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const sendToCustomMonitoring = (errorData: any) => { /* TODO: Implement custom monitoring */ };',
    description: 'Commented out unused sendToCustomMonitoring'
  },
  {
    find: /const\s+storeErrorInDatabase\s*=\s*\(errorData:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const storeErrorInDatabase = (errorData: any) => { /* TODO: Implement database storage */ };',
    description: 'Commented out unused storeErrorInDatabase'
  }
]);

fixFile('app/api/analytics/web-vitals/route.ts', [
  {
    find: /const\s+sendToGA4\s*=\s*\(data:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const sendToGA4 = (data: any) => { /* TODO: Implement GA4 integration */ };',
    description: 'Commented out unused sendToGA4'
  },
  {
    find: /const\s+sendToCustomAnalytics\s*=\s*\(data:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const sendToCustomAnalytics = (data: any) => { /* TODO: Implement custom analytics */ };',
    description: 'Commented out unused sendToCustomAnalytics'
  },
  {
    find: /const\s+storeInDatabase\s*=\s*\(data:\s*any\)\s*=>\s*\{[^}]+\};/g,
    replace: '// const storeInDatabase = (data: any) => { /* TODO: Implement database storage */ };',
    description: 'Commented out unused storeInDatabase'
  }
]);

console.log('\n✅ TypeScript error fixes completed!');