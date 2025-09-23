#!/bin/bash

# Orion ERP Development Startup Script

echo "🚀 Starting Orion ERP Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create .env file for backend if it doesn't exist
if [ ! -f "./backend/.env" ]; then
    echo "📄 Creating backend .env file..."
    cp "./backend/.env.example" "./backend/.env"
    echo "✅ Backend .env file created. Please review and update with your settings."
fi

# Start services with Docker Compose
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Available Services:"
echo "   • Frontend (Next.js):    http://localhost:3000"
echo "   • Backend API (FastAPI): http://localhost:8000"
echo "   • API Documentation:     http://localhost:8000/docs"
echo "   • Database (PostgreSQL): localhost:5432"
echo "   • pgAdmin:               http://localhost:5050"
echo "   • Redis:                 localhost:6379"
echo ""
echo "📚 Useful Commands:"
echo "   • View logs:             docker-compose logs -f"
echo "   • Stop services:         docker-compose down"
echo "   • Restart services:      docker-compose restart"
echo "   • Update containers:     docker-compose up -d --build"
echo ""
echo "🎯 Ready to develop!"