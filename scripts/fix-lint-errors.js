#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper function to process files
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix React unescaped entities
  const unescapedEntities = [
    { search: /(?<!\\)'/g, replace: "&apos;" },
    { search: /(?<!\\)"/g, replace: "&quot;" },
  ];

  // Only replace in JSX text content (not in attributes or JS code)
  const jsxTextRegex = />([^<]*)</g;
  content = content.replace(jsxTextRegex, (match, text) => {
    let newText = text;
    unescapedEntities.forEach(({ search, replace }) => {
      // Only replace if it's not inside a JS expression {}
      if (!text.includes('{')) {
        newText = newText.replace(search, replace);
      }
    });
    return `>${newText}<`;
  });

  if (content !== fs.readFileSync(filePath, 'utf8')) {
    modified = true;
  }

  // Remove console.log statements
  const consoleRegex = /^\s*console\.(log|error|warn|info|debug)\(.*?\);?\s*$/gm;
  const newContent = content.replace(consoleRegex, '');
  if (newContent !== content) {
    content = newContent;
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Get all TypeScript/JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const projectRoot = path.join(__dirname, '..');
const files = getAllFiles(path.join(projectRoot, 'app'));
const componentFiles = getAllFiles(path.join(projectRoot, 'components'));
const libFiles = getAllFiles(path.join(projectRoot, 'lib'));

[...files, ...componentFiles, ...libFiles].forEach(processFile);

console.log('Lint fixes completed!');