#!/bin/bash

# Staging deployment script for TaskFlow AI
# This script handles the deployment process on the staging server

set -e

# Configuration
PROJECT_DIR="$HOME/taskflow-ai"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

# Warning message
warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error_exit "Docker is not installed"
    fi
    
    # Check if docker-compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error_exit "Docker Compose is not installed"
    fi
    
    # Check if environment file exists
    if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
        error_exit "Environment file $ENV_FILE not found"
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$PROJECT_DIR/infrastructure/certbot/www"
    mkdir -p "$PROJECT_DIR/infrastructure/certbot/conf"
    mkdir -p "$PROJECT_DIR/logs"
    
    success "Directories created"
}

# Backup current deployment
backup_current() {
    log "Creating backup of current deployment..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    
    # Export docker volumes
    docker run --rm -v taskflow-ai_postgres_data:/data -v "$BACKUP_DIR:/backup" \
        alpine tar czf "/backup/postgres_data_$TIMESTAMP.tar.gz" -C / data 2>/dev/null || true
    
    success "Backup created: $BACKUP_FILE"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" pull || error_exit "Failed to pull images"
    
    success "Images pulled successfully"
}

# Stop current containers
stop_containers() {
    log "Stopping current containers..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" down || warning "No containers to stop"
    
    success "Containers stopped"
}

# Start new containers
start_containers() {
    log "Starting new containers..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d || error_exit "Failed to start containers"
    
    success "Containers started"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    cd "$PROJECT_DIR"
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head || error_exit "Failed to run migrations"
    
    success "Migrations completed"
}

# Initialize SSL certificates
init_ssl() {
    log "Initializing SSL certificates..."
    
    # Check if certificates already exist
    if [ ! -d "$PROJECT_DIR/infrastructure/certbot/conf/live/staging.taskflow-ai.dev" ]; then
        log "Requesting SSL certificate for staging.taskflow-ai.dev..."
        
        # Get certificate using certbot
        docker-compose -f "$COMPOSE_FILE" run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email="${CERTBOT_EMAIL}" \
            --agree-tos \
            --no-eff-email \
            --force-renewal \
            -d staging.taskflow-ai.dev \
            -d staging-api.taskflow-ai.dev
    else
        log "SSL certificates already exist"
    fi
    
    success "SSL initialization completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Wait for services to be ready
    sleep 20
    
    # Check backend health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        error_exit "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        warning "Frontend health check failed"
    fi
    
    # Show container status
    log "Container status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove unused Docker resources
    docker system prune -f --volumes || warning "Failed to prune Docker resources"
    
    # Remove old backup files (older than 7 days)
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete || warning "Failed to clean old backups"
    
    success "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting deployment process..."
    
    check_prerequisites
    create_directories
    backup_current
    pull_images
    stop_containers
    start_containers
    init_ssl
    run_migrations
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    
    # Show deployment info
    log "Deployment Information:"
    log "- Frontend URL: https://staging.taskflow-ai.dev"
    log "- API URL: https://staging-api.taskflow-ai.dev"
    log "- Grafana Dashboard: https://staging.taskflow-ai.dev/grafana"
    log "- Logs: docker-compose -f $COMPOSE_FILE logs -f [service_name]"
}

# Run deployment
deploy