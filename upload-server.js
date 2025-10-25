const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const clientId = req.params.clientId;
        const uploadPath = path.join(__dirname, 'uploads', clientId);
        
        // Créer le dossier du client s'il n'existe pas
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Garder le nom original avec un timestamp pour éviter les doublons
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// Configuration de multer - ACCEPTE TOUS LES TYPES DE FICHIERS
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024 // Limite à 50MB (augmentée)
    },
    fileFilter: function (req, file, cb) {
        // ACCEPTER TOUS LES TYPES DE FICHIERS
        // Pas de filtrage par type MIME
        cb(null, true);
    }
});

// Route pour uploader un fichier
app.post('/upload/:clientId', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    res.json({
        success: true,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: `/uploads/${req.params.clientId}/${req.file.filename}`
    });
});

// Route pour lister les fichiers d'un client
app.get('/files/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    const uploadPath = path.join(__dirname, 'uploads', clientId);
    
    if (!fs.existsSync(uploadPath)) {
        return res.json({ files: [] });
    }
    
    fs.readdir(uploadPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de lecture' });
        }
        
        const fileList = files.map(filename => {
            const filePath = path.join(uploadPath, filename);
            const stats = fs.statSync(filePath);
            return {
                filename: filename,
                originalname: filename.split('-').slice(2).join('-'),
                size: stats.size,
                path: `/uploads/${clientId}/${filename}`,
                uploadDate: stats.mtime
            };
        });
        
        res.json({ files: fileList });
    });
});

// Route pour supprimer un fichier
app.delete('/files/:clientId/:filename', (req, res) => {
    const clientId = req.params.clientId;
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', clientId, filename);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur de suppression' });
        }
        res.json({ success: true, message: 'Fichier supprimé' });
    });
});

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route pour générer un export complet (ZIP côté serveur)
app.get('/export-all', async (req, res) => {
    try {
        const archiver = require('archiver');
        const dbPath = path.join(__dirname, 'db.json');
        
        // Lire la base de données
        const dbContent = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(dbContent);
        const clients = db.clients || [];
        
        // Configurer les headers pour le téléchargement
        const date = new Date().toISOString().split('T')[0];
        const filename = `export-complet-clients-${date}.zip`;
        
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Créer l'archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Niveau de compression maximum
        });
        
        // Gérer les erreurs
        archive.on('error', function(err) {
            console.error('Erreur archiver:', err);
            res.status(500).send({ error: err.message });
        });
        
        // Pipe l'archive vers la réponse
        archive.pipe(res);
        
        // Ajouter le README
        const readme = `EXPORT COMPLET DE LA BASE DE DONNÉES CLIENTS
═══════════════════════════════════════════════════════════

📅 Date d'export : ${new Date().toLocaleString('fr-FR')}
📊 Nombre de clients : ${clients.length}

📁 CONTENU DE L'ARCHIVE :
─────────────────────────────────────────────────────────
• clients.json    : Base de données complète (format JSON)
• clients.txt     : Base de données lisible (format TXT)
• uploads/        : Dossier contenant tous les fichiers uploadés
  └─ [Nom_Client]/ : Un dossier par client avec ses fichiers

🔧 UTILISATION :
─────────────────────────────────────────────────────────
1. Extraire l'archive ZIP
2. Consulter clients.txt pour une lecture rapide
3. Les fichiers de chaque client sont dans uploads/[Nom_Client]/
4. Importer clients.json pour restaurer la base de données

💡 NOTES :
─────────────────────────────────────────────────────────
- Tous les fichiers uploadés sont inclus
- Les dossiers portent le nom des clients (espaces → _)
- Un fichier _info.txt dans chaque dossier donne les détails
- Cet export est une sauvegarde complète et autonome

═══════════════════════════════════════════════════════════`;
        
        archive.append(readme, { name: 'README.txt' });
        
        // Ajouter clients.json
        archive.append(dbContent, { name: 'clients.json' });
        
        // Générer clients.txt
        let txtContent = '═══════════════════════════════════════════════════════════\n';
        txtContent += '              BASE DE DONNÉES CLIENTS\n';
        txtContent += `              Export du ${new Date().toLocaleDateString('fr-FR')}\n`;
        txtContent += '═══════════════════════════════════════════════════════════\n\n';
        txtContent += `Total : ${clients.length} client(s)\n\n`;
        
        clients.forEach((client, index) => {
            txtContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            txtContent += `CLIENT #${index + 1}\n`;
            txtContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
            txtContent += `👤 Nom       : ${client.nom}\n`;
            txtContent += `📧 Email     : ${client.email || 'Non renseigné'}\n`;
            txtContent += `📱 Téléphone : ${client.telephone || 'Non renseigné'}\n`;
            txtContent += `📅 Ajouté le : ${client.dateAjout || 'N/A'}\n\n`;
            
            if (client.notes) {
                txtContent += `📝 NOTES :\n`;
                txtContent += `┌${'─'.repeat(57)}┐\n`;
                const noteLines = client.notes.split('\n');
                noteLines.forEach(line => {
                    txtContent += `│ ${line.padEnd(56)}│\n`;
                });
                txtContent += `└${'─'.repeat(57)}┘\n`;
            }
            txtContent += '\n\n';
        });
        
        txtContent += '═══════════════════════════════════════════════════════════\n';
        txtContent += '                     FIN DE L\'EXPORT\n';
        txtContent += '═══════════════════════════════════════════════════════════\n';
        
        archive.append(txtContent, { name: 'clients.txt' });
        
        // Ajouter les dossiers uploads avec les fichiers
        const uploadsPath = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsPath)) {
            // Pour chaque client, créer son dossier avec son nom
            for (const client of clients) {
                const clientUploadPath = path.join(uploadsPath, client.id);
                
                if (fs.existsSync(clientUploadPath)) {
                    const files = fs.readdirSync(clientUploadPath);
                    
                    if (files.length > 0) {
                        // Nettoyer le nom du client pour le nom de dossier
                        const safeName = client.nom
                            .replace(/[<>:"/\\|?*]/g, '_')
                            .replace(/\s+/g, '_')
                            .trim();
                        
                        // Créer un fichier info
                        const clientInfo = `CLIENT: ${client.nom}
ID: ${client.id}
Email: ${client.email || 'N/A'}
Téléphone: ${client.telephone || 'N/A'}
Date d'ajout: ${client.dateAjout || 'N/A'}

FICHIERS (${files.length}):
${files.map((f, i) => {
    const stats = fs.statSync(path.join(clientUploadPath, f));
    const size = formatBytes(stats.size);
    const originalName = f.split('-').slice(2).join('-');
    return `${i + 1}. ${originalName} (${size})`;
}).join('\n')}
`;
                        
                        archive.append(clientInfo, { name: `uploads/${safeName}/_info.txt` });
                        
                        // Ajouter tous les fichiers
                        files.forEach(file => {
                            const filePath = path.join(clientUploadPath, file);
                            const originalName = file.split('-').slice(2).join('-');
                            archive.file(filePath, { name: `uploads/${safeName}/${originalName}` });
                        });
                    }
                }
            }
        }
        
        // Finaliser l'archive
        archive.finalize();
        
        console.log(`✅ Export complet généré: ${filename}`);
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        res.status(500).json({ error: 'Erreur lors de la génération de l\'export' });
    }
});

// Fonction pour formater la taille des fichiers
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Serveur d'upload démarré sur http://127.0.0.1:${PORT}`);
    console.log(`✅ TOUS les types de fichiers sont acceptés`);
    console.log(`📦 Limite de taille: 50MB par fichier`);
});
