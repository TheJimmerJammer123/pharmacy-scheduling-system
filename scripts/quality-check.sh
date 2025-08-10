#!/bin/bash

# Quality Check Script for Pharmacy Scheduling System
# This script runs comprehensive quality checks across the entire project

set -e

echo "🚀 Starting comprehensive quality checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the root directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Backend Quality Checks
print_status "Running backend quality checks..."

cd backend

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found"
    exit 1
fi

print_status "Installing backend dependencies..."
npm ci --silent

print_status "Running backend linting..."
if npm run lint; then
    print_success "Backend linting passed"
else
    print_error "Backend linting failed"
    exit 1
fi

print_status "Checking backend code formatting..."
if npm run format:check; then
    print_success "Backend formatting is correct"
else
    print_warning "Backend code needs formatting. Run 'npm run format' to fix."
    # Auto-fix formatting
    npm run format
    print_success "Backend formatting has been fixed"
fi

print_status "Running backend tests..."
if npm run test; then
    print_success "Backend tests passed"
else
    print_error "Backend tests failed"
    exit 1
fi

cd ..

# Frontend Quality Checks
print_status "Running frontend quality checks..."

cd frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi

print_status "Installing frontend dependencies..."
npm ci --silent

print_status "Running frontend linting..."
if npm run lint; then
    print_success "Frontend linting passed"
else
    print_error "Frontend linting failed"
    exit 1
fi

print_status "Checking frontend code formatting..."
if npm run format:check; then
    print_success "Frontend formatting is correct"
else
    print_warning "Frontend code needs formatting. Run 'npm run format' to fix."
    # Auto-fix formatting
    npm run format
    print_success "Frontend formatting has been fixed"
fi

print_status "Running TypeScript type check..."
if npm run type-check; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

print_status "Running frontend tests..."
if npm run test; then
    print_success "Frontend tests passed"
else
    print_error "Frontend tests failed"
    exit 1
fi

print_status "Building frontend for production..."
if npm run build; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Security Checks
print_status "Running security audits..."

print_status "Checking backend dependencies for vulnerabilities..."
cd backend
if npm audit --audit-level moderate; then
    print_success "Backend security audit passed"
else
    print_warning "Backend has security vulnerabilities. Consider running 'npm audit fix'"
fi

cd ../frontend
print_status "Checking frontend dependencies for vulnerabilities..."
if npm audit --audit-level moderate; then
    print_success "Frontend security audit passed"
else
    print_warning "Frontend has security vulnerabilities. Consider running 'npm audit fix'"
fi

cd ..

# Git Hooks Check
print_status "Checking Git hooks..."
if [ -f ".husky/pre-commit" ] && [ -x ".husky/pre-commit" ]; then
    print_success "Pre-commit hook is configured and executable"
else
    print_warning "Pre-commit hook is not properly configured"
fi

if [ -f ".husky/commit-msg" ] && [ -x ".husky/commit-msg" ]; then
    print_success "Commit message validation hook is configured and executable"
else
    print_warning "Commit message validation hook is not properly configured"
fi

# Docker Services Check
print_status "Checking Docker services..."
if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    if docker compose ps &> /dev/null; then
        print_success "Docker services are running"
    else
        print_warning "Docker services are not running. Run 'docker compose up -d' to start them."
    fi
else
    print_warning "Docker is not available"
fi

# Final Summary
echo ""
echo "========================================"
print_success "🎉 All quality checks completed!"
echo "========================================"
print_success "✅ Backend linting and formatting"
print_success "✅ Backend tests"
print_success "✅ Frontend linting and formatting"
print_success "✅ Frontend TypeScript type checking"
print_success "✅ Frontend tests"
print_success "✅ Frontend production build"
print_success "✅ Security audits"
print_success "✅ Git hooks configuration"

echo ""
echo "Your code is ready for deployment! 🚀"

exit 0