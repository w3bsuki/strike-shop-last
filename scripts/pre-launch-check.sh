#!/bin/bash

# Strike Shop Pre-Launch Validation Script
# This script performs comprehensive checks before production launch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://api.strikebrand.com}"
FRONTEND_URL="${FRONTEND_URL:-https://shop.strikebrand.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.strikebrand.com}"

echo "======================================"
echo "Strike Shop Pre-Launch Validation"
echo "======================================"
echo ""

# Track overall status
CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to run a check
run_check() {
    local check_name=$1
    local check_command=$2
    
    echo -n "Checking $check_name... "
    
    if eval $check_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((CHECKS_FAILED++))
        return 1
    fi
}

# Function to check HTTP endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        ((CHECKS_FAILED++))
    fi
}

echo "1. Infrastructure Checks"
echo "------------------------"

# Check API health
check_endpoint "API Health" "$PRODUCTION_URL/health" 200
check_endpoint "API Deep Health" "$PRODUCTION_URL/health/deep" 200

# Check database connectivity
run_check "Database Connection" "railway run --environment production 'npm run db:ping'"

# Check Redis connectivity
run_check "Redis Connection" "railway run --environment production 'npm run redis:ping'"

# Check S3 connectivity
run_check "S3 Storage Access" "aws s3 ls s3://strike-shop-assets/ --max-items 1"

echo ""
echo "2. Application Endpoints"
echo "------------------------"

# Check critical endpoints
check_endpoint "Store Products API" "$PRODUCTION_URL/store/products" 200
check_endpoint "Store Cart API" "$PRODUCTION_URL/store/cart" 200
check_endpoint "Auth Endpoint" "$PRODUCTION_URL/auth/session" 200
check_endpoint "Admin Panel" "$ADMIN_URL" 200
check_endpoint "Frontend Homepage" "$FRONTEND_URL" 200

echo ""
echo "3. Security Checks"
echo "------------------"

# Check HTTPS redirect
echo -n "Checking HTTPS enforcement... "
http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://api.strikebrand.com" -L --max-redirs 0)
if [ "$http_status" = "301" ] || [ "$http_status" = "302" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP redirects to HTTPS)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (HTTP not redirecting to HTTPS)"
    ((CHECKS_FAILED++))
fi

# Check security headers
echo -n "Checking security headers... "
headers=$(curl -s -I "$PRODUCTION_URL/health")
required_headers=("X-Frame-Options" "X-Content-Type-Options" "Strict-Transport-Security")
missing_headers=()

for header in "${required_headers[@]}"; do
    if ! echo "$headers" | grep -qi "$header"; then
        missing_headers+=("$header")
    fi
done

if [ ${#missing_headers[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (Missing: ${missing_headers[*]})"
    ((CHECKS_FAILED++))
fi

# Check CORS configuration
echo -n "Checking CORS configuration... "
cors_header=$(curl -s -I -H "Origin: https://shop.strikebrand.com" "$PRODUCTION_URL/store/products" | grep -i "access-control-allow-origin")
if echo "$cors_header" | grep -q "shop.strikebrand.com"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (CORS not properly configured)"
    ((CHECKS_FAILED++))
fi

echo ""
echo "4. Payment System"
echo "-----------------"

# Check Stripe webhook endpoint
check_endpoint "Stripe Webhook" "$PRODUCTION_URL/hooks/stripe" 200

# Verify Stripe configuration
echo -n "Checking Stripe configuration... "
if railway run --environment production 'node scripts/verify-stripe.js' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Manual verification recommended)"
fi

echo ""
echo "5. Performance Checks"
echo "--------------------"

# Quick performance test
echo -n "Running quick performance test... "
response_time=$(curl -s -o /dev/null -w "%{time_total}" "$PRODUCTION_URL/store/products")
response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)

if [ "$response_time_ms" -lt 1000 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (${response_time_ms}ms)"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${response_time_ms}ms - consider optimization)"
    ((CHECKS_FAILED++))
fi

echo ""
echo "6. Monitoring & Alerting"
echo "------------------------"

# Check monitoring endpoints
run_check "Sentry Connection" "curl -s https://sentry.io/api/0/projects/ -H 'Authorization: Bearer $SENTRY_AUTH_TOKEN' | grep -q 'strike-shop'"
run_check "Datadog Agent" "railway run --environment production 'npm run datadog:check'"

echo ""
echo "7. Backup & Recovery"
echo "--------------------"

# Check backup configuration
run_check "Database Backup" "railway run --environment production 'node scripts/database-backup.js --dry-run'"
run_check "Disaster Recovery Plan" "test -f scripts/disaster-recovery.js"

echo ""
echo "8. Content & Assets"
echo "-------------------"

# Check CDN
check_endpoint "CDN Static Assets" "https://cdn.strikebrand.com/health" 200

# Check critical assets
check_endpoint "Logo Asset" "https://cdn.strikebrand.com/images/logo.png" 200
check_endpoint "Homepage Hero" "https://cdn.strikebrand.com/images/hero-image.png" 200

echo ""
echo "======================================"
echo "Pre-Launch Validation Summary"
echo "======================================"
echo ""
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED!${NC}"
    echo "The system is ready for production launch."
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED!${NC}"
    echo "Please fix the failed checks before launching."
    exit 1
fi