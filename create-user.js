#!/usr/bin/env node

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const USERS_FILE = path.join(__dirname, 'users.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  🔐 CRÉATION D\'UTILISATEUR SÉCURISÉ      ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    try {
        // Charger ou créer le fichier users
        let data;
        if (fs.existsSync(USERS_FILE)) {
            data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        } else {
            data = { users: [] };
        }

        const username = await question('👤 Nom d\'utilisateur: ');
        
        if (!username || username.trim() === '') {
            console.log('❌ Le nom d\'utilisateur ne peut pas être vide');
            rl.close();
            return;
        }

        // Vérifier si l'utilisateur existe déjà
        if (data.users.find(u => u.username === username)) {
            console.log('❌ Cet utilisateur existe déjà');
            rl.close();
            return;
        }

        const password = await question('🔒 Mot de passe: ');
        
        if (!password || password.length < 6) {
            console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
            rl.close();
            return;
        }

        console.log('\n⏳ Hashage du mot de passe avec bcrypt...');
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);

        // Ajouter l'utilisateur
        data.users.push({
            username: username,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        });

        // Sauvegarder
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

        console.log('\n✅ Utilisateur créé avec succès !');
        console.log(`📁 Fichier: ${USERS_FILE}`);
        console.log(`👤 Username: ${username}`);
        console.log(`🔐 Mot de passe: ${password}`);
        console.log(`🔒 Hash: ${passwordHash.substring(0, 20)}...`);
        console.log('\n⚠️  NOTEZ CES INFORMATIONS, le mot de passe ne sera plus visible !');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }

    rl.close();
}

async function listUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        console.log('❌ Aucun utilisateur créé');
        return;
    }

    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    
    console.log('\n📋 UTILISATEURS EXISTANTS\n');
    console.log('═══════════════════════════════════════════════════');
    
    if (data.users.length === 0) {
        console.log('Aucun utilisateur');
    } else {
        data.users.forEach((u, i) => {
            console.log(`${i + 1}. 👤 ${u.username}`);
            console.log(`   📅 Créé le: ${new Date(u.createdAt).toLocaleString('fr-FR')}`);
            console.log(`   🔒 Hash: ${u.passwordHash.substring(0, 30)}...`);
            console.log('───────────────────────────────────────────────────');
        });
    }
    
    console.log(`\nTotal: ${data.users.length} utilisateur(s)`);
}

async function deleteUser() {
    if (!fs.existsSync(USERS_FILE)) {
        console.log('❌ Aucun utilisateur créé');
        rl.close();
        return;
    }

    const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    
    if (data.users.length === 0) {
        console.log('❌ Aucun utilisateur à supprimer');
        rl.close();
        return;
    }

    console.log('\n📋 Utilisateurs existants:');
    data.users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.username}`);
    });

    const username = await question('\n👤 Nom d\'utilisateur à supprimer: ');
    
    const index = data.users.findIndex(u => u.username === username);
    
    if (index === -1) {
        console.log('❌ Utilisateur non trouvé');
    } else {
        data.users.splice(index, 1);
        fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
        console.log(`✅ Utilisateur "${username}" supprimé`);
    }

    rl.close();
}

async function initDefaultUsers() {
    console.log('\n╔═══════════════════════════════════════════╗');
    console.log('║  🚀 CRÉATION DES UTILISATEURS PAR DÉFAUT ║');
    console.log('╚═══════════════════════════════════════════╝\n');

    const defaultUsers = [
        { username: 'admin', password: 'admin123' },
    ];

    let data;
    if (fs.existsSync(USERS_FILE)) {
        data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
        data = { users: [] };
    }

    console.log('⏳ Création des utilisateurs par défaut...\n');

    for (const user of defaultUsers) {
        // Vérifier si existe déjà
        if (data.users.find(u => u.username === user.username)) {
            console.log(`⚠️  ${user.username} existe déjà, ignoré`);
            continue;
        }

        const passwordHash = await bcrypt.hash(user.password, 10);
        data.users.push({
            username: user.username,
            passwordHash: passwordHash,
            createdAt: new Date().toISOString()
        });
        
        console.log(`✅ ${user.username} créé (mot de passe: ${user.password})`);
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

    console.log('\n✅ Utilisateurs par défaut créés !');
    console.log(`📁 Fichier: ${USERS_FILE}`);
    console.log('\n⚠️  IMPORTANT: Changez ces mots de passe en production !');
    console.log('    Utilisez: node create-user.js pour créer de nouveaux utilisateurs');
}

// Menu principal
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║   🔐 GESTION DES UTILISATEURS            ║');
        console.log('╚═══════════════════════════════════════════╝');
        console.log('\nUsage:');
        console.log('  node create-user.js create    - Créer un utilisateur');
        console.log('  node create-user.js list      - Lister les utilisateurs');
        console.log('  node create-user.js delete    - Supprimer un utilisateur');
        console.log('  node create-user.js init      - Créer les utilisateurs par défaut');
        process.exit(0);
    }

    const command = args[0];

    switch (command) {
        case 'create':
            await createUser();
            break;
        case 'list':
            await listUsers();
            break;
        case 'delete':
            await deleteUser();
            break;
        case 'init':
            await initDefaultUsers();
            break;
        default:
            console.log('❌ Commande inconnue:', command);
            console.log('Commandes disponibles: create, list, delete, init');
    }
}

main().catch(console.error);
