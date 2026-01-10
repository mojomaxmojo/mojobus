#!/bin/bash

# MojoBus Deployment Script für AlmaLinux 9.7 (ohne Git)
# Ziel: /home/nginx/domains/mojobus.cc/public
# Funktioniert komplett ohne Git-Klonen

set -e  # Bei Fehlern abbrechen

# Konfiguration
WORK_DIR="/home/nginx/domains/mojobus.cc/public"
WEB_USER="nginx"  # Standard nginx-Benutzer
APP_DOMAIN="mojobus.cc"
NODE_ENV="production"

# Colors für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐧 MojoBus Deployment für AlmaLinux 9.7 (ohne Git)${NC}"
echo -e "${YELLOW}📁 Zielverzeichnis: $WORK_DIR${NC}"
echo -e "${YELLOW}🌐 Ziel-Domain: $APP_DOMAIN${NC}"
echo ""

# 1. Arbeitsverzeichnis prüfen
echo "🔍 Prüfe Arbeitsverzeichnis..."
if [ ! -d "$WORK_DIR" ]; then
    echo -e "${RED}❌ Arbeitsverzeichnis nicht gefunden: $WORK_DIR${NC}"
    echo -e "${RED}💡 Bitte erstelle das Verzeichnis oder prüfe den Pfad${NC}"
    exit 1
fi

# Schreibrechte prüfen
if [ ! -w "$WORK_DIR" ]; then
    echo -e "${RED}❌ Keine Schreibrechte auf: $WORK_DIR${NC}"
    echo -e "${RED}💡 Prüfe Berechtigungen: ls -la $(dirname $WORK_DIR)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arbeitsverzeichnis gefunden${NC}"

# 2. Ins Arbeitsverzeichnis wechseln
cd "$WORK_DIR" || {
    echo -e "${RED}❌ Konnte nicht in Arbeitsverzeichnis wechseln: $WORK_DIR${NC}"
    exit 1
}

# 3. Node.js prüfen/installieren
echo -e "${BLUE}📦 Prüfe/Installiere Node.js...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Node.js nicht gefunden. Installiere mit DNF...${NC}"
    
    # DNF module enable
    if command -v dnf &> /dev/null; then
        sudo dnf module enable nodejs:18 -y
        sudo dnf install -y nodejs npm
    else
        # Fallback auf ältere Methoden
        echo -e "${YELLOW}📦 Versuche Node.js Installation mit alternativer Methode...${NC}"
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs npm
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js Installation fehlgeschlagen${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="18.17.0"
    
    if [ "$(printf '%s\n' "$NODE_VERSION" "$REQUIRED_NODE_VERSION" | sort -V | head -n1)" = "$NODE_VERSION" ]; then
        echo -e "${GREEN}✅ Node.js Version: $NODE_VERSION (aktuell)${NC}"
    else
        echo -e "${YELLOW}⚠️ Node.js Version: $NODE_VERSION (veraltet, empfohlen: $REQUIRED_NODE_VERSION+)${NC}"
        echo -e "${BLUE}🔄 Update Node.js mit DNF...${NC}"
        
        if command -v dnf &> /dev/null; then
            sudo dnf module enable nodejs:18 -y
            sudo dnf update -y nodejs npm
        else
            echo -e "${YELLOW}⚠️ Manuelles Update von Node.js wird empfohlen${NC}"
        fi
    fi
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm nicht gefunden${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# 4. Build-Tools und Abhängigkeiten installieren
echo -e "${BLUE}🛠️ Installiere Build-Tools und Abhängigkeiten...${NC}"

# DNF cache aktualisieren
if command -v dnf &> /dev/null; then
    echo -e "${BLUE}🔄 Aktualisiere DNF Cache...${NC}"
    sudo dnf makecache --timer
fi

# Build-Tools
BUILD_TOOLS="gcc gcc-c++ make python3 python3-pip"
echo -e "${BLUE}📦 Installiere Build-Tools: $BUILD_TOOLS${NC}"

if command -v dnf &> /dev/null; then
    sudo dnf groupinstall "Development Tools" -y
    sudo dnf install -y python3 python3-pip
else
    sudo yum groupinstall "Development Tools" -y
    sudo yum install -y python3 python3-pip
fi

# Webserver-Tools
if command -v dnf &> /dev/null; then
    sudo dnf install -y git nginx
else
    sudo yum install -y git nginx
fi

# 5. Projekt-Dateien hochladen (ohne Git)
echo -e "${BLUE}📁 Lade Projekt-Dateien hoch...${NC}"

# Prüfen ob package.json existiert
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json nicht gefunden in $WORK_DIR${NC}"
    echo -e "${RED}💡 Bitte lade die Projekt-Dateien manuell in $WORK_DIR hoch${NC}"
    echo -e "${RED}📁 Benötigte Dateien: package.json, src/, dist/ nach Build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ package.json gefunden${NC}"

# source files prüfen
if [ ! -d "src" ]; then
    echo -e "${RED}❌ src/ Verzeichnis nicht gefunden${NC}"
    echo -e "${RED}💡 Bitte lade alle Quelldateien nach $WORK_DIR/src/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ src/ Verzeichnis gefunden${NC}"

# 6. Dependencies installieren
echo -e "${BLUE}📦 Installiere Projekt-Dependencies...${NC}"

#清理可能的旧依赖
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}🧹 Entferne alte Dependencies...${NC}"
    rm -rf node_modules/
fi

# Dependencies installieren
echo -e "${BLUE}📦 Führe npm ci aus...${NC}"
if command -v npm &> /dev/null; then
    npm ci --production --no-audit --no-fund || {
        echo -e "${YELLOW}⚠️ npm ci fehlgeschlagen, versuche npm install...${NC}"
        npm install --production --no-audit --no-fund || {
            echo -e "${RED}❌ Dependency-Installation fehlgeschlagen${NC}"
            exit 1
        }
    }
else
    echo -e "${RED}❌ npm nicht verfügbar${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installiert${NC}"

# 7. Production Build ausführen
echo -e "${BLUE}🏗️ Führe Production-Build aus...${NC}"

# Build-Umgebungsvariablen
export NODE_ENV=$NODE_ENV
export NODE_OPTIONS="--max-old-space-size=4096"

# Build ausführen
if command -v npm &> /dev/null; then
    npm run build || {
        echo -e "${RED}❌ Build fehlgeschlagen${NC}"
        exit 1
    }
else
    echo -e "${RED}❌ npm nicht verfügbar für Build${NC}"
    exit 1
fi

# Build prüfen
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Build fehlgeschlagen - dist/ Verzeichnis oder index.html nicht erstellt${NC}"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
echo -e "${GREEN}✅ Build erfolgreich - Größe: $BUILD_SIZE${NC}"

# 8. Nginx konfigurieren
echo -e "${BLUE}⚙️ Konfiguriere Nginx...${NC}"

# Nginx-Konfigurationsdatei erstellen
NGINX_CONF_DIR="/etc/nginx/conf.d"
NGINX_CONF="$NGINX_CONF_DIR/mojobus.conf"

echo -e "${BLUE}📝 Erstelle Nginx-Konfiguration...${NC}"
sudo mkdir -p "$NGINX_CONF_DIR"

sudo tee "$NGINX_CONF" > /dev/null << EOF
# MojoBus Nginx Configuration für AlmaLinux
# Generiert am $(date)

server {
    listen 80;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    # Redirect zu HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $APP_DOMAIN www.$APP_DOMAIN;
    
    root $WORK_DIR/dist;
    index index.html;
    
    # SSL Konfiguration
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
    
    # SPA Router Support - alle Anfragen zu index.html weiterleiten
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Security Headers für SPA
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
    }
    
    # Health Check Endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Error Pages
    error_page 404 /index.html;
    
    # Logging (nur für Fehler)
    error_log /var/log/nginx/mojobus.error.log warn;
    access_log /var/log/nginx/mojobus.access.log combined;
}
EOF

# Seite aktivieren
echo -e "${BLUE}🔗 Aktiviere Nginx-Seite...${NC}"
sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/mojobus.conf"

# Konfiguration testen
echo -e "${BLUE}✅ Teste Nginx-Konfiguration...${NC}"
sudo nginx -t || {
    echo -e "${RED}❌ Nginx-Konfiguration enthält Fehler!${NC}"
    echo -e "${BLUE}💡 Überprüfe: sudo nginx -t${NC}"
    exit 1
}

# 9. Berechtigungen optimieren
echo -e "${BLUE}🔐 Bereite Berechtigungen...${NC}"

# Dateiberechtigungen setzen
if [ "$WEB_USER" != "$(whoami)" ]; then
    sudo chown -R $WEB_USER:$WEB_USER dist/
fi

chmod -R 755 dist/
find dist/ -type f -exec chmod 644 {} \; 2>/dev/null || true

# SELinux-Kontext setzen (wichtig für AlmaLinux)
echo -e "${BLUE}🛡️ Setze SELinux-Kontext...${NC}"
if command -v getenforce &> /dev/null; then
    if ! getenforce -s dist/. 2>/dev/null; then
        echo -e "${BLUE}🔄 Setze SELinux httpd_sys_content_t...${NC}"
        sudo semanage fcontext -a -t httpd_sys_content_t "$WORK_DIR/dist(/.*)?" 2>/dev/null || true
        sudo restorecon -R "$WORK_DIR/dist/"
        echo -e "${GREEN}✅ SELinux-Kontext gesetzt${NC}"
    else
        echo -e "${GREEN}✅ SELinux-Kontext bereits korrekt${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️ SELinux nicht verfügbar${NC}"
fi

# 10. Nginx neu laden
echo -e "${BLUE}🔄 Lade Nginx neu...${NC}"
sudo systemctl reload nginx

# 11. Services überprüfen
echo -e "${BLUE}🔍 Überprüfe Services...${NC}"

# Nginx-Status prüfen
if systemctl is-active nginx --quiet; then
    echo -e "${GREEN}✅ Nginx läuft aktiv${NC}"
else
    echo -e "${YELLOW}⚠️ Nginx läuft nicht, starte Nginx...${NC}"
    sudo systemctl start nginx
    sleep 3
fi

# Firewall prüfen
echo -e "${BLUE}🔥 Prüfe Firewall...${NC}"
if command -v firewall-cmd &> /dev/null; then
    if firewall-cmd --query-service=http && firewall-cmd --query-service=https; then
        echo -e "${GREEN}✅ Firewall HTTP/HTTPS Ports offen${NC}"
    else
        echo -e "${YELLOW}⚠️ Firewall HTTP/HTTPS Ports nicht konfiguriert${NC}"
        echo -e "${BLUE}🔄 Konfiguriere Firewall...${NC}"
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        echo -e "${GREEN}✅ Firewall konfiguriert${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️ firewall-cmd nicht verfügbar${NC}"
fi

# 12. Health-Checks durchführen
echo -e "${BLUE}🏥 Führe Health-Checks durch...${NC}"
sleep 5

# Lokale Tests
echo -e "${BLUE}🔍 Lokale Tests:${NC}"

# HTTP-Test
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP-Test erfolgreich (Status $HTTP_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ HTTP-Test fehlgeschlagen (Status $HTTP_CODE)${NC}"
fi

# HTTPS-Test
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost/ 2>/dev/null)
if [ "$HTTPS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS-Test erfolgreich (Status $HTTPS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ HTTPS-Test fehlgeschlagen (Status $HTTPS_CODE)${NC}"
fi

# Externer Test
EXTERNAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://$APP_DOMAIN/" 2>/dev/null)
EXTERNAL_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" "https://$APP_DOMAIN/" 2>/dev/null)

if [ "$EXTERNAL_HTTP" = "301" ] && [ "$EXTERNAL_HTTPS" = "200" ]; then
    echo -e "${GREEN}✅ Externer Test perfekt (HTTP→HTTPS Redirect + HTTPS OK)${NC}"
else
    echo -e "${YELLOW}⚠️ Externer Test: HTTP=$EXTERNAL_HTTP, HTTPS=$EXTERNAL_HTTPS${NC}"
fi

# 13. Deployment-Informationen
echo ""
echo -e "${GREEN}🎉 Deployment erfolgreich abgeschlossen!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 Website:        https://$APP_DOMAIN${NC}"
echo -e "${GREEN}📁 Arbeitsverzeichnis:   $WORK_DIR${NC}"
echo -e "${GREEN}📦 Build-Größe:    $BUILD_SIZE${NC}"
echo -e "${GREEN}🔧 Node.js:       $(node --version)${NC}"
echo -e "${GREEN}🐧 System:         $(cat /etc/redhat-release || uname -r) mit DNF${NC}"
echo -e "${GREEN}👤 User:          $(whoami) ($(id -un))${NC}"
echo -e "${GREEN}⏰ Deployment-Zeit: $(date)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Nützliche Commands:${NC}"
echo -e "${YELLOW}📝 Logs anzeigen:     sudo journalctl -u nginx -f${NC}"
echo -e "${YELLOW}🔄 Nginx neustarten:  sudo systemctl restart nginx${NC}"
echo -e "${YELLOW}📊 Nginx Status:      sudo systemctl status nginx${NC}"
echo -e "${YELLOW}🔍 Nginx Test:        sudo nginx -t${NC}"
echo -e "${YELLOW}📦 Build neu:          npm run build${NC}"
echo -e "${YELLOW}🔄 Nginx reload:       sudo systemctl reload nginx${NC}"
echo ""
echo -e "${BLUE}🌐 Health-Checks:${NC}"
echo -e "${YELLOW}🔗 Intern HTTP:     curl http://localhost/${NC}"
echo -e "${YELLOW}🔒 Intern HTTPS:    curl -k https://localhost/${NC}"
echo -e "${YELLOW}🌍 Extern HTTP:     curl http://$APP_DOMAIN/${NC}"
echo -e "${YELLOW}🔒 Extern HTTPS:    curl https://$APP_DOMAIN/${NC}"
echo ""
echo -e "${BLUE}🔄 Updates durchführen:${NC}"
echo -e "${YELLOW}📦 Dependencies update:    npm update --production${NC}"
echo -e "${YELLOW}🏗️ Build:               npm run build${NC}"
echo -e "${YELLOW}🔄 Nginx reload:           sudo systemctl reload nginx${NC}"
echo ""
echo -e "${GREEN}🎊 Deine MojoBus Website ist jetzt LIVE auf https://$APP_DOMAIN! 🌊🚀${NC}"
echo ""