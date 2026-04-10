#!/bin/bash

# MojoBus Update Script für AlmaLinux 9.7
# Schnelle Updates ohne vollständiges Deployment

set -e

APP_DIR="/var/www/mojobus"
APP_USER="nginx"

echo "🔄 Starte MojoBus Update auf AlmaLinux..."
echo "📁 Zielverzeichnis: $APP_DIR"

# 1. Zum Projektverzeichnis wechseln
cd "$APP_DIR"

# 2. Latest code holen
echo "📥 Hole neuesten Code..."
sudo -u $APP_USER git pull origin main

# 3. Dependencies prüfen und bei Bedarf installieren
echo "📦 Prüfe Dependencies..."
if sudo -u $APP_USER npm ci --production --dry-run | grep -q "added"; then
    echo "📦 Installiere neue Dependencies..."
    sudo -u $APP_USER npm ci --production
else
    echo "✅ Dependencies sind aktuell"
fi

# 4. Build für Production
echo "🏗️ Baue für Production..."
sudo -u $APP_USER NODE_ENV=production npm run build

# 5. Nginx neu laden
echo "🔄 Lade Nginx neu..."
sudo systemctl reload nginx

# 6. Health Check
echo "🏥 Führe Health Check durch..."
sleep 2
if curl -f -s "https://mojobus.co/health" > /dev/null; then
    echo "✅ Health Check erfolgreich"
else
    echo "❌ Health Check fehlgeschlagen"
fi

echo "✅ Update abgeschlossen!"
echo "🌐 https://mojobus.co ist aktualisiert"