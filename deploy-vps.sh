#!/bin/bash

# MojoBus VPS Deployment Script
# Für VPS mit Cemminmodul
# Ziel: https://mojobus.cc

set -e  # Bei Fehlern abbrechen

# Konfiguration
APP_NAME="mojobus"
APP_DIR="/var/www/$APP_NAME"
APP_DOMAIN="mojobus.cc"
APP_USER="www-data"  # Standard Web-User
NGINX_USER="www-data"
NODE_ENV="production"

echo "🚀 Starte $APP_NAME Deployment auf VPS..."
echo "📁 Zielverzeichnis: $APP_DIR"
echo "🌐 Ziel-Domain: $APP_DOMAIN"

# 1. Web-User sicherstellen (falls nicht vorhanden)
if ! id "$APP_USER" &>/dev/null; then
    echo "📝 Erstelle Web-User: $APP_USER"
    adduser --system --no-create-home --home $APP_DIR $APP_USER
fi

# 2. Verzeichnis erstellen und Berechtigungen setzen
echo "📁 Erstelle Verzeichnisstruktur..."
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR

# 3. Repository vorbereiten (im richtigen Verzeichnis)
echo "📥 Bereite Repository vor..."
cd $APP_DIR

# Falls es ein Git-Repo ist, updates holen
if [ -d ".git" ]; then
    echo "📦 Bestehendes Repository gefunden - hole Updates..."
    sudo -u $APP_USER git pull origin main
else
    echo "📦 Klonne Repository neu..."
    # Alten Inhalt entfernen
    rm -rf $APP_DIR/*
    sudo -u $APP_USER git clone https://github.com/dein-username/mojobus.git .
fi

# 4. Dependencies installieren
echo "📦 Installiere Dependencies..."
sudo -u $APP_USER npm ci --production

# 5. Build für Production
echo "🏗️ Baue für Production..."
sudo -u $APP_USER NODE_ENV=$NODE_ENV npm run build

# 6. Nginx Konfiguration erstellen
echo "⚙️ Erstelle Nginx Konfiguration..."
cat > /etc/nginx/sites-available/$APP_NAME.conf << 'EOF'
# MojoBus Nginx Configuration
server {
    listen 80;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    # Redirect zu HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    root $APP_DIR/dist;
    index index.html;
    
    # SSL Konfiguration (Certbot wird diese erstellen)
    ssl_certificate /etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$APP_DOMAIN/privkey.pem;
    
    # SSL Optimierungen
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Static Asset Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        access_log off;
    }
    
    # SPA Router Support
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security Headers für SPA
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
    }
    
    # Health Check für Monitoring
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Error Pages
    error_page 404 /index.html;
    
    # Logging (nur für Fehler)
    error_log /var/log/nginx/$APP_NAME.error.log warn;
    access_log /var/log/nginx/$APP_NAME.access.log combined;
}
EOF

# 7. Seite aktivieren
echo "🔗 Aktiviere Nginx Seite..."
ln -sf /etc/nginx/sites-available/$APP_NAME.conf /etc/nginx/sites-enabled/

# 8. Konfiguration testen
echo "✅ Teste Nginx Konfiguration..."
nginx -t && echo "✅ Konfiguration gültig!" || {
    echo "❌ Nginx Konfiguration enthält Fehler!"
    exit 1
}

# 9. Berechtigungen korrigieren
echo "🔐 Setze Berechtigungen..."
chown -R $APP_USER:$NGINX_USER $APP_DIR
chmod -R 755 $APP_DIR
find $APP_DIR -type d -exec chmod 755 {} \;
find $APP_DIR -type f -exec chmod 644 {} \;

# 10. Nginx neu laden
echo "🔄 Lade Nginx neu..."
systemctl reload nginx

# 11. Bereit für SSL
echo "🔒 Bereite SSL vor..."
# Check ob Certbot installiert ist
if ! command -v certbot &> /dev/null; then
    echo "📦 Installiere Certbot..."
    apt update && apt install -y certbot python3-certbot-nginx
fi

echo "✅ Deployment abgeschlossen!"
echo "🌐 Deine Anwendung ist bereit auf: http://$APP_DOMAIN"
echo ""
echo "📝 Nächste Schritte:"
echo "1. SSL Zertifikat erstellen: sudo certbot --nginx -d $APP_DOMAIN -d www.$APP_DOMAIN"
echo "2. Nginx neu starten: sudo systemctl restart nginx"
echo "3. Deployment wiederholen: sudo -u $APP_USER /var/www/$APP_NAME/update.sh"
echo ""
echo "📊 Monitoring: curl http://$APP_DOMAIN/health"