#!/bin/bash

# Script to perform the actual backup
# Called by cron from backup-entrypoint.sh

set -e

# Source the backup functions
source /scripts/backup-entrypoint.sh

# Perform the backup
perform_backup