#!/bin/bash

# TaskFlow AI Kubernetes Deployment Script

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="taskflow"

echo "Deploying TaskFlow AI to $ENVIRONMENT environment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if the cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "Cannot connect to Kubernetes cluster. Please configure kubectl."
    exit 1
fi

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create image pull secret for GitHub Container Registry
if [ ! -z "$GITHUB_TOKEN" ]; then
    kubectl create secret docker-registry ghcr-secret \
        --docker-server=ghcr.io \
        --docker-username=$GITHUB_USERNAME \
        --docker-password=$GITHUB_TOKEN \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
else
    echo "Warning: GITHUB_TOKEN not set. Skipping image pull secret creation."
fi

# Deploy based on environment
case $ENVIRONMENT in
    production)
        echo "Deploying to production..."
        if [ ! -f "overlays/production/secrets.env" ]; then
            echo "Error: overlays/production/secrets.env not found."
            echo "Please copy secrets.env.example to secrets.env and fill in the values."
            exit 1
        fi
        kubectl apply -k overlays/production/
        ;;
    staging)
        echo "Deploying to staging..."
        kubectl apply -k overlays/staging/
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        echo "Usage: ./deploy.sh [production|staging]"
        exit 1
        ;;
esac

echo "Waiting for deployments to be ready..."
kubectl wait --namespace=$NAMESPACE --for=condition=available --timeout=600s deployment --all

echo "Deployment complete!"
echo ""
echo "To check the status:"
echo "  kubectl get all -n $NAMESPACE"
echo ""
echo "To view logs:"
echo "  kubectl logs -n $NAMESPACE -l app=backend"
echo "  kubectl logs -n $NAMESPACE -l app=frontend"
echo ""
echo "To access the application:"
echo "  kubectl get ingress -n $NAMESPACE"