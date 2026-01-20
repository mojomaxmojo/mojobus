#!/bin/bash

# MojoBus VPS Deployment Script
# für mojobus.cc mit automatischem Deployment

set -e  # Bei Fehlern abbrechen

# Konfiguration
APP_NAME="mojobus"
APP_USER="web"
APP_DIR="/var/www/$APP_NAME"
APP_REPO="https://github.com/dein-username/mojobus.git"
APP_DOMAIN="mojobus.cc"
APP_EMAIL="deine-email@mojobus.cc"

echo "🚀 Starte $APP_NAME Deployment..."

# 1. Web-User erstellen (falls nicht vorhanden)
if ! id "$APP_USER" &>/dev/null; then
    echo "📝 Erstelle Benutzer: $APP_USER"
    adduser --system --home /var/www/$APP_USER --shell /bin/bash --gecos "Web Application" $APP_USER
fi

# 2. Anwendungsverzeichnis erstellen
echo "📁 Erstelle Verzeichnis: $APP_DIR"
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# 3. Code aus Repository holen
echo "📥 Klone Repository nach $APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git pull origin main
else
    git clone $APP_REPO $APP_DIR
fi
cd $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR

# 4. Dependencies installieren
echo "📦 Installiere Dependencies..."
sudo -u $APP_USER npm ci --production

# 5. Build für Production
echo "🏗️ Baue für Production..."
sudo -u $APP_USER npm run build

# 6. Nginx Konfiguration erstellen
echo "⚙️ Erstelle Nginx Konfiguration..."
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
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
    
    # SSL Konfiguration
    ssl_certificate /etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$APP_DOMAIN/privkey.pem;
    
    # SSL HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # SPA Support - alle Anfragen zu index.html weiterleiten
    location / {
        try_files $uri $uri/ /index.html;
        
        # Security Headers für SPA
        add_header X-Content-Type-Options "nosniff" always;
    }
    
    # API/Nostr Requests optimieren
    location ~* \.(nostr|ws)$ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 7. Seite aktivieren
echo "🔗 Aktiviere Nginx Seite..."
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# 8. Nginx Konfiguration testen
echo "✅ Teste Nginx Konfiguration..."
nginx -t

# 9. Nginx neu laden
echo "🔄 Lade Nginx neu..."
systemctl reload nginx

# 10. SSL Zertifikat erstellen (falls nicht vorhanden)
if [ ! -f "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" ]; then
    echo "🔒 Erstelle SSL Zertifikat für $APP_DOMAIN..."
    certbot --nginx -d $APP_DOMAIN -d www.$APP_DOMAIN --email $APP_EMAIL --agree-tos --non-interactive --redirect
fi

# 11. Berechtigungen setzen
echo "🔐 Setze Berechtigungen..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR

# 12. Neustart des Webservers
echo "🔄 Neustarte Webservers..."
systemctl restart nginx

echo "✅ Deployment abgeschlossen!"
echo "🌐 Deine Anwendung ist jetzt live auf: https://$APP_DOMAIN"
echo "📝 Logs mit: journalctl -u nginx -f"
echo "🔄 Updates mit: cd $APP_DIR && git pull && npm ci && npm run build"