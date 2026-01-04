# 📊 GESTION CLIENTS - Système complet de gestion

![Version](https://img.shields.io/badge/version-1.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Debian%2012-orange)

**Application web moderne de gestion de clients avec upload de fichiers et exports multiformats**

---

## 🌟 Fonctionnalités principales

### 👥 Gestion des clients
- ➕ Ajout, modification, suppression de clients
- 📝 Stockage d'informations : nom, email, téléphone, notes
- 📅 Date d'ajout automatique
- 💾 Sauvegarde automatique dans une base JSON

### 🔍 Recherche et filtrage
- 🔤 Filtres alphabétiques A-Z
- 🔎 Recherche en temps réel (nom, email, téléphone, notes)
- 📊 Statistiques du nombre de clients

### 📁 Gestion de fichiers
- 📤 Upload par clic ou glisser-déposer
- 📸 Support : photos, documents, PDF, vidéos, audio
- 👁️ Visualisation en plein écran (images, PDF, texte, vidéo, audio)
- ⬇️ Téléchargement direct
- 🗑️ Suppression de fichiers
- 📦 Limite : 10MB par fichier

### 💾 Export de données
- **Formats disponibles :**
  - 📋 JSON (format technique)
  - 📊 CSV (compatible Excel)
  - 📄 TXT (texte formaté lisible)
  - 🌐 HTML (page web imprimable)
  - 📦 ZIP complet (données + tous les fichiers)
- **Export individuel** : Un seul client avec ses fichiers
- **Export global** : Toute la base de données

### 🔐 Sécurité
- 🔒 Authentification HTTP Basic
- 🔥 Firewall : Ports API bloqués de l'extérieur
- 🛡️ API accessible uniquement via proxy Apache
- 🚫 Accès protégé aux fichiers uploadés

### 🎨 Interface
- 🌙 Thème sombre
- 📱 Responsive (PC, tablette, mobile)
- ⚡ Animations fluides
- 🖱️ UX intuitive

---

## 📋 Prérequis

- **OS :** Debian 12 ou Ubuntu 22.04+
- **RAM :** 512 MB minimum
- **Disque :** 1 GB minimum
- **Logiciels :**
  - Apache 2.4+
  - Node.js 18+
  - NPM 8+

---

## 🚀 Installation rapide

### Installation guidée (15 minutes)

Suivez le **NSTALLATION-EXPRESS.md** pour une installation pas à pas.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **NSTALLATION-EXPRESS.md** | Installation en 15 minutes ⚡ |

---

## 🎮 Utilisation

### Accès

```
http://VOTRE_IP/gestion-clients/index.html
```
---

## 📁 Structure du projet

```
/var/www/html/gestion-clients/
├── index.html              # Interface web
├── upload-server.js        # Serveur d'upload
├── db.json                 # Base de données
├── package.json            # Dépendances Node.js
└── uploads/                # Fichiers uploadés
    ├── Jean_Dupont/
    │   ├── photo.jpg
    │   └── document.pdf
    └── Marie_Martin/
        └── facture.pdf
```

---

## 🏗️ Architecture

```
┌─────────────────────────────┐
│    Navigateur (Client)      │
│   http://IP/gestion-clients │
└─────────────┬───────────────┘
              │ Port 80
              ▼
┌─────────────────────────────┐
│      Apache + Proxy         │
│   • Authentification        │
│   • Proxy vers APIs         │
└────┬──────────────┬─────────┘
     │              │
     ▼              ▼
┌─────────┐   ┌─────────┐
│JSON API │   │Upload   │
│Port 3000│   │Port 3001│
│localhost│   │localhost│
└────┬────┘   └────┬────┘
     │             │
     ▼             ▼
┌─────────┐   ┌─────────┐
│ db.json │   │uploads/ │
└─────────┘   └─────────┘
```

---

## 🛠️ Technologies utilisées

### Backend
- **Apache** : Serveur web + proxy inverse
- **Node.js** : Runtime JavaScript
- **JSON Server** : API REST automatique
- **Express** : Framework web
- **Multer** : Gestion des uploads

### Frontend
- **HTML5** : Structure
- **CSS3** : Styles (thème Dracula)
- **JavaScript Vanilla** : Logique
- **JSZip** : Génération de fichiers ZIP

---

## 🔧 Configuration avancée

### Ajouter un utilisateur

```bash
sudo htpasswd /etc/apache2/.htpasswd nouveauuser
```

### Augmenter la limite d'upload

Dans `upload-server.js` :
```javascript
limits: { fileSize: 50 * 1024 * 1024 } // 50MB
```

### Sauvegarde automatique

```bash
# Cron job quotidien à 2h
0 2 * * * tar -czf ~/backup-$(date +\%Y\%m\%d).tar.gz /var/www/html/gestion-clients/
```

---

## 🐛 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
sudo journalctl -u gestion-clients-api -n 50

# Vérifier les permissions
ls -la /var/www/html/gestion-clients/
```

### Erreur 403 Forbidden

```bash
# Corriger les permissions
sudo chown -R votre-user:votre-user /var/www/html/gestion-clients/
sudo chmod -R 755 /var/www/html/gestion-clients/
```

---

## 📝 Changelog

### Version 1.0 (Octobre 2025)
- ✅ Gestion complète des clients
- ✅ Upload et visualisation de fichiers
- ✅ Export multiformats (JSON, CSV, TXT, HTML, ZIP)
- ✅ Authentification HTTP Basic
- ✅ Sécurité firewall
- ✅ Interface responsive
- ✅ Documentation complète

---

## 📄 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

**⭐ Projet créé avec ❤️ pour simplifier la gestion des clients**

**Dernière mise à jour :** Octobre 2025
