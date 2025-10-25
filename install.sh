#!/bin/bash
################################################################################
#                                                                              #
#  INSTALLATION AUTOMATIQUE - SYSTÈME DE GESTION CLIENTS                      #
#  Version: 1.0                                                                #
#  Date: Octobre 2025                                                          #
#                                                                              #
################################################################################

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables globales
INSTALL_DIR="/var/www/html/gestion-clients"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/tmp/gestion-clients-install.log"

# Fonction pour afficher le logo
show_logo() {
    clear
    echo -e "${PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║     ⚡ SYSTÈME DE GESTION CLIENTS - INSTALLATION ⚡           ║"
    echo "║                                                               ║"
    echo "║            Installation automatique complète                  ║"
    echo "║                     Version 1.2                               ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
}

# Fonctions d'affichage
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
    log "INFO: $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

step() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    log "STEP: $1"
}

# Fonction pour vérifier si on est root
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        error "Ne lancez PAS ce script en tant que root !"
        error "Lancez-le avec votre utilisateur normal."
        error "Le script utilisera sudo quand nécessaire."
        exit 1
    fi
}

# Fonction pour demander confirmation
confirm() {
    local prompt="$1"
    local default="${2:-n}"
    
    if [ "$default" = "O" ]; then
        prompt="$prompt [O/n]: "
    else
        prompt="$prompt [o/N]: "
    fi
    
    read -p "$prompt" response
    response=${response:-$default}
    
    if [[ "$response" =~ ^[Oo]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Fonction pour installer les prérequis
install_prerequisites() {
    step "Étape 1/10: Installation des prérequis"
    
    info "Mise à jour de la liste des paquets..."
    sudo apt update >> "$LOG_FILE" 2>&1
    
    # Apache
    if ! command -v apache2 &> /dev/null; then
        info "Installation d'Apache..."
        sudo apt install -y apache2 apache2-utils >> "$LOG_FILE" 2>&1
        success "Apache installé"
    else
        success "Apache déjà installé"
    fi
    
    # Node.js
    if ! command -v node &> /dev/null; then
        info "Installation de Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - >> "$LOG_FILE" 2>&1
        sudo apt install -y nodejs >> "$LOG_FILE" 2>&1
        success "Node.js installé"
    else
        success "Node.js déjà installé ($(node --version))"
    fi
    
    # json-server
    if ! command -v json-server &> /dev/null; then
        info "Installation de json-server..."
        sudo npm install -g json-server >> "$LOG_FILE" 2>&1
        success "json-server installé"
    else
        success "json-server déjà installé"
    fi
    
    # iptables-persistent
    if ! dpkg -l | grep -q iptables-persistent; then
        info "Installation de iptables-persistent..."
        sudo DEBIAN_FRONTEND=noninteractive apt install -y iptables-persistent >> "$LOG_FILE" 2>&1
        success "iptables-persistent installé"
    else
        success "iptables-persistent déjà installé"
    fi
}

# Fonction pour créer la structure de l'application
create_structure() {
    step "Étape 2/10: Création de la structure de l'application"
    
    # Créer le dossier principal
    if [ ! -d "$INSTALL_DIR" ]; then
        info "Création du dossier $INSTALL_DIR..."
        sudo mkdir -p "$INSTALL_DIR"
        success "Dossier créé"
    else
        warning "Le dossier $INSTALL_DIR existe déjà"
        if confirm "Voulez-vous faire une sauvegarde avant de continuer?"; then
            BACKUP_DIR="$INSTALL_DIR-backup-$(date +%Y%m%d-%H%M%S)"
            info "Sauvegarde dans $BACKUP_DIR..."
            sudo cp -r "$INSTALL_DIR" "$BACKUP_DIR"
            success "Sauvegarde créée"
        fi
    fi
    
    # Créer les sous-dossiers
    sudo mkdir -p "$INSTALL_DIR/uploads"
    sudo mkdir -p "$INSTALL_DIR/backups"
    
    # Définir les permissions
    sudo chown -R $USER:$USER "$INSTALL_DIR"
    
    success "Structure créée"
}

# Fonction pour copier les fichiers
copy_files() {
    step "Étape 3/10: Copie des fichiers de l'application"
    
    info "Copie des fichiers depuis $SCRIPT_DIR..."
    
    # Copier tous les fichiers nécessaires
    cp "$SCRIPT_DIR/index-avec-upload.html" "$INSTALL_DIR/index.html"
    cp "$SCRIPT_DIR/upload-server.js" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/auth-server.js" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/create-user.js" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/login-secure.html" "$INSTALL_DIR/"
    cp "$SCRIPT_DIR/app-secure.html" "$INSTALL_DIR/"
    
    # Rendre create-user.js exécutable
    chmod +x "$INSTALL_DIR/create-user.js"
    
    success "Fichiers copiés"
}

# Fonction pour initialiser npm
initialize_npm() {
    step "Étape 4/10: Installation des dépendances Node.js"
    
    cd "$INSTALL_DIR"
    
    # Créer package.json
    info "Création de package.json..."
    cat > package.json << 'EOF'
{
  "name": "gestion-clients",
  "version": "1.0.0",
  "description": "Système de gestion de clients avec authentification sécurisée",
  "main": "upload-server.js",
  "scripts": {
    "start": "json-server --watch db.json --port 3000 --host 127.0.0.1"
  },
  "dependencies": {
    "express": "^5.1.0",
    "multer": "^2.0.2",
    "cors": "^2.8.5",
    "bcrypt": "^6.0.0",
    "archiver": "^7.0.1"
  }
}
EOF
    
    # Installer les dépendances
    info "Installation des dépendances (cela peut prendre quelques minutes)..."
    npm install >> "$LOG_FILE" 2>&1
    
    success "Dépendances installées"
}

# Fonction pour créer la base de données
create_database() {
    step "Étape 5/10: Création de la base de données"
    
    cd "$INSTALL_DIR"
    
    if [ ! -f "db.json" ]; then
        info "Création de db.json..."
        echo '{"clients":[]}' > db.json
        success "db.json créé"
    else
        warning "db.json existe déjà, conservation des données"
    fi
}

# Fonction pour configurer l'authentification
configure_auth() {
    step "Étape 6/10: Configuration de l'authentification"
    
    cd "$INSTALL_DIR"
    
    echo ""
    info "Choix du mode d'authentification:"
    echo "  1) Sans authentification (accès libre)"
    echo "  2) Authentification sécurisée (bcrypt + backend)"
    echo ""
    
    read -p "Votre choix [1-2]: " auth_choice
    
    case $auth_choice in
        1)
            info "Mode: Sans authentification"
            # Utiliser index-avec-upload.html comme page principale
            # Déjà copié comme index.html
            success "Configuration terminée (mode libre)"
            return 0
            ;;
        2)
            info "Mode: Authentification sécurisée"
            
            # Utiliser les fichiers sécurisés
            cp "$INSTALL_DIR/login-secure.html" "$INSTALL_DIR/index.html"
            cp "$INSTALL_DIR/app-secure.html" "$INSTALL_DIR/app.html"
            
            warning "⚠️  Changez ces mots de passe après l'installation !"
            ;;
        *)
            warning "Choix invalide, utilisation du mode sans authentification"
            return 0
            ;;
    esac
}

# Fonction pour créer les services systemd
create_services() {
    step "Étape 7/10: Création des services systemd"
    
    # Service API (json-server)
    info "Création du service gestion-clients-api..."
    sudo tee /etc/systemd/system/gestion-clients-api.service > /dev/null << EOF
[Unit]
Description=API Gestion Clients (JSON Server)
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/json-server --watch db.json --port 3000 --host 127.0.0.1
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Service Upload
    info "Création du service gestion-clients-upload..."
    sudo tee /etc/systemd/system/gestion-clients-upload.service > /dev/null << EOF
[Unit]
Description=Serveur Upload Gestion Clients
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node upload-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Service Auth (si mode sécurisé)
    if [ "$auth_choice" = "2" ]; then
        info "Création du service gestion-clients-auth..."
        sudo tee /etc/systemd/system/gestion-clients-auth.service > /dev/null << EOF
[Unit]
Description=Serveur Authentification Gestion Clients
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node auth-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    fi
    
    # Recharger systemd
    sudo systemctl daemon-reload
    
    success "Services créés"
}

# Fonction pour configurer Apache
configure_apache() {
    step "Étape 8/10: Configuration d'Apache"
    
    # Sauvegarder l'ancienne config
    if [ -f /etc/apache2/sites-available/000-default.conf ]; then
        info "Sauvegarde de l'ancienne configuration Apache..."
        sudo cp /etc/apache2/sites-available/000-default.conf \
                /etc/apache2/sites-available/000-default.conf.backup-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Copier la nouvelle config
    info "Installation de la nouvelle configuration Apache..."
    sudo cp "$SCRIPT_DIR/000-default-complete.conf" /etc/apache2/sites-available/000-default.conf
    
    # Activer les modules nécessaires
    info "Activation des modules Apache..."
    sudo a2enmod proxy >> "$LOG_FILE" 2>&1
    sudo a2enmod proxy_http >> "$LOG_FILE" 2>&1
    
    # Tester la configuration
    info "Test de la configuration Apache..."
    if sudo apache2ctl configtest >> "$LOG_FILE" 2>&1; then
        success "Configuration Apache valide"
    else
        error "Erreur dans la configuration Apache"
        error "Consultez $LOG_FILE pour plus de détails"
        return 1
    fi
}

# Fonction pour configurer le firewall
configure_firewall() {
    step "Étape 9/10: Configuration du firewall"
    
    info "Configuration du firewall pour bloquer les ports internes..."
    
    # Port 3000 (API)
    sudo iptables -D INPUT -p tcp --dport 3000 -j REJECT 2>/dev/null
    sudo iptables -I INPUT 1 -i lo -p tcp --dport 3000 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 3000 -j REJECT --reject-with tcp-reset
    
    # Port 3001 (Upload)
    sudo iptables -D INPUT -p tcp --dport 3001 -j REJECT 2>/dev/null
    sudo iptables -I INPUT 1 -i lo -p tcp --dport 3001 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 3001 -j REJECT --reject-with tcp-reset
    
    # Port 3002 (Auth) - si mode sécurisé
    if [ "$auth_choice" = "2" ]; then
        sudo iptables -D INPUT -p tcp --dport 3002 -j REJECT 2>/dev/null
        sudo iptables -I INPUT 1 -i lo -p tcp --dport 3002 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 3002 -j REJECT --reject-with tcp-reset
    fi
    
    # Sauvegarder les règles
    sudo netfilter-persistent save >> "$LOG_FILE" 2>&1
    
    success "Firewall configuré"
}

# Fonction pour démarrer les services
start_services() {
    step "Étape 10/10: Démarrage des services"
    
    # Redémarrer Apache
    info "Redémarrage d'Apache..."
    sudo systemctl restart apache2
    
    # Activer et démarrer les services
    info "Activation et démarrage des services..."
    
    sudo systemctl enable gestion-clients-api >> "$LOG_FILE" 2>&1
    sudo systemctl start gestion-clients-api
    
    sudo systemctl enable gestion-clients-upload >> "$LOG_FILE" 2>&1
    sudo systemctl start gestion-clients-upload
    
    if [ "$auth_choice" = "2" ]; then
        sudo systemctl enable gestion-clients-auth >> "$LOG_FILE" 2>&1
        sudo systemctl start gestion-clients-auth
    fi
    
    # Attendre un peu que les services démarrent
    sleep 3
    
    # Vérifier les services
    info "Vérification des services..."
    
    if systemctl is-active --quiet gestion-clients-api; then
        success "✅ gestion-clients-api actif"
    else
        error "❌ gestion-clients-api n'a pas démarré"
    fi
    
    if systemctl is-active --quiet gestion-clients-upload; then
        success "✅ gestion-clients-upload actif"
    else
        error "❌ gestion-clients-upload n'a pas démarré"
    fi
    
    if [ "$auth_choice" = "2" ]; then
        if systemctl is-active --quiet gestion-clients-auth; then
            success "✅ gestion-clients-auth actif"
        else
            error "❌ gestion-clients-auth n'a pas démarré"
        fi
    fi
    
    if systemctl is-active --quiet apache2; then
        success "✅ Apache actif"
    else
        error "❌ Apache n'a pas démarré"
    fi
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║        ✅ INSTALLATION TERMINÉE AVEC SUCCÈS ! ✅              ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Obtenir l'IP du serveur
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    echo -e "${CYAN}📍 ACCÈS À L'APPLICATION${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "🌐 URL: ${YELLOW}http://$SERVER_IP/gestion-clients/${NC}"
    echo ""
    
    if [ "$auth_choice" = "2" ]; then
        echo -e "${CYAN}🔐 IDENTIFIANTS${NC}"
        echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "  👤 admin / admin123"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Changez ces mots de passe !${NC}"
        echo "     cd $INSTALL_DIR"
        echo "     node create-user.js create"
        echo ""
    fi
    
    echo -e "${CYAN}📊 SERVICES INSTALLÉS${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  ✅ Apache (Port 80)"
    echo "  ✅ JSON Server - API Clients (Port 3000)"
    echo "  ✅ Upload Server (Port 3001)"
    if [ "$auth_choice" = "2" ]; then
        echo "  ✅ Auth Server (Port 3002)"
    fi
    echo ""
    
    echo -e "${CYAN}🔧 COMMANDES UTILES${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Voir les services:"
    echo "    sudo systemctl status gestion-clients-api"
    echo "    sudo systemctl status gestion-clients-upload"
    if [ "$auth_choice" = "2" ]; then
        echo "    sudo systemctl status gestion-clients-auth"
    fi
    echo ""
    echo "  Voir les logs:"
    echo "    sudo journalctl -u gestion-clients-api -f"
    echo "    sudo journalctl -u gestion-clients-upload -f"
    echo ""
    if [ "$auth_choice" = "2" ]; then
        echo "  Gérer les utilisateurs:"
        echo "    cd $INSTALL_DIR"
        echo "    node create-user.js create   # Créer un utilisateur"
        echo "    node create-user.js list     # Lister les utilisateurs"
        echo "    node create-user.js delete   # Supprimer un utilisateur"
        echo ""
    fi
    
    echo -e "${CYAN}📁 DOSSIER D'INSTALLATION${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  $INSTALL_DIR"
    echo ""
    
    echo -e "${CYAN}📝 LOG D'INSTALLATION${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  $LOG_FILE"
    echo ""
    
    echo -e "${GREEN}🎉 Votre système de gestion de clients est opérationnel !${NC}"
    echo ""
}

# Fonction principale
main() {
    show_logo
    
    # Vérifier qu'on n'est pas root
    check_root
    
    info "Début de l'installation..."
    info "Log: $LOG_FILE"
    echo ""
    
    # Demander confirmation
    if ! confirm "Êtes-vous prêt à commencer l'installation?" "y"; then
        warning "Installation annulée par l'utilisateur"
        exit 0
    fi
    
    # Étapes d'installation
    install_prerequisites
    create_structure
    copy_files
    initialize_npm
    create_database
    configure_auth
    create_services
    configure_apache
    configure_firewall
    start_services
    
    # Afficher le résumé
    show_summary
    
    log "Installation terminée avec succès"
}

# Gestion des erreurs
trap 'error "Une erreur est survenue. Consultez $LOG_FILE pour plus de détails."; exit 1' ERR

# Lancement du script
main "$@"
