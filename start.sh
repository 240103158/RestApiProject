#!/bin/bash
# Quick Start Script for Blog Posts Frontend

echo "🚀 Starting Blog Posts Application..."
echo ""

# Check if PostgreSQL is running
echo "✓ Checking PostgreSQL connection..."
if ! nc -z localhost 5434; then
    echo "⚠️  PostgreSQL не найден на localhost:5434"
    echo "Пожалуйста, убедитесь что PostgreSQL запущен"
    exit 1
fi

echo "✓ PostgreSQL найден"
echo ""

# Build and run
echo "🔨 Building project..."
cd /Users/bakdauletomirzak/IdeaProjects/RestApiProject

# Clean build
mvn clean compile

if [ $? -eq 0 ]; then
    echo "✓ Build successful"
    echo ""
    echo "🚀 Starting Spring Boot application..."
    mvn spring-boot:run
else
    echo "❌ Build failed"
    exit 1
fi

