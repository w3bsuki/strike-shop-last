#!/bin/bash

# Strike Shop Frontend Deployment Script
# This script handles the deployment of the Next.js frontend application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-1800}" # 30 minutes
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_DELAY="${HEALTH_CHECK_DELAY:-30}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to check if required environment variables are set
check_env_vars() {
    print_status "Checking required environment variables..."
    
    local required_vars=(
        "NEXT_PUBLIC_MEDUSA_BACKEND_URL"
        "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
        "NEXT_PUBLIC_SANITY_PROJECT_ID"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    print_status "All required environment variables are set"
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check Node.js version
    local node_version=$(node -v | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1 | grep -q "$required_version"; then
        print_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi
    
    # Check if next.config.mjs exists
    if [ ! -f "next.config.mjs" ] && [ ! -f "next.config.production.mjs" ]; then
        print_error "Next.js configuration file not found"
        exit 1
    fi
    
    print_status "Pre-deployment checks passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Clean install for production
    if [ -f "package-lock.json" ]; then
        npm ci --production=false
    elif [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    elif [ -f "pnpm-lock.yaml" ]; then
        pnpm install --frozen-lockfile
    else
        print_warning "No lock file found, using npm install"
        npm install
    fi
    
    print_status "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run unit tests
    if npm run test:unit --if-present; then
        print_status "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
    
    # Run integration tests
    if npm run test:integration --if-present; then
        print_status "Integration tests passed"
    else
        print_warning "Integration tests failed or not configured"
    fi
}

# Function to run security checks
security_checks() {
    print_status "Running security checks..."
    
    # Run npm audit
    npm audit --production || print_warning "Some vulnerabilities found, review npm audit report"
    
    # Check for exposed secrets
    if grep -r "sk_live_" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .; then
        print_error "Found exposed Stripe secret keys!"
        exit 1
    fi
    
    print_status "Security checks completed"
}

# Function to build the application
build_application() {
    print_status "Building application for $DEPLOYMENT_ENV..."
    
    # Copy production config if exists
    if [ "$DEPLOYMENT_ENV" = "production" ] && [ -f "next.config.production.mjs" ]; then
        cp next.config.production.mjs next.config.mjs
    fi
    
    # Set build-time environment variables
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build with timeout
    timeout $BUILD_TIMEOUT npm run build || {
        print_error "Build failed or timed out after $BUILD_TIMEOUT seconds"
        exit 1
    }
    
    print_status "Build completed successfully"
}

# Function to optimize build output
optimize_build() {
    print_status "Optimizing build output..."
    
    # Generate bundle analysis report
    if npm run analyze:bundle --if-present; then
        print_status "Bundle analysis completed"
    fi
    
    # Check build size
    local build_size=$(du -sh .next | cut -f1)
    print_status "Build size: $build_size"
    
    # Warn if build is too large
    local size_mb=$(du -sm .next | cut -f1)
    if [ "$size_mb" -gt 100 ]; then
        print_warning "Build size exceeds 100MB, consider optimization"
    fi
}

# Function to deploy to hosting provider
deploy_to_provider() {
    print_status "Deploying to hosting provider..."
    
    case "${DEPLOYMENT_PROVIDER:-vercel}" in
        "vercel")
            deploy_to_vercel
            ;;
        "railway")
            deploy_to_railway
            ;;
        "render")
            deploy_to_render
            ;;
        "netlify")
            deploy_to_netlify
            ;;
        *)
            print_error "Unknown deployment provider: $DEPLOYMENT_PROVIDER"
            exit 1
            ;;
    esac
}

# Vercel deployment
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not installed"
        exit 1
    fi
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        vercel --prod --confirm
    else
        vercel --confirm
    fi
}

# Railway deployment
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed"
        exit 1
    fi
    
    railway up --environment "$DEPLOYMENT_ENV"
}

# Render deployment
deploy_to_render() {
    print_status "Deploying to Render..."
    
    # Render uses Git-based deployments
    git push render main
}

# Netlify deployment
deploy_to_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_error "Netlify CLI not installed"
        exit 1
    fi
    
    if [ "$DEPLOYMENT_ENV" = "production" ]; then
        netlify deploy --prod
    else
        netlify deploy
    fi
}

# Function to perform health check
health_check() {
    print_status "Performing health check..."
    
    local deployment_url="${DEPLOYMENT_URL:-https://your-domain.com}"
    local health_endpoint="$deployment_url/api/health"
    
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        print_status "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
        
        if curl -sf "$health_endpoint" > /dev/null; then
            print_status "Health check passed!"
            return 0
        fi
        
        print_warning "Health check failed, retrying in $HEALTH_CHECK_DELAY seconds..."
        sleep $HEALTH_CHECK_DELAY
    done
    
    print_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Function to notify deployment status
notify_deployment() {
    local status=$1
    local message=$2
    
    print_status "Sending deployment notification..."
    
    # Slack notification
    if [ ! -z "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || print_warning "Failed to send Slack notification"
    fi
    
    # Discord notification
    if [ ! -z "${DISCORD_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"Deployment $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || print_warning "Failed to send Discord notification"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed, initiating rollback..."
    
    # Provider-specific rollback commands
    case "${DEPLOYMENT_PROVIDER:-vercel}" in
        "vercel")
            vercel rollback
            ;;
        "railway")
            railway rollback
            ;;
        *)
            print_warning "Automatic rollback not available for $DEPLOYMENT_PROVIDER"
            ;;
    esac
    
    notify_deployment "FAILED" "Deployment failed and was rolled back"
}

# Main deployment flow
main() {
    print_status "Starting Strike Shop frontend deployment..."
    print_status "Environment: $DEPLOYMENT_ENV"
    
    # Trap errors for rollback
    trap 'rollback_deployment' ERR
    
    # Run deployment steps
    check_env_vars
    pre_deployment_checks
    install_dependencies
    run_tests
    security_checks
    build_application
    optimize_build
    deploy_to_provider
    
    # Post-deployment steps
    if health_check; then
        print_status "Deployment completed successfully!"
        notify_deployment "SUCCESS" "Frontend deployed to $DEPLOYMENT_ENV"
    else
        print_error "Deployment verification failed"
        rollback_deployment
        exit 1
    fi
    
    # Clean up trap
    trap - ERR
}

# Run main function
main "$@"