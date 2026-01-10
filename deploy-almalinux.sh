#!/bin/bash

# MojoBus Deployment Script für AlmaLinux 9.7
# Ziel: https://mojobus.cc

set -e  # Bei Fehlern abbrechen

# Konfiguration
APP_NAME="mojobus"
APP_DIR="/var/www/$APP_NAME"
APP_DOMAIN="mojobus.cc"
APP_USER="nginx"  # Standard nginx user auf AlmaLinux
NGINX_CONF_DIR="/etc/nginx/conf.d"

echo "🚀 Starte $APP_NAME Deployment auf AlmaLinux..."
echo "📁 Zielverzeichnis: $APP_DIR"
echo "🌐 Ziel-Domain: $APP_DOMAIN"

# 1. System-Update (optional, aber empfohlen)
echo "📦 System-Update wird geprüft..."
if ! command -v dnf &> /dev/null; then
    echo "❌ DNF nicht gefunden. Bitte dnf installieren."
    exit 1
fi

# 2. Projektverzeichnis erstellen und Berechtigungen setzen
echo "📁 Erstelle Projektverzeichnis..."
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
fi
chown -R $APP_USER:$APP_USER "$APP_DIR"
chmod -R 755 "$APP_DIR"

# 3. In Projektverzeichnis wechseln
cd "$APP_DIR"

# 4. Git Repository vorbereiten
echo "📥 Bereite Git Repository vor..."
if [ -d ".git" ]; then
    echo "🔄 Bestehendes Repository gefunden - hole Updates..."
    sudo -u $APP_USER git pull origin main
else
    echo "📦 Klone Repository neu..."
    rm -rf "$APP_DIR"/*
    sudo -u $APP_USER git clone https://github.com/dein-username/mojobus.git .
fi

# 5. Node.js Version prüfen
echo "📝 Prüfe Node.js Version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nicht gefunden. Installiere Node.js 18..."
    sudo dnf module enable nodejs:18 -y
    sudo dnf install nodejs -y
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
echo "✅ Node.js Version: $NODE_VERSION"

# 6. Nginx installieren (falls nicht vorhanden)
if ! command -v nginx &> /dev/null; then
    echo "🌐 Installiere Nginx..."
    sudo dnf install nginx -y
fi

# 7. Certbot für SSL installieren
if ! command -v certbot &> /dev/null; then
    echo "🔒 Installiere Certbot und Nginx SSL Modul..."
    sudo dnf install certbot python3-certbot-nginx -y
fi

# 8. Dependencies installieren
echo "📦 Installiere Build-Dependencies..."
sudo -u $APP_USER npm ci --production

# 9. Build für Production
echo "🏗️ Baue für Production..."
sudo -u $APP_USER NODE_ENV=production npm run build

# 10. Nginx Konfiguration einrichten
echo "⚙️ Installiere Nginx Konfiguration..."
if [ ! -f "$NGINX_CONF_DIR/mojobus.conf" ]; then
    sudo mkdir -p "$NGINX_CONF_DIR"
    # Erstelle Konfigurationsdatei aus unserer Vorlage
    sudo cp "$APP_DIR/mojobus-almalinux.conf" "$NGINX_CONF_DIR/mojobus.conf"
fi

# Konfiguration testen
echo "✅ Teste Nginx Konfiguration..."
sudo nginx -t

# 11. Nginx aktivieren und starten
echo "🔄 Aktiviere und starte Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# 12. SSL Zertifikat erstellen (falls nicht vorhanden)
if [ ! -f "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" ]; then
    echo "🔒 Erstelle SSL Zertifikat für $APP_DOMAIN..."
    sudo certbot --nginx -d "$APP_DOMAIN" -d "www.$APP_DOMAIN" --non-interactive --agree-tos --email dein-email@mojobus.cc --redirect
fi

# 13. Firewall für HTTP/HTTPS öffnen
echo "🔥 Konfiguriere Firewall..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# 14. Berechtigungen sicherstellen
echo "🔐 Berechtigungen korrigieren..."
chown -R $APP_USER:$APP_USER "$APP_DIR"
find "$APP_DIR" -type d -exec chmod 755 {} \;
find "$APP_DIR" -type f -exec chmod 644 {} \;

# 15. Nginx neu starten
echo "🔄 Nginx neu starten..."
sudo systemctl restart nginx

# 16. Health Check
echo "🏥 Führe Health Check durch..."
sleep 5
if curl -f -s "http://$APP_DOMAIN/health" > /dev/null; then
    echo "✅ HTTP Health Check OK"
else
    echo "❌ HTTP Health Check fehlgeschlagen"
fi

if curl -f -s -k "https://$APP_DOMAIN/health" > /dev/null; then
    echo "✅ HTTPS Health Check OK"
else
    echo "❌ HTTPS Health Check fehlgeschlagen"
fi

# 17. Service Status prüfen
echo "📊 Service Status:"
systemctl is-active nginx && echo "✅ Nginx: Aktiv" || echo "❌ Nginx: Inaktiv"
systemctl is-enabled nginx && echo "✅ Nginx: Autostart aktiv" || echo "❌ Nginx: Autostart inaktiv"

echo ""
echo "🎉 Deployment abgeschlossen!"
echo "🌐 Deine Anwendung ist live auf: https://$APP_DOMAIN"
echo ""
echo "📊 Nützliche Commands:"
echo "  - Logs ansehen:     sudo journalctl -u nginx -f"
echo "  - Nginx neu starten:  sudo systemctl restart nginx"
echo "  - Konfiguration testen: sudo nginx -t"
echo "  - SSL erneuern:     sudo certbot renew"
echo "  - Update durchführen:  sudo -u nginx /var/www/mojobus/update.sh"
echo ""
echo "🔄 Für Updates nutze: cd $APP_DIR && sudo -u nginx update.sh"