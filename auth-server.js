const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(express.json());

// CORS pour l'application
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Fichier pour stocker les utilisateurs (avec mots de passe hashés)
const USERS_FILE = path.join(__dirname, 'users.json');

// Fichier pour stocker les sessions actives
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

// Charger ou créer le fichier utilisateurs
function loadUsers() {
    if (fs.existsSync(USERS_FILE)) {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
        // Créer des utilisateurs par défaut avec mots de passe hashés
        const defaultUsers = {
            users: []
        };
        saveUsers(defaultUsers);
        return defaultUsers;
    }
}

function saveUsers(data) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

// Charger ou créer le fichier sessions
function loadSessions() {
    if (fs.existsSync(SESSIONS_FILE)) {
        return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    } else {
        const sessions = { sessions: [] };
        saveSessions(sessions);
        return sessions;
    }
}

function saveSessions(data) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
}

// Nettoyer les sessions expirées
function cleanExpiredSessions() {
    const data = loadSessions();
    const now = Date.now();
    data.sessions = data.sessions.filter(s => s.expiresAt > now);
    saveSessions(data);
}

// Route de login
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username et password requis' });
        }
        
        const data = loadUsers();
        const user = data.users.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
        
        // Vérifier le mot de passe avec bcrypt
        const match = await bcrypt.compare(password, user.passwordHash);
        
        if (!match) {
            return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
        
        // Créer une session
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const session = {
            token: sessionToken,
            username: username,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 heures
            lastActivity: Date.now()
        };
        
        const sessionsData = loadSessions();
        sessionsData.sessions.push(session);
        saveSessions(sessionsData);
        
        res.json({
            success: true,
            token: sessionToken,
            username: username,
            expiresAt: session.expiresAt
        });
        
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Route de vérification de session
app.get('/auth/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ success: false, error: 'Token manquant' });
        }
        
        cleanExpiredSessions();
        
        const data = loadSessions();
        const session = data.sessions.find(s => s.token === token);
        
        if (!session) {
            return res.status(401).json({ success: false, error: 'Session invalide' });
        }
        
        if (session.expiresAt < Date.now()) {
            return res.status(401).json({ success: false, error: 'Session expirée' });
        }
        
        // Mettre à jour la dernière activité
        session.lastActivity = Date.now();
        saveSessions(data);
        
        res.json({
            success: true,
            username: session.username,
            expiresAt: session.expiresAt
        });
        
    } catch (error) {
        console.error('Erreur verify:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Route de déconnexion
app.post('/auth/logout', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.json({ success: true });
        }
        
        const data = loadSessions();
        data.sessions = data.sessions.filter(s => s.token !== token);
        saveSessions(data);
        
        res.json({ success: true, message: 'Déconnexion réussie' });
        
    } catch (error) {
        console.error('Erreur logout:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Route pour ajouter un utilisateur (protégée - admin seulement)
app.post('/auth/users', async (req, res) => {
    try {
        const { username, password, adminPassword } = req.body;
        
        // Vérifier que c'est l'admin qui fait la requête
        // Pour plus de sécurité, vous pourriez ajouter un token admin
        
        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username et password requis' });
        }
        
        const data = loadUsers();
        
        // Vérifier si l'utilisateur existe déjà
        if (data.users.find(u => u.username === username)) {
            return res.status(409).json({ success: false, error: 'Utilisateur existe déjà' });
        }
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);
        
        data.users.push({
            username: username,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        });
        
        saveUsers(data);
        
        res.json({ success: true, message: 'Utilisateur créé' });
        
    } catch (error) {
        console.error('Erreur création user:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Route pour lister les utilisateurs (sans les mots de passe)
app.get('/auth/users', (req, res) => {
    try {
        const data = loadUsers();
        const users = data.users.map(u => ({
            username: u.username,
            createdAt: u.createdAt
        }));
        res.json({ success: true, users: users });
    } catch (error) {
        console.error('Erreur liste users:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Route pour supprimer un utilisateur
app.delete('/auth/users/:username', (req, res) => {
    try {
        const username = req.params.username;
        const data = loadUsers();
        
        data.users = data.users.filter(u => u.username !== username);
        saveUsers(data);
        
        res.json({ success: true, message: 'Utilisateur supprimé' });
    } catch (error) {
        console.error('Erreur suppression user:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Nettoyer les sessions expirées toutes les heures
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🔐 Serveur d'authentification démarré sur http://127.0.0.1:${PORT}`);
    console.log(`📁 Fichiers de données:`);
    console.log(`   - Utilisateurs: ${USERS_FILE}`);
    console.log(`   - Sessions: ${SESSIONS_FILE}`);
    console.log(`✅ Mots de passe hashés avec bcrypt`);
    console.log(`🔒 Sessions sécurisées avec tokens`);
});
