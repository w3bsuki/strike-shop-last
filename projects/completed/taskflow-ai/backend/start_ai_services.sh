#!/bin/bash

echo "🤖 Starting TaskFlow AI Services..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your OPENAI_API_KEY"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "^OPENAI_API_KEY=sk-" .env; then
    echo "❌ OPENAI_API_KEY not configured in .env file"
    echo "   Please add: OPENAI_API_KEY=sk-your-key-here"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    exit 1
fi

echo "✅ Environment configuration found"

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "⚠️  Redis not running. Starting Redis..."
    redis-server --daemonize yes
    sleep 2
    
    if pgrep -x "redis-server" > /dev/null; then
        echo "✅ Redis started successfully"
    else
        echo "❌ Failed to start Redis. Please install and start Redis manually:"
        echo "   brew install redis && redis-server"
        echo "   # or"
        echo "   sudo apt-get install redis-server && redis-server"
        exit 1
    fi
else
    echo "✅ Redis is already running"
fi

# Start Celery worker in background
echo "🔧 Starting Celery worker..."
celery -A app.worker.celery_app worker --loglevel=info --detach

# Wait a moment for worker to start
sleep 3

# Check if Celery worker is running
if pgrep -f "celery.*worker" > /dev/null; then
    echo "✅ Celery worker started successfully"
else
    echo "⚠️  Celery worker may not have started properly"
fi

echo ""
echo "🚀 Starting FastAPI server..."
echo "   API Documentation: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
echo "   AI Features: http://localhost:8000/api/v1/tasks/"
echo ""

# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000