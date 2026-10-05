"use strict";
/* Gestion Clients v3 — serveur unique.
   Auth + droits par compte, sections structurées (accès/réseau/équipements),
   chiffrement des secrets au repos (AES-256-GCM), 2FA TOTP, sauvegardes.
   Tout est vérifié côté serveur. */
const express = require("express");
const multer = require("multer");
const archiver = require("archiver");
try { archiver.registerFormat("zip-encrypted", require("archiver-zip-encrypted")); } catch (e) { /* déjà enregistré */ }
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const QR = require("qrcode");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
let sharp = null; try { sharp = require("sharp"); sharp.cache(false); sharp.concurrency(1); } catch {}

// ─────────────────────────── Configuration ───────────────────────────
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || "/app/data";
const SECRET = process.env.SECRET_KEY || "";
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25);
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 12);
const IDLE_MIN = Number(process.env.IDLE_MINUTES || 30);
const BRANDING_DIR = process.env.BRANDING_DIR || "/app/branding";
const APP_NAME = process.env.APP_NAME || "Gestion Clients";
const HOST_DIR = process.env.HOST_DIR || "/app/host";   // .env et docker-compose.yml montés en lecture seule

const DB_FILE = path.join(DATA_DIR, "db.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const THUMBS_DIR = path.join(DATA_DIR, "cache", "thumbs");   // régénérable, exclu des sauvegardes
const LOG_FILE = path.join(DATA_DIR, "audit.log");

if (!SECRET || SECRET.length < 32) {
  console.error("[ERREUR] SECRET_KEY manquante ou trop courte (≥32 car.) — openssl rand -hex 32");
  process.exit(1);
}
for (const d of [DATA_DIR, UPLOADS_DIR, BACKUP_DIR, THUMBS_DIR]) fs.mkdirSync(d, { recursive: true });

const log = (level, msg) => {
  const line = `${new Date().toISOString()} ${level} ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch {}
};

// ─────────────────────────── Chiffrement au repos (AES-256-GCM) ───────────────────────────
let ENC_KEY = null;
if (process.env.ENCRYPTION_KEY) {
  try { ENC_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex"); } catch {}
  if (!ENC_KEY || ENC_KEY.length !== 32) { console.error("[ERREUR] ENCRYPTION_KEY invalide — 64 caractères hex (openssl rand -hex 32)"); process.exit(1); }
} else {
  log("WARN", "ENCRYPTION_KEY absente : les secrets sont stockés EN CLAIR. Définissez-la (openssl rand -hex 32) pour chiffrer au repos.");
}
function encrypt(plain) {
  if (plain == null || plain === "") return null;
  if (!ENC_KEY) return { enc: false, v: String(plain) };
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const ct = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return { iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), ct: ct.toString("base64") };
}
function decrypt(blob) {
  if (!blob) return "";
  if (blob.enc === false) return blob.v || "";
  if (!ENC_KEY) { const e = new Error("Clé de chiffrement absente, impossible de déchiffrer"); e.status = 503; throw e; }
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, Buffer.from(blob.iv, "base64"));
    d.setAuthTag(Buffer.from(blob.tag, "base64"));
    return Buffer.concat([d.update(Buffer.from(blob.ct, "base64")), d.final()]).toString("utf8");
  } catch { const e = new Error("Déchiffrement impossible (clé incorrecte ?)"); e.status = 503; throw e; }
}

// ─────────────────────────── Stockage JSON (atomique) ───────────────────────────
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (e) { if (e.code === "ENOENT") return fallback; log("ERROR", `Fichier illisible : ${file}`); const err = new Error("Données illisibles"); err.status = 503; throw err; }
}
function writeJSON(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
const readDB = () => readJSON(DB_FILE, { clients: [] });
const writeDB = (d) => writeJSON(DB_FILE, d);
const readUsers = () => readJSON(USERS_FILE, { users: [] });
const writeUsers = (d) => writeJSON(USERS_FILE, d);

// ─────────────────────────── Sauvegardes quotidiennes ───────────────────────────
function dailyBackup() {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const dir = path.join(BACKUP_DIR, day);
    fs.mkdirSync(dir, { recursive: true });
    for (const f of [DB_FILE, USERS_FILE]) if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, path.basename(f)));
    // rotation : garder 30 jours
    const days = fs.readdirSync(BACKUP_DIR).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    for (const old of days.slice(0, -30)) fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true });
  } catch (e) { log("ERROR", `Sauvegarde : ${e}`); }
}

// ─────────────────────────── Permissions ───────────────────────────
const PERMS = ["clients.edit", "notes.view", "secrets.view", "files.view", "files.edit", "export"];
const FULL = Object.fromEntries(PERMS.map((p) => [p, true]));
const normPerms = (p = {}) => Object.fromEntries(PERMS.map((k) => [k, !!p[k]]));
function visibleClients(user, clients) {
  if (user.role === "admin" || user.clientScope === "all" || !Array.isArray(user.clientScope)) return clients;
  const set = new Set(user.clientScope);
  return clients.filter((c) => set.has(c.id));
}
const canSeeClient = (user, id) => user.role === "admin" || user.clientScope === "all" || !Array.isArray(user.clientScope) || user.clientScope.includes(id);
const effPerms = (user) => user.role === "admin" ? FULL : normPerms(user.perms);
function publicUser(u) {
  return { username: u.username, role: u.role, displayName: u.displayName || u.username, perms: effPerms(u),
    clientScope: u.role === "admin" ? "all" : (u.clientScope ?? "all"), twofa: !!u.totpEnabled, require2fa: !!u.require2fa, createdAt: u.createdAt, pins: Array.isArray(u.pins) ? u.pins : [] };
}

// ─────────────────────────── Sessions (cookie signé HMAC) ───────────────────────────
const b64url = (b) => Buffer.from(b).toString("base64url");
function sign(obj) {
  const body = b64url(JSON.stringify(obj));
  return `${body}.${crypto.createHmac("sha256", SECRET).update(body).digest("base64url")}`;
}
function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const exp = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (mac.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(exp))) return null;
  let p; try { p = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { return null; }
  if (!p.exp || p.exp < Date.now()) return null;
  return p;
}

const FAIL_WINDOW = 15 * 60 * 1000, FAIL_MAX = 8;
const failures = new Map();
function tooMany(ip) { const h = (failures.get(ip) || []).filter((t) => Date.now() - t < FAIL_WINDOW); failures.set(ip, h); return h.length >= FAIL_MAX; }
const addFail = (ip) => failures.set(ip, [...(failures.get(ip) || []), Date.now()]);

function passwordOk(stored, given) {
  if (typeof stored !== "string") return false;
  if (stored.startsWith("$2")) { try { return bcrypt.compareSync(given, stored); } catch { return false; } }
  return crypto.timingSafeEqual(crypto.createHash("sha256").update(given).digest(), crypto.createHash("sha256").update(stored).digest());
}
const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

// ─────────────────────────── TOTP (RFC 6238, sans dépendance) ───────────────────────────
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32encode(buf) {
  let bits = "", out = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.substr(i, 5), 2)];
  const rem = bits.length % 5;
  if (rem) out += B32[parseInt(bits.substr(bits.length - rem).padEnd(5, "0"), 2)];
  return out;
}
function base32decode(s) {
  s = s.replace(/=+$/, "").toUpperCase(); let bits = "";
  for (const c of s) { const i = B32.indexOf(c); if (i < 0) continue; bits += i.toString(2).padStart(5, "0"); }
  const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.substr(i, 8), 2));
  return Buffer.from(bytes);
}
function totpAt(secretB32, counter) {
  const key = base32decode(secretB32);
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac("sha1", key).update(buf).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1e6).padStart(6, "0");
}
function totpVerify(secretB32, token, window = 1) {
  if (!/^\d{6}$/.test(String(token || ""))) return false;
  const t = Math.floor(Date.now() / 30000);
  for (let w = -window; w <= window; w++) if (crypto.timingSafeEqual(Buffer.from(totpAt(secretB32, t + w)), Buffer.from(String(token)))) return true;
  return false;
}

// ─────────────────────────── App ───────────────────────────
const app = express();
app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(express.json({ limit: "512kb" }));

function parseCookies(req) {
  const out = {}; (req.headers.cookie || "").split(";").forEach((c) => { const i = c.indexOf("="); if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return out;
}
const COOKIE = "gc_session", PRE_COOKIE = "gc_pre";
function cookieStr(name, val, maxAge) {
  const secure = process.env.COOKIE_SECURE === "1" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(val)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}
const setSession = (res, payload) => res.setHeader("Set-Cookie", cookieStr(COOKIE, sign(payload), SESSION_HOURS * 3600));
const clearSession = (res) => res.setHeader("Set-Cookie", [cookieStr(COOKIE, "", 0), cookieStr(PRE_COOKIE, "", 0)]);

const HSTS = process.env.COOKIE_SECURE === "1";
app.use((req, res, next) => {
  res.set({ "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin" });
  if (HSTS) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

function auth(req, res, next) {
  const p = verifyToken(parseCookies(req)[COOKIE]);
  if (!p || p.step !== "ok") return res.status(401).json({ error: "Non authentifié" });
  if (p.last && IDLE_MIN > 0 && Date.now() - p.last > IDLE_MIN * 60 * 1000) return res.status(401).json({ error: "Session inactive" });
  const u = readUsers().users.find((x) => x.username === p.sub);
  if (!u || u.pv !== p.pv) return res.status(401).json({ error: "Session expirée" });
  req.user = u;
  setSession(res, { ...p, last: Date.now() });   // glissement d'inactivité
  next();
}
const adminOnly = (req, res, next) => req.user.role === "admin" ? next() : res.status(403).json({ error: "Réservé à l'administrateur" });
const need = (perm) => (req, res, next) => effPerms(req.user)[perm] ? next() : res.status(403).json({ error: "Action non autorisée" });

// ── Auth ──
function finishLogin(res, u) { setSession(res, { sub: u.username, pv: u.pv, step: "ok", last: Date.now(), exp: Date.now() + SESSION_HOURS * 3600 * 1000 }); }

app.post("/api/login", (req, res) => {
  const ip = req.ip;
  if (tooMany(ip)) { log("WARN", `LOGIN LOCKED ip=${ip}`); return res.status(429).json({ error: "Trop de tentatives, réessayez plus tard" }); }
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  const u = readUsers().users.find((x) => x.username === username);
  if (!u || !passwordOk(u.passwordHash, password)) { addFail(ip); log("WARN", `LOGIN FAIL user=${JSON.stringify(username)} ip=${ip}`); return res.status(401).json({ error: "Identifiant ou mot de passe incorrect" }); }
  // Étape 2 : 2FA activée, ou enrôlement imposé par l'admin
  if (u.totpEnabled || u.require2fa) {
    res.setHeader("Set-Cookie", cookieStr(PRE_COOKIE, sign({ sub: u.username, pv: u.pv, step: "pre", exp: Date.now() + 5 * 60 * 1000 }), 5 * 60));
    return res.json({ twofa: true, enroll: !u.totpEnabled });
  }
  finishLogin(res, u);
  log("INFO", `LOGIN OK user=${JSON.stringify(username)} role=${u.role} ip=${ip}`);
  res.json({ user: publicUser(u) });
});

function preUser(req) { const p = verifyToken(parseCookies(req)[PRE_COOKIE]); if (!p || p.step !== "pre") return null; const u = readUsers().users.find((x) => x.username === p.sub); return u && u.pv === p.pv ? u : null; }

app.post("/api/login/2fa", (req, res) => {
  const ip = req.ip;
  const u = preUser(req);
  if (!u) return res.status(401).json({ error: "Étape de connexion expirée, recommencez" });
  if (tooMany(ip)) return res.status(429).json({ error: "Trop de tentatives" });
  if (!u.totpEnabled) return res.status(400).json({ error: "enroll", enroll: true });
  if (!totpVerify(decrypt(u.totp), req.body?.code)) { addFail(ip); log("WARN", `2FA FAIL user=${JSON.stringify(u.username)} ip=${ip}`); return res.status(401).json({ error: "Code à 6 chiffres incorrect" }); }
  failures.delete(ip);
  finishLogin(res, u);
  log("INFO", `LOGIN OK (2FA) user=${JSON.stringify(u.username)} ip=${ip}`);
  res.json({ user: publicUser(u) });
});

app.post("/api/logout", (req, res) => { clearSession(res); res.json({ ok: true }); });
app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));
// Épingles : propres à chaque compte, ne modifient pas les fiches clients
app.put("/api/me/pins/:id", auth, (req, res) => {
  const id = String(req.params.id);
  if (!canSeeClient(req.user, id) || !readDB().clients.some((c) => c.id === id)) return res.status(404).json({ error: "Client introuvable" });
  const us = readUsers(); const u = us.users.find((x) => x.username === req.user.username);
  const pins = new Set(Array.isArray(u.pins) ? u.pins : []);
  if (req.body?.pinned === false) pins.delete(id); else pins.add(id);
  u.pins = [...pins].slice(-200); writeUsers(us);
  res.json({ pins: u.pins });
});

// ── 2FA : enrôlement (pré-session pendant login imposé, ou session normale) ──
async function startEnroll(username) {
  const secret = base32encode(crypto.randomBytes(20));
  const uri = `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}&period=30&digits=6`;
  const qr = await QR.toDataURL(uri, { margin: 1, width: 220 });
  return { secret, uri, qr };
}
// Démarre l'enrôlement — accepté en session normale OU en pré-session (login imposé)
app.post("/api/2fa/setup", async (req, res) => {
  const u = (verifyToken(parseCookies(req)[COOKIE])?.step === "ok" && readUsers().users.find((x) => x.username === verifyToken(parseCookies(req)[COOKIE]).sub)) || preUser(req);
  if (!u) return res.status(401).json({ error: "Non authentifié" });
  const { secret, uri, qr } = await startEnroll(u.username);
  const data = readUsers(); const uu = data.users.find((x) => x.username === u.username);
  uu.pendingTotp = encrypt(secret); writeUsers(data);
  res.json({ qr, uri, secret });
});
app.post("/api/2fa/enable", (req, res) => {
  const pre = preUser(req);
  const sess = verifyToken(parseCookies(req)[COOKIE]);
  const sessU = sess?.step === "ok" ? readUsers().users.find((x) => x.username === sess.sub) : null;
  const u = sessU || pre;
  if (!u) return res.status(401).json({ error: "Non authentifié" });
  const data = readUsers(); const uu = data.users.find((x) => x.username === u.username);
  if (!uu.pendingTotp) return res.status(400).json({ error: "Aucun enrôlement en cours" });
  if (!totpVerify(decrypt(uu.pendingTotp), req.body?.code)) return res.status(401).json({ error: "Code incorrect" });
  uu.totp = uu.pendingTotp; uu.totpEnabled = true; delete uu.pendingTotp; writeUsers(data);
  log("INFO", `2FA ENABLED user=${JSON.stringify(u.username)}`);
  if (sessU) return res.json({ ok: true, user: publicUser(uu) });
  finishLogin(res, uu);            // enrôlement pendant un login imposé → ouvre la session
  res.json({ ok: true, user: publicUser(uu) });
});
app.post("/api/2fa/disable", auth, (req, res) => {
  if (!passwordOk(req.user.passwordHash, String(req.body?.password || ""))) return res.status(400).json({ error: "Mot de passe incorrect" });
  const data = readUsers(); const uu = data.users.find((x) => x.username === req.user.username);
  delete uu.totp; delete uu.pendingTotp; uu.totpEnabled = false; writeUsers(data);
  log("INFO", `2FA DISABLED user=${JSON.stringify(req.user.username)}`);
  res.json({ ok: true, user: publicUser(uu) });
});

// ── Changement de son propre mot de passe (déconnecte les autres sessions) ──
app.post("/api/me/password", auth, (req, res) => {
  const key = `pw:${req.user.username}`;
  if (tooMany(key)) return res.status(429).json({ error: "Trop de tentatives, réessayez plus tard" });
  const cur = String(req.body?.current || ""), next = String(req.body?.next || "");
  if (!passwordOk(req.user.passwordHash, cur)) { addFail(key); log("WARN", `PASSWORD CHANGE FAIL user=${JSON.stringify(req.user.username)}`); return res.status(400).json({ error: "Mot de passe actuel incorrect" }); }
  if (next.length < 8) return res.status(400).json({ error: "Nouveau mot de passe : 8 caractères minimum" });
  if (next.length > 200) return res.status(400).json({ error: "Mot de passe trop long" });
  if (next === cur) return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'actuel" });
  const data = readUsers(); const u = data.users.find((x) => x.username === req.user.username);
  u.passwordHash = hashPassword(next); u.pv = crypto.randomBytes(6).toString("hex"); u.passwordChangedAt = new Date().toISOString();
  writeUsers(data); failures.delete(key);
  finishLogin(res, u);   // nouvelle session pour cet appareil ; les autres sont invalidées par le changement de pv
  log("INFO", `PASSWORD CHANGED user=${JSON.stringify(u.username)}`);
  res.json({ ok: true, user: publicUser(u) });
});

// ── Branding ──
const LOGO_EXT = { svg: "image/svg+xml", png: "image/png", webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg" };
function findLogo(base) { for (const ext of Object.keys(LOGO_EXT)) { const f = path.join(BRANDING_DIR, `${base}.${ext}`); try { const st = fs.statSync(f); if (st.isFile() && st.size) return { f, ext, v: Math.floor(st.mtimeMs) }; } catch {} } return null; }
app.get("/api/info", (req, res) => { const url = (l) => l ? `/branding/${path.basename(l.f)}?v=${l.v}` : null; res.json({ appName: APP_NAME, logo: url(findLogo("logo")), logoDark: url(findLogo("logo-dark")) }); });
app.get("/branding/:name", (req, res) => {
  const m = /^(logo|logo-dark)\.[a-z]+$/.exec(req.params.name); const l = m && findLogo(m[1]);
  if (!l || path.basename(l.f) !== req.params.name) return res.status(404).end();
  res.set({ "Content-Type": LOGO_EXT[l.ext], "Cache-Control": "public, max-age=86400", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:" });
  res.sendFile(l.f);
});

// ─────────────────────────── Clients + sections structurées ───────────────────────────
const txt = (v, n) => { v = String(v ?? "").trim(); if (v.length > n) { const e = new Error("Champ trop long"); e.status = 400; throw e; } return v; };
const rid = () => crypto.randomUUID().slice(0, 12);

function cleanCredentials(input, existing) {
  const byId = new Map((existing || []).map((c) => [c.id, c]));
  return (Array.isArray(input) ? input : []).slice(0, 100).map((c) => {
    const prev = byId.get(c.id);
    const out = { id: (c.id && byId.has(c.id)) ? c.id : rid(), label: txt(c.label, 120) || "Accès",
      type: txt(c.type, 40), host: txt(c.host, 200), username: txt(c.username, 200), url: txt(c.url, 300), notes: txt(c.notes, 2000) };
    // mot de passe : undefined = garder l'existant ; "" = effacer ; sinon (re)chiffrer
    if (c.password === undefined) out.secret = prev ? prev.secret : null;
    else out.secret = c.password === "" ? null : encrypt(String(c.password).slice(0, 1000));
    return out;
  });
}
function cleanNetworks(input) {
  return (Array.isArray(input) ? input : []).slice(0, 100).map((n) => ({ id: n.id && /^[0-9a-f]{12}$/.test(n.id) ? n.id : rid(),
    label: txt(n.label, 120), subnet: txt(n.subnet, 60), vlan: txt(n.vlan, 40), gateway: txt(n.gateway, 60),
    dns: txt(n.dns, 120), dhcp: txt(n.dhcp, 120), publicIp: txt(n.publicIp, 120), notes: txt(n.notes, 2000) }));
}
function cleanHosts(input) {
  return (Array.isArray(input) ? input : []).slice(0, 300).map((h) => ({ id: h.id && /^[0-9a-f]{12}$/.test(h.id) ? h.id : rid(),
    hostname: txt(h.hostname, 120), ip: txt(h.ip, 60), role: txt(h.role, 120), os: txt(h.os, 120), notes: txt(h.notes, 2000) }));
}

/** Prépare un client pour l'envoi : jamais de secret en clair, sections masquées selon les droits. */
function clientForUser(user, c) {
  const p = effPerms(user);
  const out = { id: c.id, nom: c.nom, email: c.email, telephone: c.telephone, dateAjout: c.dateAjout, createdAt: c.createdAt, updatedAt: c.updatedAt,
    networks: c.networks || [], hosts: c.hosts || [] };
  out.notes = p["notes.view"] ? (c.notes || "") : undefined;
  out.notesHidden = !p["notes.view"] && !!c.notes;
  if (p["secrets.view"]) out.credentials = (c.credentials || []).map(({ secret, ...rest }) => ({ ...rest, hasPassword: !!secret }));
  else { out.credentials = undefined; out.secretsHidden = (c.credentials || []).length; }
  // noms des pièces jointes (tri « plus de fichiers » + recherche) — seulement si droit de voir les fichiers
  if (p["files.view"]) { let names = []; try { names = fs.readdirSync(path.join(UPLOADS_DIR, c.id)); } catch {} out.fileNames = names.map(originalName); }
  return out;
}

app.get("/api/clients", auth, (req, res) => res.json(visibleClients(req.user, readDB().clients).map((c) => clientForUser(req.user, c))));

app.post("/api/clients", auth, need("clients.edit"), (req, res) => {
  const b = req.body || {};
  const nom = txt(b.nom, 200); if (!nom) return res.status(400).json({ error: "Le nom est obligatoire" });
  const canS = effPerms(req.user)["secrets.view"], canN = effPerms(req.user)["notes.view"];
  const db = readDB(); const now = new Date().toISOString();
  const client = { id: crypto.randomUUID(), nom, email: txt(b.email, 200), telephone: txt(b.telephone, 60),
    notes: canN ? txt(b.notes, 20000) : "", networks: cleanNetworks(b.networks), hosts: cleanHosts(b.hosts),
    credentials: canS ? cleanCredentials(b.credentials, []) : [], dateAjout: now.slice(0, 10), createdAt: now, updatedAt: now };
  db.clients.unshift(client); writeDB(db);
  if (req.user.role !== "admin" && Array.isArray(req.user.clientScope)) { const us = readUsers(); const u = us.users.find((x) => x.username === req.user.username); if (u && Array.isArray(u.clientScope)) { u.clientScope.push(client.id); writeUsers(us); } }
  log("INFO", `CLIENT CREATE id=${client.id} by=${req.user.username}`);
  res.status(201).json(clientForUser(req.user, client));
});

app.put("/api/clients/:id", auth, need("clients.edit"), (req, res) => {
  if (!canSeeClient(req.user, req.params.id)) return res.status(403).json({ error: "Client non autorisé" });
  const db = readDB(); const c = db.clients.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Client introuvable" });
  const b = req.body || {}; const nom = txt(b.nom, 200); if (!nom) return res.status(400).json({ error: "Le nom est obligatoire" });
  const p = effPerms(req.user);
  c.nom = nom; c.email = txt(b.email, 200); c.telephone = txt(b.telephone, 60);
  c.networks = cleanNetworks(b.networks); c.hosts = cleanHosts(b.hosts);
  if (p["notes.view"] && b.notes !== undefined) c.notes = txt(b.notes, 20000);
  if (p["secrets.view"] && b.credentials !== undefined) c.credentials = cleanCredentials(b.credentials, c.credentials);
  c.updatedAt = new Date().toISOString(); writeDB(db);
  log("INFO", `CLIENT UPDATE id=${c.id} by=${req.user.username}`);
  res.json(clientForUser(req.user, c));
});

app.delete("/api/clients/:id", auth, need("clients.edit"), async (req, res) => {
  if (!canSeeClient(req.user, req.params.id)) return res.status(403).json({ error: "Client non autorisé" });
  const db = readDB(); const before = db.clients.length;
  db.clients = db.clients.filter((x) => x.id !== req.params.id);
  if (db.clients.length === before) return res.status(404).json({ error: "Client introuvable" });
  writeDB(db);
  await fsp.rm(path.join(UPLOADS_DIR, req.params.id), { recursive: true, force: true }).catch(() => {});
  await fsp.rm(path.join(THUMBS_DIR, req.params.id), { recursive: true, force: true }).catch(() => {});
  const us = readUsers(); let ch = false;
  for (const u of us.users) {
    if (Array.isArray(u.clientScope)) { const n = u.clientScope.filter((i) => i !== req.params.id); if (n.length !== u.clientScope.length) { u.clientScope = n; ch = true; } }
    if (Array.isArray(u.pins) && u.pins.includes(req.params.id)) { u.pins = u.pins.filter((i) => i !== req.params.id); ch = true; }
  }
  if (ch) writeUsers(us);
  log("INFO", `CLIENT DELETE id=${req.params.id} by=${req.user.username}`);
  res.json({ ok: true });
});

// Révélation d'un mot de passe — tracée dans le journal
app.get("/api/clients/:id/credentials/:cid/secret", auth, need("secrets.view"), (req, res) => {
  if (!canSeeClient(req.user, req.params.id)) return res.status(403).json({ error: "Client non autorisé" });
  const c = readDB().clients.find((x) => x.id === req.params.id);
  const cred = c && (c.credentials || []).find((x) => x.id === req.params.cid);
  if (!cred) return res.status(404).json({ error: "Accès introuvable" });
  log("INFO", `SECRET REVEAL client=${req.params.id} cred=${JSON.stringify(cred.label)} by=${req.user.username} ip=${req.ip}`);
  res.json({ password: decrypt(cred.secret) });
});

// ── Fichiers ──
const SAFE_ID = /^[0-9a-f-]{8,40}$/i;
function clientDir(id) { if (!SAFE_ID.test(id)) { const e = new Error("Identifiant invalide"); e.status = 400; throw e; } return path.join(UPLOADS_DIR, id); }
const storage = multer.diskStorage({
  destination: (req, file, cb) => { try { const d = clientDir(req.params.id); fs.mkdirSync(d, { recursive: true }); cb(null, d); } catch (e) { cb(e); } },
  filename: (req, file, cb) => { const orig = Buffer.from(file.originalname, "latin1").toString("utf8"); const safe = orig.replace(/[/\\]/g, "_").replace(/^\.+/, "_").slice(0, 150) || "fichier"; cb(null, `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${safe}`); },
});
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 20 } });
function fileGuard(perm) { return (req, res, next) => { if (!effPerms(req.user)[perm]) return res.status(403).json({ error: "Action non autorisée" }); if (!canSeeClient(req.user, req.params.id)) return res.status(403).json({ error: "Client non autorisé" }); next(); }; }
const originalName = (fn) => fn.split("-").slice(2).join("-") || fn;

app.get("/api/clients/:id/files", auth, fileGuard("files.view"), (req, res) => {
  let dir; try { dir = clientDir(req.params.id); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
  let names = []; try { names = fs.readdirSync(dir); } catch {}
  res.json({ files: names.map((fn) => { const st = fs.statSync(path.join(dir, fn)); return { filename: fn, originalname: originalName(fn), size: st.size, uploadDate: st.mtime }; }).sort((a, b) => b.uploadDate - a.uploadDate) });
});

const INLINE_TYPES = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", bmp: "image/bmp", avif: "image/avif", heic: "image/heic",
  txt: "text/plain; charset=utf-8", csv: "text/plain; charset=utf-8", log: "text/plain; charset=utf-8", md: "text/plain; charset=utf-8",
  mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", ogg: "audio/ogg", flac: "audio/flac" };
app.get("/api/clients/:id/files/:filename", auth, fileGuard("files.view"), (req, res) => {
  const fn = path.basename(req.params.filename);
  let file; try { file = path.join(clientDir(req.params.id), fn); } catch (e) { return res.status(e.status || 400).end(); }
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Fichier introuvable" });
  const ext = (originalName(fn).split(".").pop() || "").toLowerCase(); const inlineType = INLINE_TYPES[ext];
  const asDownload = !!req.query.dl || !inlineType;
  res.set({ "Content-Type": asDownload ? "application/octet-stream" : inlineType, "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'",
    "Content-Disposition": `${asDownload ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(originalName(fn))}` });
  res.sendFile(file);
});
// ── Vignettes (images via sharp, PDF page 1 via pdftoppm) — cache WebP dans data/cache/thumbs ──
const THUMB_PX = 480;
const THUMB_IMG = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif", "tif", "tiff", "heic", "heif"]);
const thumbKind = (name) => { const ext = (name.split(".").pop() || "").toLowerCase(); return THUMB_IMG.has(ext) ? "img" : ext === "pdf" ? "pdf" : null; };
const thumbJobs = new Map(); const thumbFailed = new Set(); let thumbActive = 0; const thumbQueue = [];
const thumbSlot = () => new Promise((r) => { if (thumbActive < 2) { thumbActive++; r(); } else thumbQueue.push(r); });
const thumbFree = () => { const n = thumbQueue.shift(); if (n) n(); else thumbActive--; };
const pdfFirstPage = (src) => new Promise((resolve, reject) =>
  execFile("pdftoppm", ["-f", "1", "-l", "1", "-singlefile", "-png", "-scale-to", String(THUMB_PX * 2), src],
    { encoding: "buffer", maxBuffer: 32 * 1024 * 1024, timeout: 20000 }, (e, out) => e ? reject(e) : resolve(out)));
async function makeThumb(src, dst, kind) {
  await thumbSlot();
  try {
    const input = kind === "pdf" ? await pdfFirstPage(src) : src;
    await fsp.mkdir(path.dirname(dst), { recursive: true });
    const tmp = `${dst}.${process.pid}.tmp`;
    await sharp(input, { failOn: "none", limitInputPixels: 100e6, pages: 1 }).rotate()
      .resize(THUMB_PX, THUMB_PX, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }).webp({ quality: 72 }).toFile(tmp);
    await fsp.rename(tmp, dst);
  } finally { thumbFree(); }
}
app.get("/api/clients/:id/files/:filename/thumb", auth, fileGuard("files.view"), async (req, res) => {
  const fn = path.basename(req.params.filename); const kind = thumbKind(originalName(fn));
  if (!sharp || !kind) return res.status(404).end();
  let src; try { src = path.join(clientDir(req.params.id), fn); } catch { return res.status(400).end(); }
  if (!fs.existsSync(src)) return res.status(404).end();
  const dst = path.join(THUMBS_DIR, req.params.id, fn + ".webp");
  if (!fs.existsSync(dst)) {
    if (thumbFailed.has(dst)) return res.status(415).end();
    if (!thumbJobs.has(dst)) thumbJobs.set(dst, makeThumb(src, dst, kind).finally(() => thumbJobs.delete(dst)));
    try { await thumbJobs.get(dst); } catch (e) { thumbFailed.add(dst); log("WARN", `THUMB ${fn}: ${String(e.message || e).split("\n")[0]}`); return res.status(415).end(); }
  }
  res.set({ "Content-Type": "image/webp", "Cache-Control": "private, max-age=604800, immutable", "X-Content-Type-Options": "nosniff" });
  res.sendFile(dst);
});
app.post("/api/clients/:id/files", auth, fileGuard("files.edit"), (req, res) => {
  upload.array("files", 20)(req, res, (err) => {
    if (err) return res.status(err.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: err.code === "LIMIT_FILE_SIZE" ? `Fichier trop volumineux (max ${MAX_UPLOAD_MB} Mo)` : "Échec de l'upload" });
    if (!req.files?.length) return res.status(400).json({ error: "Aucun fichier" });
    log("INFO", `FILES UPLOAD client=${req.params.id} n=${req.files.length} by=${req.user.username}`);
    res.json({ ok: true, count: req.files.length });
  });
});
app.delete("/api/clients/:id/files/:filename", auth, fileGuard("files.edit"), (req, res) => {
  const fn = path.basename(req.params.filename);
  let file; try { file = path.join(clientDir(req.params.id), fn); } catch (e) { return res.status(e.status || 400).json({ error: e.message }); }
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Fichier introuvable" });
  fs.unlinkSync(file); fs.rm(path.join(THUMBS_DIR, req.params.id, fn + ".webp"), { force: true }, () => {});
  log("INFO", `FILE DELETE client=${req.params.id} by=${req.user.username}`); res.json({ ok: true });
});

// ── Export (périmètre de l'utilisateur ; secrets déchiffrés seulement si droit) ──
app.get("/api/export", auth, need("export"), (req, res) => {
  let clients = visibleClients(req.user, readDB().clients);
  if (req.query.client) { if (!canSeeClient(req.user, req.query.client)) return res.status(403).json({ error: "Client non autorisé" }); clients = clients.filter((c) => c.id === req.query.client); if (!clients.length) return res.status(404).json({ error: "Client introuvable" }); }
  const p = effPerms(req.user);
  const date = new Date().toISOString().slice(0, 10);
  res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="clients-${date}.zip"` });
  const zip = archiver("zip", { zlib: { level: 9 } });
  zip.on("error", (e) => { log("ERROR", `EXPORT ${e}`); try { res.status(500).end(); } catch {} });
  zip.pipe(res);
  const safe = (s) => String(s || "").replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_").trim() || "client";
  const jsonOut = [];
  for (const c of clients) {
    const o = { id: c.id, nom: c.nom, email: c.email, telephone: c.telephone, dateAjout: c.dateAjout, networks: c.networks || [], hosts: c.hosts || [] };
    if (p["notes.view"]) o.notes = c.notes || "";
    if (p["secrets.view"]) o.credentials = (c.credentials || []).map((cr) => ({ label: cr.label, type: cr.type, host: cr.host, username: cr.username, url: cr.url, notes: cr.notes, password: decrypt(cr.secret) }));
    jsonOut.push(o);
    // fiche lisible
    let t = `CLIENT : ${c.nom}\nEmail : ${c.email || "—"}\nTéléphone : ${c.telephone || "—"}\n`;
    if ((c.networks || []).length) { t += `\n— RÉSEAU —\n`; for (const n of c.networks) t += `${n.label || "Réseau"} : ${[n.subnet, n.vlan && "VLAN " + n.vlan, n.gateway && "GW " + n.gateway, n.dns && "DNS " + n.dns, n.publicIp && "IP pub " + n.publicIp].filter(Boolean).join(" · ")}\n`; }
    if ((c.hosts || []).length) { t += `\n— ÉQUIPEMENTS —\n`; for (const h of c.hosts) t += `${h.hostname || "?"}  ${h.ip || ""}  ${h.role || ""}  ${h.os || ""}\n`; }
    if (p["secrets.view"] && (c.credentials || []).length) { t += `\n— ACCÈS —\n`; for (const cr of c.credentials) t += `${cr.label} [${cr.type || ""}] ${cr.host || cr.url || ""}  user: ${cr.username || "—"}  mdp: ${decrypt(cr.secret) || "—"}\n`; }
    if (p["notes.view"] && c.notes) t += `\n— NOTES —\n${c.notes}\n`;
    zip.append(t, { name: `clients/${safe(c.nom)}_${c.id.slice(0, 8)}/fiche.txt` });
    if (p["files.view"]) { let dir; try { dir = clientDir(c.id); } catch { dir = null; } if (dir && fs.existsSync(dir)) for (const fn of fs.readdirSync(dir)) zip.file(path.join(dir, fn), { name: `clients/${safe(c.nom)}_${c.id.slice(0, 8)}/fichiers/${originalName(fn)}` }); }
  }
  zip.append(JSON.stringify(jsonOut, null, 2), { name: "clients.json" });
  log("WARN", `EXPORT by=${req.user.username} clients=${clients.length}${p["secrets.view"] ? " (avec mots de passe en clair)" : ""}`);
  zip.finalize();
});

// ── Sauvegarde complète chiffrée (admin) ──
// Archive ZIP chiffrée AES-256 (ouvrable avec 7-Zip / Keka / WinZip) de /app/data,
// du .env et du docker-compose.yml (s'ils sont montés) et du branding.
// La phrase de passe protège l'archive ; l'ENCRYPTION_KEY voyage DEDANS (via le .env).
app.get("/api/backup/status", auth, adminOnly, (req, res) => {
  res.json({
    env: fs.existsSync(path.join(HOST_DIR, ".env")),
    compose: ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"].some((f) => fs.existsSync(path.join(HOST_DIR, f))),
  });
});

app.post("/api/backup", auth, adminOnly, (req, res) => {
  const pass = String(req.body?.passphrase || "");
  if (pass.length < 10) return res.status(400).json({ error: "Phrase de passe : 12 caractères recommandés, 10 minimum" });

  const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const name = `sauvegarde-${(APP_NAME || "gestion-clients").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "gestion-clients"}-${date}.zip`;
  res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" });

  const zip = archiver.create("zip-encrypted", { zlib: { level: 9 }, encryptionMethod: "aes256", password: pass });
  let failed = false;
  zip.on("error", (e) => { failed = true; log("ERROR", `BACKUP ${e}`); try { res.destroy(); } catch {} });
  res.on("close", () => { if (!res.writableFinished) { failed = true; try { zip.abort(); } catch {} } });
  zip.pipe(res);

  // /app/data sauf le dossier des sauvegardes quotidiennes (évite l'imbrication et le gonflement)
  zip.directory(DATA_DIR, "data", (entry) => /^(backups|cache)(\/|$)/.test(entry.name) ? false : entry);
  // branding (logos)
  if (fs.existsSync(BRANDING_DIR)) zip.directory(BRANDING_DIR, "branding");
  // fichiers de configuration de l'hôte (montés en lecture seule)
  if (fs.existsSync(path.join(HOST_DIR, ".env"))) zip.file(path.join(HOST_DIR, ".env"), { name: "config/.env" });
  for (const f of ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml"]) {
    const p = path.join(HOST_DIR, f);
    if (fs.existsSync(p)) { zip.file(p, { name: `config/${f}` }); break; }
  }
  // note de restauration dans l'archive
  zip.append(
    [
      "Sauvegarde complète — " + APP_NAME,
      "Créée le " + new Date().toISOString(),
      "",
      "Contenu :",
      "  data/        → clients, comptes, journal, fichiers joints (uploads)",
      "  branding/    → logo éventuel",
      "  config/.env  → secrets, dont ENCRYPTION_KEY (indispensable pour relire les mots de passe)",
      "  config/docker-compose.yml",
      "",
      "Cette archive est chiffrée (AES-256). Conservez la phrase de passe séparément :",
      "sans elle, l'archive est illisible.",
      "",
      "RESTAURATION :",
      "  1. Décompresser l'archive (7-Zip, Keka, WinZip… avec la phrase de passe).",
      "  2. Copier data/, branding/, .env et docker-compose.yml à côté du docker-compose.yml.",
      "  3. docker compose up -d --build",
      "",
      "L'ENCRYPTION_KEY du .env doit correspondre aux données de data/ : c'est elle qui déchiffre les mots de passe.",
    ].join("\n"),
    { name: "LISEZ-MOI.txt" }
  );

  log("WARN", `BACKUP by=${req.user.username} ip=${req.ip} (archive chiffrée complète)`);
  zip.finalize();
});

// ── Administration des comptes ──
app.get("/api/users", auth, adminOnly, (req, res) => res.json({ users: readUsers().users.map(publicUser), clients: readDB().clients.map((c) => ({ id: c.id, nom: c.nom })) }));
function validUserInput(b, { creating }) {
  const username = String(b?.username || "").trim();
  if (creating && !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) { const e = new Error("Identifiant invalide (3–32 car. : lettres, chiffres, . _ -)"); e.status = 400; throw e; }
  const role = b?.role === "admin" ? "admin" : "user";
  const displayName = String(b?.displayName || username).trim().slice(0, 80);
  let clientScope = "all";
  if (role === "user" && Array.isArray(b?.clientScope)) clientScope = b.clientScope.filter((x) => typeof x === "string");
  return { username, role, displayName, perms: normPerms(b?.perms), clientScope, require2fa: !!b?.require2fa };
}
app.post("/api/users", auth, adminOnly, (req, res) => {
  const inp = validUserInput(req.body, { creating: true });
  const pw = String(req.body?.password || ""); if (pw.length < 8) return res.status(400).json({ error: "Mot de passe : 8 caractères minimum" });
  const data = readUsers();
  if (data.users.some((u) => u.username.toLowerCase() === inp.username.toLowerCase())) return res.status(409).json({ error: "Cet identifiant existe déjà" });
  data.users.push({ username: inp.username, displayName: inp.displayName, role: inp.role, perms: inp.perms, clientScope: inp.role === "admin" ? "all" : inp.clientScope,
    require2fa: inp.require2fa, passwordHash: hashPassword(pw), pv: crypto.randomBytes(6).toString("hex"), createdAt: new Date().toISOString() });
  writeUsers(data); log("INFO", `USER CREATE ${inp.username} role=${inp.role} by=${req.user.username}`); res.status(201).json({ ok: true });
});
app.put("/api/users/:username", auth, adminOnly, (req, res) => {
  const data = readUsers(); const u = data.users.find((x) => x.username === req.params.username);
  if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
  const inp = validUserInput({ ...req.body, username: u.username }, { creating: false });
  const admins = data.users.filter((x) => x.role === "admin");
  if (u.role === "admin" && inp.role !== "admin" && admins.length === 1) return res.status(400).json({ error: "Impossible : dernier administrateur" });
  u.displayName = inp.displayName; u.role = inp.role; u.require2fa = inp.require2fa;
  u.perms = inp.role === "admin" ? FULL : inp.perms; u.clientScope = inp.role === "admin" ? "all" : inp.clientScope;
  if (req.body?.password) { if (String(req.body.password).length < 8) return res.status(400).json({ error: "Mot de passe : 8 caractères minimum" }); u.passwordHash = hashPassword(String(req.body.password)); u.pv = crypto.randomBytes(6).toString("hex"); }
  if (req.body?.reset2fa) { delete u.totp; delete u.pendingTotp; u.totpEnabled = false; }
  writeUsers(data); log("INFO", `USER UPDATE ${u.username} by=${req.user.username}`); res.json({ ok: true });
});
app.delete("/api/users/:username", auth, adminOnly, (req, res) => {
  if (req.params.username === req.user.username) return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
  const data = readUsers(); const u = data.users.find((x) => x.username === req.params.username);
  if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
  if (u.role === "admin" && data.users.filter((x) => x.role === "admin").length === 1) return res.status(400).json({ error: "Impossible : dernier administrateur" });
  data.users = data.users.filter((x) => x.username !== req.params.username);
  writeUsers(data); log("INFO", `USER DELETE ${req.params.username} by=${req.user.username}`); res.json({ ok: true });
});

// ── Statique + SPA ──
app.get("/healthz", (req, res) => res.json({ ok: true }));
app.use(express.static(path.join(__dirname, "public"), { index: false, maxAge: "1h" }));
app.use("/api", (req, res) => res.status(404).json({ error: "Route inconnue" }));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON invalide" });
  const status = err.status || 500; if (!err.status) log("ERROR", `${req.method} ${req.path} — ${err.stack || err}`);
  res.status(status).json({ error: err.status ? err.message : "Erreur serveur" });
});

// Compte admin initial + sauvegarde + vérifs
(function startup() {
  const data = readUsers();
  if (!data.users.length) {
    const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");
    data.users.push({ username: process.env.ADMIN_USER || "admin", displayName: "Administrateur", role: "admin", perms: FULL, clientScope: "all",
      require2fa: process.env.ADMIN_REQUIRE_2FA === "1", passwordHash: hashPassword(pw), pv: crypto.randomBytes(6).toString("hex"), createdAt: new Date().toISOString() });
    writeUsers(data);
    log("WARN", `Compte admin créé — identifiant=${process.env.ADMIN_USER || "admin"} mot de passe=${pw}`);
    log("WARN", "Changez ce mot de passe après la première connexion.");
  }
  dailyBackup();
  setInterval(dailyBackup, 24 * 3600 * 1000).unref();
})();

app.listen(PORT, () => log("INFO", `Gestion Clients v3 sur http://localhost:${PORT}${ENC_KEY ? " (chiffrement actif)" : ""}`));
