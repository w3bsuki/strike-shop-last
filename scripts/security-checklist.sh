#!/bin/bash

# Strike Shop Security Checklist Script
# Run this before every production deployment

echo "🔒 Strike Shop Production Security Checklist"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check a condition
check() {
    local description="$1"
    local command="$2"
    local severity="${3:-error}" # error or warning
    
    echo -n "Checking: $description... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        if [ "$severity" = "warning" ]; then
            echo -e "${YELLOW}⚠ WARNING${NC}"
            ((WARNINGS++))
            return 1
        else
            echo -e "${RED}✗ FAILED${NC}"
            ((FAILED++))
            return 1
        fi
    fi
}

echo "1. SECRET MANAGEMENT"
echo "-------------------"
check "No hardcoded secrets in code" "! grep -r 'temporary_.*secret' --include='*.js' --include='*.ts' --exclude-dir=node_modules ."
check "Environment variables are set" "[ -n \"\$JWT_SECRET\" ] && [ -n \"\$COOKIE_SECRET\" ]"
check ".env files are gitignored" "grep -q '.env' .gitignore"
check "No .env files in repository" "! find . -name '.env*' -not -path './node_modules/*' -not -name '.env.example' | grep -q '.'"

echo ""
echo "2. CORS CONFIGURATION"
echo "--------------------"
check "CORS not using wildcard (*)" "! grep -q 'Cors:.*\"\\*\"' medusa-config.js"
check "Production CORS variables set" "[ -n \"\$STORE_CORS\" ] && [ -n \"\$ADMIN_CORS\" ]"

echo ""
echo "3. AUTHENTICATION & AUTHORIZATION"
echo "---------------------------------"
check "Clerk environment variables set" "[ -n \"\$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\" ] && [ -n \"\$CLERK_SECRET_KEY\" ]"
check "No development bypasses in middleware" "! grep -q 'NODE_ENV.*development.*return' middleware.ts"
check "Admin routes are protected" "grep -q '/admin' middleware.ts"

echo ""
echo "4. API SECURITY"
echo "---------------"
check "Rate limiting is enabled" "grep -q 'ENABLE_RATE_LIMITING.*true' deployment/environments/production.env || [ \"\$ENABLE_RATE_LIMITING\" = \"true\" ]"
check "Security headers are enabled" "grep -q 'ENABLE_SECURITY_HEADERS.*true' deployment/environments/production.env || [ \"\$ENABLE_SECURITY_HEADERS\" = \"true\" ]"
check "API routes have input validation" "grep -q 'zod' package.json"

echo ""
echo "5. PAYMENT SECURITY"
echo "------------------"
check "Stripe keys are configured" "[ -n \"\$STRIPE_API_KEY\" ] && [ -n \"\$STRIPE_WEBHOOK_SECRET\" ]"
check "Using Stripe production keys" "[ \"\$STRIPE_API_KEY\" != \"\" ] && [[ ! \"\$STRIPE_API_KEY\" =~ ^sk_test_ ]]" "warning"
check "Webhook signature verification exists" "grep -q 'constructEvent' app/api/webhooks/stripe/route.ts"

echo ""
echo "6. DATABASE SECURITY"
echo "-------------------"
check "Database URL is configured" "[ -n \"\$DATABASE_URL\" ]"
check "Database SSL is enabled for production" "grep -q 'ssl:.*rejectUnauthorized' security/secure-medusa-config.js"
check "Database backup is configured" "grep -q 'ENABLE_AUTOMATED_BACKUPS.*true' deployment/environments/production.env || [ \"\$ENABLE_AUTOMATED_BACKUPS\" = \"true\" ]"

echo ""
echo "7. MONITORING & LOGGING"
echo "----------------------"
check "Sentry DSN is configured" "[ -n \"\$SENTRY_DSN\" ]" "warning"
check "Monitoring is enabled" "[ \"\$ENABLE_PERFORMANCE_MONITORING\" = \"true\" ]" "warning"
check "Error logging is configured" "grep -q 'console.error' app/api/" "warning"

echo ""
echo "8. DEPENDENCY SECURITY"
echo "---------------------"
echo -n "Checking: No high/critical vulnerabilities... "
if npm audit --production --audit-level=high > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    ((WARNINGS++))
    echo "  Run 'npm audit' to see details"
fi

echo ""
echo "9. BUILD & DEPLOYMENT"
echo "--------------------"
check "Production build succeeds" "[ -d .next ] || npm run build" "warning"
check "TypeScript has no errors" "npx tsc --noEmit" "warning"
check "ESLint has no errors" "npm run lint" "warning"

echo ""
echo "10. SSL/TLS & NETWORK SECURITY"
echo "------------------------------"
check "HTTPS is enforced" "grep -q 'FORCE_HTTPS.*true' deployment/environments/production.env || [ \"\$FORCE_HTTPS\" = \"true\" ]"
check "HSTS is configured" "grep -q 'HSTS_MAX_AGE' deployment/environments/production.env"

echo ""
echo "11. COMPLIANCE REQUIREMENTS"
echo "--------------------------"
check "Privacy policy exists" "[ -f app/privacy/page.tsx ] || [ -f app/privacy-policy/page.tsx ]" "warning"
check "Terms of service exists" "[ -f app/terms/page.tsx ] || [ -f app/terms-of-service/page.tsx ]" "warning"
check "Cookie consent implementation" "grep -q 'cookie.*consent' -r components/" "warning"

echo ""
echo "12. SECURITY HEADERS"
echo "-------------------"
check "CSP header is configured" "grep -q 'Content-Security-Policy' security/secure-middleware.ts"
check "X-Frame-Options is set" "grep -q 'X-Frame-Options' security/secure-middleware.ts"
check "X-Content-Type-Options is set" "grep -q 'X-Content-Type-Options' security/secure-middleware.ts"

echo ""
echo "========================================="
echo "SECURITY CHECKLIST SUMMARY"
echo "========================================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ SECURITY CHECK FAILED${NC}"
    echo "Please fix all failed items before deploying to production!"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  SECURITY CHECK PASSED WITH WARNINGS${NC}"
    echo "Consider addressing warnings for better security posture."
    exit 0
else
    echo -e "${GREEN}✅ ALL SECURITY CHECKS PASSED${NC}"
    echo "Ready for production deployment!"
    exit 0
fi