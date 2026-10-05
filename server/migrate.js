"use strict";
/* Migration depuis l'ancienne installation (gestion-clients v1 : Apache + json-server + 3 services).
 *
 * Usage (sur la VM, avant de lancer la nouvelle app) :
 *   node migrate.js <ancien_dossier> <nouveau_data_dir>
 * Exemple :
 *   node migrate.js /var/www/html/gestion-clients ./data
 *
 * Reprend : clients (db.json), comptes (users.json, mots de passe conservés), fichiers (uploads/).
 * Les anciens comptes deviennent administrateurs (l'ancien système n'avait pas de rôles) :
 * l'admin pourra ensuite les repasser en comptes restreints depuis l'interface.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const [, , SRC, DST] = process.argv;
if (!SRC || !DST) {
  console.error("Usage : node migrate.js <ancien_dossier> <nouveau_data_dir>");
  process.exit(1);
}
const readJSON = (f, fb) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return fb; } };
const pv = () => crypto.randomBytes(6).toString("hex");

fs.mkdirSync(DST, { recursive: true });
fs.mkdirSync(path.join(DST, "uploads"), { recursive: true });

// ── Clients ──
const oldDB = readJSON(path.join(SRC, "db.json"), { clients: [] });
const clients = (oldDB.clients || []).map((c) => ({
  id: c.id || crypto.randomUUID(),
  nom: c.nom || "Sans nom",
  email: c.email || "",
  telephone: c.telephone || "",
  notes: c.notes || "",
  dateAjout: c.dateAjout || new Date().toISOString().slice(0, 10),
  createdAt: c.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));
fs.writeFileSync(path.join(DST, "db.json"), JSON.stringify({ clients }, null, 2));
console.log(`✓ ${clients.length} client(s) migré(s)`);

// ── Comptes ──
const oldUsers = readJSON(path.join(SRC, "users.json"), { users: [] });
const FULL = { "clients.edit": true, "secrets.view": true, "notes.view": true, "files.view": true, "files.edit": true, export: true };
const users = (oldUsers.users || []).map((u) => ({
  username: u.username,
  displayName: u.username,
  role: "admin",                       // anciens comptes = accès complet → admin
  perms: FULL,
  clientScope: "all",
  passwordHash: u.passwordHash,         // hash bcrypt conservé : les mots de passe restent valides
  pv: pv(),
  createdAt: u.createdAt || new Date().toISOString(),
}));
fs.writeFileSync(path.join(DST, "users.json"), JSON.stringify({ users }, null, 2));
console.log(`✓ ${users.length} compte(s) migré(s) (en administrateur)`);
if (!users.length) console.log("  (aucun compte : un admin sera créé au premier démarrage)");

// ── Fichiers ──
const oldUploads = path.join(SRC, "uploads");
let copied = 0;
if (fs.existsSync(oldUploads)) {
  for (const clientId of fs.readdirSync(oldUploads)) {
    const srcDir = path.join(oldUploads, clientId);
    if (!fs.statSync(srcDir).isDirectory()) continue;
    const dstDir = path.join(DST, "uploads", clientId);
    fs.mkdirSync(dstDir, { recursive: true });
    for (const f of fs.readdirSync(srcDir)) {
      fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
      copied++;
    }
  }
}
console.log(`✓ ${copied} fichier(s) copié(s)`);
console.log("\nMigration terminée. Vérifiez le dossier :", path.resolve(DST));
