#!/bin/bash

# Database setup script for Open SSO
echo "🚀 Setting up Open SSO MySQL Database..."

# Database configuration
DB_NAME="opensso"
DB_USER="opensso_user" 
DB_PASSWORD="opensso_password123"
DB_HOST="localhost"
DB_PORT="3306"

echo "📊 Creating database and user..."

# Create database and user
mysql -u root -p << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;
EOF

echo "✅ Database '${DB_NAME}' created successfully!"
echo "✅ User '${DB_USER}' created with full access!"

echo ""
echo "📝 Database Connection Details:"
echo "   Host: ${DB_HOST}"
echo "   Port: ${DB_PORT}"
echo "   Database: ${DB_NAME}"
echo "   Username: ${DB_USER}"
echo "   Password: ${DB_PASSWORD}"
echo ""
echo "🔧 Update your .env file with:"
echo "   DATABASE_URL=\"mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}\""
