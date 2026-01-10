#!/bin/bash

# MojoBus Update Script
# Für schnelle Updates ohne full deployment

set -e

APP_DIR="/var/www/mojobus"
APP_USER="www-data"

echo "🔄 Starte MojoBus Update..."

cd $APP_DIR

# Latest code holen
echo "📥 Hole neuesten Code..."
sudo -u $APP_USER git pull origin main

# Dependencies installieren (falls neue)
echo "📦 Installiere Dependencies..."
sudo -u $APP_USER npm ci --production

# Build
echo "🏗️ Baue Anwendung..."
sudo -u $APP_USER npm run build

# Nginx neu laden
echo "🔄 Lade Nginx neu..."
systemctl reload nginx

echo "✅ Update abgeschlossen!"
echo "🌐 https://mojobus.cc aktualisiert"