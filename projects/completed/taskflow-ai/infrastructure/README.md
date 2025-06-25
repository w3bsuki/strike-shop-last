# TaskFlow AI Infrastructure

This directory contains all infrastructure configuration for TaskFlow AI, including Docker, Kubernetes, and CI/CD pipelines.

## Directory Structure

```
infrastructure/
├── docker/           # Docker-related configurations
│   ├── postgres/     # PostgreSQL initialization scripts
│   ├── prometheus/   # Prometheus configuration and alerts
│   └── grafana/      # Grafana provisioning
├── kubernetes/       # Kubernetes manifests
│   ├── base/         # Base Kubernetes resources
│   └── overlays/     # Environment-specific overlays
│       ├── production/
│       └── staging/
└── nginx/           # Nginx configurations
    ├── nginx.conf    # Development nginx config
    ├── nginx.prod.conf # Production nginx config
    └── conf.d/       # Additional nginx configurations
```

## Local Development

### Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose v2.0+
- At least 8GB RAM allocated to Docker

### Quick Start

1. Clone the repository
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your configuration
4. Start the services:
   ```bash
   docker-compose up -d
   ```

### Services

The local development environment includes:
- **Frontend** (Next.js): http://localhost:3000
- **Backend API** (FastAPI): http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Flower** (Celery monitoring): http://localhost:5555

### Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild services
docker-compose build

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access PostgreSQL
docker-compose exec postgres psql -U taskflow

# Access Redis CLI
docker-compose exec redis redis-cli -a redis123
```

## Production Deployment

### Kubernetes Deployment

#### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3 (for cert-manager and nginx-ingress)

#### Initial Setup

1. Install cert-manager:
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

2. Install nginx-ingress:
   ```bash
   helm upgrade --install ingress-nginx ingress-nginx \
     --repo https://kubernetes.github.io/ingress-nginx \
     --namespace ingress-nginx --create-namespace
   ```

3. Create cluster issuer for Let's Encrypt:
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   EOF
   ```

#### Deploy to Production

1. Navigate to the kubernetes directory:
   ```bash
   cd infrastructure/kubernetes
   ```

2. Copy and configure secrets:
   ```bash
   cp overlays/production/secrets.env.example overlays/production/secrets.env
   # Edit secrets.env with your production values
   ```

3. Deploy:
   ```bash
   ./deploy.sh production
   ```

### GitHub Actions CI/CD

The CI/CD pipeline automatically:
1. Runs tests for both frontend and backend
2. Builds Docker images
3. Pushes images to GitHub Container Registry
4. Deploys to staging (on develop branch)
5. Deploys to production (on release)

#### Setup GitHub Secrets

Add these secrets in your GitHub repository settings:
- `GITHUB_TOKEN`: Already available, used for package registry
- `PRODUCTION_KUBECONFIG`: Your production cluster kubeconfig
- `STAGING_KUBECONFIG`: Your staging cluster kubeconfig

## Monitoring

### Prometheus Metrics

Custom metrics exposed by the backend:
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration histogram
- `task_operations_total`: Task CRUD operations
- `celery_task_duration_seconds`: Celery task execution time
- `websocket_connections`: Active WebSocket connections

### Grafana Dashboards

Pre-configured dashboards:
- Application Overview
- API Performance
- Database Performance
- Redis Metrics
- Celery Workers
- System Resources

### Alerts

Configured alerts include:
- Service down (Backend, Database, Redis)
- High error rate (>5%)
- High latency (>500ms p95)
- Database connection pool exhaustion
- Redis memory usage (>90%)
- Disk space low (<20%)
- High CPU/Memory usage

## Security Considerations

1. **Secrets Management**: Use Kubernetes secrets or external secret managers
2. **Network Policies**: Implement strict network policies in production
3. **RBAC**: Configure proper role-based access control
4. **TLS**: All traffic encrypted with TLS 1.3
5. **Rate Limiting**: Implemented at nginx level
6. **Security Headers**: CSP, HSTS, X-Frame-Options configured

## Troubleshooting

### Common Issues

1. **Pod not starting**: Check logs with `kubectl logs -n taskflow <pod-name>`
2. **Database connection issues**: Verify DATABASE_URL and network connectivity
3. **Image pull errors**: Check image pull secrets configuration
4. **Ingress not working**: Verify DNS and certificate status

### Debug Commands

```bash
# Check pod status
kubectl get pods -n taskflow

# Describe a pod
kubectl describe pod -n taskflow <pod-name>

# Check events
kubectl get events -n taskflow --sort-by='.lastTimestamp'

# Execute into a pod
kubectl exec -it -n taskflow <pod-name> -- /bin/sh

# Check ingress
kubectl get ingress -n taskflow
kubectl describe ingress -n taskflow taskflow-ingress

# Check certificates
kubectl get certificate -n taskflow
```

## Backup and Restore

### Database Backup

```bash
# Create backup
kubectl exec -n taskflow postgres-0 -- pg_dump -U taskflow taskflow > backup.sql

# Restore backup
kubectl exec -i -n taskflow postgres-0 -- psql -U taskflow taskflow < backup.sql
```

### Persistent Volume Backup

Consider using tools like Velero for comprehensive backup solutions.

## Performance Tuning

1. **Database**: Configure connection pooling and optimize queries
2. **Redis**: Set appropriate memory limits and eviction policies
3. **Kubernetes**: Configure HPA based on metrics
4. **Nginx**: Tune worker processes and connections
5. **Application**: Use caching and optimize API responses

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check Prometheus/Grafana metrics
4. Contact the DevOps team