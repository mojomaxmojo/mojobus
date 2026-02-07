#!/bin/bash

# Simple Deploy Script for MojoBus
# Nur Build und Deploy - kein Git Pull

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/home/nginx/domains/mojobus.co/public"

echo ""
echo "=========================================="
echo "🚀 MojoBus Simple Deploy"
echo "=========================================="
echo ""

# Map-Dateien für Production wiederherstellen
echo -e "${BLUE}ℹ  Stelle Map-Dateien für Production wieder her...${NC}"
mkdir -p "$PROJECT_DIR/.deployment-backup"
cp "$PROJECT_DIR/src/AppRouter.tsx" "$PROJECT_DIR/.deployment-backup/AppRouter.tsx" 2>/dev/null || true

if [ -f "$PROJECT_DIR/src/pages/MapPage.production.tsx" ]; then
    mv "$PROJECT_DIR/src/pages/MapPage.production.tsx" "$PROJECT_DIR/src/pages/MapPage.tsx"
    echo -e "${GREEN}✅ MapPage.tsx wiederhergestellt${NC}"
else
    echo -e "${YELLOW}⚠  MapPage.production.tsx nicht gefunden${NC}"
fi

sed -i 's/import("\.\/pages\/MapPagePlaceholder")/import("\.\/pages\/MapPage")/g' "$PROJECT_DIR/src/AppRouter.tsx"
echo -e "${GREEN}✅ AppRouter.tsx aktualisiert${NC}"
echo ""

# Build
echo -e "${BLUE}ℹ  Baue Projekt...${NC}"
npm run build || {
    echo -e "${RED}❌ Build fehlgeschlagen${NC}"
    # Restore dev config on build failure
    if [ -f "$PROJECT_DIR/src/pages/MapPage.tsx" ]; then
        mv "$PROJECT_DIR/src/pages/MapPage.tsx" "$PROJECT_DIR/src/pages/MapPage.production.tsx"
    fi
    if [ -f "$PROJECT_DIR/.deployment-backup/AppRouter.tsx" ]; then
        cp "$PROJECT_DIR/.deployment-backup/AppRouter.tsx" "$PROJECT_DIR/src/AppRouter.tsx"
    fi
    rm -rf "$PROJECT_DIR/.deployment-backup"
    exit 1
}
echo -e "${GREEN}✅ Build erfolgreich${NC}"
echo ""

# Deploy
echo -e "${BLUE}ℹ  Deploye nach $DEPLOY_DIR...${NC}"
rm -rf "$DEPLOY_DIR"/*
cp -r "$PROJECT_DIR/dist/"* "$DEPLOY_DIR/" || {
    echo -e "${RED}❌ Deploy fehlgeschlagen${NC}"
    exit 1
}

# Permissions
chown -R nginx:nginx "$DEPLOY_DIR"
find "$DEPLOY_DIR" -type d -exec chmod 755 {} \;
find "$DEPLOY_DIR" -type f -exec chmod 644 {} \;

echo -e "${GREEN}✅ Deploy erfolgreich${NC}"
echo ""

# Development-Konfiguration wiederherstellen
echo -e "${BLUE}ℹ  Stelle Development-Konfiguration wieder her...${NC}"
if [ -f "$PROJECT_DIR/src/pages/MapPage.tsx" ]; then
    mv "$PROJECT_DIR/src/pages/MapPage.tsx" "$PROJECT_DIR/src/pages/MapPage.production.tsx"
    echo -e "${GREEN}✅ MapPage.tsx → MapPage.production.tsx${NC}"
fi

if [ -f "$PROJECT_DIR/.deployment-backup/AppRouter.tsx" ]; then
    cp "$PROJECT_DIR/.deployment-backup/AppRouter.tsx" "$PROJECT_DIR/src/AppRouter.tsx"
    echo -e "${GREEN}✅ AppRouter.tsx wiederhergestellt${NC}"
fi

rm -rf "$PROJECT_DIR/.deployment-backup"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Deployment abgeschlossen!${NC}"
echo "=========================================="
echo ""
echo "🔗 Teste: https://mojobus.co"
echo "🗺️  Map mit Leaflet funktioniert jetzt!"
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
