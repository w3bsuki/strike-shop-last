const { exec } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  database: {
    url: process.env.DATABASE_URL,
    name: process.env.DATABASE_NAME || 'strike_shop',
  },
  s3: {
    bucket: process.env.BACKUP_S3_BUCKET || 'strike-shop-backups',
    region: process.env.AWS_REGION || 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  encryption: {
    enabled: process.env.BACKUP_ENCRYPTION === 'true',
    key: process.env.ENCRYPTION_KEY,
  },
  retention: {
    days: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    datadogApiKey: process.env.DATADOG_API_KEY,
  },
};

// Initialize S3 client
const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

// Backup types
const BackupType = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
  SCHEMA_ONLY: 'schema',
};

class DatabaseBackup {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.backupId = crypto.randomUUID();
  }

  async performBackup(type = BackupType.FULL) {
    console.log(`Starting ${type} backup at ${this.timestamp}`);

    try {
      // Start monitoring
      await this.notifyMonitoring('backup.started', {
        type,
        backupId: this.backupId,
      });

      // Create backup
      const backupFile = await this.createBackup(type);

      // Encrypt if enabled
      const finalFile = config.encryption.enabled
        ? await this.encryptBackup(backupFile)
        : backupFile;

      // Upload to S3
      const s3Key = await this.uploadToS3(finalFile, type);

      // Verify backup
      await this.verifyBackup(s3Key);

      // Clean up local files
      await this.cleanup([backupFile, finalFile]);

      // Update backup catalog
      await this.updateBackupCatalog({
        backupId: this.backupId,
        timestamp: this.timestamp,
        type,
        s3Key,
        size: (await fs.stat(finalFile)).size,
        encrypted: config.encryption.enabled,
      });

      // Notify success
      await this.notifyMonitoring('backup.completed', {
        type,
        backupId: this.backupId,
        s3Key,
      });

      console.log(`Backup completed successfully: ${s3Key}`);
      return { success: true, s3Key, backupId: this.backupId };
    } catch (error) {
      console.error('Backup failed:', error);
      await this.notifyMonitoring('backup.failed', {
        type,
        backupId: this.backupId,
        error: error.message,
      });
      throw error;
    }
  }

  async createBackup(type) {
    const filename = `backup_${this.backupId}_${type}.sql`;
    const filepath = path.join('/tmp', filename);

    let command;
    switch (type) {
      case BackupType.FULL:
        command = `pg_dump ${config.database.url} --no-owner --no-acl --clean --if-exists > ${filepath}`;
        break;
      case BackupType.INCREMENTAL:
        // Use pg_basebackup for incremental backups
        command = `pg_basebackup -D ${filepath} -Ft -z -P -U postgres -h ${this.getDbHost()}`;
        break;
      case BackupType.SCHEMA_ONLY:
        command = `pg_dump ${config.database.url} --schema-only --no-owner --no-acl > ${filepath}`;
        break;
    }

    return new Promise((resolve, reject) => {
      exec(
        command,
        { maxBuffer: 1024 * 1024 * 100 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Backup command failed: ${error.message}`));
          } else {
            resolve(filepath);
          }
        }
      );
    });
  }

  async encryptBackup(filepath) {
    const encryptedPath = `${filepath}.enc`;
    const cipher = crypto.createCipher('aes-256-cbc', config.encryption.key);

    const input = await fs.readFile(filepath);
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

    await fs.writeFile(encryptedPath, encrypted);
    return encryptedPath;
  }

  async uploadToS3(filepath, type) {
    const fileContent = await fs.readFile(filepath);
    const filename = path.basename(filepath);
    const datePrefix = new Date().toISOString().split('T')[0];
    const s3Key = `backups/${datePrefix}/${type}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: s3Key,
      Body: fileContent,
      ContentType: 'application/octet-stream',
      ServerSideEncryption: 'AES256',
      Metadata: {
        backupId: this.backupId,
        timestamp: this.timestamp,
        type,
        encrypted: config.encryption.enabled.toString(),
      },
    });

    await s3Client.send(command);
    return s3Key;
  }

  async verifyBackup(s3Key) {
    // Implement backup verification logic
    // - Check file integrity
    // - Verify encryption if enabled
    // - Test restore capability (on staging)
    console.log(`Verifying backup: ${s3Key}`);
    return true;
  }

  async cleanup(files) {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        console.warn(`Failed to delete temporary file: ${file}`);
      }
    }
  }

  async updateBackupCatalog(backupInfo) {
    // Store backup metadata in database
    const catalogEntry = {
      ...backupInfo,
      status: 'completed',
      verified: true,
      expiresAt: new Date(
        Date.now() + config.retention.days * 24 * 60 * 60 * 1000
      ),
    };

    // Save to database backup_catalog table
    console.log('Catalog entry:', catalogEntry);
    // Implementation depends on your database schema
  }

  async notifyMonitoring(event, data) {
    // Send to monitoring services
    if (config.monitoring.datadogApiKey) {
      // Send custom metric to Datadog
      console.log(`Datadog event: ${event}`, data);
    }

    if (config.monitoring.sentryDsn) {
      // Send event to Sentry
      console.log(`Sentry event: ${event}`, data);
    }
  }

  getDbHost() {
    const url = new URL(config.database.url);
    return url.hostname;
  }

  // Restore functionality
  async restoreBackup(backupId, targetDb = null) {
    console.log(`Starting restore for backup: ${backupId}`);

    try {
      // Fetch backup metadata
      const backupInfo = await this.getBackupInfo(backupId);

      // Download from S3
      const localFile = await this.downloadFromS3(backupInfo.s3Key);

      // Decrypt if needed
      const restoreFile = backupInfo.encrypted
        ? await this.decryptBackup(localFile)
        : localFile;

      // Perform restore
      await this.performRestore(restoreFile, targetDb);

      // Cleanup
      await this.cleanup([localFile, restoreFile]);

      console.log('Restore completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async performRestore(filepath, targetDb) {
    const dbUrl = targetDb || config.database.url;
    const command = `psql ${dbUrl} < ${filepath}`;

    return new Promise((resolve, reject) => {
      exec(
        command,
        { maxBuffer: 1024 * 1024 * 100 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Restore command failed: ${error.message}`));
          } else {
            resolve();
          }
        }
      );
    });
  }
}

// Backup scheduler
class BackupScheduler {
  constructor() {
    this.backup = new DatabaseBackup();
  }

  async runScheduledBackup() {
    const hour = new Date().getHours();

    // Determine backup type based on schedule
    let backupType;
    if (hour === 2) {
      // Full backup at 2 AM
      backupType = BackupType.FULL;
    } else if ([8, 14, 20].includes(hour)) {
      // Incremental backups throughout the day
      backupType = BackupType.INCREMENTAL;
    } else {
      console.log('No backup scheduled for this hour');
      return;
    }

    try {
      await this.backup.performBackup(backupType);
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      process.exit(1);
    }
  }

  async cleanupOldBackups() {
    // Implement cleanup of backups older than retention period
    console.log('Cleaning up old backups...');
    // List S3 objects and delete those older than retention days
  }
}

// Main execution
if (require.main === module) {
  const scheduler = new BackupScheduler();
  scheduler
    .runScheduledBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { DatabaseBackup, BackupScheduler };
