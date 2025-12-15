#!/bin/bash

echo "🚀 Setting up IWC Document Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher) first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup Backend
echo "📦 Setting up backend..."
cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "⚠️  Please update the .env file with your actual configuration values:"
    echo "   - Database URL"
    echo "   - JWT Secret"
    echo "   - Cloudinary credentials"
    echo "   - Email configuration"
    echo ""
    read -p "Press Enter after updating the .env file..."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run prisma:seed

echo "✅ Backend setup complete!"

# Setup Frontend
echo "📦 Setting up frontend..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Check if .env.local file exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
fi

echo "✅ Frontend setup complete!"

cd ..

echo ""
echo "🎉 Setup complete! You can now start the application:"
echo ""
echo "Backend (Terminal 1):"
echo "  cd backend && npm run dev"
echo ""
echo "Frontend (Terminal 2):"
echo "  cd frontend && npm run dev"
echo ""
echo "🔑 Default login credentials:"
echo "  Super Admin: admin@iwc.com / admin123"
echo "  Document Admin: docadmin@iwc.com / docadmin123"
echo "  Team Member: leader@team001.com / member123"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:5000"
echo "  Prisma Studio: npx prisma studio (in backend folder)"
echo ""
echo "Happy coding! 🚀"
