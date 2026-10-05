"use strict";
/* Gestion Clients v3 — interface. Les droits affichés sont un confort : le serveur revérifie tout. */

/* ═════════ Icônes ═════════ */
const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  users:   I('<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3"/>'),
  user:    I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  plus:    I('<path d="M12 5v14M5 12h14"/>'),
  pin:     I('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>'),
  sort:    I('<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="M11 4h10"/><path d="M11 8h7"/><path d="M11 12h4"/>'),
  search:  I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  edit:    I('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  trash:   I('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  mail:    I('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>'),
  phone:   I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/>'),
  note:    I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h3"/>'),
  folder:  I('<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z"/>'),
  upload:  I('<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>'),
  download:I('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
  eye:     I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff:  I('<path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 7 10 7a13 13 0 0 1-2.2 3M6.6 6.6A13 13 0 0 0 2 11s3.5 7 10 7a9.8 9.8 0 0 0 4.3-1M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  copy:    I('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>'),
  file:    I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>'),
  image:   I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  export:  I('<path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5M15 3h6v6M10 14 21 3"/>'),
  settings:I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  logout:  I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  moon:    I('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  sun:     I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
  x:       I('<path d="M18 6 6 18M6 6l12 12"/>'),
  alert:   I('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>'),
  back:    I('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  inbox:   I('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  key:     I('<path d="M12.6 11.4A6 6 0 1 0 8 16v3l2 2 4-1v-3l1-1h2l2-2-1-2z"/><circle cx="16.5" cy="7.5" r="1.5"/>'),
  net:     I('<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/><path d="M6 10v4a2 2 0 0 0 2 2h6M18 14V9"/>'),
  server:  I('<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>'),
  shield:  I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  dice:    I('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.3"/><circle cx="16" cy="16" r="1.3"/><circle cx="16" cy="8" r="1.3"/><circle cx="8" cy="16" r="1.3"/>'),
  check:   I('<path d="M20 6 9 17l-5-5"/>'),
};
const themeToggle = () =>
  `<button type="button" class="theme-toggle" onclick="toggleTheme()" aria-label="Changer de thème" title="Thème clair / sombre"><span class="icon-moon">${ICON.moon}</span><span class="icon-sun">${ICON.sun}</span></button>`;

/* ═════════ État ═════════ */
const root = document.getElementById("root");
let me = null, info = { appName: "Gestion Clients", logo: null, logoDark: null };
let clients = [], selectedId = null, query = "";
let sortKey = (() => { try { return localStorage.getItem("gc.sort") || "nom"; } catch { return "nom"; } })();
if (!["nom", "nom-desc", "maj", "ajout"].includes(sortKey)) sortKey = "nom";
let draft = null;   // brouillon du formulaire { credentials, networks, hosts }

/* ═════════ Utilitaires ═════════ */
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const attr = (s) => esc(JSON.stringify(String(s ?? "")));
const can = (p) => !!(me && me.perms && me.perms[p]);
const initials = (n) => String(n || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
function toast(msg, err = false) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.className = "toast" + (err ? " error" : "") + " show";
  clearTimeout(t._h); t._h = setTimeout(() => t.className = "toast", 2800);
}
const fmtSize = (b) => { if (!b) return "0 o"; const k = 1024, u = ["o", "Ko", "Mo", "Go"]; const i = Math.floor(Math.log(b) / Math.log(k)); return `${(b / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${u[i]}`; };
const fileIcon = (name) => /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name) ? ICON.image : ICON.file;
const canThumb = (name) => /\.(jpe?g|png|gif|webp|avif|tiff?|heic|heif|pdf)$/i.test(name);
const fileExt = (name) => { const m = /\.([a-z0-9]{1,6})$/i.exec(name); return m ? m[1].toUpperCase() : ""; };

/* ═════════ API ═════════ */
async function api(method, url, body, isForm) {
  const opt = { method, credentials: "same-origin", headers: {} };
  if (body !== undefined) { if (isForm) opt.body = body; else { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); } }
  const r = await fetch(url, opt);
  if (r.status === 401 && !/\/login|\/2fa/.test(url)) { me = null; renderLogin("Session expirée ou inactive, reconnectez-vous."); throw new Error("401"); }
  let data = null; try { data = await r.json(); } catch {}
  if (!r.ok) { const e = new Error((data && data.error) || "Erreur serveur"); e.data = data; e.status = r.status; throw e; }
  return data;
}

/* ═════════ Démarrage ═════════ */
(async function boot() {
  try { info = { ...info, ...(await api("GET", "/api/info")) }; } catch {}
  document.title = `Gestion Clients — ${info.appName}`;
  try { me = (await api("GET", "/api/me")).user; await loadClients(); renderApp(); }
  catch { renderLogin(); }
})();

function brandMark(large) {
  const cls = large ? "brand-logo lg" : "brand-logo";
  if (!info.logo) return `<span class="brand-mark${large ? " lg" : ""}" aria-hidden="true">${ICON.users}</span>`;
  if (info.logoDark) return `<img src="${esc(info.logo)}" alt="" class="${cls} only-light"><img src="${esc(info.logoDark)}" alt="" class="${cls} only-dark">`;
  return `<img src="${esc(info.logo)}" alt="" class="${cls} auto-dark">`;
}

/* ═════════ Connexion (avec 2FA) ═════════ */
function renderLogin(errMsg) {
  root.innerHTML = `
  <div class="login-page"><div class="login-corner">${themeToggle()}</div>
    <div class="login-box">
      <div class="login-head">${brandMark(true)}<span class="kicker">${esc(info.appName)}</span><h1>Gestion Clients</h1></div>
      <form class="login-card" id="loginForm">
        <div class="alert" id="loginErr" style="${errMsg ? "" : "display:none"}">${ICON.alert}<span>${esc(errMsg || "")}</span></div>
        <label class="field"><span>Identifiant</span><input type="text" id="lu" autocomplete="username" autofocus></label>
        <label class="field"><span>Mot de passe</span><input type="password" id="lp" autocomplete="current-password" placeholder="••••••••"></label>
        <button type="submit" class="btn btn-primary" id="lbtn">Se connecter</button>
      </form>
      <div class="login-foot">Accès réservé · ${esc(info.appName)}</div>
    </div></div>`;
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("lbtn"), eb = document.getElementById("loginErr");
    btn.disabled = true; btn.textContent = "Connexion…";
    try {
      const d = await api("POST", "/api/login", { username: document.getElementById("lu").value.trim(), password: document.getElementById("lp").value });
      if (d.twofa) return d.enroll ? render2faEnroll(true) : render2faPrompt();
      me = d.user; await loadClients(); renderApp();
    } catch (err) {
      eb.querySelector("span").textContent = err.status === 401 ? "Identifiant ou mot de passe incorrect" : err.message;
      eb.style.display = ""; btn.disabled = false; btn.textContent = "Se connecter";
    }
  });
}
function render2faPrompt(errMsg) {
  root.innerHTML = `
  <div class="login-page"><div class="login-corner">${themeToggle()}</div>
    <div class="login-box">
      <div class="login-head"><span class="brand-mark lg">${ICON.shield}</span><span class="kicker">Vérification</span><h1>Code à 6 chiffres</h1></div>
      <form class="login-card" id="f2fa">
        <div class="alert" id="e2fa" style="${errMsg ? "" : "display:none"}">${ICON.alert}<span>${esc(errMsg || "")}</span></div>
        <label class="field"><span>Code de votre application d'authentification</span>
          <input type="text" id="code2fa" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" autofocus style="text-align:center;font:600 20px/1 var(--font-mono);letter-spacing:.3em"></label>
        <button type="submit" class="btn btn-primary">Valider</button>
      </form>
      <div class="login-foot"><a href="#" onclick="renderLogin();return false" style="color:var(--gray)">Annuler</a></div>
    </div></div>`;
  document.getElementById("f2fa").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { const d = await api("POST", "/api/login/2fa", { code: document.getElementById("code2fa").value.trim() }); me = d.user; await loadClients(); renderApp(); }
    catch (err) { if (err.data?.enroll) return render2faEnroll(true); const eb = document.getElementById("e2fa"); eb.querySelector("span").textContent = err.message; eb.style.display = ""; }
  });
}
/* Enrôlement 2FA — pendant un login imposé (forced=true) ou depuis les réglages du compte */
async function render2faEnroll(forced) {
  let setup; try { setup = await api("POST", "/api/2fa/setup"); } catch (e) { return forced ? renderLogin(e.message) : toast(e.message, true); }
  const body = `
    <p class="twofa-intro">Scannez ce QR code avec votre application d'authentification (Google Authenticator, Aegis, 2FAS, Proton Authenticator…), puis saisissez le code à 6 chiffres.</p>
    <img class="qr" src="${esc(setup.qr)}" alt="QR code 2FA" width="200" height="200">
    <div class="field"><span>Ou saisie manuelle de la clé</span><code class="secret-key">${esc(setup.secret)}</code></div>
    <form id="fEnroll">
      <div class="alert" id="eEnroll" style="display:none">${ICON.alert}<span></span></div>
      <label class="field"><span>Code à 6 chiffres</span><input type="text" id="enrollCode" inputmode="numeric" maxlength="6" placeholder="123456" autofocus style="text-align:center;font:600 18px/1 var(--font-mono);letter-spacing:.3em"></label>
      <button type="submit" class="btn btn-primary" style="width:100%">Activer la double authentification</button>
    </form>`;
  if (forced) {
    root.innerHTML = `<div class="login-page"><div class="login-corner">${themeToggle()}</div><div class="login-box">
      <div class="login-head"><span class="brand-mark lg">${ICON.shield}</span><span class="kicker">Sécurité requise</span><h1>Activer la 2FA</h1></div>
      <div class="login-card twofa-card">${body}</div></div></div>`;
  } else {
    modalHTML(`${ICON.shield} Double authentification`, `<div class="twofa-card">${body}</div>`);
  }
  document.getElementById("fEnroll").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const d = await api("POST", "/api/2fa/enable", { code: document.getElementById("enrollCode").value.trim() });
      if (forced) { me = d.user; await loadClients(); renderApp(); toast("Double authentification activée"); }
      else { me = d.user; closeModal(); toast("Double authentification activée"); renderApp(); }
    } catch (err) { const eb = document.getElementById("eEnroll"); eb.querySelector("span").textContent = err.message; eb.style.display = ""; }
  });
}

async function loadClients() {
  clients = await api("GET", "/api/clients");
}

/* ═════════ Application ═════════ */
function renderApp() {
  root.innerHTML = `
  <div class="app">
    <header class="topbar"><div class="topbar-inner">
      <div class="brand">${brandMark(false)}<div class="brand-title"><strong>Gestion Clients</strong><small>${esc(info.appName)}</small></div></div>
      <div class="topbar-actions">
        <button class="user-chip" onclick="openAccount()" title="Mon compte"><span class="dot">${esc(initials(me.displayName))}</span>${esc(me.displayName)}<span class="role">· ${me.role === "admin" ? "Admin" : "Utilisateur"}</span>${me.twofa ? `<span class="chip-2fa" title="2FA active">${ICON.shield}</span>` : ""}</button>
        <button class="btn btn-sm has-label nav-clients" id="navClients" onclick="showClients()" title="Tous les clients">${ICON.users}<span class="label">Clients</span></button>
        <button class="btn btn-sm has-label search-btn" onclick="openSearch()" title="Rechercher un client (/ ou Ctrl+K)">${ICON.search}<span class="label">Rechercher</span><kbd class="label">/</kbd></button>
        ${can("export") ? `<button class="btn btn-sm has-label" onclick="exportAll()" title="Exporter (ZIP)">${ICON.export}<span class="label">Export</span></button>` : ""}
        ${me.role === "admin" ? `<button class="btn btn-sm has-label" onclick="openBackup()" title="Sauvegarde complète chiffrée">${ICON.shield}<span class="label">Sauvegarde</span></button>` : ""}
        ${me.role === "admin" ? `<button class="btn btn-sm has-label" onclick="openUsers()" title="Comptes">${ICON.settings}<span class="label">Comptes</span></button>` : ""}
        ${themeToggle()}
        <button class="btn btn-icon btn-ghost btn-danger" onclick="doLogout()" title="Déconnexion" aria-label="Déconnexion">${ICON.logout}</button>
      </div>
    </div></header>
    <div class="layout layout-full">
      <main class="detail" id="detail"></main>
    </div>
  </div>
  <div class="overlay" id="overlay" onclick="closeForm()"></div>
  <div class="panel" id="panel"></div>
  <div id="modalHost"></div>
  <div id="searchHost"></div>`;
  if (!window._searchKeys) { window._searchKeys = true; document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) && me && document.getElementById("searchHost")) { e.preventDefault(); openSearch(); } }); }
  if (!window._hashNav) { window._hashNav = true; window.addEventListener("hashchange", () => { if (me && document.getElementById("detail")) routeFromHash(); }); }
  routeFromHash(true);
}
/* ═════════ Navigation : #/clients  |  #/c/<id> (bouton Précédent du navigateur compatible) ═════════ */
function routeFromHash(initial) {
  const m = /^#\/c\/([\w-]+)/.exec(location.hash);
  const id = m && clients.some((c) => c.id === m[1]) ? m[1] : null;
  if (id !== selectedId || initial) { selectedId = id; renderDetail(); window.scrollTo({ top: 0 }); }
}
function showClients() { if (location.hash !== "#/clients") location.hash = "#/clients"; else routeFromHash(true); }

/* ═════════ Liste : tri, recherche, épingles ═════════ */
const SORTS = [
  { k: "nom", label: "Nom A → Z" }, { k: "nom-desc", label: "Nom Z → A" },
  { k: "maj", label: "Modifiés récemment" }, { k: "ajout", label: "Ajoutés récemment" },
];
const norm = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const byName = (a, b) => (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base", numeric: true });
const SORT_FN = {
  nom: byName, "nom-desc": (a, b) => byName(b, a),
  maj: (a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) || byName(a, b),
  ajout: (a, b) => String(b.createdAt || b.dateAjout || "").localeCompare(String(a.createdAt || a.dateAjout || "")) || byName(a, b),
};
const isPinned = (id) => (me.pins || []).includes(id);

/** Champs indexés : [libellé affiché si la correspondance vient de là, valeur]. */
function searchFields(c) {
  const f = [["", c.nom], ["", c.email], ["", c.telephone]];
  if (c.notes) f.push(["Notes", c.notes]);
  for (const h of c.hosts || []) f.push(["Machine", [h.hostname, h.ip, h.role, h.os].filter(Boolean).join(" · ")], ["Machine", h.notes]);
  for (const n of c.networks || []) f.push(["Réseau", [n.label, n.subnet, n.vlan && "VLAN " + n.vlan, n.gateway, n.publicIp, n.dns, n.dhcp].filter(Boolean).join(" · ")], ["Réseau", n.notes]);
  for (const cr of c.credentials || []) f.push(["Accès", [cr.label, cr.type, cr.host, cr.username, cr.url].filter(Boolean).join(" · ")], ["Accès", cr.notes]);
  for (const fn of c.fileNames || []) f.push(["Fichier", fn]);
  return f.filter(([, v]) => v);
}
/** Tous les mots doivent apparaître (dans un champ ou un autre). Renvoie null ou le 1er champ « secondaire » qui correspond. */
function matchClient(c, terms) {
  const fields = searchFields(c).map(([k, v]) => [k, String(v), norm(v)]);
  const all = fields.map((x) => x[2]).join("\n");
  if (!terms.every((t) => all.includes(t))) return null;
  if (terms.every((t) => fields.slice(0, 3).some((x) => x[2].includes(t)))) return { where: "" };
  const hit = fields.find((x) => x[0] && terms.some((t) => x[2].includes(t)));
  return { where: hit ? `${hit[0]} : ${hit[1].replace(/\s+/g, " ").slice(0, 80)}` : "" };
}
function listView() {
  const rows = clients.map((c) => ({ c, m: { where: "" } }));
  const fn = SORT_FN[sortKey] || byName;
  rows.sort((a, b) => fn(a.c, b.c));
  return { pinned: rows.filter((r) => isPinned(r.c.id)), others: rows.filter((r) => !isPinned(r.c.id)), total: rows.length };
}
function sortBadge(c) {
  if (sortKey === "maj" && c.updatedAt) return new Date(c.updatedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  if (sortKey === "ajout" && (c.createdAt || c.dateAjout)) return new Date(c.createdAt || c.dateAjout).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  return "";
}
function cardHTML(c) {
  const pinned = isPinned(c.id), badge = sortBadge(c);
  const stats = [[(c.hosts || []).length, ICON.server, "équipement(s)"], [(c.credentials || []).length, ICON.key, "accès"], [(c.fileNames || []).length, ICON.folder, "fichier(s)"]]
    .filter(([n]) => n).map(([n, ic, l]) => `<span class="st" title="${n} ${l}">${ic}${n}</span>`).join("");
  return `<div class="ccard" role="button" tabindex="0" onclick="select(${attr(c.id)})" onkeydown="if(event.key==='Enter')select(${attr(c.id)})">
      <div class="ccard-top"><span class="avatar">${esc(initials(c.nom))}</span>
        <span class="ci-body"><span class="ci-name">${esc(c.nom)}</span><span class="ci-sub">${esc(c.email || "—")}</span></span>
        <button class="ci-pin${pinned ? " on" : ""}" title="${pinned ? "Désépingler" : "Épingler en haut de liste"}" aria-label="${pinned ? "Désépingler" : "Épingler"}" onclick="event.stopPropagation();togglePin(${attr(c.id)})">${ICON.pin}</button></div>
      <div class="ccard-foot"><span>${esc(c.telephone || "")}</span><span class="ccard-stats">${stats}${badge ? `<span class="ci-badge">${esc(badge)}</span>` : ""}</span></div>
    </div>`;
}
function renderClients() {
  const el = document.getElementById("detail"); if (!el) return;
  const { pinned, others } = listView();
  const scope = me.clientScope !== "all" ? `<span class="tag">accès limité</span>` : "";
  el.innerHTML = `
    <div class="card clients-head">
      <h2>Clients <span class="count">${clients.length}</span> ${scope}</h2>
      <label class="sort">${ICON.sort}<select id="sortSel" aria-label="Trier">${SORTS.map((o) => `<option value="${o.k}"${o.k === sortKey ? " selected" : ""}>${o.label}</option>`).join("")}</select></label>
      ${can("clients.edit") ? `<button class="btn btn-primary btn-sm" onclick="openForm()">${ICON.plus}Nouveau</button>` : ""}
    </div>
    ${!clients.length ? `<div class="welcome">${ICON.inbox}<h2>Aucun client</h2><div>${can("clients.edit") ? "Créez votre premier client avec « Nouveau »." : "Aucun client ne vous est attribué."}</div></div>` : ""}
    ${pinned.length ? `<div class="list-sep">${ICON.pin} Épinglés</div><div class="cgrid">${pinned.map((r) => cardHTML(r.c)).join("")}</div>` : ""}
    ${others.length ? `${pinned.length ? `<div class="list-sep">Tous les clients</div>` : ""}<div class="cgrid">${others.map((r) => cardHTML(r.c)).join("")}</div>` : ""}`;
  document.getElementById("sortSel").addEventListener("change", (e) => { sortKey = e.target.value; try { localStorage.setItem("gc.sort", sortKey); } catch {} renderClients(); });
}
/** Rafraîchit la vue liste si elle est affichée (sans toucher à une fiche ouverte). */
function renderList() { if (!selectedId) renderClients(); }
/* ═════════ Palette de recherche (bouton du haut, / ou Ctrl+K) ═════════ */
let searchSel = 0, searchRows = [];
function openSearch() {
  const host = document.getElementById("searchHost"); if (!host) return;
  if (host.innerHTML) { document.getElementById("qInput")?.focus(); return; }
  host.innerHTML = `<div class="sp-wrap" onclick="if(event.target===this)closeSearch()">
    <div class="sp" role="dialog" aria-label="Rechercher un client">
      <div class="sp-head">${ICON.search}<input id="qInput" type="search" autocomplete="off" spellcheck="false" placeholder="Nom, email, IP, machine, accès, fichier…" value="${esc(query)}"><kbd>Échap</kbd></div>
      <div class="sp-list" id="spList"></div>
      <div class="sp-foot"><span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span><span><kbd>Entrée</kbd> ouvrir</span><span id="spCount"></span></div>
    </div></div>`;
  const q = document.getElementById("qInput");
  q.addEventListener("input", () => { query = q.value; searchSel = 0; renderSearch(); });
  q.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeSearch(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); searchSel = Math.min(searchSel + 1, searchRows.length - 1); renderSearch(true); }
    else if (e.key === "ArrowUp") { e.preventDefault(); searchSel = Math.max(searchSel - 1, 0); renderSearch(true); }
    else if (e.key === "Enter") { e.preventDefault(); const r = searchRows[searchSel]; if (r) pickSearch(r.c.id); }
  });
  searchSel = 0; renderSearch(); q.focus(); q.select();
}
function closeSearch() { const h = document.getElementById("searchHost"); if (h) h.innerHTML = ""; }
function pickSearch(id) { closeSearch(); select(id); }
function renderSearch(keepScroll) {
  const box = document.getElementById("spList"); if (!box) return;
  const terms = norm(query).split(/\s+/).filter(Boolean); let head = "";
  if (terms.length) {
    searchRows = clients.map((c) => ({ c, m: matchClient(c, terms) })).filter((r) => r.m).sort((a, b) => byName(a.c, b.c)).slice(0, 50);
  } else {   // sans saisie : épinglés puis récemment modifiés
    const pins = clients.filter((c) => isPinned(c.id)).sort(byName);
    const rec = clients.filter((c) => !isPinned(c.id)).sort(SORT_FN.maj).slice(0, 8);
    searchRows = [...pins, ...rec].map((c) => ({ c, m: { where: "" } })); head = "Épinglés et récemment modifiés";
  }
  const total = terms.length ? clients.filter((c) => matchClient(c, terms)).length : 0;
  document.getElementById("spCount").textContent = terms.length ? `${total} résultat${total > 1 ? "s" : ""}${total > 50 ? " (50 affichés)" : ""}` : "";
  if (!searchRows.length) { box.innerHTML = `<div class="list-empty">${terms.length ? "Aucun résultat" : "Aucun client"}</div>`; return; }
  box.innerHTML = (head ? `<div class="list-sep">${head}</div>` : "") + searchRows.map(({ c, m }, i) => `
    <div class="sp-item${i === searchSel ? " sel" : ""}" onmousemove="if(searchSel!==${i}){searchSel=${i};renderSearch(true)}" onclick="pickSearch(${attr(c.id)})">
      <span class="avatar">${esc(initials(c.nom))}</span>
      <span class="ci-body"><span class="ci-name">${esc(c.nom)}${isPinned(c.id) ? ` <span class="sp-pin">${ICON.pin}</span>` : ""}</span><span class="ci-sub${m.where ? " ci-hit" : ""}">${esc(m.where || [c.email, c.telephone].filter(Boolean).join(" · ") || "—")}</span></span>
      ${i === searchSel ? `<kbd>↵</kbd>` : ""}
    </div>`).join("");
  if (keepScroll) box.querySelector(".sp-item.sel")?.scrollIntoView({ block: "nearest" });
}

async function togglePin(id) {
  const on = !isPinned(id);
  try { const d = await api("PUT", `/api/me/pins/${encodeURIComponent(id)}`, { pinned: on }); me.pins = d.pins; renderDetail(); }
  catch (e) { toast(e.message, true); }
}
function select(id) { if (location.hash !== `#/c/${id}`) location.hash = `#/c/${id}`; else routeFromHash(true); }

/* ═════════ Détail client ═════════ */
function renderDetail() {
  const el = document.getElementById("detail");
  const c = clients.find((x) => x.id === selectedId);
  document.getElementById("navClients")?.classList.toggle("active", !c);
  if (!c) { selectedId = null; return renderClients(); }
  const mailV = c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : "Non renseigné";
  const telV = c.telephone ? `<a href="tel:${esc(c.telephone.replace(/\s/g, ""))}">${esc(c.telephone)}</a>` : "Non renseigné";

  // Accès
  let accessCard = "";
  if (can("secrets.view")) {
    const creds = c.credentials || [];
    accessCard = `<div class="card"><div class="card-head"><span class="kicker" style="flex:1">${ICON.key} Accès <span class="n">${creds.length}</span></span></div>
      ${creds.length ? creds.map((cr) => credRow(c.id, cr)).join("") : `<div class="files-empty">Aucun accès enregistré</div>`}</div>`;
  } else if (c.secretsHidden) {
    accessCard = `<div class="card"><div class="card-head"><span class="kicker">${ICON.key} Accès</span></div><div class="notes-hidden">${c.secretsHidden} accès — non autorisé à les voir</div></div>`;
  }
  // Réseau
  const nets = c.networks || [];
  const netCard = nets.length ? `<div class="card"><div class="card-head"><span class="kicker">${ICON.net} Réseau <span class="n">${nets.length}</span></span></div>
    <div class="table-wrap"><table class="stable"><thead><tr><th>Libellé</th><th>Sous-réseau</th><th>VLAN</th><th>Passerelle</th><th>DNS</th><th>IP publique</th></tr></thead><tbody>
    ${nets.map((n) => `<tr><td>${esc(n.label || "—")}</td><td class="mono">${esc(n.subnet || "—")}</td><td class="mono">${esc(n.vlan || "—")}</td><td class="mono">${esc(n.gateway || "—")}</td><td class="mono">${esc(n.dns || "—")}</td><td class="mono">${esc(n.publicIp || "—")}</td></tr>${n.notes ? `<tr class="trnote"><td colspan="6">${esc(n.notes)}</td></tr>` : ""}`).join("")}
    </tbody></table></div></div>` : "";
  // Équipements
  const hosts = c.hosts || [];
  const hostCard = hosts.length ? `<div class="card"><div class="card-head"><span class="kicker">${ICON.server} Équipements <span class="n">${hosts.length}</span></span></div>
    <div class="table-wrap"><table class="stable"><thead><tr><th>Nom d'hôte</th><th>IP</th><th>Rôle</th><th>OS</th></tr></thead><tbody>
    ${hosts.map((h) => `<tr><td class="mono">${esc(h.hostname || "—")}</td><td class="mono">${esc(h.ip || "—")}</td><td>${esc(h.role || "—")}</td><td>${esc(h.os || "—")}</td></tr>${h.notes ? `<tr class="trnote"><td colspan="4">${esc(h.notes)}</td></tr>` : ""}`).join("")}
    </tbody></table></div></div>` : "";
  // Notes
  let notesCard = "";
  if (can("notes.view")) notesCard = c.notes ? `<div class="card"><div class="card-head"><span class="kicker">${ICON.note} Notes</span></div><div class="notes-content">${esc(c.notes)}</div></div>` : "";
  else if (c.notesHidden) notesCard = `<div class="card"><div class="card-head"><span class="kicker">${ICON.note} Notes</span></div><div class="notes-hidden">Notes masquées (accès non autorisé)</div></div>`;

  el.innerHTML = `
    <button class="back-link" onclick="showClients()">${ICON.back} Tous les clients</button>
    <div class="card"><div class="detail-hero">
      <span class="avatar lg">${esc(initials(c.nom))}</span>
      <div class="ident"><h2>${esc(c.nom)}</h2><div class="meta">Ajouté le ${esc(c.dateAjout || "—")}</div></div>
      <div class="detail-actions">
        <button class="btn btn-sm btn-icon btn-pin${isPinned(c.id) ? " on" : ""}" title="${isPinned(c.id) ? "Désépingler" : "Épingler en haut de liste"}" onclick="togglePin(${attr(c.id)})">${ICON.pin}</button>
        ${can("clients.edit") ? `<button class="btn btn-sm" onclick="openForm(${attr(c.id)})">${ICON.edit}<span class="label">Modifier</span></button>` : ""}
        ${can("export") ? `<button class="btn btn-sm btn-icon" title="Exporter ce client" onclick="exportOne(${attr(c.id)})">${ICON.export}</button>` : ""}
        ${can("clients.edit") ? `<button class="btn btn-sm btn-icon btn-ghost btn-danger" title="Supprimer" onclick="askDelete(${attr(c.id)})">${ICON.trash}</button>` : ""}
      </div>
    </div></div>
    <div class="card"><div class="card-head"><span class="kicker">Coordonnées</span></div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">${ICON.mail} Email</div><div class="info-value ${c.email ? "" : "empty"}">${mailV}</div></div>
        <div class="info-item"><div class="info-label">${ICON.phone} Téléphone</div><div class="info-value ${c.telephone ? "" : "empty"}">${telV}</div></div>
      </div></div>
    ${accessCard}${netCard}${hostCard}${notesCard}
    ${can("files.view") ? `<div class="card"><div class="card-head"><span class="kicker" style="flex:1">${ICON.folder} Fichiers</span></div>
      ${can("files.edit") ? `<div class="dropzone" id="dz" onclick="document.getElementById('fileInput').click()">${ICON.upload}<div class="dz-main">Glissez-déposez ou cliquez pour ajouter</div></div><input type="file" id="fileInput" multiple hidden>` : ""}
      <div class="files" id="files"></div></div>` : ""}`;
  if (can("files.view")) { setupUpload(c.id); loadFiles(c.id); }
}

function credRow(clientId, cr) {
  const meta = [cr.type, cr.host || cr.url].filter(Boolean).map(esc).join(" · ");
  return `<div class="cred" data-cid="${esc(cr.id)}">
    <div class="cred-top"><span class="cred-ico">${ICON.key}</span><div class="cred-id"><div class="cred-label">${esc(cr.label)}</div>${meta ? `<div class="cred-meta">${meta}</div>` : ""}</div></div>
    <div class="cred-fields">
      ${cr.username ? `<div class="cred-field"><span class="cf-k">Identifiant</span><span class="cf-v mono">${esc(cr.username)}</span><button class="icon-btn" title="Copier" onclick="copyText(${attr(cr.username)})">${ICON.copy}</button></div>` : ""}
      ${cr.hasPassword ? `<div class="cred-field"><span class="cf-k">Mot de passe</span><span class="cf-v mono secret" id="sec-${esc(cr.id)}">••••••••••</span>
        <button class="icon-btn" title="Révéler" id="rev-${esc(cr.id)}" onclick="revealSecret(${attr(clientId)},${attr(cr.id)})">${ICON.eye}</button>
        <button class="icon-btn" title="Copier" onclick="copySecret(${attr(clientId)},${attr(cr.id)})">${ICON.copy}</button></div>` : ""}
      ${(cr.url && cr.host) ? `<div class="cred-field"><span class="cf-k">URL</span><span class="cf-v mono">${esc(cr.url)}</span></div>` : ""}
    </div>
    ${cr.notes ? `<div class="cred-notes">${esc(cr.notes)}</div>` : ""}
  </div>`;
}
const secretsCache = {};
async function fetchSecret(clientId, cid) {
  if (secretsCache[cid] !== undefined) return secretsCache[cid];
  const d = await api("GET", `/api/clients/${encodeURIComponent(clientId)}/credentials/${encodeURIComponent(cid)}/secret`);
  secretsCache[cid] = d.password || ""; return secretsCache[cid];
}
async function revealSecret(clientId, cid) {
  const span = document.getElementById(`sec-${cid}`), btn = document.getElementById(`rev-${cid}`);
  if (span.dataset.shown === "1") { span.textContent = "••••••••••"; span.dataset.shown = ""; btn.innerHTML = ICON.eye; btn.title = "Révéler"; return; }
  try { const pw = await fetchSecret(clientId, cid); span.textContent = pw || "(vide)"; span.dataset.shown = "1"; btn.innerHTML = ICON.eyeoff; btn.title = "Masquer";
    clearTimeout(span._h); span._h = setTimeout(() => { if (span.dataset.shown === "1") { span.textContent = "••••••••••"; span.dataset.shown = ""; btn.innerHTML = ICON.eye; } }, 30000); }
  catch (e) { toast(e.message, true); }
}
async function copySecret(clientId, cid) { try { await copyText(await fetchSecret(clientId, cid), true); } catch (e) { toast(e.message, true); } }
async function copyText(text, isSecret) {
  try { await navigator.clipboard.writeText(text); toast(isSecret ? "Mot de passe copié (effacement auto dans 30 s)" : "Copié");
    if (isSecret) setTimeout(() => navigator.clipboard.writeText("").catch(() => {}), 30000); }
  catch { toast("Copie impossible (presse-papiers refusé)", true); }
}

/* ═════════ Fichiers ═════════ */
async function loadFiles(id) {
  const box = document.getElementById("files"); if (!box) return;
  try {
    const d = await api("GET", `/api/clients/${encodeURIComponent(id)}/files`);
    const cl = clients.find((x) => x.id === id); if (cl) { const before = (cl.fileNames || []).length; cl.fileNames = d.files.map((f) => f.originalname); if (before !== cl.fileNames.length) renderList(); }
    if (!d.files.length) { box.innerHTML = `<div class="files-empty">Aucun fichier</div>`; return; }
    box.innerHTML = d.files.map((f) => { const base = `/api/clients/${encodeURIComponent(id)}/files/${encodeURIComponent(f.filename)}`;
      const thumb = canThumb(f.originalname) ? `<img src="${esc(base)}/thumb" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">` : "";
      return `<div class="file"><a class="file-thumb" href="${esc(base)}" target="_blank" rel="noopener" title="Aperçu : ${esc(f.originalname)}"><span class="file-ico">${fileIcon(f.originalname)}</span>${thumb}<span class="file-ext">${esc(fileExt(f.originalname))}</span></a>
        <div class="file-row"><div class="file-body"><div class="file-name" title="${esc(f.originalname)}">${esc(f.originalname)}</div><div class="file-size">${esc(fmtSize(f.size))}</div></div>
        <div class="file-acts"><a class="icon-btn" href="${esc(base)}" target="_blank" rel="noopener" title="Ouvrir">${ICON.eye}</a><a class="icon-btn" href="${esc(base)}?dl=1" title="Télécharger">${ICON.download}</a>${can("files.edit") ? `<button class="icon-btn" title="Supprimer" onclick="delFile(${attr(id)},${attr(f.filename)})">${ICON.trash}</button>` : ""}</div></div></div>`;
    }).join("");
  } catch { box.innerHTML = `<div class="files-empty">Erreur de chargement</div>`; }
}
function setupUpload(id) {
  const dz = document.getElementById("dz"), input = document.getElementById("fileInput"); if (!dz) return;
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); if (e.dataTransfer.files.length) upload(id, e.dataTransfer.files); });
  input.addEventListener("change", () => { if (input.files.length) upload(id, input.files); input.value = ""; });
}
async function upload(id, files) {
  const fd = new FormData(); for (const f of files) fd.append("files", f);
  try { toast("Envoi…"); await api("POST", `/api/clients/${encodeURIComponent(id)}/files`, fd, true); toast(`${files.length} fichier(s) ajouté(s)`); loadFiles(id); }
  catch (e) { toast(e.message, true); }
}
async function delFile(id, filename) {
  if (!confirm("Supprimer ce fichier ?")) return;
  try { await api("DELETE", `/api/clients/${encodeURIComponent(id)}/files/${encodeURIComponent(filename)}`); toast("Fichier supprimé"); loadFiles(id); }
  catch (e) { toast(e.message, true); }
}

/* ═════════ Formulaire client (coordonnées + sections éditables) ═════════ */
function openForm(id) {
  const c = id ? clients.find((x) => x.id === id) : null;
  draft = {
    credentials: can("secrets.view") ? (c?.credentials || []).map((x) => ({ ...x, password: undefined })) : [],
    networks: (c?.networks || []).map((x) => ({ ...x })),
    hosts: (c?.hosts || []).map((x) => ({ ...x })),
  };
  const panel = document.getElementById("panel"); panel.style.width = "min(560px, 100vw)";
  panel.innerHTML = `
    <div class="panel-head"><h2>${c ? "Modifier le client" : "Nouveau client"}</h2><button class="icon-btn" onclick="closeForm()" aria-label="Fermer">${ICON.x}</button></div>
    <div class="panel-body">
      <label class="field"><span>Nom<em>*</em></span><input type="text" id="f-nom" maxlength="200" value="${esc(c ? c.nom : "")}" placeholder="Nom du client"></label>
      <div class="form-grid2">
        <label class="field"><span>Email</span><input type="email" id="f-email" maxlength="200" value="${esc(c ? c.email : "")}"></label>
        <label class="field"><span>Téléphone</span><input type="tel" id="f-tel" maxlength="60" value="${esc(c ? c.telephone : "")}"></label>
      </div>
      ${can("secrets.view") ? sectionBlock("credentials", `${ICON.key} Accès`, "Ajouter un accès") : ""}
      ${sectionBlock("networks", `${ICON.net} Réseau / plan d'adressage`, "Ajouter un réseau")}
      ${sectionBlock("hosts", `${ICON.server} Équipements`, "Ajouter un équipement")}
      ${can("notes.view") ? `<label class="field"><span>${ICON.note} Notes</span><textarea id="f-notes" maxlength="20000" placeholder="Informations complémentaires…">${esc(c ? c.notes : "")}</textarea></label>`
        : `<div class="field"><span>Notes</span><div class="notes-hidden">Vous n'avez pas accès aux notes.</div></div>`}
    </div>
    <div class="panel-foot"><button class="btn" onclick="closeForm()">Annuler</button><button class="btn btn-primary" onclick="saveClient(${c ? attr(c.id) : "null"})">${c ? "Enregistrer" : "Créer"}</button></div>`;
  document.getElementById("overlay").classList.add("open"); panel.classList.add("open");
  for (const k of ["credentials", "networks", "hosts"]) renderRows(k);
  setTimeout(() => document.getElementById("f-nom").focus(), 50);
}
const SECTION = {
  credentials: { fields: [["label", "Libellé", "text"], ["type", "Type", "text", "SSH, RDP, VPN, admin web…"], ["host", "Hôte / IP", "text"], ["url", "URL", "text"], ["username", "Identifiant", "text"], ["password", "Mot de passe", "secret"], ["notes", "Notes", "text"]] },
  networks: { fields: [["label", "Libellé", "text", "Siège, agence…"], ["subnet", "Sous-réseau", "text", "192.168.10.0/24"], ["vlan", "VLAN", "text"], ["gateway", "Passerelle", "text"], ["dns", "DNS", "text"], ["dhcp", "Plage DHCP", "text"], ["publicIp", "IP publique", "text"], ["notes", "Notes", "text"]] },
  hosts: { fields: [["hostname", "Nom d'hôte", "text"], ["ip", "IP", "text"], ["role", "Rôle", "text", "AD, hyperviseur, NAS…"], ["os", "OS", "text"], ["notes", "Notes", "text"]] },
};
function sectionBlock(key, title, addLabel) {
  return `<div class="section-block"><div class="section-block-head"><span class="kicker">${title}</span><button type="button" class="btn btn-sm" onclick="addRow('${key}')">${ICON.plus}${esc(addLabel)}</button></div><div id="rows-${key}" class="rows"></div></div>`;
}
function addRow(key) { draft[key].push({ _new: true }); renderRows(key); }
function removeRow(key, i) { draft[key].splice(i, 1); renderRows(key); }
function renderRows(key) {
  const box = document.getElementById(`rows-${key}`); if (!box) return;
  const rows = draft[key];
  box.innerHTML = rows.length ? rows.map((row, i) => `
    <div class="row-card"><button type="button" class="row-del icon-btn" title="Retirer" onclick="removeRow('${key}',${i})">${ICON.trash}</button>
      <div class="row-grid">${SECTION[key].fields.map(([f, label, type, ph]) => fieldInput(key, i, f, label, type, ph, row)).join("")}</div></div>`).join("")
    : `<div class="rows-empty">Aucun élément</div>`;
}
function fieldInput(key, i, f, label, type, ph, row) {
  const id = `${key}-${i}-${f}`;
  const full = f === "notes" || f === "url" ? " full" : "";
  if (type === "secret") {
    const has = row.hasPassword, placeholder = has ? "•••••• (inchangé)" : "Nouveau mot de passe";
    return `<label class="field${full}"><span>${esc(label)}</span><div class="pw-row">
      <input type="password" id="${id}" placeholder="${placeholder}" oninput="draft['${key}'][${i}].password=this.value">
      <button type="button" class="icon-btn" title="Afficher" onclick="togglePw('${id}',this)">${ICON.eye}</button>
      <button type="button" class="icon-btn" title="Générer" onclick="genPw('${id}','${key}',${i})">${ICON.dice}</button>
      ${has ? `<button type="button" class="icon-btn btn-danger" title="Effacer le mot de passe" onclick="clearPw('${id}','${key}',${i},this)">${ICON.x}</button>` : ""}
    </div></label>`;
  }
  return `<label class="field${full}"><span>${esc(label)}</span><input type="text" id="${id}" value="${esc(row[f] || "")}" ${ph ? `placeholder="${esc(ph)}"` : ""} oninput="draft['${key}'][${i}]['${f}']=this.value"></label>`;
}
function togglePw(id, btn) { const el = document.getElementById(id); const show = el.type === "password"; el.type = show ? "text" : "password"; btn.innerHTML = show ? ICON.eyeoff : ICON.eye; }
function genPw(id, key, i) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*-_=+?";
  const a = new Uint32Array(20); crypto.getRandomValues(a);
  const pw = [...a].map((x) => abc[x % abc.length]).join("");
  const el = document.getElementById(id); el.type = "text"; el.value = pw; draft[key][i].password = pw;
  copyText(pw, true);
}
function clearPw(id, key, i, btn) { const el = document.getElementById(id); el.value = ""; el.placeholder = "Nouveau mot de passe"; draft[key][i].password = ""; draft[key][i].hasPassword = false; btn.remove(); }
function closeForm() { document.getElementById("overlay")?.classList.remove("open"); document.getElementById("panel")?.classList.remove("open"); draft = null; }

async function saveClient(id) {
  const body = { nom: val("f-nom"), email: val("f-email"), telephone: val("f-tel"),
    networks: cleanDraft("networks"), hosts: cleanDraft("hosts") };
  if (can("notes.view")) body.notes = val("f-notes");
  if (can("secrets.view")) body.credentials = cleanDraft("credentials");
  if (!body.nom) { toast("Le nom est obligatoire", true); return; }
  try {
    let u; if (id) { u = await api("PUT", `/api/clients/${encodeURIComponent(id)}`, body); const k = clients.findIndex((x) => x.id === u.id); if (k >= 0) clients[k] = u; }
    else { u = await api("POST", "/api/clients", body); clients.push(u); }
    for (const cid in secretsCache) delete secretsCache[cid];
    clients.sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base" }));
    closeForm(); if (id) renderDetail(); else select(u.id);
    toast(id ? "Client enregistré" : "Client créé");
  } catch (e) { toast(e.message, true); }
}
function cleanDraft(key) {
  return draft[key].map((r) => { const o = {}; if (r.id) o.id = r.id;
    for (const [f] of SECTION[key].fields) { if (f === "password") { if (r.password !== undefined) o.password = r.password; } else if (r[f] != null) o[f] = r[f]; }
    return o;
  }).filter((r) => SECTION[key].fields.some(([f]) => f !== "password" && (r[f] || "").trim()) || r.password);
}
const val = (id) => (document.getElementById(id)?.value || "").trim();

/* ═════════ Suppression ═════════ */
function askDelete(id) {
  const c = clients.find((x) => x.id === id); if (!c) return;
  modal(`${ICON.alert} Supprimer le client`, `Supprimer <strong>${esc(c.nom)}</strong>, ses accès et tous ses fichiers ? Irréversible.`,
    [{ label: "Annuler", cls: "btn" }, { label: "Supprimer", cls: "btn btn-danger", act: async () => {
      try { await api("DELETE", `/api/clients/${encodeURIComponent(id)}`); clients = clients.filter((x) => x.id !== id); 
        if (selectedId === id) showClients(); else renderDetail(); toast("Client supprimé"); } catch (e) { toast(e.message, true); } } }]);
}

/* ═════════ Exports ═════════ */
function exportOne(id) { if (can("secrets.view")) exportWarn(() => window.location.href = `/api/export?client=${encodeURIComponent(id)}`); else window.location.href = `/api/export?client=${encodeURIComponent(id)}`; }
function exportAll() { if (can("secrets.view")) exportWarn(() => window.location.href = `/api/export`); else window.location.href = `/api/export`; }
function exportWarn(go) {
  modal(`${ICON.alert} Export avec mots de passe`, `L'archive contiendra les <strong>mots de passe en clair</strong>. À conserver dans un endroit sûr et à supprimer après usage.`,
    [{ label: "Annuler", cls: "btn" }, { label: "Télécharger", cls: "btn btn-primary", act: go }]);
}

/* ═════════ Mon compte (2FA) ═════════ */
function openAccount() {
  modalHTML(`${ICON.user} Mon compte`, `
    <div class="acct-row"><div><div class="acct-k">Identifiant</div><div class="acct-v">${esc(me.username)}</div></div></div>
    <div class="acct-row"><div><div class="acct-k">Double authentification</div><div class="acct-v">${me.twofa ? `<span class="tag ok">${ICON.check} activée</span>` : `<span class="tag">désactivée</span>`}</div></div>
      ${me.twofa ? `<button class="btn btn-sm btn-danger" onclick="disable2fa()">Désactiver</button>` : `<button class="btn btn-sm btn-primary" onclick="render2faEnroll(false)">Activer</button>`}</div>
    <p class="note">La double authentification protège votre compte même si votre mot de passe est compromis. Recommandée, surtout pour les accès depuis Internet.</p>`);
}
function disable2fa() {
  modal(`${ICON.shield} Désactiver la 2FA`, `Saisissez votre mot de passe pour confirmer :<br><input type="password" id="dis2fapw" class="form-input" style="margin-top:10px" autocomplete="current-password">`,
    [{ label: "Annuler", cls: "btn" }, { label: "Désactiver", cls: "btn btn-danger", act: async () => {
      try { const d = await api("POST", "/api/2fa/disable", { password: document.getElementById("dis2fapw")?.value || "" }); me = d.user; toast("2FA désactivée"); renderApp(); }
      catch (e) { toast(e.message, true); } } }]);
}

/* ═════════ Sauvegarde complète chiffrée ═════════ */
async function openBackup() {
  let st = { env: false, compose: false };
  try { st = await api("GET", "/api/backup/status"); } catch {}
  const miss = [!st.env && ".env", !st.compose && "docker-compose.yml"].filter(Boolean);
  const warn = miss.length
    ? `<p class="note" style="color:var(--danger)">${ICON.alert} ${miss.join(" et ")} non détecté${miss.length > 1 ? "s" : ""} : la sauvegarde se fera sans. Vérifiez les montages dans le docker-compose.yml (voir le README).</p>`
    : "";
  modalHTML(`${ICON.shield} Sauvegarde complète`, `
    <p class="note">Archive chiffrée de <strong>toutes les données</strong> (clients, comptes, fichiers joints, journal), du logo, et des fichiers de configuration <code>.env</code> et <code>docker-compose.yml</code> — donc de l'<strong>ENCRYPTION_KEY</strong>, indispensable pour relire les mots de passe.</p>
    <p class="note">L'archive est protégée par une phrase de passe (ZIP AES-256) ouvrable avec 7-Zip, Keka ou WinZip. <strong>Sans la phrase de passe, l'archive est illisible</strong> — conservez-la à part, dans un gestionnaire de mots de passe.</p>
    ${warn}
    <label class="field" style="margin-top:12px"><span>Phrase de passe</span><input type="password" id="bkpass" class="form-input" autocomplete="new-password" placeholder="12 caractères ou plus"></label>
    <label class="field"><span>Confirmer la phrase de passe</span><input type="password" id="bkpass2" class="form-input" autocomplete="new-password"></label>
    <p class="note" id="bkerr" style="display:none;color:var(--danger)"></p>
    <div class="modal-acts" style="margin-top:14px"><button class="btn" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="bkgo" onclick="doBackup()">${ICON.download} Télécharger</button></div>`);
  setTimeout(() => document.getElementById("bkpass")?.focus(), 50);
}
async function doBackup() {
  const p1 = document.getElementById("bkpass").value, p2 = document.getElementById("bkpass2").value;
  const err = document.getElementById("bkerr"), show = (m) => { err.textContent = m; err.style.display = "block"; };
  if (p1.length < 10) return show("Phrase de passe trop courte : 10 caractères minimum, 12 ou plus recommandés.");
  if (p1 !== p2) return show("Les deux phrases de passe ne correspondent pas.");
  const btn = document.getElementById("bkgo"), old = btn.innerHTML; btn.disabled = true; btn.textContent = "Préparation…";
  try {
    const r = await fetch("/api/backup", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: p1 }) });
    if (r.status === 401) { me = null; renderLogin("Session expirée, reconnectez-vous."); return; }
    if (!r.ok) { let m = "Échec de la sauvegarde"; try { m = (await r.json()).error || m; } catch {} throw new Error(m); }
    const blob = await r.blob();
    const name = (/filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") || "") || [, "sauvegarde.zip"])[1];
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    closeModal(); toast("Sauvegarde chiffrée téléchargée");
  } catch (e) { btn.disabled = false; btn.innerHTML = old; show(e.message); }
}

/* ═════════ Administration des comptes ═════════ */
const PERM_LABELS = [
  ["clients.edit", "Créer et modifier des clients", "Sinon : lecture seule"],
  ["notes.view", "Voir et modifier les notes", "Masquées sinon"],
  ["secrets.view", "Voir les accès et mots de passe", "La section Accès est masquée sinon"],
  ["files.view", "Voir les fichiers", "Consulter et télécharger"],
  ["files.edit", "Ajouter et supprimer des fichiers", "Nécessite l'accès aux fichiers"],
  ["export", "Exporter les données (ZIP)", "Limité à son périmètre"],
];
let adminData = { users: [], clients: [] };
async function openUsers() {
  try { adminData = await api("GET", "/api/users"); } catch (e) { return toast(e.message, true); }
  const panel = document.getElementById("panel"); panel.style.width = "min(580px, 100vw)";
  panel.innerHTML = `<div class="panel-head"><h2>${ICON.settings} Comptes utilisateurs</h2><button class="icon-btn" onclick="closeForm()" aria-label="Fermer">${ICON.x}</button></div>
    <div class="panel-body" id="usersBody"></div>
    <div class="panel-foot"><button class="btn btn-primary" style="flex:1;justify-content:center" onclick="openUserForm()">${ICON.plus}Nouvel utilisateur</button></div>`;
  document.getElementById("overlay").classList.add("open"); panel.classList.add("open"); renderUsersList();
}
function renderUsersList() {
  document.getElementById("usersBody").innerHTML = adminData.users.map((u) => {
    const permCount = u.role === "admin" ? "Tous droits" : Object.values(u.perms).filter(Boolean).length + " droit(s)";
    const scope = u.role === "admin" || u.clientScope === "all" ? "tous les clients" : `${(u.clientScope || []).length} client(s)`;
    return `<div class="user-row"><span class="avatar">${esc(initials(u.displayName))}</span>
      <div class="u-body"><div class="u-name">${esc(u.displayName)} <span class="tag ${u.role === "admin" ? "admin" : ""}">${u.role === "admin" ? "Admin" : "Utilisateur"}</span>${u.twofa ? `<span class="tag ok" title="2FA active">${ICON.shield}</span>` : ""}</div>
        <div class="u-meta"><span>@${esc(u.username)}</span>${u.role === "admin" ? "" : `<span class="badge-perm">${permCount}</span><span class="badge-perm">${scope}</span>`}${u.require2fa && !u.twofa ? `<span class="badge-perm">2FA requise</span>` : ""}</div></div>
      <div class="detail-actions"><button class="btn btn-sm btn-icon" title="Modifier" onclick="openUserForm(${attr(u.username)})">${ICON.edit}</button>
        ${u.username === me.username ? "" : `<button class="btn btn-sm btn-icon btn-ghost btn-danger" title="Supprimer" onclick="delUser(${attr(u.username)})">${ICON.trash}</button>`}</div></div>`;
  }).join("");
}
function openUserForm(username) {
  const u = username ? adminData.users.find((x) => x.username === username) : null;
  const isAdmin = u ? u.role === "admin" : false;
  const perms = u ? u.perms : { "clients.edit": true, "notes.view": true, "secrets.view": true, "files.view": true, "files.edit": true, export: false };
  const scopeAll = !u || u.clientScope === "all";
  const panel = document.getElementById("panel");
  panel.innerHTML = `<div class="panel-head"><h2>${u ? "Modifier le compte" : "Nouvel utilisateur"}</h2><button class="icon-btn" onclick="openUsers()" aria-label="Retour">${ICON.back}</button></div>
    <div class="panel-body">
      <label class="field"><span>Identifiant${u ? "" : "<em>*</em>"}</span><input type="text" id="u-username" value="${esc(u ? u.username : "")}" ${u ? "disabled" : ""} placeholder="prenom.nom" autocomplete="off"></label>
      <label class="field"><span>Nom affiché</span><input type="text" id="u-display" value="${esc(u ? u.displayName : "")}" maxlength="80"></label>
      <label class="field"><span>Mot de passe${u ? " (laisser vide = inchangé)" : "<em>*</em>"}</span><input type="password" id="u-password" autocomplete="new-password" placeholder="8 caractères minimum"></label>
      <div class="field"><span>Rôle</span><div class="radio-row" id="u-role">
        <label class="${isAdmin ? "" : "on"}"><input type="radio" name="role" value="user" ${isAdmin ? "" : "checked"} onchange="toggleRole(false)">${ICON.user} Utilisateur</label>
        <label class="${isAdmin ? "on" : ""}"><input type="radio" name="role" value="admin" ${isAdmin ? "checked" : ""} onchange="toggleRole(true)">${ICON.settings} Administrateur</label></div></div>
      <div id="u-rights" style="${isAdmin ? "display:none" : ""}">
        <div class="field" style="margin-bottom:12px"><span>Droits</span><div class="perm-grid">
          ${PERM_LABELS.map(([k, t, h]) => `<label class="perm"><input type="checkbox" data-perm="${k}" ${perms[k] ? "checked" : ""}><span class="perm-txt"><strong>${esc(t)}</strong><span>${esc(h)}</span></span></label>`).join("")}</div></div>
        <div class="field"><span>Clients accessibles</span><div class="radio-row">
          <label class="${scopeAll ? "on" : ""}"><input type="radio" name="scope" value="all" ${scopeAll ? "checked" : ""} onchange="toggleScope(true)">Tous</label>
          <label class="${scopeAll ? "" : "on"}"><input type="radio" name="scope" value="some" ${scopeAll ? "" : "checked"} onchange="toggleScope(false)">Sélection</label></div>
          <div class="scope-box" id="u-scope" style="margin-top:8px;${scopeAll ? "display:none" : ""}">
            ${adminData.clients.length ? adminData.clients.map((c) => `<label><input type="checkbox" data-client="${esc(c.id)}" ${!scopeAll && u.clientScope.includes(c.id) ? "checked" : ""}>${esc(c.nom)}</label>`).join("") : `<div class="files-empty">Aucun client</div>`}</div></div>
      </div>
      <label class="perm" style="margin-top:4px"><input type="checkbox" id="u-require2fa" ${u?.require2fa ? "checked" : ""}><span class="perm-txt"><strong>Imposer la double authentification</strong><span>L'utilisateur devra l'activer à sa prochaine connexion</span></span></label>
      ${u?.twofa ? `<label class="perm"><input type="checkbox" id="u-reset2fa"><span class="perm-txt"><strong>Réinitialiser sa 2FA</strong><span>En cas de perte du téléphone — il la reconfigurera</span></span></label>` : ""}
    </div>
    <div class="panel-foot"><button class="btn" onclick="openUsers()">Annuler</button><button class="btn btn-primary" onclick="saveUser(${u ? attr(u.username) : "null"})">${u ? "Enregistrer" : "Créer le compte"}</button></div>`;
  setTimeout(() => document.getElementById(u ? "u-display" : "u-username").focus(), 50);
}
function toggleRole(isAdmin) { document.getElementById("u-rights").style.display = isAdmin ? "none" : ""; document.querySelectorAll('#u-role label').forEach((l) => l.classList.toggle("on", l.querySelector("input").checked)); }
function toggleScope(all) { document.getElementById("u-scope").style.display = all ? "none" : ""; document.querySelectorAll('input[name="scope"]').forEach((i) => i.closest("label").classList.toggle("on", i.checked)); }
async function saveUser(username) {
  const role = document.querySelector('input[name="role"]:checked').value;
  const body = { displayName: val("u-display"), role, require2fa: document.getElementById("u-require2fa").checked };
  const pw = document.getElementById("u-password").value; if (pw) body.password = pw;
  if (document.getElementById("u-reset2fa")?.checked) body.reset2fa = true;
  if (role === "user") {
    body.perms = {}; document.querySelectorAll("[data-perm]").forEach((c) => body.perms[c.dataset.perm] = c.checked);
    body.clientScope = document.querySelector('input[name="scope"]:checked').value === "all" ? "all" : [...document.querySelectorAll("[data-client]:checked")].map((c) => c.dataset.client);
  }
  try {
    if (username) await api("PUT", `/api/users/${encodeURIComponent(username)}`, body);
    else { body.username = val("u-username"); if (!body.password) return toast("Mot de passe requis", true); await api("POST", "/api/users", body); }
    adminData = await api("GET", "/api/users"); toast(username ? "Compte enregistré" : "Compte créé");
    if (username === me.username) { try { me = (await api("GET", "/api/me")).user; } catch {} }
    openUsers();
  } catch (e) { toast(e.message, true); }
}
function delUser(username) {
  modal(`${ICON.alert} Supprimer le compte`, `Supprimer le compte <strong>@${esc(username)}</strong> ?`,
    [{ label: "Annuler", cls: "btn" }, { label: "Supprimer", cls: "btn btn-danger", act: async () => {
      try { await api("DELETE", `/api/users/${encodeURIComponent(username)}`); adminData = await api("GET", "/api/users"); renderUsersList(); toast("Compte supprimé"); } catch (e) { toast(e.message, true); } } }]);
}

/* ═════════ Modales ═════════ */
function modal(title, html, actions) {
  const host = document.getElementById("modalHost");
  host.innerHTML = `<div class="modal-wrap" id="mwrap"><div class="modal"><h2>${title}</h2><p>${html}</p><div class="modal-acts" id="macts"></div></div></div>`;
  const acts = document.getElementById("macts");
  actions.forEach((a) => { const b = document.createElement("button"); b.className = a.cls; b.textContent = a.label; b.onclick = () => { host.innerHTML = ""; if (a.act) a.act(); }; acts.appendChild(b); });
  document.getElementById("mwrap").addEventListener("click", (e) => { if (e.target.id === "mwrap") host.innerHTML = ""; });
}
function modalHTML(title, bodyHtml) {
  const host = document.getElementById("modalHost");
  host.innerHTML = `<div class="modal-wrap" id="mwrap"><div class="modal"><div class="modal-top"><h2>${title}</h2><button class="icon-btn" onclick="closeModal()">${ICON.x}</button></div><div class="modal-scroll">${bodyHtml}</div></div></div>`;
  document.getElementById("mwrap").addEventListener("click", (e) => { if (e.target.id === "mwrap") host.innerHTML = ""; });
}
function closeModal() { const h = document.getElementById("modalHost"); if (h) h.innerHTML = ""; }

async function doLogout() { try { await api("POST", "/api/logout"); } catch {} me = null; renderLogin(); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeForm(); closeModal(); } });
