#!/bin/bash

# Strike Shop Backend (Medusa) Deployment Script
# This script handles the deployment of the Medusa backend application

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
MEDUSA_DIR="${MEDUSA_DIR:-my-medusa-store}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-1200}" # 20 minutes
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-10}"
HEALTH_CHECK_DELAY="${HEALTH_CHECK_DELAY:-30}"
DB_BACKUP="${DB_BACKUP:-true}"

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
        "DATABASE_URL"
        "JWT_SECRET"
        "COOKIE_SECRET"
        "STRIPE_API_KEY"
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

# Function to backup database
backup_database() {
    if [ "$DB_BACKUP" != "true" ]; then
        print_warning "Database backup skipped"
        return
    fi
    
    print_status "Backing up database..."
    
    local backup_name="medusa_backup_$(date +%Y%m%d_%H%M%S).sql"
    local backup_dir="./backups"
    
    # Create backup directory if it doesn't exist
    mkdir -p "$backup_dir"
    
    # Extract database connection details
    if [[ "$DATABASE_URL" =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        local db_user="${BASH_REMATCH[1]}"
        local db_pass="${BASH_REMATCH[2]}"
        local db_host="${BASH_REMATCH[3]}"
        local db_port="${BASH_REMATCH[4]}"
        local db_name="${BASH_REMATCH[5]}"
        
        # Perform backup
        PGPASSWORD="$db_pass" pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" > "$backup_dir/$backup_name"
        
        # Compress backup
        gzip "$backup_dir/$backup_name"
        
        print_status "Database backed up to $backup_dir/$backup_name.gz"
        
        # Upload to S3 if configured
        if [ ! -z "${AWS_ACCESS_KEY_ID:-}" ] && [ ! -z "${S3_BACKUP_BUCKET:-}" ]; then
            aws s3 cp "$backup_dir/$backup_name.gz" "s3://$S3_BACKUP_BUCKET/medusa-backups/$backup_name.gz"
            print_status "Backup uploaded to S3"
        fi
    else
        print_error "Invalid DATABASE_URL format"
        exit 1
    fi
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check if we're in the Medusa directory
    if [ ! -d "$MEDUSA_DIR" ]; then
        print_error "Medusa directory not found: $MEDUSA_DIR"
        exit 1
    fi
    
    cd "$MEDUSA_DIR"
    
    # Check Node.js version
    local node_version=$(node -v | cut -d'v' -f2)
    local required_version="18.0.0"
    
    if ! printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1 | grep -q "$required_version"; then
        print_error "Node.js version $node_version is below required version $required_version"
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in Medusa directory"
        exit 1
    fi
    
    # Check database connection
    print_status "Testing database connection..."
    if ! npx medusa migrations list > /dev/null 2>&1; then
        print_error "Database connection failed"
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

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check pending migrations
    local pending=$(npx medusa migrations list | grep -c "not run" || true)
    
    if [ "$pending" -gt 0 ]; then
        print_status "Found $pending pending migrations"
        
        # Run migrations
        npx medusa migrations run || {
            print_error "Migration failed"
            exit 1
        }
        
        print_status "Migrations completed successfully"
    else
        print_status "No pending migrations"
    fi
}

# Function to build the application
build_application() {
    print_status "Building Medusa application..."
    
    # Set build-time environment variables
    export NODE_ENV=production
    
    # Build Medusa
    timeout $BUILD_TIMEOUT npm run build || {
        print_error "Build failed or timed out after $BUILD_TIMEOUT seconds"
        exit 1
    }
    
    print_status "Build completed successfully"
}

# Function to create admin user if needed
setup_admin_user() {
    print_status "Checking admin user setup..."
    
    if [ ! -z "${ADMIN_EMAIL:-}" ] && [ ! -z "${ADMIN_PASSWORD:-}" ]; then
        print_status "Creating admin user..."
        
        node <<EOF
const { Medusa } = require("@medusajs/medusa");
const setupServer = require("./src/index.js");

async function createAdmin() {
  const { app } = await setupServer();
  const userService = app.resolve("userService");
  
  try {
    await userService.create({
      email: "$ADMIN_EMAIL",
      password: "$ADMIN_PASSWORD",
      role: "admin",
    });
    console.log("Admin user created successfully");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("Admin user already exists");
    } else {
      throw error;
    }
  }
  
  process.exit(0);
}

createAdmin().catch(console.error);
EOF
    else
        print_warning "Admin user creation skipped (ADMIN_EMAIL or ADMIN_PASSWORD not set)"
    fi
}

# Function to deploy to hosting provider
deploy_to_provider() {
    print_status "Deploying to hosting provider..."
    
    case "${DEPLOYMENT_PROVIDER:-railway}" in
        "railway")
            deploy_to_railway
            ;;
        "render")
            deploy_to_render
            ;;
        "heroku")
            deploy_to_heroku
            ;;
        "docker")
            deploy_with_docker
            ;;
        *)
            print_error "Unknown deployment provider: $DEPLOYMENT_PROVIDER"
            exit 1
            ;;
    esac
}

# Railway deployment
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not installed"
        exit 1
    fi
    
    # Deploy
    railway up --environment "$DEPLOYMENT_ENV"
}

# Render deployment
deploy_to_render() {
    print_status "Deploying to Render..."
    
    # Render uses Git-based deployments
    git push render main
}

# Heroku deployment
deploy_to_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI not installed"
        exit 1
    fi
    
    # Deploy
    git push heroku main
}

# Docker deployment
deploy_with_docker() {
    print_status "Building Docker image..."
    
    local image_name="strike-shop-medusa"
    local image_tag="$DEPLOYMENT_ENV-$(git rev-parse --short HEAD)"
    
    # Build Docker image
    docker build -t "$image_name:$image_tag" .
    
    # Tag for registry
    if [ ! -z "${DOCKER_REGISTRY:-}" ]; then
        docker tag "$image_name:$image_tag" "$DOCKER_REGISTRY/$image_name:$image_tag"
        docker tag "$image_name:$image_tag" "$DOCKER_REGISTRY/$image_name:$DEPLOYMENT_ENV"
        
        # Push to registry
        docker push "$DOCKER_REGISTRY/$image_name:$image_tag"
        docker push "$DOCKER_REGISTRY/$image_name:$DEPLOYMENT_ENV"
    fi
    
    print_status "Docker image built and pushed"
}

# Function to perform health check
health_check() {
    print_status "Performing health check..."
    
    local backend_url="${MEDUSA_BACKEND_URL:-https://your-medusa-backend.com}"
    local health_endpoint="$backend_url/health"
    
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

# Function to run post-deployment tasks
post_deployment_tasks() {
    print_status "Running post-deployment tasks..."
    
    # Clear cache if Redis is configured
    if [ ! -z "${REDIS_URL:-}" ]; then
        print_status "Clearing Redis cache..."
        # Add Redis cache clearing logic here
    fi
    
    # Warm up cache
    print_status "Warming up cache..."
    curl -sf "$MEDUSA_BACKEND_URL/store/products?limit=1" > /dev/null || true
    curl -sf "$MEDUSA_BACKEND_URL/store/collections" > /dev/null || true
    
    # Update search index if configured
    if [ ! -z "${ALGOLIA_APP_ID:-}" ]; then
        print_status "Updating search index..."
        # Add search index update logic here
    fi
}

# Function to notify deployment status
notify_deployment() {
    local status=$1
    local message=$2
    
    print_status "Sending deployment notification..."
    
    # Slack notification
    if [ ! -z "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backend Deployment $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" || print_warning "Failed to send Slack notification"
    fi
    
    # Discord notification
    if [ ! -z "${DISCORD_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"Backend Deployment $status: $message\"}" \
            "$DISCORD_WEBHOOK_URL" || print_warning "Failed to send Discord notification"
    fi
}

# Function to rollback deployment
rollback_deployment() {
    print_error "Deployment failed, initiating rollback..."
    
    # Rollback database if migrations were run
    if [ -f ".migration_run" ]; then
        print_status "Rolling back database migrations..."
        npx medusa migrations revert || print_warning "Migration rollback failed"
        rm -f .migration_run
    fi
    
    # Provider-specific rollback
    case "${DEPLOYMENT_PROVIDER:-railway}" in
        "railway")
            railway rollback
            ;;
        "heroku")
            heroku rollback
            ;;
        *)
            print_warning "Automatic rollback not available for $DEPLOYMENT_PROVIDER"
            ;;
    esac
    
    notify_deployment "FAILED" "Backend deployment failed and was rolled back"
}

# Main deployment flow
main() {
    print_status "Starting Strike Shop backend deployment..."
    print_status "Environment: $DEPLOYMENT_ENV"
    
    # Trap errors for rollback
    trap 'rollback_deployment' ERR
    
    # Run deployment steps
    check_env_vars
    backup_database
    pre_deployment_checks
    install_dependencies
    run_migrations
    touch .migration_run  # Mark that migrations were run
    build_application
    setup_admin_user
    deploy_to_provider
    
    # Post-deployment steps
    if health_check; then
        post_deployment_tasks
        rm -f .migration_run  # Clean up marker
        print_status "Deployment completed successfully!"
        notify_deployment "SUCCESS" "Backend deployed to $DEPLOYMENT_ENV"
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