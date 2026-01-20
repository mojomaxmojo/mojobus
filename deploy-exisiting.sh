#!/bin/bash

# MojoBus Deployment auf bestehenden Webserver
# Ziel: /home/nginx/domains/mojobus.cc/public/

set -e

# Konfiguration
WEB_DIR="/home/nginx/domains/mojobus.cc/public"
APP_NAME="mojobus"
APP_DOMAIN="mojobus.cc"
APP_USER="nginx"  # Webserver-Benutzer
REPO_URL="https://github.com/mojomaxme/mojobus.git"

echo "🚀 Starte MojoBus Deployment auf bestehenden Webserver..."
echo "📁 Zielverzeichnis: $WEB_DIR"
echo "🌐 Ziel-Domain: $APP_DOMAIN"

# 1. Arbeitsverzeichnis prüfen und ggf. erstellen
echo "📋 Prüfe Webserver-Verzeichnis..."
if [ ! -d "$WEB_DIR" ]; then
    echo "❌ Webserver-Verzeichnis nicht gefunden: $WEB_DIR"
    echo "💡 Bitte prüfen ob der Pfad korrekt ist und nginx Schreibrechte hat"
    exit 1
fi

# Schreibrechte prüfen
if [ ! -w "$WEB_DIR" ]; then
    echo "❌ Keine Schreibrechte auf: $WEB_DIR"
    echo "💡 Bitte mit chown nginx:nginx $WEB_DIR und chmod 755 $WEB_DIR korrigieren"
    exit 1
fi

# 2. Ins Webserver-Verzeichnis wechseln
cd "$WEB_DIR" || {
    echo "❌ Konnte nicht in Verzeichnis wechseln: $WEB_DIR"
    exit 1
}

# 3. Git installieren falls nicht vorhanden
if ! command -v git &> /dev/null; then
    echo "📦 Installiere git..."
    sudo apt update && sudo apt install -y git
fi

# 4. Repository vorbereiten
echo "🧹 Bereite Arbeitsverzeichnis vor..."
# Alte Dateien sichern (optional)
if [ -d ".git" ]; then
    echo "💾 Sichere bestehendes Repository..."
    mv .git ../${APP_NAME}-git-backup-$(date +%Y%m%d-%H%M%S)
fi

# Nicht-versteckte Dateien sichern (.htaccess, etc.)
if [ -f ".htaccess" ]; then
    cp .htaccess .htaccess.backup
fi

# 5. Repository klonen oder aktualisieren
echo "📥 Hole Repository..."
if [ -d ".git" ]; then
    echo "🔄 Bestehendes Repository gefunden - aktualisiere..."
    git remote set-url origin "$REPO_URL"
    git fetch origin
    git reset --hard origin/main
    git clean -fd
else
    echo "📦 Klonne Repository neu..."
    rm -rf .[^.]*  # Alle Dateien außer versteckte entfernen
    git clone "$REPO_URL" .
fi

# 6. Node.js prüfen/installieren
echo "📝 Prüfe Node.js..."
if ! command -v node &> /dev/null; then
    echo "📦 Node.js nicht gefunden. Installiere Node.js 18..."
    # Methode 1: DNF/RPM (für AlmaLinux/Rocky)
    if command -v dnf &> /dev/null; then
        sudo dnf module enable nodejs:18 -y
        sudo dnf install nodejs -y
    # Methode 2: DNF/RPM (für CentOS/Fedora)
    elif command -v yum &> /dev/null; then
        sudo yum module enable nodejs:18 -y
        sudo yum install nodejs -y
    # Methode 3: APT (für Debian/Ubuntu)
    else
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    NODE_VERSION=$(node --version)
    echo "✅ Node.js gefunden: $NODE_VERSION"
fi

# 7. npm prüfen/installieren
if ! command -v npm &> /dev/null; then
    echo "📦 npm nicht gefunden. Installiere npm..."
    if command -v dnf &> /dev/null; then
        sudo dnf install npm -y
    elif command -v yum &> /dev/null; then
        sudo yum install npm -y
    else
        sudo apt-get install -y npm
    fi
else
    NPM_VERSION=$(npm --version)
    echo "✅ npm gefunden: $NPM_VERSION"
fi

# 8. Dependencies installieren
echo "📦 Installiere Dependencies..."
npm ci --production || {
    echo "❌ npm ci fehlgeschlagen, versuche npm install..."
    npm install --production
}

# 9. Build ausführen
echo "🏗️ Baue für Production..."
NODE_ENV=production npm run build || {
    echo "❌ Build fehlgeschlagen!"
    exit 1
}

# 10. Build prüfen
echo "🔍 Prüfe Build-Output..."
if [ ! -d "dist" ]; then
    echo "❌ dist/ Verzeichnis nicht gefunden nach Build!"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html nicht gefunden in dist/!"
    exit 1
fi

# 11. Berechtigungen setzen
echo "🔐 Setze Berechtigungen..."
if [ "$APP_USER" != "$(whoami)" ]; then
    # Falls wir nicht als nginx-Benutzer laufen, Berechtigungen anpassen
    sudo chown -R $APP_USER:$APP_USER .
fi
chmod -R 755 .
chmod -R 644 dist/*/*.html
chmod -R 644 dist/*/*.css
chmod -R 644 dist/*/*.js

# 12. Zentrale Webserver-Dateien
echo "🌐 Erstelle zentrale Webserver-Dateien..."
echo "MojoBus auf $APP_DOMAIN | Deployment: $(date)" > deployment-info.txt

# 13. Success-Message
echo ""
echo "✅ Deployment erfolgreich abgeschlossen!"
echo "🌐 Deine MojoBus Website ist jetzt live unter: https://$APP_DOMAIN"
echo "📁 Installiert in: $WEB_DIR"
echo ""
echo "📊 Nützliche Commands:"
echo "  - Verzeichnis auflisten:    ls -la $WEB_DIR"
echo "  - Nginx neu laden:      sudo systemctl reload nginx"
echo "  - Nginx Status:         sudo systemctl status nginx"
echo "  - Nginx Logs:           sudo tail -f /var/log/nginx/error.log"
echo "  - Deployment Info:       cat $WEB_DIR/deployment-info.txt"
echo ""
echo "🔍 Health Checks:"
echo "  - HTTP:  curl -I http://$APP_DOMAIN"
echo "  - HTTPS: curl -I https://$APP_DOMAIN"
echo "  - Endpunkt: curl https://$APP_DOMAIN/health"
echo ""
echo "🔄 Für Updates nutze:"
echo "  cd $WEB_DIR && git pull && npm ci && npm run build"