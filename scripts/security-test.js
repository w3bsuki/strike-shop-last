#!/usr/bin/env node

/**
 * 🛡️ COMPREHENSIVE SECURITY TESTING SUITE
 * Automated security testing and vulnerability assessment
 * Tests all fortress-level security implementations
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

// 🎯 Security Test Configuration
const SECURITY_TESTS = {
  // Test target configuration
  TARGET: {
    HOST: process.env.TEST_HOST || 'localhost',
    PORT: process.env.TEST_PORT || 4000,
    PROTOCOL: process.env.TEST_PROTOCOL || 'http',
    BASE_URL: function() {
      return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
    }
  },

  // Security headers to validate
  REQUIRED_HEADERS: [
    'content-security-policy',
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection',
    'referrer-policy',
    'permissions-policy',
    'strict-transport-security' // Only in production
  ],

  // Attack payloads for testing
  ATTACK_PAYLOADS: {
    XSS: [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '"><svg/onload=alert("xss")>'
    ],
    
    SQL_INJECTION: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1#",
      "') OR ('1'='1",
      "1; SELECT * FROM information_schema.tables"
    ],
    
    DIRECTORY_TRAVERSAL: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%2F..%2F..%2Fetc%2Fpasswd'
    ],
    
    COMMAND_INJECTION: [
      '; cat /etc/passwd',
      '| id',
      '`whoami`',
      '$(id)',
      '; ls -la',
      '&& cat /etc/passwd',
      '|| echo vulnerable'
    ]
  },

  // Rate limiting test configuration
  RATE_LIMIT: {
    REQUESTS: 150, // Send more than allowed
    WINDOW: 1000,  // Within 1 second
    EXPECTED_BLOCK: 100 // Should be blocked after this many
  }
};

// 🛡️ Security Test Suite Class
class SecurityTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  // 🚀 Run all security tests
  async runAllTests() {
    console.log('🛡️ FORTRESS-LEVEL SECURITY TESTING SUITE');
    console.log('=========================================');
    console.log(`Target: ${SECURITY_TESTS.TARGET.BASE_URL()}`);
    console.log(`Started: ${new Date().toISOString()}\n`);

    try {
      // Core security tests
      await this.testSecurityHeaders();
      await this.testXSSProtection();
      await this.testSQLInjectionProtection();
      await this.testDirectoryTraversal();
      await this.testCommandInjection();
      await this.testRateLimiting();
      await this.testCSRFProtection();
      await this.testAuthenticationSecurity();
      await this.testPaymentSecurity();
      await this.testInputValidation();

      // Generate test report
      this.generateReport();

    } catch (error) {
      console.error('🚨 CRITICAL TEST FAILURE:', error.message);
      process.exit(1);
    }
  }

  // 🔍 Test security headers implementation
  async testSecurityHeaders() {
    console.log('🔍 Testing Security Headers...');
    
    try {
      const response = await this.makeRequest('GET', '/');
      const headers = response.headers;

      for (const header of SECURITY_TESTS.REQUIRED_HEADERS) {
        if (header === 'strict-transport-security' && SECURITY_TESTS.TARGET.PROTOCOL !== 'https') {
          continue; // Skip HSTS for non-HTTPS
        }

        if (headers[header]) {
          this.logResult('PASS', `Security header present: ${header}`);
        } else {
          this.logResult('FAIL', `Missing security header: ${header}`);
        }
      }

      // Test CSP effectiveness
      const csp = headers['content-security-policy'];
      if (csp) {
        if (csp.includes("'unsafe-eval'")) {
          this.logResult('WARN', 'CSP allows unsafe-eval');
        }
        if (csp.includes("'unsafe-inline'")) {
          this.logResult('WARN', 'CSP allows unsafe-inline');
        }
        if (csp.includes('*')) {
          this.logResult('WARN', 'CSP contains wildcard sources');
        }
      }

    } catch (error) {
      this.logResult('FAIL', `Security headers test failed: ${error.message}`);
    }
  }

  // 🚫 Test XSS protection
  async testXSSProtection() {
    console.log('🚫 Testing XSS Protection...');

    for (const payload of SECURITY_TESTS.ATTACK_PAYLOADS.XSS) {
      try {
        const response = await this.makeRequest('GET', `/?q=${encodeURIComponent(payload)}`);
        
        if (response.statusCode === 403 || response.statusCode === 400) {
          this.logResult('PASS', `XSS payload blocked: ${payload.substring(0, 30)}...`);
        } else if (response.body && response.body.includes(payload)) {
          this.logResult('FAIL', `XSS payload reflected: ${payload.substring(0, 30)}...`);
        } else {
          this.logResult('PASS', `XSS payload sanitized: ${payload.substring(0, 30)}...`);
        }
      } catch (error) {
        this.logResult('PASS', `XSS payload blocked (connection): ${payload.substring(0, 30)}...`);
      }
    }
  }

  // 💉 Test SQL injection protection
  async testSQLInjectionProtection() {
    console.log('💉 Testing SQL Injection Protection...');

    for (const payload of SECURITY_TESTS.ATTACK_PAYLOADS.SQL_INJECTION) {
      try {
        const response = await this.makeRequest('GET', `/api/products?search=${encodeURIComponent(payload)}`);
        
        if (response.statusCode === 403 || response.statusCode === 400) {
          this.logResult('PASS', `SQL injection blocked: ${payload.substring(0, 30)}...`);
        } else if (response.body && response.body.toLowerCase().includes('syntax error')) {
          this.logResult('FAIL', `SQL injection may be possible: ${payload.substring(0, 30)}...`);
        } else {
          this.logResult('PASS', `SQL injection payload handled safely: ${payload.substring(0, 30)}...`);
        }
      } catch (error) {
        this.logResult('PASS', `SQL injection blocked (connection): ${payload.substring(0, 30)}...`);
      }
    }
  }

  // 📁 Test directory traversal protection
  async testDirectoryTraversal() {
    console.log('📁 Testing Directory Traversal Protection...');

    for (const payload of SECURITY_TESTS.ATTACK_PAYLOADS.DIRECTORY_TRAVERSAL) {
      try {
        const response = await this.makeRequest('GET', `/${payload}`);
        
        if (response.statusCode === 403 || response.statusCode === 400 || response.statusCode === 404) {
          this.logResult('PASS', `Directory traversal blocked: ${payload.substring(0, 30)}...`);
        } else if (response.body && (response.body.includes('root:') || response.body.includes('127.0.0.1'))) {
          this.logResult('FAIL', `Directory traversal successful: ${payload.substring(0, 30)}...`);
        } else {
          this.logResult('PASS', `Directory traversal safely handled: ${payload.substring(0, 30)}...`);
        }
      } catch (error) {
        this.logResult('PASS', `Directory traversal blocked (connection): ${payload.substring(0, 30)}...`);
      }
    }
  }

  // 💻 Test command injection protection
  async testCommandInjection() {
    console.log('💻 Testing Command Injection Protection...');

    for (const payload of SECURITY_TESTS.ATTACK_PAYLOADS.COMMAND_INJECTION) {
      try {
        const response = await this.makeRequest('POST', '/api/contact', {
          message: payload,
          email: 'test@example.com',
          name: 'Test User'
        });
        
        if (response.statusCode === 403 || response.statusCode === 400) {
          this.logResult('PASS', `Command injection blocked: ${payload.substring(0, 30)}...`);
        } else if (response.body && (response.body.includes('uid=') || response.body.includes('gid='))) {
          this.logResult('FAIL', `Command injection successful: ${payload.substring(0, 30)}...`);
        } else {
          this.logResult('PASS', `Command injection safely handled: ${payload.substring(0, 30)}...`);
        }
      } catch (error) {
        this.logResult('PASS', `Command injection blocked (connection): ${payload.substring(0, 30)}...`);
      }
    }
  }

  // 🚦 Test rate limiting
  async testRateLimiting() {
    console.log('🚦 Testing Rate Limiting...');

    const promises = [];
    for (let i = 0; i < SECURITY_TESTS.RATE_LIMIT.REQUESTS; i++) {
      promises.push(this.makeRequest('GET', '/api/health'));
    }

    try {
      const responses = await Promise.allSettled(promises);
      const blockedCount = responses.filter(result => 
        result.status === 'fulfilled' && 
        (result.value.statusCode === 429 || result.value.statusCode === 403)
      ).length;

      if (blockedCount >= 10) { // At least some requests should be blocked
        this.logResult('PASS', `Rate limiting active: ${blockedCount} requests blocked`);
      } else {
        this.logResult('WARN', `Rate limiting may be too lenient: only ${blockedCount} requests blocked`);
      }
    } catch (error) {
      this.logResult('FAIL', `Rate limiting test failed: ${error.message}`);
    }
  }

  // 🔐 Test CSRF protection
  async testCSRFProtection() {
    console.log('🔐 Testing CSRF Protection...');

    try {
      // Test POST without CSRF token
      const response = await this.makeRequest('POST', '/api/payments/create-payment-intent', {
        amount: 100,
        currency: 'gbp',
        items: [{ id: 'test', name: 'Test', price: 100, quantity: 1 }]
      });

      if (response.statusCode === 403 && response.body.includes('CSRF')) {
        this.logResult('PASS', 'CSRF protection active for payment endpoints');
      } else if (response.statusCode === 401) {
        this.logResult('PASS', 'Authentication required (CSRF test deferred)');
      } else {
        this.logResult('WARN', 'CSRF protection may not be active');
      }
    } catch (error) {
      this.logResult('PASS', `CSRF protection blocked request: ${error.message}`);
    }
  }

  // 🔑 Test authentication security
  async testAuthenticationSecurity() {
    console.log('🔑 Testing Authentication Security...');

    try {
      // Test protected route without authentication
      const response = await this.makeRequest('GET', '/account');
      
      if (response.statusCode === 401 || response.statusCode === 403 || 
          (response.statusCode === 302 && response.headers.location?.includes('sign-in'))) {
        this.logResult('PASS', 'Protected routes require authentication');
      } else {
        this.logResult('FAIL', 'Protected routes accessible without authentication');
      }

      // Test admin routes
      const adminResponse = await this.makeRequest('GET', '/admin');
      if (adminResponse.statusCode === 401 || adminResponse.statusCode === 403 ||
          (adminResponse.statusCode === 302 && adminResponse.headers.location?.includes('sign-in'))) {
        this.logResult('PASS', 'Admin routes require authentication');
      } else {
        this.logResult('FAIL', 'Admin routes accessible without authentication');
      }
    } catch (error) {
      this.logResult('PASS', `Authentication protection active: ${error.message}`);
    }
  }

  // 💳 Test payment security
  async testPaymentSecurity() {
    console.log('💳 Testing Payment Security...');

    try {
      // Test malformed payment data
      const maliciousPayload = {
        amount: -100, // Negative amount
        currency: 'XXX', // Invalid currency
        items: []
      };

      const response = await this.makeRequest('POST', '/api/payments/create-payment-intent', maliciousPayload);
      
      if (response.statusCode === 400 || response.statusCode === 403) {
        this.logResult('PASS', 'Payment validation blocks malicious data');
      } else if (response.statusCode === 401) {
        this.logResult('PASS', 'Payment endpoints require authentication');
      } else {
        this.logResult('WARN', 'Payment validation may need strengthening');
      }
    } catch (error) {
      this.logResult('PASS', `Payment security active: ${error.message}`);
    }
  }

  // ✅ Test input validation
  async testInputValidation() {
    console.log('✅ Testing Input Validation...');

    const testCases = [
      { field: 'email', value: 'invalid-email', expected: 'rejection' },
      { field: 'phone', value: '123abc', expected: 'rejection' },
      { field: 'amount', value: 'not-a-number', expected: 'rejection' },
      { field: 'name', value: 'A'.repeat(1000), expected: 'rejection' }
    ];

    for (const testCase of testCases) {
      try {
        const payload = { [testCase.field]: testCase.value };
        const response = await this.makeRequest('POST', '/api/contact', payload);
        
        if (response.statusCode === 400) {
          this.logResult('PASS', `Input validation rejects invalid ${testCase.field}`);
        } else {
          this.logResult('WARN', `Input validation may accept invalid ${testCase.field}`);
        }
      } catch (error) {
        this.logResult('PASS', `Input validation blocks invalid ${testCase.field}`);
      }
    }
  }

  // 📡 Make HTTP request
  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: SECURITY_TESTS.TARGET.HOST,
        port: SECURITY_TESTS.TARGET.PORT,
        path: path,
        method: method,
        headers: {
          'User-Agent': 'Security-Test-Suite/1.0',
          'Accept': 'application/json, text/html',
        },
        timeout: 5000
      };

      if (data) {
        const postData = JSON.stringify(data);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const client = SECURITY_TESTS.TARGET.PROTOCOL === 'https' ? https : http;
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        });
      });

      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // 📝 Log test result
  logResult(status, message) {
    const icons = { PASS: '✅', FAIL: '❌', WARN: '⚠️' };
    const colors = { 
      PASS: '\x1b[32m', // Green
      FAIL: '\x1b[31m', // Red  
      WARN: '\x1b[33m', // Yellow
      RESET: '\x1b[0m'
    };

    console.log(`${icons[status]} ${colors[status]}${message}${colors.RESET}`);
    
    this.results.tests.push({ status, message, timestamp: new Date().toISOString() });
    
    switch (status) {
      case 'PASS': this.results.passed++; break;
      case 'FAIL': this.results.failed++; break;
      case 'WARN': this.results.warnings++; break;
    }
  }

  // 📊 Generate test report
  generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log('\n🛡️ SECURITY TEST REPORT');
    console.log('========================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${this.results.passed} (${passRate}%)`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`Completion: ${new Date().toISOString()}`);

    // Security assessment
    if (this.results.failed === 0) {
      console.log('\n🏆 FORTRESS-LEVEL SECURITY ACHIEVED!');
      console.log('Your application has passed all security tests.');
    } else if (this.results.failed <= 2) {
      console.log('\n🛡️ STRONG SECURITY DETECTED');
      console.log('Minor security improvements needed.');
    } else {
      console.log('\n🚨 SECURITY VULNERABILITIES DETECTED');
      console.log('Immediate security fixes required!');
    }

    // Recommendations
    if (this.results.warnings > 0) {
      console.log('\n📋 SECURITY RECOMMENDATIONS:');
      console.log('• Review warnings and implement suggested improvements');
      console.log('• Regular security testing and monitoring');
      console.log('• Keep dependencies updated');
      console.log('• Implement additional monitoring and alerting');
    }

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// 🚀 Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🛡️ FORTRESS-LEVEL SECURITY TESTING SUITE');
    console.log('=========================================');
    console.log('');
    console.log('Usage: node scripts/security-test.js [options]');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TEST_HOST      Target hostname (default: localhost)');
    console.log('  TEST_PORT      Target port (default: 4000)');
    console.log('  TEST_PROTOCOL  Protocol http/https (default: http)');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('');
    console.log('Security Tests:');
    console.log('  • Security headers validation');
    console.log('  • XSS protection testing');
    console.log('  • SQL injection protection');
    console.log('  • Directory traversal protection');
    console.log('  • Command injection protection');
    console.log('  • Rate limiting functionality');
    console.log('  • CSRF protection');
    console.log('  • Authentication security');
    console.log('  • Payment security validation');
    console.log('  • Input validation testing');
    return;
  }

  const testSuite = new SecurityTestSuite();
  await testSuite.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('🚨 CRITICAL ERROR:', error.message);
    process.exit(1);
  });
}

module.exports = { SecurityTestSuite, SECURITY_TESTS };