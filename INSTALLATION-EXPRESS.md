# ⚡ INSTALLATION EXPRESS - 1 COMMANDE

## 📦 Package d'installation complet

**Tout est inclus !** Un seul fichier ZIP avec installation automatique.

---

## 🚀 INSTALLATION EN 3 ÉTAPES

### 1️⃣ Télécharger

Téléchargez **gestion-clients-package.zip**

### 2️⃣ Extraire

```bash
unzip gestion-clients-package.zip
cd gestion-clients-package
```

### 3️⃣ Installer

```bash
chmod +x install.sh
./install.sh
```

**C'EST TOUT !** ✨

Le script fait **TOUT** automatiquement :
- ✅ Installe Apache, Node.js, dépendances
- ✅ Crée la structure
- ✅ Configure les services
- ✅ Configure Apache et le firewall
- ✅ Démarre tout

**Durée : 5-10 minutes** ☕

---

## 🎯 CE QUE LE SCRIPT FAIT

```
[1/10] Installation des prérequis (Apache, Node.js)...
[2/10] Création de la structure (/var/www/html/gestion-clients)...
[3/10] Copie des fichiers...
[4/10] Installation des dépendances npm...
[5/10] Création de la base de données (db.json)...
[6/10] Configuration de l'authentification...
      → Choix : Sans auth ou Auth sécurisée (bcrypt)
[7/10] Création des services systemd...
[8/10] Configuration d'Apache (proxy, routes)...
[9/10] Configuration du firewall (ports bloqués)...
[10/10] Démarrage des services...

✅ INSTALLATION TERMINÉE !
```

---

## ✅ RÉSULTAT

### Accès
```
http://VOTRE_IP/gestion-clients/
```

### Services installés
- ✅ **Apache** (Port 80)
- ✅ **JSON Server** (Port 3000) - API clients
- ✅ **Upload Server** (Port 3001) - Gestion fichiers
- ✅ **Auth Server** (Port 3002) - Authentification sécurisée

### Fonctionnalités
- ✅ Gestion complète des clients
- ✅ Upload de fichiers (tous types, 50MB max)
- ✅ Visualisation de fichiers (images, PDF, vidéo)
- ✅ Export multiformats (JSON, CSV, TXT, HTML, ZIP)
- ✅ Authentification sécurisée (bcrypt)
- ✅ Recherche et filtres

---

## 🔐 IDENTIFIANTS (si auth activée)

```
admin / admin123
```

**⚠️ Changez-les après l'installation !**

```bash
cd /var/www/html/gestion-clients
node create-user.js create
```

---

## 📋 CONTENU DU PACKAGE

```
gestion-clients-package.zip (48 KB)
├── install.sh                    ← Script d'installation
├── index-avec-upload.html        ← Interface web
├── upload-server.js              ← Serveur upload
├── auth-server.js                ← Serveur auth
├── create-user.js                ← Gestion users
├── login-secure.html             ← Page login
├── app-secure.html               ← App sécurisée
├── 000-default-complete.conf     ← Config Apache
└── README.md                     ← Documentation
```

---

## 🔧 COMMANDES UTILES

### Voir les services
```bash
sudo systemctl status gestion-clients-api
sudo systemctl status gestion-clients-upload
sudo systemctl status gestion-clients-auth
```

### Voir les logs
```bash
sudo journalctl -u gestion-clients-api -f
```

### Redémarrer
```bash
sudo systemctl restart gestion-clients-api
sudo systemctl restart gestion-clients-upload
sudo systemctl restart apache2
```

### Gérer les utilisateurs
```bash
cd /var/www/html/gestion-clients
node create-user.js list      # Lister
node create-user.js create    # Créer
node create-user.js delete    # Supprimer
```

---

## 🐛 PROBLÈME ?

### Voir le log d'installation
```bash
cat /tmp/gestion-clients-install.log
```

### Tester Apache
```bash
sudo apache2ctl configtest
```

### Vérifier les ports
```bash
sudo ss -tulnp | grep 3000
sudo ss -tulnp | grep 3001
sudo ss -tulnp | grep 3002
# Doivent tous écouter sur 127.0.0.1
```

---

## 📖 DOCUMENTATION COMPLÈTE

Consultez **README.md** dans le package pour :
- Guide détaillé
- Dépannage complet
- Architecture
- Configuration avancée
- Désinstallation

---

## 🎉 C'EST PRÊT !

Une seule commande et vous avez un système de gestion clients complet et sécurisé !

**Bon usage !** 🚀

---

**Version :** 1.2 | **Taille :** 48 KB | **Durée d'install :** 5-10 min
