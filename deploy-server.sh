#!/bin/bash

# MojoBus Deployment direkt auf Server
# Für bereits existierendes Repository auf AlmaLinux

set -e

# Konfiguration
APP_NAME="mojobus"
APP_DIR="/var/www/$APP_NAME"
APP_DOMAIN="mojobus.cc"
APP_USER="nginx"
NODE_ENV="production"

echo "🚀 Starte Server-seitiges Deployment..."

# 1. Im Projektverzeichnis sein
cd "$APP_DIR" || {
    echo "❌ Konnte nicht in Verzeichnis wechseln: $APP_DIR"
    exit 1
}

# 2. Repository sauber machen
echo "🧹 Räume Repository auf..."
git reset --hard HEAD
git clean -fd

# 3. Latest holen
echo "📥 Hole neuesten Code..."
git pull origin main || {
    echo "❌ Git Pull fehlgeschlagen"
    exit 1
}

# 4. Dependencies prüfen und installieren
echo "📦 Prüfe Dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/package.json" ]; then
    echo "📦 Installiere Dependencies..."
    npm ci --production
else
    echo "✅ Dependencies sind aktuell"
fi

# 5. Build für Production
echo "🏗️ Baue für Production..."
NODE_ENV=production npm run build || {
    echo "❌ Build fehlgeschlagen"
    exit 1
}

# 6. Build prüfen
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Build erzeugte kein gültiges dist/ Verzeichnis"
    exit 1
fi

# 7. Berechtigungen setzen
echo "🔐 Setze Berechtigungen..."
chown -R $APP_USER:$APP_USER dist/
chmod -R 755 dist/

# 8. Nginx neu laden
echo "🔄 Lade Nginx neu..."
systemctl reload nginx

# 9. Health Check
echo "🏥 Führe Health Check durch..."
sleep 3
if curl -f -s "http://localhost/health" > /dev/null; then
    echo "✅ HTTP Health Check erfolgreich"
else
    echo "⚠️ HTTP Health Check fehlgeschlagen"
fi

if curl -f -s -k "https://$APP_DOMAIN/health" > /dev/null; then
    echo "✅ HTTPS Health Check erfolgreich"
else
    echo "⚠️ HTTPS Health Check fehlgeschlagen"
fi

echo ""
echo "🎉 Deployment abgeschlossen!"
echo "🌐 Anwendung live unter: https://$APP_DOMAIN"
echo "📊 Logs: journalctl -u nginx -f"