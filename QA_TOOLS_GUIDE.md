# Quality Assurance Tools Guide

## Quick Start

This guide provides instructions for using all quality assurance tools configured for the Strike Shop project.

## 1. Test Suites

### Running Tests
```bash
# Run all tests with coverage
npm run test:coverage

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:component     # Component tests only
npm run test:e2e          # End-to-end tests

# Watch mode for development
npm run test:watch:unit
npm run test:watch:component

# Debug tests
npm run test:debug
```

### Coverage Requirements
- Unit Tests: 90%+
- Integration Tests: 85%+
- Component Tests: 90%+
- Overall: 90%+

## 2. Performance Testing

### Lighthouse CI
```bash
# Run Lighthouse CI
npm run lighthouse

# View Lighthouse reports
npm run lighthouse:view
```

Configuration: `lighthouserc.js`
- Tests 5 key pages
- Requires 90% score in all categories
- Checks Core Web Vitals

### Load Testing with k6

```bash
# Install k6 (if not installed)
brew install k6  # macOS
# or
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6  # Ubuntu/Debian

# Run load tests
npm run load:test    # Normal load (100 users)
npm run load:stress  # Stress test (300 users)
npm run load:spike   # Spike test (500 users)
npm run load:api     # API performance test

# Run with custom settings
k6 run --vus 200 --duration 5m k6/load-test.js
```

### Performance Targets
- p95 response time < 500ms (normal load)
- p95 response time < 2000ms (stress load)
- Error rate < 10% (normal load)
- Error rate < 20% (spike load)

## 3. Security Testing

### npm Audit
```bash
# Check for vulnerabilities
npm run security:audit

# Auto-fix safe vulnerabilities
npm run security:fix

# Fix with breaking changes (careful!)
npm audit fix --force
```

### Security Checklist
- [ ] 0 high/critical vulnerabilities in production
- [ ] All API endpoints have rate limiting
- [ ] CSRF protection enabled
- [ ] Input validation on all forms
- [ ] Security headers configured

## 4. Accessibility Testing

### WCAG Validation
```bash
# Run accessibility validation
npm run wcag:validate

# Manual testing recommended with:
# - NVDA (Windows)
# - JAWS (Windows)  
# - VoiceOver (macOS)
# - Axe DevTools (Browser extension)
```

### Accessibility Requirements
- WCAG 2.1 Level AA compliance
- 0 critical violations
- Keyboard navigation support
- Screen reader compatibility
- Color contrast 4.5:1 (normal text)
- Color contrast 3:1 (large text)

## 5. Quality Gates

### Check All Quality Gates
```bash
npm run test:quality-gates
```

This verifies:
- Test coverage meets thresholds
- No failing tests
- Bundle size within limits
- Type coverage 100%

### Generate Quality Report
```bash
npm run quality:report
```

## 6. Continuous Integration

### Pre-commit Checks
```bash
# Run all checks before committing
npm run lint
npm run type-check
npm run test
```

### Pre-deployment Checklist
```bash
# 1. Run all tests
npm run test:all

# 2. Check security
npm run security:audit

# 3. Validate accessibility  
npm run wcag:validate

# 4. Run performance tests
npm run load:test

# 5. Build production bundle
npm run build

# 6. Analyze bundle size
npm run bundle:check
```

## 7. Monitoring Tools

### Development
- React Query DevTools (built-in)
- Redux DevTools (if using Redux)
- Web Vitals tracking (automatic)

### Production
- Lighthouse CI (automated)
- Real User Monitoring (RUM)
- Error tracking (configure Sentry)
- Performance monitoring

## 8. Troubleshooting

### Common Issues

**Tests failing with module errors**
```bash
# Clear Jest cache
jest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**MSW not working**
```bash
# Ensure MSW is properly installed
npm install msw@latest --save-dev
```

**Lighthouse CI fails**
```bash
# Ensure build is complete
npm run build

# Check if server starts properly
npm start
```

**k6 command not found**
Install k6 following instructions at https://k6.io/docs/getting-started/installation/

## 9. Best Practices

1. **Run tests before committing**
   - Use husky pre-commit hooks
   - Ensure all tests pass

2. **Monitor performance regularly**
   - Run Lighthouse CI on every PR
   - Track bundle size changes

3. **Keep dependencies updated**
   - Run security audits weekly
   - Update patches immediately

4. **Document test failures**
   - Create issues for flaky tests
   - Add comments explaining workarounds

5. **Maintain test data**
   - Use factories for consistent data
   - Clean up after tests

## 10. Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [k6 Documentation](https://k6.io/docs/)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

For questions or issues, please refer to the project documentation or contact the QA team.