#!/bin/bash

# Backup entrypoint script for PostgreSQL
# This script runs automated backups on a schedule

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to perform backup
perform_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/backup_${POSTGRES_DB}_${timestamp}.sql.gz"
    
    echo "[$(date)] Starting backup of database: $POSTGRES_DB"
    
    # Perform backup using pg_dump
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=custom \
        --compress=9 \
        > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Backup completed successfully: $backup_file"
        
        # Upload to S3 if configured
        if [ -n "$S3_BACKUP_BUCKET" ]; then
            upload_to_s3 "$backup_file"
        fi
        
        # Clean up old backups
        cleanup_old_backups
    else
        echo "[$(date)] Backup failed!"
        exit 1
    fi
}

# Function to upload backup to S3
upload_to_s3() {
    local backup_file="$1"
    local s3_path="s3://${S3_BACKUP_BUCKET}/postgres/$(basename $backup_file)"
    
    echo "[$(date)] Uploading backup to S3: $s3_path"
    
    aws s3 cp "$backup_file" "$s3_path" \
        --storage-class STANDARD_IA \
        --metadata "retention-days=$RETENTION_DAYS"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Upload to S3 completed successfully"
    else
        echo "[$(date)] Upload to S3 failed!"
    fi
}

# Function to clean up old backups
cleanup_old_backups() {
    echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days"
    
    # Clean local backups
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Clean S3 backups if configured
    if [ -n "$S3_BACKUP_BUCKET" ]; then
        # List and delete old S3 objects
        aws s3 ls "s3://${S3_BACKUP_BUCKET}/postgres/" | \
        while read -r line; do
            create_date=$(echo $line | awk '{print $1" "$2}')
            file_name=$(echo $line | awk '{print $4}')
            
            if [ -n "$file_name" ]; then
                # Calculate age in days
                create_timestamp=$(date -d "$create_date" +%s)
                current_timestamp=$(date +%s)
                age_days=$(( ($current_timestamp - $create_timestamp) / 86400 ))
                
                if [ $age_days -gt $RETENTION_DAYS ]; then
                    echo "[$(date)] Deleting old S3 backup: $file_name (age: $age_days days)"
                    aws s3 rm "s3://${S3_BACKUP_BUCKET}/postgres/$file_name"
                fi
            fi
        done
    fi
}

# Function to restore from backup
restore_backup() {
    local backup_file="$1"
    
    echo "[$(date)] Starting restore from: $backup_file"
    
    PGPASSWORD="$POSTGRES_PASSWORD" pg_restore \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --clean \
        --if-exists \
        "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Restore completed successfully"
    else
        echo "[$(date)] Restore failed!"
        exit 1
    fi
}

# Main execution
if [ "$1" = "restore" ]; then
    # Restore mode
    if [ -z "$2" ]; then
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi
    restore_backup "$2"
else
    # Backup mode - run on schedule
    echo "[$(date)] Starting backup scheduler"
    echo "Backup schedule: $BACKUP_SCHEDULE"
    echo "Retention days: $RETENTION_DAYS"
    
    # Install cron job
    echo "$BACKUP_SCHEDULE /scripts/perform-backup.sh >> /var/log/backup.log 2>&1" | crontab -
    
    # Start cron daemon
    crond -f -l 8
fi