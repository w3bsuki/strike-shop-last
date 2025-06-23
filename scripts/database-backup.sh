#!/bin/bash

# Strike Shop Database Backup Script
# Automated backup with encryption and verification

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="strike_shop_backup_${TIMESTAMP}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# Check requirements
check_requirements() {
    local missing_tools=()
    
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("postgresql-client")
    command -v aws >/dev/null 2>&1 || missing_tools+=("awscli")
    command -v openssl >/dev/null 2>&1 || missing_tools+=("openssl")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again"
        exit 1
    fi
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Perform database backup
perform_backup() {
    local backup_file="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    local compressed_file="${backup_file}.gz"
    
    log_info "Starting database backup..."
    
    # Check if DATABASE_URL is set
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi
    
    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    if [[ ! "$DATABASE_URL" =~ ^postgres(ql)?:// ]]; then
        log_error "Invalid DATABASE_URL format"
        exit 1
    fi
    
    # Perform backup with progress
    log_info "Dumping database..."
    if pg_dump "$DATABASE_URL" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=plain \
        --encoding=UTF8 \
        --schema=public \
        > "$backup_file" 2>&1; then
        log_success "Database dump completed"
    else
        log_error "Database dump failed"
        exit 1
    fi
    
    # Get backup size
    local size=$(du -h "$backup_file" | cut -f1)
    log_info "Backup size: $size"
    
    # Compress backup
    log_info "Compressing backup..."
    if gzip -9 "$backup_file"; then
        log_success "Backup compressed successfully"
        local compressed_size=$(du -h "$compressed_file" | cut -f1)
        log_info "Compressed size: $compressed_size"
    else
        log_error "Compression failed"
        exit 1
    fi
    
    echo "$compressed_file"
}

# Encrypt backup
encrypt_backup() {
    local input_file="$1"
    local encrypted_file="${input_file}.enc"
    
    if [ -z "$ENCRYPTION_KEY" ]; then
        log_warning "Encryption key not provided, skipping encryption"
        echo "$input_file"
        return
    fi
    
    log_info "Encrypting backup..."
    if openssl enc -aes-256-cbc \
        -salt \
        -in "$input_file" \
        -out "$encrypted_file" \
        -pass "pass:$ENCRYPTION_KEY" \
        -pbkdf2; then
        log_success "Backup encrypted successfully"
        rm -f "$input_file"
        echo "$encrypted_file"
    else
        log_error "Encryption failed"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log_info "Verifying backup integrity..."
    
    # Check file exists and is not empty
    if [ ! -f "$backup_file" ] || [ ! -s "$backup_file" ]; then
        log_error "Backup file is missing or empty"
        return 1
    fi
    
    # If encrypted, verify we can decrypt
    if [[ "$backup_file" == *.enc ]] && [ -n "$ENCRYPTION_KEY" ]; then
        local test_decrypt=$(mktemp)
        if openssl enc -aes-256-cbc \
            -d \
            -in "$backup_file" \
            -pass "pass:$ENCRYPTION_KEY" \
            -pbkdf2 2>/dev/null | head -n 1 > "$test_decrypt"; then
            if grep -q "PostgreSQL database dump" "$test_decrypt" 2>/dev/null || \
               zcat "$test_decrypt" 2>/dev/null | head -n 1 | grep -q "PostgreSQL database dump"; then
                log_success "Backup verification passed"
                rm -f "$test_decrypt"
                return 0
            fi
        fi
        rm -f "$test_decrypt"
        log_error "Backup verification failed - cannot decrypt or invalid format"
        return 1
    fi
    
    # For unencrypted compressed backups
    if [[ "$backup_file" == *.gz ]]; then
        if zcat "$backup_file" | head -n 1 | grep -q "PostgreSQL database dump"; then
            log_success "Backup verification passed"
            return 0
        fi
    fi
    
    log_error "Backup verification failed"
    return 1
}

# Upload to S3
upload_to_s3() {
    local backup_file="$1"
    
    if [ -z "$S3_BUCKET" ]; then
        log_warning "S3 bucket not configured, skipping upload"
        return
    fi
    
    log_info "Uploading backup to S3..."
    
    local s3_path="s3://${S3_BUCKET}/database-backups/$(date +%Y/%m/%d)/$(basename "$backup_file")"
    
    if aws s3 cp "$backup_file" "$s3_path" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --metadata "timestamp=${TIMESTAMP},retention_days=${RETENTION_DAYS}"; then
        log_success "Backup uploaded to S3: $s3_path"
        
        # Set lifecycle policy for automatic deletion
        aws s3api put-object-tagging \
            --bucket "$S3_BUCKET" \
            --key "database-backups/$(date +%Y/%m/%d)/$(basename "$backup_file")" \
            --tagging "TagSet=[{Key=AutoDelete,Value=true},{Key=RetentionDays,Value=${RETENTION_DAYS}}]" || true
    else
        log_error "S3 upload failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Local cleanup
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -type f -name "strike_shop_backup_*.sql.gz*" -mtime +$RETENTION_DAYS -delete || true
        local remaining=$(find "$BACKUP_DIR" -type f -name "strike_shop_backup_*.sql.gz*" | wc -l)
        log_info "Local backups remaining: $remaining"
    fi
    
    # S3 cleanup (if bucket lifecycle policies are not set)
    if [ -n "$S3_BUCKET" ]; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://${S3_BUCKET}/database-backups/" --recursive | \
        while read -r line; do
            local file_date=$(echo "$line" | awk '{print $1}')
            local file_path=$(echo "$line" | awk '{print $4}')
            if [[ "$file_date" < "$cutoff_date" ]] && [[ "$file_path" == *strike_shop_backup_* ]]; then
                aws s3 rm "s3://${S3_BUCKET}/$file_path" || true
            fi
        done
    fi
}

# Generate backup report
generate_report() {
    local backup_file="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local report_file="${BACKUP_DIR}/backup_report_${TIMESTAMP}.json"
    
    cat > "$report_file" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_name": "${BACKUP_NAME}",
  "backup_file": "$(basename "$backup_file")",
  "backup_size": "$(du -h "$backup_file" 2>/dev/null | cut -f1 || echo "unknown")",
  "duration_seconds": $duration,
  "encrypted": $([ -n "$ENCRYPTION_KEY" ] && echo "true" || echo "false"),
  "s3_upload": $([ -n "$S3_BUCKET" ] && echo "true" || echo "false"),
  "retention_days": $RETENTION_DAYS,
  "status": "success"
}
EOF
    
    log_info "Backup report saved to: $report_file"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        [ "$status" = "error" ] && color="danger"
        [ "$status" = "warning" ] && color="warning"
        
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Database Backup Notification\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"Environment\", \"value\": \"${NODE_ENV:-production}\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false},
                        {\"title\": \"Timestamp\", \"value\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"short\": true}
                    ]
                }]
            }" 2>/dev/null || true
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    log_info "Starting Strike Shop database backup process..."
    
    # Check requirements
    check_requirements
    
    # Create backup directory
    create_backup_dir
    
    # Perform backup
    local backup_file=$(perform_backup)
    
    # Encrypt backup
    backup_file=$(encrypt_backup "$backup_file")
    
    # Verify backup
    if ! verify_backup "$backup_file"; then
        send_notification "error" "Backup verification failed"
        exit 1
    fi
    
    # Upload to S3
    upload_to_s3 "$backup_file"
    
    # Clean old backups
    cleanup_old_backups
    
    # Generate report
    generate_report "$backup_file" "$start_time"
    
    # Send success notification
    send_notification "success" "Database backup completed successfully"
    
    log_success "Backup process completed successfully!"
}

# Handle errors
trap 'log_error "Backup process failed!"; send_notification "error" "Backup process failed with error"; exit 1' ERR

# Run main function
main "$@"