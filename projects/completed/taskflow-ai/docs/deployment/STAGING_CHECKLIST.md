# TaskFlow AI Staging Deployment Checklist

## Pre-Deployment Setup

### 1. Server Preparation
- [ ] Provision Ubuntu 20.04+ server with minimum 4GB RAM, 2 CPU cores
- [ ] Ensure 50GB+ available disk space
- [ ] Configure server firewall (ports 22, 80, 443)
- [ ] Run server setup script: `./infrastructure/scripts/setup-staging-server.sh`
- [ ] Reboot server after setup completion

### 2. DNS Configuration
- [ ] Create A records for:
  - `staging.taskflow-ai.dev` → Server IP
  - `staging-api.taskflow-ai.dev` → Server IP
- [ ] Verify DNS propagation: `nslookup staging.taskflow-ai.dev`

### 3. GitHub Repository Setup
- [ ] Configure GitHub Actions secrets:
  - [ ] `STAGING_HOST` - Server IP or hostname
  - [ ] `STAGING_USER` - SSH username (typically the sudo user)
  - [ ] `STAGING_SSH_KEY` - Private SSH key (base64 encoded)
  - [ ] `STAGING_KNOWN_HOSTS` - Server's SSH host key
  - [ ] `SLACK_WEBHOOK` - Slack webhook for deployment notifications

### 4. Environment Configuration
- [ ] Copy `.env.staging` template to server
- [ ] Generate secure secrets:
  ```bash
  # SECRET_KEY
  openssl rand -hex 32
  
  # JWT_SECRET_KEY  
  openssl rand -hex 32
  
  # Database passwords
  openssl rand -base64 32
  
  # Redis password
  openssl rand -base64 32
  ```
- [ ] Configure external service credentials:
  - [ ] OpenAI API key
  - [ ] SendGrid/Email service credentials
  - [ ] Sentry DSN
  - [ ] AWS S3 credentials (for backups)
  - [ ] Grafana admin credentials

### 5. Third-Party Service Setup
- [ ] **Sentry**: Create new project for staging environment
- [ ] **SendGrid**: Configure API key and verified sender domain
- [ ] **AWS S3**: Create backup bucket with appropriate lifecycle policies
- [ ] **Slack**: Set up #deployments channel and webhook

## Deployment Process

### 6. Initial Deployment
- [ ] Push code to `develop` branch to trigger automatic deployment
- [ ] OR manually run "Deploy to Staging" GitHub Action
- [ ] Monitor deployment logs in GitHub Actions

### 7. SSL Certificate Setup
- [ ] Verify HTTP deployment first: `curl http://staging.taskflow-ai.dev/health`
- [ ] Request Let's Encrypt certificates:
  ```bash
  docker-compose -f docker-compose.staging.yml run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email=devops@taskflow-ai.dev --agree-tos --no-eff-email \
    -d staging.taskflow-ai.dev -d staging-api.taskflow-ai.dev
  ```
- [ ] Restart nginx with SSL: `docker-compose -f docker-compose.staging.yml restart nginx`

### 8. Post-Deployment Verification
- [ ] **Health Checks**:
  - [ ] Frontend: `https://staging.taskflow-ai.dev`
  - [ ] Backend API: `https://staging-api.taskflow-ai.dev/health`
  - [ ] Database: `https://staging-api.taskflow-ai.dev/health/detailed`
  - [ ] WebSocket: Test real-time features

- [ ] **Service Status**:
  ```bash
  docker-compose -f docker-compose.staging.yml ps
  docker-compose -f docker-compose.staging.yml logs --tail=50
  ```

- [ ] **Database Migrations**:
  ```bash
  docker-compose -f docker-compose.staging.yml exec backend alembic current
  ```

### 9. Monitoring Setup Verification
- [ ] **Prometheus**: Verify targets at `http://internal-ip:9090/targets`
- [ ] **Grafana**: Access at `https://staging.taskflow-ai.dev/grafana`
  - [ ] Login with configured admin credentials
  - [ ] Verify data sources are connected
  - [ ] Check dashboard displays metrics
- [ ] **Logs**: Verify log aggregation in Grafana Explore → Loki

### 10. Security Verification
- [ ] SSL Grade: Test at [SSL Labs](https://www.ssllabs.com/ssltest/)
- [ ] Security Headers: Test at [Security Headers](https://securityheaders.com/)
- [ ] Firewall: Verify only ports 22, 80, 443 are open
- [ ] Fail2ban: Check status `sudo systemctl status fail2ban`

## Monitoring and Alerts

### 11. Alert Configuration
- [ ] **Uptime Monitoring**: Verify blackbox exporter targets
- [ ] **SSL Expiry**: Confirm certificate monitoring
- [ ] **Resource Alerts**: CPU, Memory, Disk usage thresholds
- [ ] **Application Alerts**: Error rates, response times
- [ ] **Database Alerts**: Connection pool, query performance

### 12. Backup Verification
- [ ] **Automated Backups**: Verify daily backup schedule
- [ ] **S3 Upload**: Check backup files in S3 bucket
- [ ] **Retention Policy**: Confirm old backups are cleaned up
- [ ] **Test Restore**: Perform test restoration (optional)

## Documentation and Handover

### 13. Documentation Updates
- [ ] Update team wiki with staging environment details
- [ ] Share Grafana dashboard URLs with team
- [ ] Document any environment-specific configurations
- [ ] Create incident response procedures

### 14. Team Access
- [ ] **Grafana Access**: Share admin credentials securely
- [ ] **SSH Access**: Add team members' public keys
- [ ] **GitHub Actions**: Ensure team can trigger deployments
- [ ] **Monitoring**: Set up PagerDuty/Slack alert channels

### 15. Testing and Sign-off
- [ ] **Smoke Testing**: Run basic application tests
- [ ] **Performance Testing**: Verify response times under load
- [ ] **Security Testing**: Run basic security scans
- [ ] **User Acceptance**: Get stakeholder approval
- [ ] **Go-Live Approval**: Final sign-off from team lead

## Maintenance and Operations

### 16. Regular Maintenance
- [ ] **Weekly**: Review logs and performance metrics
- [ ] **Monthly**: Security updates and backup verification  
- [ ] **Quarterly**: SSL certificate renewal check
- [ ] **As Needed**: Scale resources based on usage

### 17. Emergency Procedures
- [ ] Document rollback procedures
- [ ] Set up incident response team contacts
- [ ] Create emergency access procedures
- [ ] Test disaster recovery scenarios

## Success Criteria

✅ **Deployment Successful When**:
- [ ] All services are running and healthy
- [ ] HTTPS is working with valid certificates
- [ ] Application features work as expected
- [ ] Monitoring shows green status across all metrics
- [ ] Team can access all necessary systems
- [ ] Documentation is complete and shared

## Troubleshooting Quick Reference

### Common Issues:
1. **SSL Certificate Issues**: Check certbot logs and DNS configuration
2. **Database Connection**: Verify environment variables and network connectivity
3. **Container Startup**: Check resource limits and dependency health
4. **Monitoring Gaps**: Verify exporter configurations and network access

### Emergency Contacts:
- **DevOps Lead**: [contact-info]
- **Backend Team**: [contact-info]
- **Infrastructure Team**: [contact-info]
- **On-Call Engineer**: [contact-info]

---

**Last Updated**: [Date]  
**Next Review**: [Date + 1 month]