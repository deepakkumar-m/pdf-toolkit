#!/bin/bash

# Quick Setup Script for Local Development

echo "=========================================="
echo "  PDF Toolkit - Local Development Setup"
echo "=========================================="
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
  echo "Creating .env from example..."
  cp .env.example .env
  echo "✅ Created backend/.env"
  echo "   Edit this file to set FRONTEND_URL if needed"
else
  echo "⚠️  backend/.env already exists, skipping..."
fi

if [ ! -d "node_modules" ]; then
  echo "Installing backend dependencies..."
  npm install
  echo "✅ Backend dependencies installed"
else
  echo "✅ Backend dependencies already installed"
fi

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."

if [ ! -f ".env.local" ]; then
  echo "Creating .env.local from example..."
  cp .env.local.example .env.local
  echo "✅ Created .env.local"
else
  echo "⚠️  .env.local already exists, skipping..."
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo "=========================================="
echo ""
echo "To start development:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  npm run dev"
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "⚠️  Note: Make sure Ghostscript is installed:"
echo "  macOS: brew install ghostscript"
echo "  Ubuntu: sudo apt-get install ghostscript"
echo ""
