#!/bin/bash

# MojoBus Deployment Script für AlmaLinux 9.7 mit DNF
# Optimiert für modernes DNF mit RPM 4.18
# Ziel: /home/nginx/domains/mojobus.cc/public/

set -e  # Bei Fehlern abbrechen

# Konfiguration
WORK_DIR="/home/nginx/domains/mojobus.cc/public"
APP_NAME="mojobus"
APP_DOMAIN="mojobus.cc"
WEB_USER="nginx"  # Standard nginx-Benutzer
NODE_VERSION="18"
REPO_URL="https://github.com/mojomaxme/mojobus.git"

echo "🐧 MojoBus Deployment für AlmaLinux 9.7"
echo "📁 Arbeitsverzeichnis: $WORK_DIR"
echo "🌐 Ziel-Domain: $APP_DOMAIN"
echo "📦 Package Manager: DNF (RPM 4.18)"

# 1. System-Voraussetzungen prüfen
echo ""
echo "🔍 Prüfe System-Voraussetzungen..."

# DNF prüfen
if ! command -v dnf &> /dev/null; then
    echo "❌ DNF nicht gefunden. Bitte zu AlmaLinux 9.7+ upgraden."
    exit 1
fi

# AlmaLinux-Version prüfen
if [ ! -f /etc/almalinux-release ]; then
    echo "❌ AlmaLinux nicht erkannt."
    exit 1
fi

ALMA_VERSION=$(grep VERSION_ID /etc/almalinux-release | cut -d'=' -f2 | tr -d '"')
echo "✅ AlmaLinux Version: $ALMA_VERSION"

# Arbeitsverzeichnis prüfen
if [ ! -d "$WORK_DIR" ]; then
    echo "❌ Arbeitsverzeichnis nicht gefunden: $WORK_DIR"
    echo "💡 Erstelle das Verzeichnis oder prüfe die Berechtigungen"
    exit 1
fi

# Schreibrechte prüfen
if [ ! -w "$WORK_DIR" ]; then
    echo "❌ Keine Schreibrechte auf: $WORK_DIR"
    echo "💡 Prüfe Berechtigungen: ls -la $(dirname $WORK_DIR)"
    exit 1
fi

echo "✅ System-Voraussetzungen erfüllt"

# 2. Arbeitsverzeichnis vorbereiten
echo ""
echo "📁 Bereite Arbeitsverzeichnis vor..."
cd "$WORK_DIR" || {
    echo "❌ Konnte nicht in Arbeitsverzeichnis wechseln: $WORK_DIR"
    exit 1
}

# Backup erstellen (optional, aber empfohlen)
if [ -d ".git" ] || [ -d "src" ] || [ -d "dist" ]; then
    BACKUP_DIR="../${APP_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
    echo "💾 Erstelle Backup in: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Vorhandene Dateien sichern
    [ -d ".git" ] && mv .git "$BACKUP_DIR/"
    [ -d "src" ] && mv src "$BACKUP_DIR/"
    [ -d "dist" ] && mv dist "$BACKUP_DIR/"
    [ -f "package.json" ] && cp package.json "$BACKUP_DIR/"
fi

# 3. Git Repository vorbereiten
echo ""
echo "📥 Bereite Git Repository vor..."

# Repository klonen oder aktualisieren
if [ -d ".git" ]; then
    echo "🔄 Bestehendes Repository gefunden - aktualisiere..."
    git remote set-url origin "$REPO_URL" 2>/dev/null || true
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "📦 Klonne Repository neu..."
    rm -rf .[^.]*  # Alte Dateien entfernen (.gitignore wird berücksichtigt)
    git clone "$REPO_URL" .
fi

# Repository-Status prüfen
echo "✅ Repository-Status:"
git status --porcelain

# 4. Node.js mit DNF installieren
echo ""
echo "📦 Prüfe und installiere Node.js..."

# Node.js Version prüfen
if command -v node &> /dev/null; then
    CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18.17.0"  # Mindestversion für moderne Features
    
    if [ "$(printf '%s\n' "$CURRENT_NODE_VERSION" "$REQUIRED_NODE_VERSION" | sort -V | head -n1)" = "$CURRENT_NODE_VERSION" ]; then
        echo "✅ Node.js $CURRENT_NODE_VERSION ist aktuell"
    else
        echo "⚠️  Node.js $CURRENT_NODE_VERSION ist veraltet - upgraden..."
        echo "📦 Installiere Node.js $NODE_VERSION mit DNF..."
        
        # DNF Module aktivieren
        sudo dnf module enable nodejs:$NODE_VERSION -y
        
        # Node.js installieren/upgraden
        sudo dnf install nodejs npm -y
        
        # Installation prüfen
        if node --version | grep -q "$NODE_VERSION"; then
            echo "✅ Node.js erfolgreich aktualisiert"
        else
            echo "❌ Node.js Update fehlgeschlagen"
            exit 1
        fi
    fi
else
    echo "📦 Installiere Node.js $NODE_VERSION mit DNF..."
    
    # DNF Module aktivieren
    sudo dnf module enable nodejs:$NODE_VERSION -y
    
    # Node.js und npm installieren
    sudo dnf install nodejs npm -y
    
    # Installation prüfen
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        echo "✅ Node.js erfolgreich installiert"
    else
        echo "❌ Node.js Installation fehlgeschlagen"
        exit 1
    fi
fi

NODE_VERSION_INSTALLED=$(node --version)
echo "✅ Node.js Version: $NODE_VERSION_INSTALLED"

# 5. Build-Tools und Dependencies installieren
echo ""
echo "🛠️ Installiere Build-Tools und Dependencies..."

# DNF Cache aktualisieren
echo "🔄 Aktualisiere DNF Cache..."
sudo dnf makecache --timer

# Build-Tools installieren
echo "📦 Installiere Build-Dependencies..."
sudo dnf groupinstall "Development Tools" -y

# Zusätzliche Development-Pakete
echo "📦 Installiere zusätzliche Tools..."
sudo dnf install -y \
    gcc \
    gcc-c++ \
    make \
    python3 \
    python3-pip \
    git

# Nginx Development-Tools (falls nicht vorhanden)
echo "🌐 Installiere Nginx Development-Tools..."
sudo dnf install -y nginx-devel

# 6. Projekt-Dependencies installieren
echo ""
echo "📦 Installiere Projekt-Dependencies mit npm..."

# Umgebungsvariablen für Production
export NODE_ENV=production

# Dependencies installieren mit DNF-optimiertem npm
if [ -f "package.json" ]; then
    echo "📦 Führe npm ci aus..."
    
    # DNF hat möglicherweise eigene Node.js-Version - npm über PATH verwenden
    PATH="/usr/bin:$PATH"
    
    if command -v npm &> /dev/null; then
        npm ci --production --no-audit --no-fund
    else
        echo "❌ npm nicht gefunden nach Installation"
        exit 1
    fi
else
    echo "❌ package.json nicht gefunden!"
    exit 1
fi

# 7. Production-Build ausführen
echo ""
echo "🏗️ Führe Production-Build aus..."

# Umgebungsvariablen setzen
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=4096"

# Build ausführen
if command -v npm &> /dev/null; then
    npm run build
else
    echo "❌ npm nicht gefunden für Build"
    exit 1
fi

# Build-Ergebnis prüfen
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Build fehlgeschlagen - dist/ Verzeichnis nicht erstellt"
    exit 1
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
echo "✅ Build erfolgreich - Größe: $BUILD_SIZE"

# 8. Berechtigungen und optimieren
echo ""
echo "🔐 Bereite Berechtigungen vor..."

# Dateiberechtigungen setzen
chown -R $WEB_USER:$WEB_USER dist/ 2>/dev/null || true
find dist/ -type f -exec chmod 644 {} \; 2>/dev/null || true
find dist/ -type d -exec chmod 755 {} \; 2>/dev/null || true

# .htaccess entfernen (nicht für Nginx nötig)
find dist/ -name ".htaccess" -delete 2>/dev/null || true

# SELinux-Kontext prüfen und setzen (wichtig für AlmaLinux)
if command -v getenforce &> /dev/null; then
    echo "🛡️ Prüfe SELinux-Kontext..."
    
    # HTTPD-Context für dist/ setzen
    if getenforce -s dist/. 2>/dev/null; then
        echo "✅ SELinux-Kontext bereits korrekt"
    else
        echo "🔄 Setze SELinux-Kontext..."
        sudo semanage fcontext -a -t httpd_sys_content_t "/home/nginx/domains/mojobus.cc/public/dist(/.*)?"
        sudo restorecon -R "/home/nginx/domains/mojobus.cc/public/dist/"
        echo "✅ SELinux-Kontext gesetzt"
    fi
else
    echo "ℹ️  SELinux nicht verfügbar"
fi

echo "✅ Berechtigungen und Optimierung abgeschlossen"

# 9. Nginx konfigurieren und neustarten
echo ""
echo "🌐 Konfiguriere und starte Nginx..."

# Nginx-Konfiguration testen
echo "🔍 Teste Nginx-Konfiguration..."
sudo nginx -t || {
    echo "❌ Nginx-Konfiguration enthält Fehler!"
    exit 1
}

# Nginx neu laden
echo "🔄 Lade Nginx neu..."
sudo systemctl reload nginx || {
    echo "❌ Nginx-Neuladen fehlgeschlagen"
    echo "💡 Versuche manuellen Neustart: sudo systemctl restart nginx"
    exit 1
}

# Nginx-Status prüfen
echo "📊 Prüfe Nginx-Status..."
if systemctl is-active nginx --quiet; then
    echo "✅ Nginx läuft aktiv"
else
    echo "⚠️  Nginx läuft nicht - versuche Neustart..."
    sudo systemctl start nginx
    sleep 3
fi

# 10. Health-Checks durchführen
echo ""
echo "🏥 Führe Health-Checks durch..."

# Lokaler HTTP-Test
echo "🌐 Teste HTTP-Zugriff..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ HTTP-Zugriff erfolgreich (Status $HTTP_CODE)"
    else
        echo "⚠️  HTTP-Zugriff Problem (Status $HTTP_CODE)"
    fi
else
    echo "⚠️  curl nicht verfügbar für HTTP-Test"
fi

# Lokaler HTTPS-Test
echo "🔒 Teste HTTPS-Zugriff..."
if command -v curl &> /dev/null; then
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost/)
    if [ "$HTTPS_CODE" = "200" ]; then
        echo "✅ HTTPS-Zugriff erfolgreich (Status $HTTPS_CODE)"
    else
        echo "⚠️  HTTPS-Zugriff Problem (Status $HTTPS_CODE)"
    fi
else
    echo "⚠️  curl nicht verfügbar für HTTPS-Test"
fi

# Externer Test
echo "🌍 Teste externen Zugriff..."
if command -v curl &> /dev/null; then
    EXTERNAL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://"$APP_DOMAIN"/)
    EXTERNAL_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" https://"$APP_DOMAIN"/)
    
    if [ "$EXTERNAL_HTTP" = "301" ] && [ "$EXTERNAL_HTTPS" = "200" ]; then
        echo "✅ Externer Zugriff perfekt (HTTP → HTTPS Redirect + HTTPS OK)"
    else
        echo "⚠️  Externer Zugriff: HTTP=$EXTERNAL_HTTP, HTTPS=$EXTERNAL_HTTPS"
    fi
else
    echo "⚠️  curl nicht verfügbar für externen Test"
fi

# 11. Deployment-Informationen
echo ""
echo "🎉 Deployment erfolgreich abgeschlossen!"
echo ""
echo "📊 Deployment-Informationen:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Website:        https://$APP_DOMAIN"
echo "📁 Arbeitsverzeichnis:   $WORK_DIR"
echo "📦 Build-Größe:    $BUILD_SIZE"
echo "🔧 Node.js:       $NODE_VERSION_INSTALLED"
echo "🐧 System:         AlmaLinux $ALMA_VERSION mit DNF"
echo "📅 User:           $WEB_USER ($(whoami))"
echo "⏰ Deployment-Zeit: $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Nützliche Commands:"
echo "📝 Logs anzeigen:     sudo journalctl -u nginx -f"
echo "🔄 Nginx neustarten:   sudo systemctl reload nginx"
echo "📊 Nginx Status:      sudo systemctl status nginx"
echo "🔍 Nginx Test:        sudo nginx -t"
echo "📄 Build neu:          npm run build"
echo "🔄 Update durchführen:  git pull && npm ci && npm run build && sudo systemctl reload nginx"
echo ""
echo "🌐 Health-Checks:"
echo "🌐 Intern HTTP:     curl http://localhost/"
echo "🔒 Intern HTTPS:    curl -k https://localhost/"
echo "🌍 Extern HTTP:     curl http://$APP_DOMAIN/"
echo "🔒 Extern HTTPS:    curl https://$APP_DOMAIN/"
echo ""
echo "🎊 Deine MojoBus Website ist jetzt LIVE auf https://$APP_DOMAIN! 🌊🚀"