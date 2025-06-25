# TaskFlow AI Staging Deployment Guide

This guide covers the deployment process for TaskFlow AI to the staging environment at `staging.taskflow-ai.dev`.

## Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or later
- Docker 20.10+ and Docker Compose 2.0+
- Minimum 4GB RAM, 2 CPU cores
- 50GB available disk space
- Open ports: 80, 443

### Required Secrets (GitHub Actions)
Configure these secrets in your GitHub repository settings:

- `STAGING_HOST`: Staging server IP/hostname
- `STAGING_USER`: SSH user for deployment
- `STAGING_SSH_KEY`: Private SSH key for authentication
- `STAGING_KNOWN_HOSTS`: SSH known_hosts entry
- `SLACK_WEBHOOK`: Slack webhook URL for notifications

## Environment Configuration

### 1. Create `.env.staging` file
Copy `.env.staging` template and fill in the values:

```bash
cp .env.staging.example .env.staging
```

Required environment variables:
- Database credentials
- Redis password
- JWT secrets
- OpenAI API key
- Email service credentials
- Sentry DSN
- AWS S3 credentials (for backups)

### 2. Generate Secure Secrets

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate JWT_SECRET_KEY
openssl rand -hex 32

# Generate database passwords
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32
```

## Deployment Process

### Automatic Deployment (via GitHub Actions)

1. **Merge to develop branch**: Automatic deployment triggers
2. **Manual deployment**: Run the "Deploy to Staging" workflow manually

The GitHub Actions workflow will:
- Build and push Docker images to GitHub Container Registry
- SSH into the staging server
- Pull latest images
- Run database migrations
- Start all services
- Perform health checks

### Manual Deployment

1. **SSH into staging server**:
```bash
ssh user@staging.taskflow-ai.dev
```

2. **Clone repository** (first time only):
```bash
git clone https://github.com/your-org/taskflow-ai.git
cd taskflow-ai
```

3. **Run deployment script**:
```bash
./infrastructure/scripts/deploy-staging.sh
```

## SSL Certificate Setup

### Initial Setup with Let's Encrypt

1. **First deployment** (HTTP only):
```bash
# Deploy without SSL first
docker-compose -f docker-compose.staging.yml up -d nginx
```

2. **Request certificates**:
```bash
docker-compose -f docker-compose.staging.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email=devops@taskflow-ai.dev \
  --agree-tos \
  --no-eff-email \
  -d staging.taskflow-ai.dev \
  -d staging-api.taskflow-ai.dev
```

3. **Restart nginx with SSL**:
```bash
docker-compose -f docker-compose.staging.yml restart nginx
```

### Certificate Renewal
Certificates auto-renew via the certbot container. Manual renewal:
```bash
docker-compose -f docker-compose.staging.yml run --rm certbot renew
```

## Monitoring Setup

### Access Points
- **Application**: https://staging.taskflow-ai.dev
- **API**: https://staging-api.taskflow-ai.dev
- **Grafana**: https://staging.taskflow-ai.dev/grafana (requires auth)
- **Prometheus**: Internal only (port 9090)

### Grafana Configuration

1. **Default credentials**:
   - Username: Set in `GRAFANA_USER`
   - Password: Set in `GRAFANA_PASSWORD`

2. **Dashboards automatically provisioned**:
   - Application Overview
   - System Metrics
   - Database Performance
   - API Performance
   - Log Analysis

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service
docker-compose -f docker-compose.staging.yml logs -f backend

# Aggregate logs via Loki
# Access through Grafana Explore tab
```

## Database Management

### Backups

Automated backups run daily at 2 AM UTC:
- Local retention: 7 days
- S3 uploads: 30 days retention

Manual backup:
```bash
docker-compose -f docker-compose.staging.yml exec postgres-backup \
  /scripts/perform-backup.sh
```

### Restore from Backup

```bash
# List available backups
ls -la ~/taskflow-ai/backups/

# Restore specific backup
docker-compose -f docker-compose.staging.yml exec postgres-backup \
  /scripts/backup-entrypoint.sh restore /backups/backup_file.sql.gz
```

### Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.staging.yml exec backend \
  alembic upgrade head

# Create new migration
docker-compose -f docker-compose.staging.yml exec backend \
  alembic revision --autogenerate -m "Description"
```

## Health Checks

### Endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed health with dependencies
- `/ready` - Readiness probe
- `/live` - Liveness probe
- `/metrics` - Prometheus metrics

### Manual Health Check
```bash
# Backend health
curl https://staging-api.taskflow-ai.dev/health

# Frontend health
curl https://staging.taskflow-ai.dev/api/health

# Detailed health
curl https://staging-api.taskflow-ai.dev/health/detailed
```

## Troubleshooting

### Common Issues

1. **Container won't start**:
```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs [service-name]

# Check container status
docker-compose -f docker-compose.staging.yml ps
```

2. **Database connection issues**:
```bash
# Test database connection
docker-compose -f docker-compose.staging.yml exec backend \
  python -c "from app.core.database import engine; print('DB OK')"
```

3. **SSL certificate issues**:
```bash
# Check certificate status
docker-compose -f docker-compose.staging.yml exec nginx \
  openssl x509 -in /etc/letsencrypt/live/staging.taskflow-ai.dev/cert.pem -text -noout
```

### Emergency Rollback

```bash
# Stop current deployment
docker-compose -f docker-compose.staging.yml down

# Restore from backup
./infrastructure/scripts/restore-backup.sh [timestamp]

# Start previous version
docker-compose -f docker-compose.staging.yml up -d
```

## Security Considerations

1. **Firewall Rules**:
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

2. **Fail2ban Configuration**:
```bash
# Install fail2ban
sudo apt-get install fail2ban

# Configure for nginx
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
```

3. **Regular Updates**:
```bash
# System updates
sudo apt-get update && sudo apt-get upgrade

# Docker updates
docker system prune -a -f
docker-compose -f docker-compose.staging.yml pull
```

## Monitoring Alerts

Alerts are configured in Prometheus for:
- Service availability
- High error rates
- Resource usage
- SSL certificate expiry
- Database/Redis connectivity

Configure alert notifications in AlertManager or integrate with PagerDuty/Slack.

## Performance Tuning

### Nginx Optimization
- Gzip compression enabled
- Static file caching
- Rate limiting configured
- Connection limits set

### Database Optimization
- Connection pooling configured
- Query performance monitoring via Prometheus
- Regular VACUUM operations scheduled

### Application Optimization
- Redis caching enabled
- Celery workers auto-scale based on load
- API rate limiting enforced

## Maintenance Windows

Recommended maintenance schedule:
- **Weekly**: Log rotation, cleanup old containers
- **Monthly**: Security updates, certificate renewal check
- **Quarterly**: Full system backup, performance review

## Support

For deployment issues:
1. Check logs and health endpoints
2. Review this documentation
3. Contact DevOps team on Slack: #taskflow-devops
4. Create issue in GitHub with `deployment` label