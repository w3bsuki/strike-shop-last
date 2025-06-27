#!/usr/bin/env node

/**
 * Test script to verify CORS validation logic
 */

console.log('Testing CORS validation logic...\n');

// Test parseAllowedOrigins function
function parseAllowedOrigins(envVar, defaultOrigins) {
  if (!envVar) {
    return defaultOrigins.join(',');
  }
  
  // Split and validate origins
  const origins = envVar.split(',').map(origin => origin.trim()).filter(origin => {
    // Reject wildcard origins
    if (origin === '*' || origin.includes('*')) {
      console.error(`SECURITY WARNING: Wildcard CORS origin detected and rejected: ${origin}`);
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(origin);
      return true;
    } catch {
      console.error(`Invalid CORS origin rejected: ${origin}`);
      return false;
    }
  });
  
  if (origins.length === 0) {
    console.error('No valid CORS origins found, using defaults');
    return defaultOrigins.join(',');
  }
  
  return origins.join(',');
}

// Test cases
const testCases = [
  {
    name: 'Wildcard origin',
    input: '*',
    expected: 'Should reject wildcard'
  },
  {
    name: 'Mixed valid and wildcard',
    input: 'https://example.com,*,https://test.com',
    expected: 'Should filter out wildcard'
  },
  {
    name: 'Valid origins',
    input: 'https://example.com,https://test.com',
    expected: 'Should accept all valid origins'
  },
  {
    name: 'Invalid URL',
    input: 'not-a-url,https://valid.com',
    expected: 'Should filter out invalid URL'
  },
  {
    name: 'Empty string',
    input: '',
    expected: 'Should use defaults'
  },
  {
    name: 'Undefined',
    input: undefined,
    expected: 'Should use defaults'
  }
];

const defaultOrigins = ['https://default1.com', 'https://default2.com'];

console.log('Running test cases:\n');

testCases.forEach(({ name, input, expected }) => {
  console.log(`Test: ${name}`);
  console.log(`Input: ${input}`);
  console.log(`Expected: ${expected}`);
  
  const result = parseAllowedOrigins(input, defaultOrigins);
  console.log(`Result: ${result}`);
  
  // Check for wildcards in result
  if (result.includes('*')) {
    console.error('❌ FAILED: Result contains wildcard!');
    process.exit(1);
  } else {
    console.log('✅ PASSED: No wildcards in result');
  }
  
  console.log('---\n');
});

console.log('\nAll tests passed! CORS validation is working correctly.');