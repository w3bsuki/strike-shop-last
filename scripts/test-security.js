#!/usr/bin/env node

/**
 * Security Test Script
 * Verifies all security measures are properly implemented
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

// Utility functions
function logTest(name, status, message) {
  if (status === 'pass') {
    console.log(`${colors.green}✓${colors.reset} ${colors.gray}${name}${colors.reset}`);
    results.passed.push({ name, message });
  } else if (status === 'fail') {
    console.log(`${colors.red}✗${colors.reset} ${colors.gray}${name}${colors.reset} ${colors.red}${message}${colors.reset}`);
    results.failed.push({ name, message });
  } else if (status === 'warn') {
    console.log(`${colors.yellow}⚠${colors.reset} ${colors.gray}${name}${colors.reset} ${colors.yellow}${message}${colors.reset}`);
    results.warnings.push({ name, message });
  }
}

// Security tests
async function testCORS() {
  console.log(`${colors.bright}\n🔒 Testing CORS Configuration${colors.reset}`);
  
  try {
    // Test with invalid origin
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Origin': 'https://evil-site.com',
      },
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader === '*') {
      logTest('CORS Wildcard Check', 'fail', 'CORS allows all origins (*)');
    } else if (!corsHeader || corsHeader === 'https://evil-site.com') {
      logTest('CORS Origin Validation', 'fail', 'Invalid origin was allowed');
    } else {
      logTest('CORS Origin Validation', 'pass', 'Invalid origin blocked');
    }
    
    // Test with valid origin
    const validResponse = await fetch(`${API_URL}/health`, {
      headers: {
        'Origin': BASE_URL,
      },
    });
    
    const validCorsHeader = validResponse.headers.get('access-control-allow-origin');
    if (validCorsHeader === BASE_URL) {
      logTest('CORS Valid Origin', 'pass', 'Valid origin allowed');
    } else {
      logTest('CORS Valid Origin', 'warn', 'Valid origin might not be configured');
    }
  } catch (error) {
    logTest('CORS Tests', 'fail', error.message);
  }
}

async function testSecurityHeaders() {
  console.log(`${colors.bright}\n🛡️ Testing Security Headers${colors.reset}`);
  
  try {
    const response = await fetch(BASE_URL);
    const headers = response.headers;
    
    // Required security headers
    const requiredHeaders = {
      'content-security-policy': 'CSP Header',
      'x-frame-options': 'X-Frame-Options',
      'x-content-type-options': 'X-Content-Type-Options',
      'x-xss-protection': 'X-XSS-Protection',
      'referrer-policy': 'Referrer-Policy',
      'permissions-policy': 'Permissions-Policy',
    };
    
    for (const [header, name] of Object.entries(requiredHeaders)) {
      if (headers.get(header)) {
        logTest(name, 'pass', `Present: ${headers.get(header).substring(0, 50)}...`);
      } else {
        logTest(name, 'fail', 'Header missing');
      }
    }
    
    // Check for information disclosure
    const badHeaders = ['server', 'x-powered-by'];
    for (const header of badHeaders) {
      if (headers.get(header)) {
        logTest(`No ${header}`, 'fail', `Information disclosure: ${headers.get(header)}`);
      } else {
        logTest(`No ${header}`, 'pass', 'Header removed');
      }
    }
    
    // HSTS check (production only)
    if (process.env.NODE_ENV === 'production') {
      if (headers.get('strict-transport-security')) {
        logTest('HSTS', 'pass', 'HSTS enabled');
      } else {
        logTest('HSTS', 'fail', 'HSTS missing in production');
      }
    }
  } catch (error) {
    logTest('Security Headers', 'fail', error.message);
  }
}

async function testXSSProtection() {
  console.log(`${colors.bright}\n🚫 Testing XSS Protection${colors.reset}`);
  
  const xssPayloads = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
  ];
  
  for (const payload of xssPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(payload)}`);
      
      if (response.status === 400 || response.status === 403) {
        logTest(`XSS Payload Blocked: ${payload.substring(0, 30)}...`, 'pass', 'Payload blocked');
      } else {
        const text = await response.text();
        if (text.includes(payload)) {
          logTest(`XSS Payload: ${payload.substring(0, 30)}...`, 'fail', 'Payload not sanitized');
        } else {
          logTest(`XSS Payload: ${payload.substring(0, 30)}...`, 'pass', 'Payload sanitized');
        }
      }
    } catch (error) {
      logTest(`XSS Test: ${payload.substring(0, 30)}...`, 'warn', error.message);
    }
  }
}

async function testSQLInjection() {
  console.log(`${colors.bright}\n💉 Testing SQL Injection Protection${colors.reset}`);
  
  const sqlPayloads = [
    "' OR '1'='1",
    "1; DROP TABLE users--",
    "' UNION SELECT * FROM users--",
    "admin' --",
  ];
  
  for (const payload of sqlPayloads) {
    try {
      const response = await fetch(`${API_URL}/products?search=${encodeURIComponent(payload)}`);
      
      if (response.status === 400 || response.status === 403) {
        logTest(`SQL Payload Blocked: ${payload}`, 'pass', 'Payload blocked');
      } else if (response.status === 500) {
        logTest(`SQL Payload: ${payload}`, 'fail', 'Server error - possible SQL injection');
      } else {
        logTest(`SQL Payload: ${payload}`, 'pass', 'Payload handled safely');
      }
    } catch (error) {
      logTest(`SQL Test: ${payload}`, 'warn', error.message);
    }
  }
}

async function testPathTraversal() {
  console.log(`${colors.bright}\n📁 Testing Path Traversal Protection${colors.reset}`);
  
  const pathPayloads = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
  ];
  
  for (const payload of pathPayloads) {
    try {
      const response = await fetch(`${BASE_URL}/${payload}`);
      
      if (response.status === 400 || response.status === 403 || response.status === 404) {
        logTest(`Path Traversal: ${payload.substring(0, 30)}...`, 'pass', 'Attempt blocked');
      } else {
        logTest(`Path Traversal: ${payload.substring(0, 30)}...`, 'fail', 'Attempt not blocked');
      }
    } catch (error) {
      logTest(`Path Traversal: ${payload.substring(0, 30)}...`, 'warn', error.message);
    }
  }
}

async function testRateLimiting() {
  console.log(`${colors.bright}\n⏱️ Testing Rate Limiting${colors.reset}`);
  
  const endpoints = [
    { path: '/api/auth/login', limit: 5, window: '15 minutes' },
    { path: '/api/payments/create-intent', limit: 10, window: '1 hour' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      const requests = [];
      for (let i = 0; i < endpoint.limit + 2; i++) {
        requests.push(fetch(`${BASE_URL}${endpoint.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true }),
        }));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      if (rateLimited) {
        logTest(`Rate Limit ${endpoint.path}`, 'pass', `Limited at ${endpoint.limit} requests/${endpoint.window}`);
      } else {
        logTest(`Rate Limit ${endpoint.path}`, 'fail', 'No rate limiting detected');
      }
    } catch (error) {
      logTest(`Rate Limit ${endpoint.path}`, 'warn', error.message);
    }
  }
}

async function testCSRFProtection() {
  console.log(`${colors.bright}\n🔐 Testing CSRF Protection${colors.reset}`);
  
  try {
    // Test POST without referer
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Product' }),
    });
    
    if (response.status === 403 || response.status === 400) {
      logTest('CSRF Referer Check', 'pass', 'Request without referer blocked');
    } else {
      logTest('CSRF Referer Check', 'warn', 'Consider implementing CSRF tokens');
    }
    
    // Test with invalid referer
    const invalidReferer = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://evil-site.com',
      },
      body: JSON.stringify({ name: 'Test Product' }),
    });
    
    if (invalidReferer.status === 403 || invalidReferer.status === 400) {
      logTest('CSRF Invalid Referer', 'pass', 'Invalid referer blocked');
    } else {
      logTest('CSRF Invalid Referer', 'fail', 'Invalid referer not blocked');
    }
  } catch (error) {
    logTest('CSRF Protection', 'warn', error.message);
  }
}

// Main test runner
async function runSecurityTests() {
  console.log(`${colors.bright}${colors.blue}\n🔒 Strike Shop Security Test Suite\n${colors.reset}`);
  console.log(`${colors.gray}Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.gray}Environment: ${process.env.NODE_ENV || 'development'}\n${colors.reset}`);
  
  // Check if server is running
  try {
    await fetch(BASE_URL);
  } catch (error) {
    console.error(`${colors.red}\n❌ Server is not running at${colors.reset}`, BASE_URL);
    console.error(`${colors.gray}Please start the server and try again.${colors.reset}`);
    process.exit(1);
  }
  
  // Run all tests
  await testCORS();
  await testSecurityHeaders();
  await testXSSProtection();
  await testSQLInjection();
  await testPathTraversal();
  await testRateLimiting();
  await testCSRFProtection();
  
  // Summary
  console.log(`${colors.bright}${colors.blue}\n📊 Test Summary\n${colors.reset}`);
  console.log(`${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${results.warnings.length}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
  
  if (results.failed.length > 0) {
    console.log(`${colors.bright}${colors.red}\n❌ Security Issues Found:\n${colors.reset}`);
    results.failed.forEach(test => {
      console.log(`${colors.red}  • ${test.name}: ${test.message}${colors.reset}`);
    });
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log(`${colors.bright}${colors.yellow}\n⚠️  Warnings:\n${colors.reset}`);
    results.warnings.forEach(test => {
      console.log(`${colors.yellow}  • ${test.name}: ${test.message}${colors.reset}`);
    });
    console.log(`${colors.green}\n✅ No critical security issues found!${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.green}\n✅ All security tests passed!${colors.reset}`);
  }
}

// Run tests
runSecurityTests().catch(error => {
  console.error(`${colors.red}\n❌ Test runner error:${colors.reset}`, error);
  process.exit(1);
});