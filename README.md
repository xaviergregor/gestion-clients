# Gestion Clients

Application web de gestion de clients et de **documentation d'infrastructure** : fiches, accès (mots de passe), plans d'adressage, équipements, fichiers joints — avec comptes à droits réglables et chiffrement des secrets.

Version 3.0 · une seule instance, plusieurs comptes.

## Stack

- **Serveur** — Node.js 24 / Express (un seul service)
- **Interface** — HTML/CSS/JS, thème clair / sombre (charte « Calme » de xgr.fr)
- **Stockage** — fichiers JSON + dossier `uploads/`, secrets chiffrés (AES-256-GCM)
- **Déploiement** — Docker Compose

## Fonctionnalités

- **Fiches client** : coordonnées, notes, fichiers joints.
- **Accès** : identifiants et mots de passe, masqués par défaut, révélation et copie à la demande (toute révélation est tracée dans le journal).
- **Réseau** : sous-réseaux, VLAN, passerelle, DNS, plage DHCP, IP publique.
- **Équipements** : nom d'hôte, IP, rôle, OS.
- **Chiffrement au repos** des mots de passe (AES-256-GCM), clé dans `.env`.
- **Double authentification (TOTP)** : activable par chaque compte, imposable par l'admin.
- **Comptes à droits fins** et visibilité par client (voir plus bas).
- **Exports** ZIP filtrés selon le périmètre et les droits.
- **Sauvegardes quotidiennes** automatiques (30 jours) dans `data/backups/`.
- **Sauvegarde complète chiffrée** depuis l'interface admin : archive ZIP (AES-256) de `data/`, du `.env` et du `docker-compose.yml`, protégée par une phrase de passe.

## Comptes et droits

Deux rôles : **administrateur** (accès complet + gestion des comptes) et **utilisateur** (droits réglés par l'admin) :

| Droit | Effet si décoché |
|---|---|
| Créer et modifier des clients | Lecture seule |
| Voir et modifier les notes | Notes masquées |
| **Voir les accès et mots de passe** | Section Accès masquée |
| Voir les fichiers | Pas d'accès aux fichiers |
| Ajouter et supprimer des fichiers | Consultation seule |
| Exporter les données | Pas d'export |

Et un **périmètre** : tous les clients, ou une sélection. Exemple : *Xavier* voit client1 et client2, *Alix* seulement client2. Un utilisateur restreint ne voit ces clients ni dans la liste, ni dans la recherche, ni dans ses exports.

Tout est appliqué côté serveur. Un mot de passe de secret n'est **jamais** envoyé avec la liste des clients : il est déchiffré uniquement lors d'une révélation explicite, par un compte qui a le droit, et c'est journalisé.

## Sécurité

- **Mots de passe des accès chiffrés au repos** (AES-256-GCM) avec `ENCRYPTION_KEY`. Sur le disque, seul le chiffré apparaît.
- **2FA (TOTP)** compatible Google Authenticator, Aegis, 2FAS, Proton Authenticator… L'admin peut l'imposer à un compte et la réinitialiser en cas de perte du téléphone.
- Sessions signées (HMAC), **déconnexion après inactivité** (`IDLE_MINUTES`), **HSTS** quand `COOKIE_SECURE=1`.
- Anti-bruteforce (login et 2FA), en-têtes de sécurité, contenu échappé (pas de XSS).
- Fichiers hors racine web, servis seulement après contrôle ; types sûrs affichés, le reste téléchargé, rien ne s'exécute dans la page.
- Journal `data/audit.log` : connexions, révélations de mots de passe, créations/modifications/suppressions, exports.

## Configuration

Secrets dans un fichier **`.env`** à côté du `docker-compose.yml`, jamais versionné.

```bash
cp .env.example .env
nano .env
```

```ini
APP_NAME=Gestion Clients
SECRET_KEY=            # openssl rand -hex 32  (signature des sessions)
ENCRYPTION_KEY=        # openssl rand -hex 32  (chiffrement des mots de passe)
ADMIN_USER=admin
ADMIN_PASSWORD=        # mot de passe admin au 1er démarrage
TRUST_PROXY=1
COOKIE_SECURE=1        # exposée sur Internet : HTTPS + HSTS
SESSION_HOURS=12
IDLE_MINUTES=30
```

- `SECRET_KEY` et `ENCRYPTION_KEY` : deux valeurs **distinctes**, longues, aléatoires, **une paire par instance**.
- **⚠️ `ENCRYPTION_KEY` est irremplaçable** : la perdre rend les mots de passe stockés illisibles. La sauvegarder hors de la VM (gestionnaire de mots de passe). Sans elle, les secrets seraient stockés en clair (l'app le signale au démarrage).
- Changer `SECRET_KEY` déconnecte tout le monde ; changer `ENCRYPTION_KEY` casse le déchiffrement des secrets déjà enregistrés.
- Au 1er démarrage, un compte admin est créé (`ADMIN_USER`/`ADMIN_PASSWORD`, ou mot de passe généré visible dans `docker compose logs`).

## Déploiement

```bash
cp .env.example .env                      # renseigner SECRET_KEY, ENCRYPTION_KEY, ADMIN_PASSWORD
docker compose up -d --build
docker compose ps                         # "healthy"
docker compose logs                        # mot de passe admin si non fourni
```

Exposée sur Internet : la mettre **derrière un reverse proxy HTTPS** (Caddy, Nginx), `COOKIE_SECURE=1` et `TRUST_PROXY=1`, et exposer le port en local seulement (`127.0.0.1:3000:3000`). Activer la 2FA sur les comptes.

```
clients.exemple.fr {
    reverse_proxy gestion-clients:3000
}
```

## Migration depuis la v1

```bash
node server/migrate.js /var/www/html/gestion-clients ./data
docker compose up -d --build
```

Reprend clients, fichiers et comptes (**mots de passe conservés**). Les anciens comptes deviennent administrateurs — à repasser en comptes restreints ensuite.

## Données et sauvegarde

```
data/
├── db.json          # clients (mots de passe des accès chiffrés)
├── users.json       # comptes (mots de passe bcrypt, secret TOTP chiffré)
├── audit.log        # journal
├── backups/AAAA-MM-JJ/   # copie quotidienne, 30 jours
├── uploads/<id>/    # fichiers joints
└── cache/thumbs/    # vignettes (régénérées à la demande, exclues des sauvegardes)
```

Sauvegarder `data/` régulièrement (hors de la VM). Les champs sensibles y sont déjà chiffrés, mais `ENCRYPTION_KEY` est nécessaire pour les relire : garder la clé séparément de la sauvegarde.

### Sauvegarde complète chiffrée (depuis l'interface)

Bouton **Sauvegarde** dans l'en-tête (admin). L'application produit une archive **ZIP chiffrée en AES-256** et protégée par une **phrase de passe**, qui contient :

```
data/                    → clients, comptes, journal, fichiers joints
branding/                → logo éventuel
config/.env              → secrets, dont ENCRYPTION_KEY
config/docker-compose.yml
LISEZ-MOI.txt            → rappel de restauration
```

Contrairement à la copie de `data/`, cette archive **embarque l'`ENCRYPTION_KEY`** (via le `.env`) : elle suffit à tout reconstruire. C'est donc la phrase de passe qui la protège — **choisissez-la longue (12+ caractères) et conservez-la à part** (gestionnaire de mots de passe). Sans elle, l'archive est illisible. Le dossier `data/backups/` (copies quotidiennes) est exclu pour éviter l'imbrication.

L'archive s'ouvre avec **7-Zip** (Windows/Linux), **Keka** (macOS) ou **WinZip** — chiffrement WinZip/AES-256 standard.

Pour que le `.env` et le `docker-compose.yml` soient inclus, ils sont montés en lecture seule dans le conteneur (déjà présent dans le `docker-compose.yml` fourni) :

```yaml
    volumes:
      - ./.env:/app/host/.env:ro
      - ./docker-compose.yml:/app/host/docker-compose.yml:ro
```

Sans ces montages, la sauvegarde se fait quand même, mais sans les fichiers de configuration (l'interface le signale).

### Restaurer une sauvegarde

Opération manuelle sur l'hôte (pas d'import par le web, volontairement) :

```bash
# 1. Décompresser l'archive avec la phrase de passe (exemple 7-Zip)
7z x sauvegarde-....zip            # demande la phrase de passe

# 2. Se placer dans un répertoire de déploiement propre et y copier :
cp -r data branding ./             # données et logo
cp config/.env ./.env              # secrets (dont ENCRYPTION_KEY)
cp config/docker-compose.yml ./    # (ou réutiliser le vôtre)

# 3. Démarrer
docker compose up -d --build
```

> L'`ENCRYPTION_KEY` du `.env` restauré **doit** correspondre aux données de `data/` : c'est elle qui déchiffre les mots de passe. L'archive garantit que les deux restent ensemble.

## Logo (optionnel)

Déposer `branding/logo.svg` (ou `.png`) à côté du `docker-compose.yml`, et `branding/logo-dark.*` pour une variante sombre. Rechargement de la page suffit.
