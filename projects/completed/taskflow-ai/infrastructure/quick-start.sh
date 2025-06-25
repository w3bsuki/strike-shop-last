#!/bin/bash

# TaskFlow AI Infrastructure Quick Start Script

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           TaskFlow AI Infrastructure Setup                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

if command_exists docker; then
    echo "✅ Docker: $(docker --version)"
else
    echo "❌ Docker: Not installed"
    echo "   Please install Docker from https://docs.docker.com/get-docker/"
fi

if command_exists docker-compose; then
    echo "✅ Docker Compose: $(docker-compose --version)"
else
    echo "❌ Docker Compose: Not installed"
    echo "   Please install Docker Compose from https://docs.docker.com/compose/install/"
fi

if command_exists kubectl; then
    echo "✅ kubectl: $(kubectl version --client --short 2>/dev/null || echo 'Installed')"
else
    echo "⚠️  kubectl: Not installed (optional for Kubernetes deployment)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Setup environment
if [ ! -f .env ]; then
    echo "Setting up environment..."
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please edit .env file with your configuration"
    echo ""
fi

# Display quick start commands
echo "🚀 Quick Start Commands:"
echo ""
echo "1. Start all services (development):"
echo "   docker-compose up -d"
echo ""
echo "2. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "3. Access services:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Grafana: http://localhost:3001 (admin/admin123)"
echo "   - Prometheus: http://localhost:9090"
echo "   - Flower: http://localhost:5555"
echo ""
echo "4. Stop all services:"
echo "   docker-compose down"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📦 Production Deployment:"
echo ""
echo "1. Build images:"
echo "   docker-compose -f docker-compose.prod.yml build"
echo ""
echo "2. Push to registry:"
echo "   docker-compose -f docker-compose.prod.yml push"
echo ""
echo "3. Deploy to Kubernetes:"
echo "   cd infrastructure/kubernetes"
echo "   ./deploy.sh production"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📚 Documentation:"
echo "   See infrastructure/README.md for detailed documentation"
echo ""

# Ask if user wants to start services
read -p "Would you like to start the development environment now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting services..."
    docker-compose up -d
    echo ""
    echo "✅ Services are starting up!"
    echo "   Run 'docker-compose ps' to check status"
    echo "   Run 'docker-compose logs -f' to view logs"
fi