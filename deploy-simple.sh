#!/bin/bash

# ============================================
# MojoBus VPS Simple Deploy Script
# Nur deployen: Git pull → Build → Deploy
# Voraussetzung: Nginx, SSL, Directory sind bereit
# ============================================

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/home/nginx/domains/mojobus.co/public"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
LATEST_LOG="$LOG_DIR/deploy-latest.log"

# ============================================
# FUNCTIONS
# ============================================

log() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message"
    echo "[$timestamp] $message" >> "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    echo -e "${RED}❌ $1${NC}" >&2
    exit 1
}

success_msg() {
    log "SUCCESS: $1"
    echo -e "${GREEN}✅ $1${NC}"
}

info_msg() {
    log "INFO: $1"
    echo -e "${BLUE}ℹ  $1${NC}"
}

warn_msg() {
    log "WARN: $1"
    echo -e "${YELLOW}⚠  $1${NC}"
}

# Logging Setup
setup_logging() {
    mkdir -p "$LOG_DIR"
    ln -sf "$LOG_FILE" "$LATEST_LOG"
    info_msg "Log-Datei: $LOG_FILE"
}

# Prüfen ob deploy dir existiert
check_deploy_dir() {
    if [ ! -d "$DEPLOY_DIR" ]; then
        error_exit "Deployment Verzeichnis nicht gefunden: $DEPLOY_DIR"
    fi
    info_msg "Deployment Verzeichnis: $DEPLOY_DIR ✓"
}

# Git pull
git_pull() {
    info_msg "Hole Updates von Git..."

    git -C "$PROJECT_DIR" fetch origin

    LOCAL=$(git -C "$PROJECT_DIR" rev-parse HEAD)
    REMOTE=$(git -C "$PROJECT_DIR" rev-parse origin/main)

    if [ "$LOCAL" != "$REMOTE" ]; then
        info_msg "Neue Version verfügbar! ($LOCAL → $REMOTE)"
        git -C "$PROJECT_DIR" pull origin main || error_exit "Git pull fehlgeschlagen"
        success_msg "Git pull erfolgreich"
    else
        info_msg "Bereits aktuell! Keine neuen Änderungen."

        # Prüfe ob --force oder -force in den Argumenten
        FORCE_DEPLOY=0
        for arg in "$@"; do
            if [ "$arg" = "--force" ] || [ "$arg" = "-force" ]; then
                FORCE_DEPLOY=1
                break
            fi
        done

        if [ $FORCE_DEPLOY -eq 0 ]; then
            info_msg "Deployment übersprungen. Nutze --force um trotzdem zu deployen."
            exit 0
        fi

        info_msg "Force deployment..."
    fi
}

# Dependencies installieren
install_dependencies() {
    info_msg "Installiere Dependencies..."

    # Versuche npm ci, falle auf npm install zurück bei Fehlern
    if [ -f "$PROJECT_DIR/package-lock.json" ]; then
        if npm ci --prefix "$PROJECT_DIR" --loglevel=error >> "$LOG_FILE" 2>&1; then
            success_msg "Dependencies installiert (npm ci)"
            return
        else
            warn_msg "npm ci fehlgeschlagen (Exit Code: $?), versuche npm install..."
        fi
    fi

    npm install --prefix "$PROJECT_DIR" --loglevel=error >> "$LOG_FILE" 2>&1 || error_exit "npm install fehlgeschlagen (Exit Code: $?)"
    success_msg "Dependencies installiert (npm install)"
}

# Projekt bauen
build_project() {
    info_msg "Baue Projekt für Production..."

    npm run build --prefix "$PROJECT_DIR" 2>&1 | tee -a "$LOG_FILE" || error_exit "Build fehlgeschlagen"

    if [ ! -d "$PROJECT_DIR/dist" ]; then
        error_exit "dist/ Ordner wurde nicht erstellt!"
    fi

    if [ ! -f "$PROJECT_DIR/dist/index.html" ]; then
        error_exit "index.html nicht in dist/ gefunden!"
    fi

    # Prüfe ob devlop im Build enthalten ist
    BUILD_JS=$(find "$PROJECT_DIR/dist" -name "*.js" -type f | head -1)
    if [ -n "$BUILD_JS" ]; then
        if grep -q "devlop" "$BUILD_JS"; then
            info_msg "✓ devlop im Build gefunden"
        else
            warn_msg "⚠ devlop NICHT im Build gefunden - möglicherweise Build-Fehler"
        fi
    fi

    success_msg "Build erfolgreich"
}

# Deploy: dist/ nach /home/nginx/domains/mojobus.co/public
deploy_files() {
    info_msg "Deploye Files nach $DEPLOY_DIR..."

    # Zielverzeichnis leeren
    rm -rf "$DEPLOY_DIR"/*

    # Inhalt von dist/ nach DEPLOY_DIR kopieren
    cp -r "$PROJECT_DIR/dist/"* "$DEPLOY_DIR/" || error_exit "Kopieren fehlgeschlagen"

    # Emergency SW deployen wenn --emergency flag
    if [ "$1" == "--emergency" ] || [ "$2" == "--emergency" ]; then
        warn_msg "Deploye Emergency Service Worker zum Cache-Leeren..."
        cp "$PROJECT_DIR/public/sw-emergency.js" "$DEPLOY_DIR/sw.js"
        info_msg "✓ Emergency SW deployed"
    fi

    # Permissions setzen
    chown -R nginx:nginx "$DEPLOY_DIR"
    find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;
    find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

    success_msg "Files deployed und Permissions gesetzt"
}

# Verify
verify_deployment() {
    info_msg "Verifiziere Deployment..."

    if [ ! -f "$DEPLOY_DIR/index.html" ]; then
        error_exit "index.html nicht im Deployment-Ordner gefunden!"
    fi

    # Dateien auflisten
    ls -lah "$DEPLOY_DIR/" | head -20

    # Gesamtgröße
    SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
    info_msg "Gesamtgröße: $SIZE"

    success_msg "Deployment verifiziert"
}

# Summary
summary() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ Deployment erfolgreich!${NC}"
    echo "=========================================="
    echo ""
    info_msg "Details:"
    echo "   Projekt: $PROJECT_DIR"
    echo "   Ziel: $DEPLOY_DIR"
    echo "   Owner: nginx:nginx"
    echo "   Log: $LOG_FILE"
    echo ""
    info_msg "Teste: https://mojobus.co"
    echo ""
}

# ============================================
# MAIN
# ============================================

main() {
    echo ""
    echo "=========================================="
    echo "🚀 MojoBus VPS Deploy"
    echo "=========================================="
    echo ""

    setup_logging
    check_deploy_dir

    # Wenn --clean-flag, lösche node_modules
    if [ "$1" == "--clean" ] || [ "$2" == "--clean" ]; then
        warn_msg "Lösche node_modules für sauberen Build..."
        rm -rf "$PROJECT_DIR/node_modules"
        info_msg "node_modules gelöscht"
    fi

    git_pull "$@"
    install_dependencies
    build_project
    deploy_files "$1" "$2"
    verify_deployment
    summary
}

# Main ausführen
main "$@"
