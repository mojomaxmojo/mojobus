#!/bin/bash

# ============================================
# MojoBus VPS Deployment Script
# Ziel: ~/site/public auf deinem VPS
# ============================================

# 📋 KONFIGURATION
# ============================================

# Deine VPS-Zugangsdaten hier eintragen:
VPS_USER=""           # z.B. "root" oder dein Username
VPS_HOST=""           # z.B. "123.45.67.89" oder "deine-vps-domain.com"
VPS_PATH="~/site/public"  # Zielverzeichnis auf VPS

# Lokale Pfade
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# FUNCTIONS
# ============================================

error_exit() {
    echo -e "${RED}❌ $1${NC}" >&2
    exit 1
}

success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_config() {
    echo ""
    info_msg "Prüfe Konfiguration..."

    if [ -z "$VPS_USER" ]; then
        error_exit "Bitte VPS_USER im Skript konfigurieren!"
    fi

    if [ -z "$VPS_HOST" ]; then
        error_exit "Bitte VPS_HOST im Skript konfigurieren!"
    fi

    success_msg "Konfiguration ist gültig!"
    echo ""
    info_msg "VPS-Zugang:"
    echo "   User: $VPS_USER"
    echo "   Host: $VPS_HOST"
    echo "   Pfad: $VPS_PATH"
    echo ""
}

check_dist() {
    echo ""
    info_msg "Prüfe dist/ Ordner..."

    if [ ! -d "$DIST_DIR" ]; then
        error_exit "dist/ Ordner nicht gefunden! Bitte zuerst 'npm run build' ausführen."
    fi

    if [ ! -f "$DIST_DIR/index.html" ]; then
        error_exit "index.html nicht in dist/ gefunden!"
    fi

    success_msg "dist/ Ordner ist vorhanden und gültig!"
    echo ""
}

test_connection() {
    echo ""
    info_msg "Teste Verbindung zum VPS..."

    if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$VPS_USER@$VPS_HOST" echo "Connection OK" 2>/dev/null; then
        error_exit "Kann keine SSH-Verbindung zum VPS herstellen!
        
Bitte überprüfe:
1. SSH-Zugang zum VPS ist möglich: ssh $VPS_USER@$VPS_HOST
2. SSH-Keys sind korrekt konfiguriert
3. VPS ist erreichbar"
    fi

    success_msg "SSH-Verbindung zum VPS erfolgreich!"
    echo ""
}

create_remote_dir() {
    echo ""
    info_msg "Erstelle Verzeichnis auf VPS..."

    ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH && chmod 755 $VPS_PATH" || error_exit "Konnte Verzeichnis nicht erstellen"

    success_msg "Verzeichnis erstellt: $VPS_PATH"
    echo ""
}

upload_files() {
    echo ""
    info_msg "Lade Dateien auf VPS hoch..."

    # rsync mit delete option (alte Dateien werden gelöscht)
    # -a: archiv mode (behält permissions, timestamps, etc.)
    # -v: verbose (zeigt Details)
    # -z: komprimierung
    # --delete: löscht Dateien auf Ziel die nicht mehr lokal existieren
    # --progress: zeigt Fortschritt

    rsync -avz --delete --progress "$DIST_DIR/" "$VPS_USER@$VPS_HOST:$VPS_PATH/" || error_exit "Upload fehlgeschlagen!"

    success_msg "Upload erfolgreich!"
    echo ""
}

set_permissions() {
    echo ""
    info_msg "Setze Berechtigungen auf VPS..."

    ssh "$VPS_USER@$VPS_HOST" "chmod -R 755 $VPS_PATH && find $VPS_PATH -type f -exec chmod 644 {} \;" || error_exit "Konnte Berechtigungen nicht setzen"

    success_msg "Berechtigungen gesetzt!"
    echo ""
}

check_deployment() {
    echo ""
    info_msg "Prüfe Deployment auf VPS..."

    # Prüfen ob index.html existiert
    if ! ssh "$VPS_USER@$VPS_HOST" "test -f $VPS_PATH/index.html"; then
        error_exit "index.html wurde nicht gefunden auf VPS!"
    fi

    # Dateien auflisten
    echo ""
    info_msg "Dateien auf VPS:"
    ssh "$VPS_USER@$VPS_HOST" "ls -lah $VPS_PATH/"

    success_msg "Deployment Überprüfung bestanden!"
    echo ""
}

webserver_config_hint() {
    echo ""
    warn_msg "Nächste Schritte:"
    echo ""
    echo "📝 Nginx Konfiguration:"
    cat << 'EOF'
    Erstelle: /etc/nginx/sites-available/mojobus
    
    server {
        listen 80;
        server_name deine-domain.com www.deine-domain.com;
        
        root /home/dein-user/site/public;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
EOF
    echo ""
    echo "Dann:"
    echo "  sudo ln -s /etc/nginx/sites-available/mojobus /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t"
    echo "  sudo systemctl reload nginx"
    echo ""
    echo "🔒 SSL mit Certbot:"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d deine-domain.com"
    echo ""
}

# ============================================
# MAIN
# ============================================

echo ""
echo "=========================================="
echo "🚀 MojoBus VPS Deployment"
echo "=========================================="
echo ""

# 1. Konfiguration prüfen
check_config

# Frage ob fortfahren
echo -n "Möchtest du fortfahren? (y/N): "
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Deployment abgebrochen."
    exit 0
fi

# 2. dist/ prüfen
check_dist

# 3. SSH-Verbindung testen
test_connection

# 4. Verzeichnis auf VPS erstellen
create_remote_dir

# 5. Dateien hochladen
upload_files

# 6. Berechtigungen setzen
set_permissions

# 7. Deployment prüfen
check_deployment

# 8. Hinweise
webserver_config_hint

# Erfolg
echo ""
echo "=========================================="
success_msg "Deployment erfolgreich abgeschlossen! 🎉"
echo "=========================================="
echo ""
info_msg "Teste deine Website:"
echo "   http://deine-domain.com"
echo ""
echo "Bei Problemen:"
echo "   Nginx Logs: sudo tail -f /var/log/nginx/mojobus_error.log"
echo "   SSH Debug: ssh -v $VPS_USER@$VPS_HOST"
echo ""
