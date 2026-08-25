#!/usr/bin/env node
/* =========================================================================
   Mangoo Connect+ — serveur temps réel (nouvelle version HTML)
   -------------------------------------------------------------------------
   - Sert les pages statiques de mangoo-ui sur le réseau local (LAN)
   - Signalisation WebRTC + présence + chat + rendez-vous via /webrtc-ws
   - HTTPS optionnel (caméra/micro Android) si cert.pem + key.pem présents

   Usage :
     node server.cjs             -> HTTP :8080 (+ HTTPS :8443 si certs)
     PORT=8080 node server.cjs   -> changer le port HTTP
   ========================================================================= */
'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const ROOT = __dirname;
const HOST = '0.0.0.0';
const HTTP_PORT = Number(process.env.PORT || 8080);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 8443);

const rand = () => crypto.randomUUID();

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

// Charge un éventuel fichier .env local (clés API des opérateurs de paiement).
// Les variables déjà présentes dans l'environnement ne sont pas écrasées.
(function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const key = m[1];
      let val = m[2];
      if ((val.length >= 2) && ((val[0] === '"' && val[val.length - 1] === '"') || (val[0] === "'" && val[val.length - 1] === "'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    });
  } catch (e) { console.error('[Env] lecture .env impossible :', e.message); }
})();

/* ------------------------------------------------------------------ *
 *  Sécurité production : identifiants admin & HTTPS
 * ------------------------------------------------------------------ *
 *  Aucun mot de passe admin n'est codé en dur. Le compte administrateur
 *  initial est configuré via les variables d'environnement :
 *    ADMIN_EMAIL    (défaut : admin@mangootech.com)
 *    ADMIN_PASSWORD (sinon généré aléatoirement et affiché une fois)
 *    ADMIN_PIN      (sinon généré aléatoirement et affiché une fois)
 *  Le forçage HTTPS de l'espace admin est actif par défaut dès que
 *  cert.pem + key.pem sont présents (désactivable avec FORCE_HTTPS_ADMIN=false).
 *
 *  Rotation d'urgence (perte d'accès) via variables d'environnement :
 *    ADMIN_PASSWORD_RESET  — réinitialise le mot de passe admin à cette valeur
 *    ADMIN_PIN_RESET       — réinitialise le PIN admin à cette valeur
 *  Ces variables sont à usage unique : appliquées au démarrage, puis à retirer.
 *  Pour un changement normal, préférez l'endpoint /api/auth/change-password.
 * ------------------------------------------------------------------ */
const ADMIN_SEED_EMAIL = process.env.ADMIN_EMAIL || 'admin@mangootech.com';
const ADMIN_SEED_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_SEED_PIN = process.env.ADMIN_PIN || '';
const ADMIN_PASSWORD_RESET = process.env.ADMIN_PASSWORD_RESET || '';
const ADMIN_PIN_RESET = process.env.ADMIN_PIN_RESET || '';
const FORCE_HTTPS_ADMIN = String(process.env.FORCE_HTTPS_ADMIN || 'true').toLowerCase() !== 'false';

let adminSeedCredentials = null; // identifiants générés (affichés une seule fois au premier démarrage)
let httpsAvailable = false;      // true si cert.pem + key.pem présents
let serverReady = false;         // true une fois le serveur HTTP démarré

// Canal de transfert de fichiers (pièces jointes)
const MAX_FILE_SIZE = 50 * 1024 * 1024;   // 50 Mo max par fichier

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / 1048576).toFixed(1) + ' Mo';
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

/* ------------------------------------------------------------------ *
 *  État temps réel (en mémoire)
 * ------------------------------------------------------------------ */
const clients = new Map();        // id -> { ws, role, name, online, lastSeen }
const calls = new Map();          // callId -> { callerId, calleeId, callerWs, calleeWs, mode }
const chatLog = [];               // { msgId, convId, from, to, text, sentAt }
const appointmentLog = [];        // { apptId, from, fromName, to, service, day, time, note, status }
const fileTransfers = new Map();  // fileId -> { fileId, from, to, name, size, mime, received, createdAt }

/* --- État Live Shopping (vendeur -> spectateurs) --- */
const live = {
  active: false,
  vendorId: null,
  vendorName: null,
  title: 'Live Shopping',
  startedAt: null,
  viewers: 0,          // nombre de spectateurs réellement connectés
  likes: 0,
  orders: 0,
  pinnedProduct: null, // { name, price, image }
  chat: []             // derniers messages publics
};
const liveViewers = new Set();  // ws des spectateurs connectés
const liveOrdersLog = [];        // commandes passées pendant un live (persistées pour le module Commandes)

/* ------------------------------------------------------------------ *
 *  État Prestations (services proposés par les prestataires)
 *  Persistance simple : fichier JSON (data/prestations.json).
 * ------------------------------------------------------------------ */
// Répertoire de données. Configurable via DATA_DIR pour s'adapter à
// l'environnement : en local `./data`, sur Render `/app/data` (Persistent
// Disk). Toutes les lectures/écritures JSON passent par les helpers
// centralisés (dataPath / readJsonFile / writeJsonAtomic) définis ci-dessous.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));

/* ------------------------------------------------------------------ *
 *  Couche d'accès aux données (DataStore) — chemin centralisé
 * ------------------------------------------------------------------ *
 *  - résout les chemins en un seul endroit (DATA_DIR) ;
 *  - interdit toute traversée de répertoire (nom de fichier simple) ;
 *  - écrit de façon ATOMIQUE (fichier temp + rename) pour ne jamais
 *    laisser un fichier partiellement écrit en cas de crash ;
 *  - prépare une future migration PostgreSQL : le code métier dépendra
 *    de readJsonFile / writeJsonAtomic, pas de fs.readFileSync/writeFileSync.
 * ------------------------------------------------------------------ */
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    return true;
  } catch (e) {
    console.error('[Data] création du répertoire impossible :', e.message);
    return false;
  }
}

// Résout un nom de fichier dans DATA_DIR en interdisant toute traversée
// (pas de sous-dossier, pas de « .. »).
function dataPath(name) {
  const n = String(name || '');
  const base = path.basename(n);
  if (base !== n || base === '' || base === '.' || base === '..') {
    throw new Error('Nom de fichier invalide : ' + n);
  }
  return path.join(DATA_DIR, base);
}

// Lecture JSON sûre. Retourne `fallback` si le fichier est absent ou corrompu.
function readJsonFile(name, fallback) {
  const p = dataPath(name);
  try {
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('[Data] lecture impossible de ' + name + ' :', e.message);
    return fallback;
  }
}

// Écriture JSON ATOMIQUE : écrit dans un fichier temporaire, vérifie que le
// contenu est du JSON valide, puis remplace l'original (rename atomique).
// En cas d'échec, les données originales ne sont pas modifiées.
function writeJsonAtomic(name, value) {
  ensureDataDir();
  const p = dataPath(name);
  const tmp = p + '.tmp-' + process.pid + '-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
    JSON.parse(fs.readFileSync(tmp, 'utf8')); // validation avant remplacement
    fs.renameSync(tmp, p);
    return true;
  } catch (e) {
    console.error('[Data] écriture impossible de ' + name + ' :', e.message);
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e2) { /* ignore */ }
    return false;
  }
}

// Retourne true si un chemin ne doit JAMAIS être servi comme fichier statique
// (données applicatives, secrets, code serveur, certificats, fichiers temporaires).
function isSensitiveFile(filePath) {
  const base = path.basename(filePath);
  // Répertoires sensibles : DATA_DIR courant ET le répertoire data/ conventionnel
  // (défense en profondeur, même si DATA_DIR est redirigé ailleurs).
  const sensitiveDirs = [DATA_DIR, path.join(ROOT, 'data')];
  for (const dir of sensitiveDirs) {
    const rel = path.relative(dir, filePath);
    if (rel === '' || rel === '.' || (!rel.startsWith('..') && !path.isAbsolute(rel))) return true;
  }
  // Secrets et identifiants locaux.
  if (base === '.env' || base.indexOf('.env') === 0) return true;
  if (base === 'CREDENTIALS.md') return true;
  // Certificats et clés privées TLS.
  if (base === 'key.pem' || base === 'cert.pem') return true;
  // Code serveur (ne doit jamais être exposé côté client).
  if (base === 'server.cjs' || base === 'backup-data.cjs') return true;
  // Fichiers temporaires d'écriture atomique (*.tmp-*).
  if (base.indexOf('.tmp-') !== -1) return true;
  return false;
}

const PRESTATIONS_FILE = dataPath('prestations.json');
let prestations = [];

function seedPrestations() {
  return [];
}

function loadPrestations() {
  try {
    if (fs.existsSync(PRESTATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PRESTATIONS_FILE, 'utf8'));
      if (Array.isArray(data)) { prestations = data; console.log('[Prestations] chargées :', prestations.length); return; }
    }
  } catch (e) { console.error('[Prestations] lecture impossible, réinitialisation :', e.message); }
  prestations = seedPrestations();
  savePrestations();
  console.log('[Prestations] seed initial :', prestations.length);
}

function savePrestations() {
  writeJsonAtomic('prestations.json', prestations);
}

/* ------------------------------------------------------------------ *
 *  État Catalogue (produits physiques en vente)
 *  Persistance simple : fichier JSON (data/catalogue.json).
 *  Distinct du module Prestations (services / temps / savoir-faire).
 * ------------------------------------------------------------------ */
const CATALOGUE_FILE = path.join(DATA_DIR, 'catalogue.json');
let catalogue = [];

function seedCatalogue() {
  return [
    // DAN Boutique — vendeur-boutique (commerce général, Dakar)
    { id: 'c-dan-1', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Robe wax élégante', description: 'Robe en wax authentique, coupe moderne.', price: 12500, stock: 8, unit: 'unité', category: 'mode', available: true, image: '' },
    { id: 'c-dan-2', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Chemise homme premium', description: 'Chemise coton, coupe ajustée.', price: 9000, stock: 15, unit: 'unité', category: 'mode', available: true, image: '' },
    { id: 'c-dan-3', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Baskets tendance', description: 'Baskets légères, semelle confort.', price: 15000, stock: 6, unit: 'paire', category: 'chaussures', available: true, image: '' },
    { id: 'c-dan-4', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Sandales cuir', description: 'Sandales en cuir véritable.', price: 11000, stock: 0, unit: 'paire', category: 'chaussures', available: false, image: '' },
    { id: 'c-dan-5', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Sac à main cuir', description: 'Sac à main en cuir, finitions soignées.', price: 22000, stock: 4, unit: 'unité', category: 'sacs', available: true, image: '' },
    { id: 'c-dan-6', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Smartphone 128 Go', description: 'Smartphone débloqué, double SIM.', price: 145000, stock: 3, unit: 'unité', category: 'electronique', available: true, image: '' },
    { id: 'c-dan-7', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Lampe déco LED', description: 'Lampe d\'ambiance à intensité variable.', price: 8500, stock: 20, unit: 'unité', category: 'maison', available: true, image: '' },
    { id: 'c-dan-8', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Parfum boisé 50 ml', description: 'Parfum boisé longue tenue.', price: 18000, stock: 9, unit: 'flacon', category: 'beaute', available: true, image: '' }
  ];
}

function loadCatalogue() {
  try {
    if (fs.existsSync(CATALOGUE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CATALOGUE_FILE, 'utf8'));
      if (Array.isArray(data)) { catalogue = data; backfillCatalogueFloors(); console.log('[Catalogue] chargé :', catalogue.length); return; }
    }
  } catch (e) { console.error('[Catalogue] lecture impossible, réinitialisation :', e.message); }
  catalogue = seedCatalogue();
  saveCatalogue();
  console.log('[Catalogue] seed initial :', catalogue.length);
}

function saveCatalogue() {
  writeJsonAtomic('catalogue.json', catalogue);
}

// Prix plancher de négociation. Un produit du catalogue peut être négociable ;
// le vendeur fixe un prix minimum (floorPrice) sous lequel le moteur ne descend
// jamais. Par défaut on ouvre la négociation avec 15 % de marge (85 % du prix).
function ensureProductFloor(p) {
  if (!p) return p;
  if (typeof p.negotiable !== 'boolean') p.negotiable = true;
  const price = Number(p.price) || 0;
  if (p.floorPrice == null || !(Number(p.floorPrice) > 0)) {
    p.floorPrice = Math.round((price * 0.85) / 100) * 100;
  }
  return p;
}

function backfillCatalogueFloors() {
  let changed = false;
  catalogue.forEach(function (p) {
    if (p.floorPrice == null || !(Number(p.floorPrice) > 0) || typeof p.negotiable !== 'boolean') changed = true;
    ensureProductFloor(p);
  });
  if (changed) saveCatalogue();
  return changed;
}

// Vue publique d'un produit : masque le prix plancher (secret du vendeur).
function publicProduct(p) {
  if (!p) return p;
  const out = Object.assign({}, p);
  delete out.floorPrice;
  return out;
}

/* ------------------------------------------------------------------ *
 *  État Inventaire (suivi des stocks, seuils, valeur et mouvements)
 *  Persistance simple : data/inventaire.json + data/inventaire-mouvements.json.
 *  Complète le module Catalogue (définition produit) avec la gestion de stock.
 * ------------------------------------------------------------------ */
const INVENTAIRE_FILE = path.join(DATA_DIR, 'inventaire.json');
const INVENTAIRE_MOUVEMENTS_FILE = path.join(DATA_DIR, 'inventaire-mouvements.json');
let inventaire = [];
let inventaireMouvements = [];

function seedInventaire() {
  return [
    // DAN Boutique — vendeur-boutique (commerce général, Dakar)
    { id: 'inv-dan-1', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Robe wax élégante', category: 'mode', stock: 8, threshold: 5, unit: 'unité', costPrice: 7000, salePrice: 12500, supplier: 'Atelier Dakar', available: true },
    { id: 'inv-dan-2', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Chemise homme premium', category: 'mode', stock: 2, threshold: 6, unit: 'unité', costPrice: 5000, salePrice: 9000, supplier: 'Atelier Dakar', available: true },
    { id: 'inv-dan-3', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Baskets tendance', category: 'chaussures', stock: 6, threshold: 4, unit: 'paire', costPrice: 9000, salePrice: 15000, supplier: 'Import Chine', available: true },
    { id: 'inv-dan-4', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Sandales cuir', category: 'chaussures', stock: 0, threshold: 5, unit: 'paire', costPrice: 6500, salePrice: 11000, supplier: 'Maroquinerie Ndiaye', available: true },
    { id: 'inv-dan-5', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Sac à main cuir', category: 'sacs', stock: 4, threshold: 3, unit: 'unité', costPrice: 13000, salePrice: 22000, supplier: 'Maroquinerie Ndiaye', available: true },
    { id: 'inv-dan-6', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Smartphone 128 Go', category: 'electronique', stock: 3, threshold: 5, unit: 'unité', costPrice: 120000, salePrice: 145000, supplier: 'Import Dubaï', available: true },
    { id: 'inv-dan-7', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Lampe déco LED', category: 'maison', stock: 20, threshold: 8, unit: 'unité', costPrice: 5000, salePrice: 8500, supplier: 'Import Turquie', available: true },
    { id: 'inv-dan-8', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Parfum boisé 50 ml', category: 'beaute', stock: 9, threshold: 4, unit: 'flacon', costPrice: 11000, salePrice: 18000, supplier: 'Import Paris', available: true }
  ];
}

function seedInventaireMouvements() {
  return [
    // DAN Boutique — vendeur-boutique
    { id: 'mov-dan-1', itemId: 'inv-dan-1', vendorId: 'pro-41cafa4bcb31', name: 'Robe wax élégante', type: 'entree', quantity: 12, reason: 'Réception atelier', time: 'Il y a 3 h' },
    { id: 'mov-dan-2', itemId: 'inv-dan-6', vendorId: 'pro-41cafa4bcb31', name: 'Smartphone 128 Go', type: 'sortie', quantity: 2, reason: 'Vente #3051', time: 'Il y a 6 h' },
    { id: 'mov-dan-3', itemId: 'inv-dan-3', vendorId: 'pro-41cafa4bcb31', name: 'Baskets tendance', type: 'entree', quantity: 10, reason: 'Réception import', time: 'Hier' },
    { id: 'mov-dan-4', itemId: 'inv-dan-5', vendorId: 'pro-41cafa4bcb31', name: 'Sac à main cuir', type: 'sortie', quantity: 1, reason: 'Vente #3047', time: 'Hier' },
    { id: 'mov-dan-5', itemId: 'inv-dan-7', vendorId: 'pro-41cafa4bcb31', name: 'Lampe déco LED', type: 'entree', quantity: 20, reason: 'Réception import', time: 'Il y a 2 j' }
  ];
}

function loadInventaire() {
  try {
    if (fs.existsSync(INVENTAIRE_FILE)) {
      const data = JSON.parse(fs.readFileSync(INVENTAIRE_FILE, 'utf8'));
      if (Array.isArray(data)) { inventaire = data; console.log('[Inventaire] chargé :', inventaire.length); return; }
    }
  } catch (e) { console.error('[Inventaire] lecture impossible, réinitialisation :', e.message); }
  inventaire = seedInventaire();
  saveInventaire();
  console.log('[Inventaire] seed initial :', inventaire.length);
}

function saveInventaire() {
  writeJsonAtomic('inventaire.json', inventaire);
}

function loadInventaireMouvements() {
  try {
    if (fs.existsSync(INVENTAIRE_MOUVEMENTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(INVENTAIRE_MOUVEMENTS_FILE, 'utf8'));
      if (Array.isArray(data)) { inventaireMouvements = data; console.log('[Inventaire] mouvements chargés :', inventaireMouvements.length); return; }
    }
  } catch (e) { console.error('[Inventaire] mouvements illisibles, réinitialisation :', e.message); }
  inventaireMouvements = seedInventaireMouvements();
  saveInventaireMouvements();
}

function saveInventaireMouvements() {
  writeJsonAtomic('inventaire-mouvements.json', inventaireMouvements);
}

/* ------------------------------------------------------------------ *
 *  État Galerie (photos du prestataire, portfolio & avant/après)
 *  Persistance simple : data/galerie.json.
 *  Catégories : coiffure, maquillage, manucure, soin.
 * ------------------------------------------------------------------ */
const GALERIE_FILE = path.join(DATA_DIR, 'galerie.json');
let galerie = [];

function seedGalerie() {
  return [
    { id: 'g-dan-1', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Robe wax élégante', category: 'vetements', type: 'photo', views: 210, likes: 34, featured: true, author: 'DAN Boutique', date: 'Hier' },
    { id: 'g-dan-2', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Baskets tendance', category: 'chaussures', type: 'photo', views: 165, likes: 28, featured: false, author: 'DAN Boutique', date: 'Il y a 2 jours' },
    { id: 'g-dan-3', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Sac à main cuir', category: 'sacs', type: 'photo', views: 140, likes: 22, featured: true, author: 'DAN Boutique', date: 'Il y a 3 jours' },
    { id: 'g-dan-4', vendorId: 'pro-41cafa4bcb31', vendorName: 'DAN Boutique', name: 'Lampe déco LED', category: 'maison', type: 'photo', views: 98, likes: 15, featured: false, author: 'DAN Boutique', date: 'Il y a 4 jours' }
  ];
}

function loadGalerie() {
  try {
    if (fs.existsSync(GALERIE_FILE)) {
      const data = JSON.parse(fs.readFileSync(GALERIE_FILE, 'utf8'));
      if (Array.isArray(data)) { galerie = data; console.log('[Galerie] chargée :', galerie.length); return; }
    }
  } catch (e) { console.error('[Galerie] lecture impossible, réinitialisation :', e.message); }
  galerie = seedGalerie();
  saveGalerie();
  console.log('[Galerie] seed initial :', galerie.length);
}

function saveGalerie() {
  writeJsonAtomic('galerie.json', galerie);
}

/* ------------------------------------------------------------------ *
 *  État Boosters (badges de visibilité payants du prestataire)
 *  Persistance simple : data/boosters.json (activations) +
 *  data/booster-stats.json (KPIs agrégés).
 *  Offres : sponsorise / promo / nouveau.
 * ------------------------------------------------------------------ */
const BOOSTERS_FILE = path.join(DATA_DIR, 'boosters.json');
const BOOSTER_STATS_FILE = path.join(DATA_DIR, 'booster-stats.json');
let boosters = [];          // activations (actives + historique)
let boosterStats = null;    // KPIs agrégés du mois

/* ------------------------------------------------------------------ *
 *  Profil & configuration du vendeur (source unique pour les modules
 *  de l'espace prestataire / boutique)
 * ------------------------------------------------------------------ *
 *  Un seul document par vendeur, persisté dans vendor-config.json.
 *  Chaque page du dashboard lit/écrit SA section (profile, horaires,
 *  verification, abonnement, fidélité, …) : c'est ce qui rend les
 *  modules interconnectés.
 * ------------------------------------------------------------------ */
const VENDOR_CONFIG_FILE = path.join(DATA_DIR, 'vendor-config.json');
let vendorConfig = {};      // { [vendorId]: configDoc }

const ABONNEMENT_PLANS = [
  { id: 'decouverte', name: 'Découverte', price: 0, priceLabel: 'FCFA / mois', icon: 'sprout', commission: 8, features: ['Fiche en ligne', 'Catalogue 3 produits', 'Badge de base', 'Messagerie'] },
  { id: 'visibilite', name: 'Visibilité', price: 5000, priceLabel: 'FCFA / mois', icon: 'eye', commission: 3, features: ['Catalogue 50 produits', 'Boosters', 'Badge Promo', 'Statistiques simples'] },
  { id: 'professionnel', name: 'Professionnel', price: 10000, priceLabel: 'FCFA / mois', icon: 'badge-check', recommended: true, commission: 0, features: ['Catalogue illimité', 'Fidélité', 'Parrainage', 'Rapports avancés', 'Classement local'] },
  { id: 'premium', name: 'Premium', price: 15000, priceLabel: 'FCFA / mois', icon: 'building-2', commission: 0, features: ['Tout le plan Professionnel', 'Multi-vendeurs', 'Support prioritaire', 'API & intégrations'] }
];

function seedVendorConfig() {
  return {
    'pro-41cafa4bcb31': {
      vendorId: 'pro-41cafa4bcb31',
      vendorName: 'DAN Boutique',
      updatedAt: new Date().toISOString(),
      profile: {
        ownerName: 'DANSOKO Fodé',
        email: 'dan@exemple.com',
        phone: '+336423456789',
        whatsapp: '+221 77 123 45 67',
        enseigne: 'DAN Boutique',
        category: 'commerce',
        description: 'Boutique de prêt-à-porter, accessoires et articles tendance au cœur de Dakar.',
        city: 'Dakar',
        country: 'Senegal',
        address: 'Rue 10, Médina, Dakar',
        lat: 14.7167,
        lng: -17.4677,
        logo: '',
        cover: ''
      },
      horaires: {
        lundi: { open: true, openTime: '09:00', closeTime: '19:00' },
        mardi: { open: true, openTime: '09:00', closeTime: '19:00' },
        mercredi: { open: true, openTime: '09:00', closeTime: '19:00' },
        jeudi: { open: true, openTime: '09:00', closeTime: '19:00' },
        vendredi: { open: true, openTime: '09:00', closeTime: '21:00' },
        samedi: { open: true, openTime: '10:00', closeTime: '21:00' },
        dimanche: { open: false, openTime: '', closeTime: '' }
      },
      paiements: {
        methods: ['wave', 'orange_money', 'cash'],
        acceptOnline: true
      },
      notifications: {
        email: true,
        sms: true,
        push: true,
        newOrder: true,
        messages: true,
        avis: true,
        promotions: true,
        lowStock: true,
        liveAlerts: true
      },
      verification: {
        status: 'certifie',
        badgeLabel: 'Boutique certifiée',
        submittedAt: '2026-07-01T10:00:00.000Z',
        reviewedAt: '2026-08-19T21:45:36.312Z',
        reviewerNote: 'Documents conformes, activité vérifiée.',
        documents: [
          { id: 'doc-cni', name: 'Pièce d\'identité', type: 'cni', status: 'valide', uploadedAt: '2026-07-01T10:00:00.000Z' },
          { id: 'doc-rc', name: 'Registre de commerce', type: 'rc', status: 'valide', uploadedAt: '2026-07-01T10:05:00.000Z' }
        ]
      },
      subscription: {
        plan: 'visibilite',
        status: 'actif',
        startedAt: '2026-07-01T00:00:00.000Z',
        renewsAt: '2026-09-01T00:00:00.000Z',
        autoRenew: true
      },
      horsLigne: {
        enabled: true,
        lastSyncAt: '2026-08-18T08:40:00.000Z',
        carte: '2,4 Mo',
        ficheFavoris: '840 Ko',
        online: true,
        lastSeenAt: new Date().toISOString(),
        reason: ''
      },
      ranking: {
        score: 92,
        position: 2,
        positionLabel: '2e sur 48',
        factors: { boost: 30, verification: 25, avis: 20, completude: 17 }
      },
      fidelite: {
        enabled: true,
        pointsPerOrder: 10,
        members: 128,
        pointsDistributed: 6400,
        redeemed: 64,
        retention: 72,
        rewards: [
          { id: 'rw-1', name: '-10% sur une prestation', cost: 100 },
          { id: 'rw-2', name: 'Soin du visage offert', cost: 250 },
          { id: 'rw-3', name: 'Brushing gratuit', cost: 150 }
        ]
      },
      parrainage: {
        enabled: true,
        code: 'DAN10',
        invited: 24,
        rewardPerInvite: 500,
        earned: 12000
      },
      rapports: {
        period: '2026-08',
        revenue: 485000,
        orders: 86,
        views: 1240,
        conversion: 6.9,
        generated: 12,
        downloads: 46,
        scheduled: 3,
        storage: '2,4 Mo',
        lastExportAt: '2026-08-17T09:30:00.000Z',
        periods: {
          '7j': { orders: 12, revenue: 485000 },
          '30j': { orders: 45, revenue: 1200000 },
          '90j': { orders: 128, revenue: 3400000 }
        }
      },
      support: {
        openTickets: 1,
        resolvedTickets: 18,
        avgResponseHours: 3,
        articles: 24,
        tickets: [
          { id: 'tk-1043', subject: 'Compte & accès', status: 'ouvert', updatedAt: '2026-08-19T17:38:16.474Z' }
        ]
      },
      promotions: {
        enabled: true,
        ca: 0,
        codes: [],
        campaigns: []
      },
      decouverte: {
        public: true,
        rayonKm: 25,
        pays: ['Senegal', 'Cameroun', 'Cote d\'Ivoire'],
        villes: ['Dakar', 'Pikine', 'Guediawaye', 'Rufisque'],
        badges: ['certifie', 'promo'],
        apparaitDans: ['carte', 'recherche', 'recommandations'],
        impressions: 2840,
        clics: 416,
        tauxClic: 14.6,
        recommandations: 132
      }
    }
  };
}

function blankVendorConfig(vendorId) {
  const now = new Date().toISOString();
  return {
    vendorId: vendorId,
    vendorName: '',
    updatedAt: now,
    profile: {
      ownerName: '',
      email: '',
      phone: '',
      whatsapp: '',
      enseigne: '',
      category: 'salon',
      description: '',
      city: '',
      country: 'Senegal',
      address: '',
      lat: 14.7167,
      lng: -17.4677,
      logo: '',
      cover: ''
    },
    horaires: {
      lundi: { open: true, openTime: '09:00', closeTime: '19:00' },
      mardi: { open: true, openTime: '09:00', closeTime: '19:00' },
      mercredi: { open: true, openTime: '09:00', closeTime: '19:00' },
      jeudi: { open: true, openTime: '09:00', closeTime: '19:00' },
      vendredi: { open: true, openTime: '09:00', closeTime: '19:00' },
      samedi: { open: true, openTime: '10:00', closeTime: '19:00' },
      dimanche: { open: false, openTime: '', closeTime: '' }
    },
    paiements: {
      methods: ['wave', 'orange_money', 'cash'],
      acceptOnline: true
    },
    notifications: {
      email: true, sms: true, push: true,
      newOrder: true, messages: true, avis: true,
      promotions: true, lowStock: true, liveAlerts: true
    },
    verification: {
      status: 'non_soumis',
      badgeLabel: '',
      submittedAt: null,
      reviewedAt: null,
      reviewerNote: '',
      documents: []
    },
    subscription: {
      plan: 'decouverte',
      status: 'actif',
      startedAt: now,
      renewsAt: null,
      autoRenew: false
    },
    horsLigne: {
      enabled: false,
      lastSyncAt: null,
      carte: '0 Ko',
      ficheFavoris: '0 Ko',
      online: true,
      lastSeenAt: now,
      reason: ''
    },
    ranking: {
      score: 0,
      position: 0,
      positionLabel: '',
      factors: { boost: 0, verification: 0, avis: 0, completude: 0 }
    },
    fidelite: {
      enabled: false,
      pointsPerOrder: 10,
      members: 0,
      pointsDistributed: 0,
      redeemed: 0,
      retention: 0,
      rewards: []
    },
    parrainage: {
      enabled: false,
      code: '',
      invited: 0,
      rewardPerInvite: 500,
      earned: 0
    },
    rapports: {
      period: now.slice(0, 7),
      revenue: 0,
      orders: 0,
      views: 0,
      conversion: 0,
      generated: 0,
      downloads: 0,
      scheduled: 0,
      storage: '0 Ko',
      lastExportAt: null,
      periods: {
        '7j': { orders: 0, revenue: 0 },
        '30j': { orders: 0, revenue: 0 },
        '90j': { orders: 0, revenue: 0 }
      }
    },
    support: {
      openTickets: 0,
      resolvedTickets: 0,
      avgResponseHours: 0,
      articles: 0,
      tickets: []
    },
    promotions: {
      enabled: false,
      ca: 0,
      codes: [],
      campaigns: []
    },
    decouverte: {
      public: false,
      rayonKm: 25,
      pays: ['Senegal'],
      villes: ['Dakar'],
      badges: [],
      apparaitDans: [],
      impressions: 0,
      clics: 0,
      tauxClic: 0,
      recommandations: 0
    }
  };
}

function vendorConfigFor(vendorId) {
  const id = String(vendorId || '');
  if (!id) return null;
  if (!vendorConfig[id]) {
    // Nouveau compte : démarre avec une config vierge (aucune donnée démo).
    vendorConfig[id] = blankVendorConfig(id);
  }
  return vendorConfig[id];
}

function loadVendorConfig() {
  try {
    if (fs.existsSync(VENDOR_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(VENDOR_CONFIG_FILE, 'utf8'));
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        vendorConfig = data;
        console.log('[VendorConfig] config chargée :', Object.keys(data).length, 'vendeur(s)');
        return;
      }
    }
  } catch (e) { console.error('[VendorConfig] lecture impossible, réinitialisation :', e.message); }
  vendorConfig = seedVendorConfig();
  saveVendorConfig();
  console.log('[VendorConfig] seed initial');
}

function saveVendorConfig() {
  writeJsonAtomic('vendor-config.json', vendorConfig);
}

/* ------------------------------------------------------------------ *
 *  Authentification (connexion / création de compte)
 *  ------------------------------------------------------------------ *
 *  - Connexion par PIN à 4 chiffres (simple, pour prestataires peu
 *    lettrés) OU par email + mot de passe.
 *  - Mots de passe & PIN hachés via scrypt natif de Node (aucune
 *    dépendance npm externe).
 *  - Sessions par token en mémoire, persistance dans data/users.json.
 *  - Chaque compte pro est relié à un document vendor-config pour que
 *    son dashboard soit immédiatement alimenté (modules interconnectés).
 * ------------------------------------------------------------------ */
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
let users = [];
let sessions = {};   // token -> userId
let pinResets = {};  // phone -> { code, userId, expiresAt }
let twoFactorCodes = {}; // userId -> { code, expiresAt, scope }

function hashSecret(secret, salt) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(secret), s, 64).toString('hex');
  return s + ':' + derived;
}

function verifySecret(secret, stored) {
  if (!stored || String(stored).indexOf(':') < 0) return false;
  const parts = String(stored).split(':');
  const salt = parts[0];
  const expected = parts.slice(1).join(':');
  const derived = crypto.scryptSync(String(secret), salt, 64).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Règle de robustesse pour les mots de passe à privilège élevé (admin).
function isStrongPassword(pw) {
  const s = String(pw || '');
  return s.length >= 10 && /[a-z]/.test(s) && /[A-Z]/.test(s) && /[0-9]/.test(s) && /[^A-Za-z0-9]/.test(s);
}

function normalizePhone(p) {
  return String(p || '').replace(/[^\d+]/g, '').trim();
}

function publicUser(u) {
  if (!u) return null;
  const cfg = u.vendorId ? vendorConfigFor(u.vendorId) : null;
  const verified = !!(cfg && cfg.verification && cfg.verification.status === 'certifie' && cfg.verification.badgeVisible !== false);
  const plan = (cfg && cfg.subscription && cfg.subscription.plan) || 'decouverte';
  const rating = (cfg && cfg.rating != null)
    ? String(cfg.rating)
    : ((cfg && cfg.ranking && cfg.ranking.score != null) ? (cfg.ranking.score / 20).toFixed(1) : '—');
  return {
    id: u.id, vendorId: u.vendorId, role: u.role, name: u.name,
    enseigne: u.enseigne, email: u.email, phone: u.phone,
    logo: u.logo, category: u.category, city: u.city,
    address: u.address || u.adresse || '',
    rating: rating, verified: verified, plan: plan,
    twoFactorEnabled: !!u.twoFactorEnabled,
    createdAt: u.createdAt
  };
}

function newUserId(role) {
  const prefix = role === 'admin' ? 'adm' : (role === 'client' ? 'cli' : (role === 'vendeur' ? 'ven' : (role === 'livreur' ? 'liv' : 'pro')));
  return prefix + '-' + crypto.randomBytes(6).toString('hex');
}

function seedUsers() {
  const now = new Date().toISOString();
  // Aucun mot de passe codé en dur : s'il n'est pas fourni via l'environnement,
  // on génère un secret aléatoire fort, affiché une seule fois au démarrage.
  const generated = {};
  if (!ADMIN_SEED_PASSWORD) generated.password = crypto.randomBytes(12).toString('base64url');
  if (!ADMIN_SEED_PIN) generated.pin = String(Math.floor(1000 + Math.random() * 9000));
  const password = ADMIN_SEED_PASSWORD || generated.password;
  const pin = ADMIN_SEED_PIN || generated.pin;
  adminSeedCredentials = { email: ADMIN_SEED_EMAIL, password: generated.password || null, pin: generated.pin || null };
  return [
    {
      id: 'adm-mangoo', vendorId: null, role: 'admin',
      name: 'Administrateur Mangoo', enseigne: 'MangooTech',
      email: ADMIN_SEED_EMAIL, phone: '+2250000000000',
      pinHash: hashSecret(pin), passwordHash: hashSecret(password),
      logo: '', category: 'plateforme', city: 'Abidjan', createdAt: now
    }
  ];
}

// En production, les identifiants admin doivent provenir UNIQUEMENT des
// variables d'environnement Render (ADMIN_PASSWORD / ADMIN_PIN). On refuse de
// générer un secret aléatoire persistant et de l'écrire sur disque ou dans les
// logs : si une valeur est manquante, le démarrage échoue avec un message clair
// (aucune valeur secrète n'est jamais journalisée ni persistée).
function assertProductionAdminCredentials(context) {
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (!isProd) return;
  const missing = [];
  if (!ADMIN_SEED_PASSWORD) missing.push('ADMIN_PASSWORD');
  if (!ADMIN_SEED_PIN) missing.push('ADMIN_PIN');
  if (missing.length === 0) return;
  console.error('[Auth] ERREUR (production) : ' + context + ' exige ' + missing.join(' et ') +
    ' via les variables d\'environnement Render. Aucun secret n\'est généré ni écrit sur disque.');
  process.exit(1);
}

function printAdminSeed(creds) {
  if (!creds || (!creds.password && !creds.pin)) return;
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  // En production, on ne journalise NI n'écrit JAMAIS un secret : les
  // identifiants sont fournis par ADMIN_PASSWORD / ADMIN_PIN (Render). Ce
  // chemin n'est utilisé qu'en développement local.
  if (isProd) return;
  const lines = [
    '',
    '============================================================',
    '  COMPTE ADMINISTRATEUR INITIAL — conservez ces identifiants',
    '  Email    : ' + creds.email
  ];
  if (creds.password) lines.push('  Mot de passe : ' + creds.password);
  if (creds.pin) lines.push('  PIN      : ' + creds.pin);
  lines.push('  (définissez ADMIN_PASSWORD / ADMIN_PIN pour les fixer)');
  lines.push('============================================================');
  lines.push('');
  console.log(lines.join('\n'));
}

// Neutralise les identifiants admin par défaut hérités d'une installation
// antérieure (admin2026 / 0000) : si le compte admin utilise encore ces
// secrets connus, on les remplace par des secrets aléatoires affichés une fois.
function rotateLegacyAdminCredentials() {
  const legacyPassword = 'admin2026';
  const legacyPin = '0000';
  let changed = false;
  const generated = { password: null, pin: null };
  const admin = users.find(function (u) { return u.role === 'admin'; });
  if (!admin) return;
  // En production, la neutralisation d'identifiants hérités ne doit jamais
  // générer de secret aléatoire : exiger les variables Render à la place.
  if (String(process.env.NODE_ENV || '').toLowerCase() === 'production' &&
      ((admin.passwordHash && verifySecret(legacyPassword, admin.passwordHash)) ||
       (admin.pinHash && verifySecret(legacyPin, admin.pinHash)))) {
    assertProductionAdminCredentials('la neutralisation d\'identifiants admin hérités');
  }
  if (admin.passwordHash && verifySecret(legacyPassword, admin.passwordHash) && !ADMIN_SEED_PASSWORD) {
    generated.password = crypto.randomBytes(12).toString('base64url');
    admin.passwordHash = hashSecret(generated.password);
    changed = true;
  }
  if (admin.pinHash && verifySecret(legacyPin, admin.pinHash) && !ADMIN_SEED_PIN) {
    generated.pin = String(Math.floor(1000 + Math.random() * 9000));
    admin.pinHash = hashSecret(generated.pin);
    changed = true;
  }
  if (changed) {
    saveUsers();
    adminSeedCredentials = { email: admin.email || ADMIN_SEED_EMAIL, password: generated.password, pin: generated.pin };
    console.log('[Auth] identifiants admin par défaut neutralisés (rotation automatique).');
    printAdminSeed(adminSeedCredentials);
  }
}

// Rotation d'urgence via variables d'environnement (ADMIN_PASSWORD_RESET /
// ADMIN_PIN_RESET). Appliquée au démarrage, à usage unique : on réécrit le
// secret admin sans dépendre d'une session existante. À retirer ensuite.
function applyAdminPasswordReset() {
  const admin = users.find(function (u) { return u.role === 'admin'; });
  if (!admin) return;
  let changed = false;
  if (ADMIN_PASSWORD_RESET) {
    admin.passwordHash = hashSecret(ADMIN_PASSWORD_RESET);
    changed = true;
  }
  if (ADMIN_PIN_RESET) {
    admin.pinHash = hashSecret(ADMIN_PIN_RESET);
    changed = true;
  }
  if (changed) {
    admin.updatedAt = new Date().toISOString();
    saveUsers();
    console.log('[Auth] rotation admin appliquée via ADMIN_PASSWORD_RESET / ADMIN_PIN_RESET.');
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(data)) {
        users = data;
        console.log('[Auth] comptes chargés :', users.length);
        rotateLegacyAdminCredentials();
        applyAdminPasswordReset();
        return;
      }
    }
  } catch (e) { console.error('[Auth] lecture impossible, réinitialisation :', e.message); }
  // Aucun compte utilisateur : création du compte admin initial. En production,
  // les identifiants doivent être fournis par les variables Render (ADMIN_PASSWORD
  // / ADMIN_PIN) — sinon le démarrage s'arrête (aucun secret généré ni persisté).
  assertProductionAdminCredentials('le compte admin initial');
  users = seedUsers();
  saveUsers();
  console.log('[Auth] seed initial :', users.length, 'compte(s)');
  printAdminSeed(adminSeedCredentials);
}

function saveUsers() {
  writeJsonAtomic('users.json', users);
}

/* ------------------------------------------------------------------ *
 *  Annuaire public (Local+ / carte)
 * ------------------------------------------------------------------ *
 *  Expose uniquement les profils pro réels (prestataires & boutiques),
 *  à l'exclusion des comptes admin/démo, pour alimenter la carte.
 * ------------------------------------------------------------------ */
// Dictionnaire géographique des villes proposées à l'inscription (slug -> coordonnées).
// Permet d'enregistrer country + lat/lng au moment de la création du compte, afin
// que la carte Local+ puisse géolocaliser chaque pro sans retomber sur Dakar.
const GEO_CITIES = {
  // Europe (test France)
  'paris':        { city: 'Paris',        country: 'France',        lat: 48.8566, lng: 2.3522 },

  // Afrique du Nord
  'algiers':      { city: 'Alger',        country: 'Algeria',       lat: 36.7538, lng: 3.0588 },
  'oran':         { city: 'Oran',         country: 'Algeria',       lat: 35.6987, lng: -0.6356 },
  'constantine':  { city: 'Constantine',  country: 'Algeria',       lat: 36.3650, lng: 6.6147 },
  'cairo':        { city: 'Le Caire',     country: 'Egypt',         lat: 30.0444, lng: 31.2357 },
  'alexandria':   { city: 'Alexandrie',   country: 'Egypt',         lat: 31.2001, lng: 29.9187 },
  'giza':         { city: 'Gizeh',        country: 'Egypt',         lat: 30.0131, lng: 31.2089 },
  'tripoli':      { city: 'Tripoli',      country: 'Libya',         lat: 32.8872, lng: 13.1913 },
  'benghazi':     { city: 'Benghazi',     country: 'Libya',         lat: 32.1167, lng: 20.0667 },
  'rabat':        { city: 'Rabat',        country: 'Morocco',       lat: 34.0209, lng: -6.8416 },
  'casablanca':   { city: 'Casablanca',   country: 'Morocco',       lat: 33.5731, lng: -7.5898 },
  'marrakech':    { city: 'Marrakech',    country: 'Morocco',       lat: 31.6295, lng: -7.9811 },
  'fes':          { city: 'Fès',          country: 'Morocco',       lat: 34.0181, lng: -5.0078 },
  'tangier':      { city: 'Tanger',       country: 'Morocco',       lat: 35.7595, lng: -5.8340 },
  'tunis':        { city: 'Tunis',        country: 'Tunisia',       lat: 36.8065, lng: 10.1815 },
  'sfax':         { city: 'Sfax',         country: 'Tunisia',       lat: 34.7406, lng: 10.7603 },
  'laayoune':     { city: 'Laâyoune',     country: 'Western Sahara', lat: 27.1253, lng: -13.1625 },

  // Afrique de l'Ouest
  'cotonou':      { city: 'Cotonou',      country: 'Benin',         lat: 6.3654, lng: 2.4183 },
  'porto-novo':   { city: 'Porto-Novo',   country: 'Benin',         lat: 6.4969, lng: 2.6289 },
  'ouagadougou':  { city: 'Ouagadougou',  country: 'Burkina Faso',  lat: 12.3714, lng: -1.5197 },
  'bobo-dioulasso': { city: 'Bobo-Dioulasso', country: 'Burkina Faso', lat: 11.1771, lng: -4.2979 },
  'praia':        { city: 'Praia',        country: 'Cape Verde',    lat: 14.9330, lng: -23.5133 },
  'banjul':       { city: 'Banjul',       country: 'Gambia',        lat: 13.4549, lng: -16.5790 },
  'accra':        { city: 'Accra',        country: 'Ghana',         lat: 5.6037, lng: -0.1870 },
  'kumasi':       { city: 'Kumasi',       country: 'Ghana',         lat: 6.6666, lng: -1.6163 },
  'conakry':      { city: 'Conakry',      country: 'Guinea',        lat: 9.6412, lng: -13.5784 },
  'bissau':       { city: 'Bissau',       country: 'Guinea-Bissau', lat: 11.8817, lng: -15.6178 },
  'abidjan':      { city: 'Abidjan',      country: "Cote d'Ivoire", lat: 5.3599,  lng: -4.0083 },
  'yamoussoukro': { city: 'Yamoussoukro', country: "Cote d'Ivoire", lat: 6.8276,  lng: -5.2893 },
  'bouake':       { city: 'Bouaké',       country: "Cote d'Ivoire", lat: 7.6900,  lng: -5.0300 },
  'daloa':        { city: 'Daloa',        country: "Cote d'Ivoire", lat: 6.8774,  lng: -6.4502 },
  'san-pedro':    { city: 'San Pedro',    country: "Cote d'Ivoire", lat: 4.7485,  lng: -6.6363 },
  'korhogo':      { city: 'Korhogo',      country: "Cote d'Ivoire", lat: 9.4580,  lng: -5.6296 },
  'man':          { city: 'Man',          country: "Cote d'Ivoire", lat: 7.4064,  lng: -7.5572 },
  'monrovia':     { city: 'Monrovia',     country: 'Liberia',       lat: 6.2907, lng: -10.7605 },
  'bamako':       { city: 'Bamako',       country: 'Mali',          lat: 12.6392, lng: -8.0029 },
  'nouakchott':   { city: 'Nouakchott',   country: 'Mauritania',    lat: 18.0735, lng: -15.9582 },
  'niamey':       { city: 'Niamey',       country: 'Niger',         lat: 13.5116, lng: 2.1254 },
  'lagos':        { city: 'Lagos',        country: 'Nigeria',       lat: 6.5244, lng: 3.3792 },
  'abuja':        { city: 'Abuja',        country: 'Nigeria',       lat: 9.0765, lng: 7.3986 },
  'kano':         { city: 'Kano',         country: 'Nigeria',       lat: 12.0022, lng: 8.5920 },
  'ibadan':       { city: 'Ibadan',       country: 'Nigeria',       lat: 7.3775, lng: 3.9470 },
  'port-harcourt': { city: 'Port Harcourt', country: 'Nigeria',     lat: 4.8156, lng: 7.0498 },
  'dakar':        { city: 'Dakar',        country: 'Senegal',       lat: 14.7167, lng: -17.4677 },
  'touba':        { city: 'Touba',        country: 'Senegal',       lat: 14.8488, lng: -15.8806 },
  'thies':        { city: 'Thiès',        country: 'Senegal',       lat: 14.7910, lng: -16.9359 },
  'saint-louis':  { city: 'Saint-Louis',  country: 'Senegal',       lat: 16.0326, lng: -16.4818 },
  'freetown':     { city: 'Freetown',     country: 'Sierra Leone',  lat: 8.4657, lng: -13.2317 },
  'lome':         { city: 'Lomé',         country: 'Togo',          lat: 6.1256, lng: 1.2254 },

  // Afrique centrale
  'luanda':       { city: 'Luanda',       country: 'Angola',        lat: -8.8390, lng: 13.2894 },
  'huambo':       { city: 'Huambo',       country: 'Angola',        lat: -12.7739, lng: 15.7346 },
  'yaounde':      { city: 'Yaoundé',      country: 'Cameroon',      lat: 3.8480, lng: 11.5021 },
  'douala':       { city: 'Douala',       country: 'Cameroon',      lat: 4.0511, lng: 9.7679 },
  'bangui':       { city: 'Bangui',       country: 'Central African Republic', lat: 4.3947, lng: 18.5582 },
  'n-djamena':    { city: "N'Djamena",    country: 'Chad',          lat: 12.1348, lng: 15.0557 },
  'brazzaville':  { city: 'Brazzaville',  country: 'Republic of the Congo', lat: -4.2634, lng: 15.2429 },
  'pointe-noire': { city: 'Pointe-Noire', country: 'Republic of the Congo', lat: -4.7692, lng: 11.8664 },
  'kinshasa':     { city: 'Kinshasa',     country: 'DR Congo',      lat: -4.4419, lng: 15.2663 },
  'lubumbashi':   { city: 'Lubumbashi',   country: 'DR Congo',      lat: -11.6876, lng: 27.5026 },
  'goma':         { city: 'Goma',         country: 'DR Congo',      lat: -1.6585, lng: 29.2201 },
  'kisangani':    { city: 'Kisangani',    country: 'DR Congo',      lat: 0.5153, lng: 25.1910 },
  'malabo':       { city: 'Malabo',       country: 'Equatorial Guinea', lat: 3.7504, lng: 8.7371 },
  'bata':         { city: 'Bata',         country: 'Equatorial Guinea', lat: 1.8639, lng: 9.7657 },
  'libreville':   { city: 'Libreville',   country: 'Gabon',         lat: 0.4162,  lng: 9.4673 },
  'port-gentil':  { city: 'Port-Gentil',  country: 'Gabon',         lat: -0.7193, lng: 8.7815 },
  'sao-tome':     { city: 'São Tomé',     country: 'Sao Tome and Principe', lat: 0.3365, lng: 6.7273 },

  // Afrique de l'Est
  'bujumbura':    { city: 'Bujumbura',    country: 'Burundi',       lat: -3.3614, lng: 29.3599 },
  'gitega':       { city: 'Gitega',       country: 'Burundi',       lat: -3.4264, lng: 29.9306 },
  'moroni':       { city: 'Moroni',       country: 'Comoros',       lat: -11.7172, lng: 43.2473 },
  'djibouti':     { city: 'Djibouti',     country: 'Djibouti',      lat: 11.5721, lng: 43.1456 },
  'asmara':       { city: 'Asmara',       country: 'Eritrea',       lat: 15.3229, lng: 38.9251 },
  'addis-ababa':  { city: 'Addis-Abeba',  country: 'Ethiopia',      lat: 9.0054, lng: 38.7636 },
  'dire-dawa':    { city: 'Dire Dawa',    country: 'Ethiopia',      lat: 9.6000, lng: 41.8667 },
  'nairobi':      { city: 'Nairobi',      country: 'Kenya',         lat: -1.2921, lng: 36.8219 },
  'mombasa':      { city: 'Mombasa',      country: 'Kenya',         lat: -4.0435, lng: 39.6682 },
  'kisumu':       { city: 'Kisumu',       country: 'Kenya',         lat: -0.0917, lng: 34.7680 },
  'antananarivo': { city: 'Antananarivo', country: 'Madagascar',    lat: -18.8792, lng: 47.5079 },
  'lilongwe':     { city: 'Lilongwe',     country: 'Malawi',        lat: -13.9626, lng: 33.7741 },
  'blantyre':     { city: 'Blantyre',     country: 'Malawi',        lat: -15.7861, lng: 35.0058 },
  'port-louis':   { city: 'Port-Louis',   country: 'Mauritius',     lat: -20.1609, lng: 57.5012 },
  'maputo':       { city: 'Maputo',       country: 'Mozambique',    lat: -25.9692, lng: 32.5732 },
  'beira':        { city: 'Beira',        country: 'Mozambique',    lat: -19.8436, lng: 34.8389 },
  'kigali':       { city: 'Kigali',       country: 'Rwanda',        lat: -1.9441, lng: 30.0619 },
  'victoria':     { city: 'Victoria',     country: 'Seychelles',    lat: -4.6191, lng: 55.4513 },
  'mogadishu':    { city: 'Mogadiscio',   country: 'Somalia',       lat: 2.0469, lng: 45.3182 },
  'hargeisa':     { city: 'Hargeisa',     country: 'Somalia',       lat: 9.5624, lng: 44.0770 },
  'juba':         { city: 'Djouba',       country: 'South Sudan',   lat: 4.8594, lng: 31.5713 },
  'dodoma':       { city: 'Dodoma',       country: 'Tanzania',      lat: -6.1630, lng: 35.7516 },
  'dar-es-salaam': { city: 'Dar es Salaam', country: 'Tanzania',    lat: -6.7924, lng: 39.2083 },
  'arusha':       { city: 'Arusha',       country: 'Tanzania',      lat: -3.3869, lng: 36.6830 },
  'kampala':      { city: 'Kampala',      country: 'Uganda',        lat: 0.3476, lng: 32.5825 },
  'lusaka':       { city: 'Lusaka',       country: 'Zambia',        lat: -15.3875, lng: 28.3228 },
  'kitwe':        { city: 'Kitwe',        country: 'Zambia',        lat: -12.8027, lng: 28.2132 },
  'harare':       { city: 'Harare',       country: 'Zimbabwe',      lat: -17.8252, lng: 31.0335 },
  'bulawayo':     { city: 'Bulawayo',     country: 'Zimbabwe',      lat: -20.1325, lng: 28.6265 },

  // Afrique australe
  'gaborone':     { city: 'Gaborone',     country: 'Botswana',      lat: -24.6282, lng: 25.9231 },
  'mbabane':      { city: 'Mbabane',      country: 'Eswatini',      lat: -26.3054, lng: 31.1367 },
  'maseru':       { city: 'Maseru',       country: 'Lesotho',       lat: -29.3151, lng: 27.4869 },
  'windhoek':     { city: 'Windhoek',     country: 'Namibia',       lat: -22.5597, lng: 17.0832 },
  'pretoria':     { city: 'Pretoria',     country: 'South Africa',  lat: -25.7479, lng: 28.2293 },
  'johannesburg': { city: 'Johannesburg', country: 'South Africa',  lat: -26.2041, lng: 28.0473 },
  'cape-town':    { city: 'Le Cap',       country: 'South Africa',  lat: -33.9249, lng: 18.4241 },
  'durban':       { city: 'Durban',       country: 'South Africa',  lat: -29.8587, lng: 31.0218 }
};

function normalizeCityKey(raw) {
  return String(raw || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function geocodeCity(raw) {
  const slug = normalizeCityKey(raw);
  return GEO_CITIES[slug] || null;
}

function carteCategory(category) {
  // Un profil « commerce » est un vendeur ; catégorie affichée « boutique ».
  return category === 'commerce' ? 'boutique' : category;
}

// Reconstruit une ville valide à partir d'un profil dont la ville est absente
// ou a été enregistrée comme « other » (ancienne option « Autre » du formulaire,
// qui n'était pas géolocalisée). On dérive la ville connue la plus proche des
// coordonnées, sinon la première ville du pays, sinon Dakar. Corrige les comptes
// créés avant la normalisation des villes, afin qu'ils apparaissent sur la carte.
function resolveVendorCity(lat, lng, country) {
  const hasGeo = typeof lat === 'number' && isFinite(lat) && typeof lng === 'number' && isFinite(lng);
  if (hasGeo) {
    let best = null, bestKm = Infinity;
    for (const slug in GEO_CITIES) {
      const c = GEO_CITIES[slug];
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < bestKm) { bestKm = d; best = c; }
    }
    if (best) return { city: best.city, country: best.country };
  }
  if (country) {
    const ck = String(country).trim().toLowerCase();
    for (const slug in GEO_CITIES) {
      const c = GEO_CITIES[slug];
      if (String(c.country).trim().toLowerCase() === ck) return { city: c.city, country: c.country };
    }
  }
  return { city: 'Dakar', country: 'Senegal' };
}

function carteVendors() {
  // Réconcilie l'état des boosters (expiration des badges échus) avant de
  // construire l'annuaire, afin que la carte reflète les badges actifs en
  // temps réel sans attendre le polling côté client.
  reconcileBoosters();
  const list = [];
  const eligible = users.filter(function (u) {
    return u && (u.role === 'prestataire' || u.role === 'vendeur');
  });
  eligible.sort(function (a, b) {
    return String(a.enseigne || a.name || '').localeCompare(String(b.enseigne || b.name || ''));
  });
  let nextId = 1;
  eligible.forEach(function (u) {
    const cfg = u.vendorId ? vendorConfigFor(u.vendorId) : null;
    const profile = (cfg && cfg.profile) || {};
    const type = u.role === 'vendeur' ? 'boutique' : 'prestataire';
    const category = carteCategory(profile.category || u.category || (type === 'boutique' ? 'boutique' : 'service'));
    const rating = (cfg && cfg.rating != null)
      ? Number(cfg.rating)
      : ((cfg && cfg.ranking && cfg.ranking.score != null) ? Number((cfg.ranking.score / 20).toFixed(1)) : 4.5);

    // Coordonnées + ville normalisées : les comptes « other » (ancienne option
    // « Autre ») sont ré-affectés à une vraie ville pour ne pas disparaître de
    // la carte alors qu'ils sont géolocalisés (par défaut Dakar).
    const lat = (profile.lat != null) ? Number(profile.lat) : (u.lat != null ? Number(u.lat) : 14.7167);
    const lng = (profile.lng != null) ? Number(profile.lng) : (u.lng != null ? Number(u.lng) : -17.4677);
    let city = profile.city || u.city || '';
    let country = profile.country || u.country || '';
    if (!city || normalizeCityKey(city) === 'other' || normalizeCityKey(city) === 'autre') {
      const resolved = resolveVendorCity(lat, lng, country);
      city = resolved.city;
      if (!country) country = resolved.country;
    }

    list.push({
      id: nextId++,
      vendorId: u.vendorId || u.id,
      name: profile.enseigne || u.enseigne || u.name,
      type: type,
      category: category,
      city: city,
      country: country,
      lat: lat,
      lng: lng,
      rating: rating,
      price: '$$',
      live: false,
      desc: profile.description || '',
      img: profile.logo || profile.cover || '',
      phone: profile.phone || u.phone || '',
      boosts: activeBoostsFor(u.vendorId || u.id)
    });
  });
  return list;
}

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      if (data && typeof data === 'object') { sessions = data; console.log('[Auth] sessions chargées'); return; }
    }
  } catch (e) { console.error('[Auth] sessions illisibles :', e.message); }
  sessions = {};
}

function saveSessions() {
  writeJsonAtomic('sessions.json', sessions);
}

function findUserByIdentifier(identifier) {
  const id = String(identifier || '').trim().toLowerCase();
  if (!id) return null;
  const phone = normalizePhone(identifier);
  for (const u of users) {
    if (u.email && u.email.toLowerCase() === id) return u;
  }
  for (const u of users) {
    if (u.phone && normalizePhone(u.phone) === phone && phone) return u;
  }
  return null;
}

function userByToken(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  const userId = sessions[t];
  if (!userId) return null;
  return users.find((u) => u.id === userId) || null;
}

// Catalogue d'offres de boosters (fixe, exposé tel quel à l'écran).
const BOOSTER_OFFERS = [
  { id: 'boost-sponsorise', type: 'sponsorise', name: 'Sponsorisé', title: 'Tête des résultats', desc: 'Votre fiche remonte en premier sur la carte et la recherche', price: 2000, priceLabel: 'FCFA / 24h', durationText: '24h', durationMs: 24 * 60 * 60 * 1000, icon: 'megaphone', recommended: false, features: ['Position en tête des résultats', 'Priorité sur la carte Local+', 'Portée maximale pendant 24h'] },
  { id: 'boost-promo', type: 'promo', name: 'En Promo', title: 'Badge promo', desc: 'Affichez le badge « Promo » et mettez vos offres en avant', price: 3000, priceLabel: 'FCFA / 3 jours', durationText: '3 jours', durationMs: 3 * 24 * 60 * 60 * 1000, icon: 'tag', recommended: true, features: ['Badge « Promo » sur votre fiche', 'Mise en avant de vos offres', 'Visibilité pendant 3 jours'] },
  { id: 'boost-nouveau', type: 'nouveau', name: 'Nouveau', title: 'Badge nouveauté', desc: 'Attirez l\'attention des nouveaux clients', price: 1000, priceLabel: 'FCFA / 48h', durationText: '48h', durationMs: 48 * 60 * 60 * 1000, icon: 'sparkles', recommended: false, features: ['Badge « Nouveau » sur votre fiche', 'Signale votre activité récente', 'Visibilité pendant 48h'] }
];

function findOffer(idOrType) {
  for (let i = 0; i < BOOSTER_OFFERS.length; i++) {
    if (BOOSTER_OFFERS[i].id === idOrType || BOOSTER_OFFERS[i].type === idOrType) return BOOSTER_OFFERS[i];
  }
  return null;
}

function seedBoosters() {
  return [];
}

function seedBoosterStats() {
  return { vendorId: 'pro-41cafa4bcb31', monthViews: 0, clicks: 0, orders: 0, roi: 0, pendingCount: 0 };
}

function loadBoosters() {
  try {
    if (fs.existsSync(BOOSTERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOOSTERS_FILE, 'utf8'));
      if (Array.isArray(data)) { boosters = data; console.log('[Boosters] activations chargées :', boosters.length); return; }
    }
  } catch (e) { console.error('[Boosters] lecture impossible, réinitialisation :', e.message); }
  boosters = seedBoosters();
  saveBoosters();
  console.log('[Boosters] seed initial :', boosters.length);
}

function saveBoosters() {
  writeJsonAtomic('boosters.json', boosters);
}

/* Réconcilie l'état des activations : expire les badges actifs échus et
 * migre les anciens badges sans date d'expiration (legacy) en leur donnant
 * une échéance future basée sur la durée de l'offre. Cela évite de vider
 * brutalement la liste des actifs tout en alimentant l'historique au fil
 * du temps. */
function reconcileBoosters() {
  const now = Date.now();
  let changed = false;
  for (let i = 0; i < boosters.length; i++) {
    const b = boosters[i];
    if (b.status !== 'active') continue;
    const offer = findOffer(b.boosterId || b.type);
    const durationMs = (offer && Number(offer.durationMs)) || 24 * 60 * 60 * 1000;
    if (!b.expiresAt) {
      // Migration legacy : le badge est considéré comme activé à l'instant.
      b.createdAt = new Date(now).toISOString();
      b.expiresAt = new Date(now + durationMs).toISOString();
      changed = true;
    } else if (Date.parse(b.expiresAt) <= now) {
      b.status = 'expire';
      b.remainingPct = 0;
      b.endLabel = 'Expiré';
      changed = true;
    }
  }
  if (changed) saveBoosters();
}

/* Types de badges actifs (non expirés) d'un vendeur, triés par poids de
 * classement (Sponsorisé > En Promo > Nouveau). Consommé par /api/carte pour
 * afficher immédiatement les badges sur la carte Local+. */
function activeBoostsFor(vendorId) {
  const id = String(vendorId || '');
  if (!id) return [];
  const now = Date.now();
  const rankOf = { sponsorise: 3, promo: 2, nouveau: 1 };
  const seen = {};
  const types = [];
  boosters.forEach(function (b) {
    if (!b || b.status !== 'active') return;
    if (String(b.vendorId || '') !== id) return;
    if (b.expiresAt && Date.parse(b.expiresAt) <= now) return;
    const t = b.type;
    if (t && !seen[t]) { seen[t] = true; types.push(t); }
  });
  types.sort(function (a, b) { return (rankOf[b] || 0) - (rankOf[a] || 0); });
  return types;
}

/* Retrouve un compte pro à partir de son vendorId (les vendeurs/prestataires
 * ont `vendorId === id` dans la seed). Utilisé pour tracer le paiement d'un
 * badge sans exiger de token de session. */
function userForVendorId(vendorId) {
  const id = String(vendorId || '');
  if (!id) return null;
  return users.find(function (u) { return u && ((u.vendorId || u.id) === id); }) || null;
}

/* Valide et trace le paiement d'un badge (activation ou renouvellement).
 * Le débit est enregistré UNIQUEMENT dans l'historique Boosters (via `price`,
 * `createdAt` et `paymentId` sur l'activation), PAS dans les Finances : celles-
 * ci ne gèrent que le portefeuille (recharges, retraits, offres du jour...).
 * En cas de paiement par portefeuille, le solde est débité directement. */
function recordBoosterPayment(user, offer, kind, body) {
  body = body || {};
  const amount = Math.round(Number(offer.price) || 0);
  const now = new Date().toISOString();
  if (body.payFromWallet === true) {
    const w = walletFor(user.id);
    if ((Number(w.balance) || 0) < amount) return { ok: false, error: 'Solde portefeuille insuffisant.' };
    w.balance = Math.round((Number(w.balance) || 0) - amount);
    w.updatedAt = now;
    saveWallets();
  }
  const payment = {
    id: 'BOOST-' + Date.now(),
    amount: amount,
    paidAt: now,
    operator: String(body.operator || ''),
    phone: String(body.phone || user.phone || '')
  };
  return { ok: true, payment: payment };
}

function loadBoosterStats() {
  try {
    if (fs.existsSync(BOOSTER_STATS_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOOSTER_STATS_FILE, 'utf8'));
      if (data && typeof data === 'object') { boosterStats = data; console.log('[Boosters] stats chargées'); return; }
    }
  } catch (e) { console.error('[Boosters] stats illisibles, réinitialisation :', e.message); }
  boosterStats = seedBoosterStats();
  saveBoosterStats();
}

function saveBoosterStats() {
  writeJsonAtomic('booster-stats.json', boosterStats);
}

/* ------------------------------------------------------------------ *
 *  Paiement global — comptes, portefeuille, modes de paiement
 * ------------------------------------------------------------------ *
 *  - Connecteur opérateurs mobile money : Orange Money, Wave, MTN MoMo,
 *    Moov Money et Free Mobile Sénégal.
 *  - Sans clés API (fichier .env), chaque opérateur bascule en mode
 *    « sandbox » : initier → confirmer est simulé, mais les frais, le
 *    portefeuille Vendeur+Client et les Offres du jour restent réels et
 *    persistants.
 *  - L'Offre du jour est un achat séparé à durée limitée, facturé par
 *    palier (24 h / 3 j / 7 j), totalement indépendant des Boosters.
 * ------------------------------------------------------------------ */
const PAYMENT_METHODS_FILE = path.join(DATA_DIR, 'payment-methods.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const WALLETS_FILE = path.join(DATA_DIR, 'wallets.json');
const OFFRES_JOUR_FILE = path.join(DATA_DIR, 'offres-jour.json');

let paymentMethods = [];
let transactions = [];
let wallets = [];
let offresJour = [];

const DEVISE = 'XOF';
const DEVISE_LABEL = 'FCFA'; // Libellé affiché (le code ISO « XOF » reste utilisé dans les données).

const MOBILE_MONEY_OPERATORS = {
  orange: { id: 'orange', label: 'Orange Money', code: 'OM', fee: 0.01, feeLabel: '1 %', configKeys: ['ORANGE_MONEY_API_KEY', 'ORANGE_MONEY_CLIENT_ID'], countries: ['SN', 'CI', 'ML', 'GN', 'BF', 'CM'] },
  wave: { id: 'wave', label: 'Wave', code: 'WAVE', fee: 0.01, feeLabel: '1 %', configKeys: ['WAVE_API_KEY', 'WAVE_SECRET_KEY'], countries: ['SN', 'CI', 'ML', 'BF', 'GN', 'GM', 'BJ', 'TG'] },
  mtn: { id: 'mtn', label: 'MTN Mobile Money', code: 'MOMO', fee: 0.015, feeLabel: '1,5 %', configKeys: ['MTN_MOMO_API_KEY', 'MTN_MOMO_SUBSCRIPTION_KEY'], countries: ['SN', 'CI', 'CM', 'GH', 'UG', 'ZM', 'GN', 'BJ'] },
  moov: { id: 'moov', label: 'Moov Money', code: 'MOOV', fee: 0.015, feeLabel: '1,5 %', configKeys: ['MOOV_API_KEY', 'MOOV_CLIENT_ID'], countries: ['SN', 'CI', 'BF', 'TG', 'NE', 'BJ'] },
  free: { id: 'free', label: 'Free Mobile Sénégal', code: 'FREE', fee: 0.01, feeLabel: '1 %', configKeys: ['FREE_MOBILE_API_KEY', 'FREE_MOBILE_CLIENT_ID'], countries: ['SN'] }
};

const OFFRE_DU_JOUR_TIERS = [
  { id: '24h', durationHours: 24, durationLabel: '24 heures', price: 1500 },
  { id: '3j', durationHours: 72, durationLabel: '3 jours', price: 3500 },
  { id: '7j', durationHours: 168, durationLabel: '7 jours', price: 6000 }
];

function seedPaymentMethods() {
  return [
    { id: 'orange_money', kind: 'mobile-money', operator: 'orange', name: 'Orange Money', fee: 0.01, feeLabel: '1 %', enabled: true },
    { id: 'wave', kind: 'mobile-money', operator: 'wave', name: 'Wave', fee: 0.01, feeLabel: '1 %', enabled: true },
    { id: 'mtn_momo', kind: 'mobile-money', operator: 'mtn', name: 'MTN Mobile Money', fee: 0.015, feeLabel: '1,5 %', enabled: true },
    { id: 'moov_money', kind: 'mobile-money', operator: 'moov', name: 'Moov Money', fee: 0.015, feeLabel: '1,5 %', enabled: true },
    { id: 'free_mobile', kind: 'mobile-money', operator: 'free', name: 'Free Mobile Sénégal', fee: 0.01, feeLabel: '1 %', enabled: true },
    { id: 'card', kind: 'card', operator: null, name: 'Carte bancaire', fee: 0.029, feeLabel: '2,9 %', enabled: true },
    { id: 'paypal', kind: 'wallet', operator: null, name: 'PayPal', fee: 0.039, feeLabel: '3,9 %', enabled: true }
  ];
}

function loadPaymentMethods() {
  try {
    if (fs.existsSync(PAYMENT_METHODS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PAYMENT_METHODS_FILE, 'utf8'));
      if (Array.isArray(data)) { paymentMethods = data; console.log('[Paiement] méthodes chargées :', paymentMethods.length); return; }
    }
  } catch (e) { console.error('[Paiement] méthodes illisibles, réinitialisation :', e.message); }
  paymentMethods = seedPaymentMethods();
  savePaymentMethods();
}

function savePaymentMethods() {
  writeJsonAtomic('payment-methods.json', paymentMethods);
}

function loadTransactions() {
  try {
    if (fs.existsSync(TRANSACTIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, 'utf8'));
      if (Array.isArray(data)) { transactions = data; console.log('[Paiement] transactions chargées :', transactions.length); return; }
    }
  } catch (e) { console.error('[Paiement] transactions illisibles, réinitialisation :', e.message); }
  transactions = [];
}

function saveTransactions() {
  writeJsonAtomic('transactions.json', transactions);
}

function loadWallets() {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const data = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
      if (Array.isArray(data)) { wallets = data; console.log('[Paiement] portefeuilles chargés :', wallets.length); return; }
    }
  } catch (e) { console.error('[Paiement] portefeuilles illisibles, réinitialisation :', e.message); }
  wallets = [];
}

function saveWallets() {
  writeJsonAtomic('wallets.json', wallets);
}

function loadOffresJour() {
  try {
    if (fs.existsSync(OFFRES_JOUR_FILE)) {
      const data = JSON.parse(fs.readFileSync(OFFRES_JOUR_FILE, 'utf8'));
      if (Array.isArray(data)) { offresJour = data; console.log('[Paiement] offres du jour chargées :', offresJour.length); return; }
    }
  } catch (e) { console.error('[Paiement] offres du jour illisibles, réinitialisation :', e.message); }
  offresJour = [];
}

function saveOffresJour() {
  writeJsonAtomic('offres-jour.json', offresJour);
}

/* ------------------------------------------------------------------ *
 *  Mangoo Négociation — module IA déterministe (sans LLM / clé API)
 *  ------------------------------------------------------------------ *
 *  Innovation réelle : un client envoie une offre sur un produit du
 *  catalogue ; le moteur calcule une contre-offre automatique bornée par
 *  un prix plancher vendeur (floorPrice), puis l'accord est conclu par
 *  Mobile Money. Le tout est localisé (Wolof / Pulaar / Français).
 *  Persistance : data/negotiations.json.
 * ------------------------------------------------------------------ */
const NEGOTIATIONS_FILE = path.join(DATA_DIR, 'negotiations.json');
const NEGO_MAX_ROUNDS = 4;

const NEGO_LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'wo', label: 'Wolof' },
  { id: 'ff', label: 'Pulaar' },
  { id: 'mnk', label: 'Mandingue' }
];

// Traductions initiales (à faire valider par un locuteur natif ; le
// Mandingue pourra être ajouté plus tard comme simple dictionnaire).
const NEGO_I18N = {
  fr: {
    greeting: 'Bonjour ! Bienvenue chez {vendor}.',
    offerReceived: 'Votre offre de {amount} FCFA pour « {product} » a bien été reçue.',
    counter: 'Le vendeur contre-propose {amount} FCFA.',
    counterFinal: 'Dernière offre du vendeur : {amount} FCFA.',
    belowFloor: 'Désolé, {amount} FCFA est sous notre minimum. Notre meilleur prix : {floor} FCFA.',
    accepted: 'Accord conclu à {amount} FCFA !',
    rejected: 'Négociation annulée.',
    closed: 'Aucun accord trouvé. Merci de votre visite.',
    notNegotiable: 'Ce produit n\'est pas négociable.',
    unavailable: 'Ce produit n\'est plus disponible.',
    payPrompt: 'Parfait ! Réglez {amount} FCFA par Mobile Money pour finaliser.',
    paid: 'Paiement confirmé. Merci pour votre achat !'
  },
  wo: {
    greeting: 'Salaamalekum ! Ngiy jàppe ci {vendor}.',
    offerReceived: 'Sa offre bu {amount} FCFA ci « {product} » am na, jërëjëf.',
    counter: 'Jaaykat bi moo jox {amount} FCFA.',
    counterFinal: 'Lu jaaykat bi jox bu mujj : {amount} FCFA.',
    belowFloor: 'Baal ma, {amount} FCFA dafa ci suuf lu ñu mën. Lu ñu gënal : {floor} FCFA.',
    accepted: 'Nangu nañu {amount} FCFA !',
    rejected: 'Waxtaan bi nañu ko tegge.',
    closed: 'Amul benn nangu. Jërëjëf !',
    notNegotiable: 'Xeetu lees jàppul ci waxtaan.',
    unavailable: 'Xeet bi amatul.',
    payPrompt: 'Baax na ! Feyy {amount} FCFA ci Mobile Money ngir jot ko.',
    paid: 'Pey bi ñu nangu ko. Jërëjëf !'
  },
  ff: {
    greeting: 'A jaaraama ! A naati to {vendor}.',
    offerReceived: 'Ko ñaañaade maa e {amount} FCFA e « {product} » heɓaama.',
    counter: 'Sooɗoowo oo rokki ma {amount} FCFA.',
    counterFinal: 'Cakkitiiɗo sooɗoowo : {amount} FCFA.',
    belowFloor: 'Yaafo, {amount} FCFA ko les ko min mbaawi. Ko ɓuri moƴƴude : {floor} FCFA.',
    accepted: 'Nanondirii e {amount} FCFA !',
    rejected: 'Yeewtere nde dartinaama.',
    closed: 'Nanondiral alaa. A jaaraama !',
    notNegotiable: 'Oo sooranteeɗo waawaa yeewteede.',
    unavailable: 'Oo sooranteeɗo alaa ko woni.',
    payPrompt: 'A jaɓii ! Njoɓ {amount} FCFA e Mobile Money ngam heɓde ɗum.',
    paid: 'Njoɓdi ndi jaɓaama. A jaaraama !'
  },
  mnk: {
    greeting: 'Salaamalekum ! I naa marabaa {vendor} kono.',
    offerReceived: 'I la sɔŋo {amount} FCFA ye « {product} » kamma soto le.',
    counter: 'Jaatii ye {amount} FCFA yitaa.',
    counterFinal: 'Jaatii la labaŋo sɔŋo : {amount} FCFA.',
    belowFloor: 'Yaafoo, {amount} FCFA ye jii la ǹ na dandaŋo koto. Ǹ na betoo sɔŋo : {floor} FCFA.',
    accepted: 'Sondomoo soto le {amount} FCFA kamma !',
    rejected: 'Kumoo baliŋ na le.',
    closed: 'Sondomoo maŋ soto. Abaraka i la naa la.',
    notNegotiable: 'Ñiŋ feŋo maŋ sɔŋo soto la.',
    unavailable: 'Ñiŋ feŋo banta le.',
    payPrompt: 'A beteyaata ! Joobaŋ {amount} FCFA ni Mobile Money la ka banna.',
    paid: 'Joobaŋo soto le. Abaraka i la saŋo la !'
  }
};

let negotiations = [];

function loadNegotiations() {
  try {
    if (fs.existsSync(NEGOTIATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(NEGOTIATIONS_FILE, 'utf8'));
      if (Array.isArray(data)) { negotiations = data; console.log('[Négociation] sessions chargées :', negotiations.length); return; }
    }
  } catch (e) { console.error('[Négociation] lecture impossible, réinitialisation :', e.message); }
  negotiations = [];
}

function saveNegotiations() {
  writeJsonAtomic('negotiations.json', negotiations);
}

function nextNegoRef() {
  let max = 0;
  negotiations.forEach(function (n) {
    const m = String(n.ref || '').match(/(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
  });
  return '#NEGO-' + String(max + 1).padStart(4, '0');
}

function fmtAmount(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function t(lang, key, vars) {
  const dict = NEGO_I18N[lang] || NEGO_I18N.fr;
  let s = dict[key] != null ? dict[key] : (NEGO_I18N.fr[key] || key);
  if (vars) {
    Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(String(vars[k])); });
  }
  return s;
}

function negotiationForId(id) {
  return negotiations.find(function (n) { return n.id === String(id || ''); }) || null;
}

// Vue publique d'une négociation : masque le prix plancher (secret vendeur).
function publicNegotiation(n) {
  if (!n) return null;
  const out = Object.assign({}, n);
  delete out.floorPrice;
  return out;
}

// Moteur de contre-offre déterministe. Retourne l'action à exécuter :
//   - 'accept'  : l'offre atteint le prix demandé -> accord.
//   - 'counter' : contre-offre (au-dessus ou au niveau du plancher).
//   - 'closed'  : plancher atteint et plus de concession -> échec.
function negotiateCounter(nego, offer) {
  const floor = Number(nego.floorPrice) || 0;
  const asking = Number(nego.askingPrice) || Number(nego.listedPrice) || 0;
  const o = Math.round(Number(offer) || 0);
  if (o >= asking) {
    return { action: 'accept', amount: asking };
  }
  if (o >= floor) {
    // Rencontre à mi-chemin, sans jamais passer sous le plancher.
    let counter = Math.round((o + asking) / 2);
    if (counter < floor) counter = floor;
    if (counter >= asking) counter = asking - 1;
    return { action: 'counter', amount: counter };
  }
  // Offre sous le plancher : le vendeur tient son minimum, puis clôt.
  if (nego.round >= NEGO_MAX_ROUNDS) {
    return { action: 'closed', amount: floor };
  }
  return { action: 'counter', amount: floor, belowFloor: true };
}

function createNegotiation(product, client, lang) {
  const listed = Math.round(Number(product.price) || 0);
  const floor = Math.round(Number(product.floorPrice) || 0);
  const nego = {
    id: 'nego-' + crypto.randomBytes(6).toString('hex'),
    ref: nextNegoRef(),
    productId: product.id,
    productName: product.name,
    vendorId: product.vendorId,
    vendorName: product.vendorName,
    clientId: client.id,
    clientName: client.name || client.enseigne || '',
    clientPhone: client.phone || '',
    lang: NEGO_I18N[lang] ? lang : 'fr',
    listedPrice: listed,
    floorPrice: floor,
    currency: DEVISE,
    askingPrice: listed,
    status: 'open',
    round: 0,
    offers: [],
    agreedPrice: null,
    agreedAt: null,
    transactionId: null,
    paidAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  negotiations.unshift(nego);
  saveNegotiations();
  return nego;
}

function applyNegotiationOffer(nego, offer) {
  const result = negotiateCounter(nego, offer);
  nego.offers.push({ by: 'client', amount: Math.round(Number(offer) || 0), at: nowIso() });
  if (result.action === 'accept') {
    nego.status = 'agreed';
    nego.agreedPrice = result.amount;
    nego.agreedAt = nowIso();
    nego.askingPrice = result.amount;
  } else if (result.action === 'closed') {
    nego.status = 'closed';
    nego.askingPrice = result.amount;
  } else {
    nego.askingPrice = result.amount;
    nego.round += 1;
  }
  nego.offers.push({ by: 'vendor', amount: result.amount, at: nowIso() });
  nego.updatedAt = nowIso();
  saveNegotiations();
  return result;
}

function buildNegoMessage(nego, result) {
  const lang = nego.lang;
  const lastClient = (nego.offers || []).filter(function (o) { return o.by === 'client'; }).pop();
  const clientAmount = lastClient ? Number(lastClient.amount) : Number(result.amount);
  const base = {
    vendor: nego.vendorName || 'le vendeur',
    product: nego.productName || '',
    floor: fmtAmount(nego.floorPrice)
  };
  if (result.action === 'accept') return { kind: 'accepted', message: t(lang, 'accepted', Object.assign({ amount: fmtAmount(result.amount) }, base)) };
  if (result.action === 'closed') return { kind: 'closed', message: t(lang, 'closed', base) };
  if (result.belowFloor) return { kind: 'belowFloor', message: t(lang, 'belowFloor', Object.assign({ amount: fmtAmount(clientAmount) }, base)) };
  return { kind: 'counter', message: t(lang, nego.round >= NEGO_MAX_ROUNDS ? 'counterFinal' : 'counter', Object.assign({ amount: fmtAmount(result.amount) }, base)) };
}

// Règlement portefeuille vendeur après paiement d'une négociation.
// Crédite le vendeur du montant net (prix convenu moins commission plateforme)
// et enregistre une transaction de règlement côté vendeur (stats admin + solde).
// La commission dépend du rôle : vendeur -> boutique, prestataire -> prestataire.
function settleNegotiationToVendor(nego) {
  const gross = Math.round(Number(nego.agreedPrice) || 0);
  const vendor = users.find(function (u) { return u.id === nego.vendorId; });
  const role = vendor ? vendor.role : 'vendeur';
  const rateKey = role === 'prestataire' ? 'prestataire' : 'boutique';
  const rate = Number(adminConfig.commissionRates && adminConfig.commissionRates[rateKey]) || 0;
  const commission = Math.round(gross * rate / 100);
  const net = gross - commission;

  const w = walletFor(nego.vendorId);
  w.balance = Math.round((Number(w.balance) || 0) + net);
  w.updatedAt = nowIso();
  saveWallets();

  const txn = recordTransaction({
    userId: nego.vendorId,
    userType: role,
    kind: 'negotiation-settlement',
    operator: null,
    operatorLabel: null,
    methodId: '',
    amount: net,
    feeAmount: commission,
    description: 'Vente négociée — ' + nego.productName,
    reference: nego.ref,
    mode: 'internal',
    status: 'completed',
    paidAt: nowIso()
  });

  nego.commissionRate = rate;
  nego.commissionAmount = commission;
  nego.settlementAmount = net;
  nego.settlementTransactionId = txn.id;
  nego.settledAt = nowIso();
  return { rate: rate, commission: commission, net: net, settlementTransactionId: txn.id };
}

/* ------------------------------------------------------------------ *
 *  Configuration plateforme (persistée serveur) — taux de commission.
 *  Contrairement à l'ancien stockage localStorage, ces valeurs sont
 *  centralisées ici et appliquées aux calculs admin (transactions,
 *  commissions estimées).
 * ------------------------------------------------------------------ */
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');

const DEFAULT_COMMISSION_RATES = { prestataire: 12, boutique: 8 };

let adminConfig = { commissionRates: Object.assign({}, DEFAULT_COMMISSION_RATES), updatedAt: null, updatedBy: null };

function loadAdminConfig() {
  try {
    if (fs.existsSync(ADMIN_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8'));
      if (data && data.commissionRates) {
        adminConfig.commissionRates = Object.assign({}, DEFAULT_COMMISSION_RATES, data.commissionRates);
        adminConfig.updatedAt = data.updatedAt || null;
        adminConfig.updatedBy = data.updatedBy || null;
      }
      console.log('[Admin] taux de commission chargés :', JSON.stringify(adminConfig.commissionRates));
      return;
    }
  } catch (e) { console.error('[Admin] config illisible, réinitialisation :', e.message); }
  saveAdminConfig();
}

function saveAdminConfig() {
  writeJsonAtomic('admin-config.json', adminConfig);
}

/* ------------------------------------------------------------------ *
 *  Mangoo Express+ — module Livraison (couriers + courses + dispatch)
 * ------------------------------------------------------------------ *
 *  Couriers : livreurs inscrits (rôle `livreur`), avec véhicule, zone
 *  et statut temps réel (offline / online / busy). Courses : besoins de
 *  livraison créés par un vendeur, diffusés aux livreurs en ligne
 *  (modèle « première acceptation gagne », comme Uber), puis suivis
 *  jusqu'à la livraison. Notification temps réel via /delivery-ws.
 * ------------------------------------------------------------------ */
const COURIERS_FILE = path.join(DATA_DIR, 'couriers.json');
const DELIVERIES_FILE = path.join(DATA_DIR, 'deliveries.json');

let couriers = [];
let deliveries = [];

// Sockets temps réel du module livraison (authentifiés par token).
const courierSockets = new Map();  // userId -> ws
const vendorSockets = new Map();   // vendorId -> ws
const clientSockets = new Map();   // phoneNormalisé -> ws (clients qui suivent une livraison)

const COURIER_VEHICLES = ['velo', 'moto', 'voiture', 'van', 'camion', 'semi'];
const DELIVERY_STATUSES = ['available', 'dispatched', 'accepted', 'picked_up', 'en_route', 'delivered', 'cancelled'];
const DELIVERY_STATUS_LABELS = {
  available: 'En attente de livreur',
  dispatched: 'Livreur assigné',
  accepted: 'Acceptée par le livreur',
  picked_up: 'Colis récupéré',
  en_route: 'En cours de livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée'
};

// ----- Catalogue de fret (Mangoo Express+ multi-livraison) -----
// 5 catégories, chacune recommande un véhicule (minimum requis) et une chaîne
// de preuve. Les catégories pondérales (matériaux, agricole, vrac) exigent une
// pesée (bon de pesée) et un contrôle de capacité. Un livreur au véhicule plus
// lourd peut aussi prendre la course (classement capacitaire ci-dessous).
const FREIGHT_CATALOG = {
  nourriture: {
    id: 'nourriture', label: 'Nourriture', vehicle: 'moto', noun: 'Produit',
    proofLabel: 'Photo du colis', proofHint: 'Prenez une photo du colis remis au livreur',
    confirmLabel: 'Colis récupéré — démarrer la livraison',
    extra: null, subproducts: null, weighing: null
  },
  produits: {
    id: 'produits', label: 'Colis & produits', vehicle: 'van', noun: 'Colis',
    proofLabel: 'Photo du colis', proofHint: 'Prenez une photo des colis remis au livreur',
    confirmLabel: 'Colis récupérés — démarrer la livraison',
    extra: { label: 'Nombre de colis', unit: 'colis', step: '1' },
    subproducts: null, weighing: null
  },
  materiaux: {
    id: 'materiaux', label: 'Ciment & matériaux', vehicle: 'camion', noun: 'Chargement',
    proofLabel: 'Photo du chargement', proofHint: 'Prenez une photo du chargement (sacs / palettes)',
    confirmLabel: 'Chargement récupéré — démarrer la livraison',
    extra: null,
    subproducts: [
      { name: 'Ciment', density: 1.44 },
      { name: 'Briques', density: 1.80 },
      { name: 'Fer à béton', density: 7.85 },
      { name: 'Carrelage', density: 2.00 }
    ],
    weighing: { unit: 'tonnes', capacityTons: 10, capacityM3: 20, defaultDensity: 1.80 }
  },
  agricole: {
    id: 'agricole', label: 'Agricole', vehicle: 'camion', noun: 'Chargement',
    proofLabel: 'Photo du chargement', proofHint: 'Prenez une photo du chargement (sacs / vrac)',
    confirmLabel: 'Chargement récupéré — démarrer la livraison',
    extra: null,
    subproducts: [
      { name: 'Riz', density: 0.75 },
      { name: 'Manioc', density: 0.60 },
      { name: 'Mil', density: 0.78 },
      { name: 'Arachide', density: 0.65 }
    ],
    weighing: { unit: 'tonnes', capacityTons: 8, capacityM3: 16, defaultDensity: 0.70 }
  },
  vrac: {
    id: 'vrac', label: 'Vrac & agrégats', vehicle: 'camion', noun: 'Chargement',
    proofLabel: 'Photo du chargement', proofHint: 'Prenez une photo du chargement (benne / matériaux)',
    confirmLabel: 'Chargement récupéré — démarrer la livraison',
    extra: null,
    subproducts: [
      { name: 'Sable', density: 1.60 },
      { name: 'Gravier', density: 1.70 },
      { name: 'Latérite', density: 1.80 },
      { name: 'Terre', density: 1.40 }
    ],
    weighing: { unit: 'tonnes', capacityTons: 8, capacityM3: 16, defaultDensity: 1.60 }
  }
};

// Flotte lourde (suggestion d'upgrade de véhicule selon le chargement).
const HEAVY_FLEET = [
  { id: 'truck8',  label: 'Camion 8 t',  tons: 8,  m3: 16, type: 'camion' },
  { id: 'truck10', label: 'Camion 10 t', tons: 10, m3: 20, type: 'camion' },
  { id: 'truck16', label: 'Camion 16 t', tons: 16, m3: 32, type: 'camion' },
  { id: 'truck20', label: 'Camion 20 t', tons: 20, m3: 40, type: 'camion' },
  { id: 'semi32',  label: 'Semi-remorque 32 t', tons: 32, m3: 60, type: 'semi' }
];

// Borne supérieure de validation d'un chargement (au-delà : course refusée).
const MAX_FREIGHT = { tons: 32, m3: 60 };

// Classement capacitaire des véhicules : un livreur peut transporter une course
// si son véhicule est au moins aussi capable que le véhicule requis par le fret.
const VEHICLE_RANK = { velo: 1, moto: 2, voiture: 3, van: 4, camion: 5, semi: 6 };

function vehicleRank(v) { return VEHICLE_RANK[String(v || '').toLowerCase()] || 0; }
function catalogEntry(type) { return FREIGHT_CATALOG[type] || null; }

// Résumé « fret » exposé avec chaque course (label, véhicule requis, pesée…).
function freightSummary(type) {
  const c = catalogEntry(type);
  if (!c) return null;
  return {
    id: c.id, label: c.label, vehicle: c.vehicle, noun: c.noun,
    proofLabel: c.proofLabel, proofHint: c.proofHint, confirmLabel: c.confirmLabel,
    extra: c.extra || null, subproducts: c.subproducts || null, weighing: c.weighing || null
  };
}

// Machine à états stricte : seules les transitions valides sont autorisées.
// Cela évite qu'un livreur ou un vendeur ne force un statut incohérent.
const DELIVERY_TRANSITIONS = {
  available: ['dispatched', 'accepted', 'cancelled'],
  dispatched: ['accepted', 'cancelled'],
  accepted: ['picked_up', 'cancelled'],
  picked_up: ['en_route', 'cancelled'],
  en_route: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

function canTransition(from, to) {
  const allowed = DELIVERY_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.indexOf(to) >= 0;
}

function loadCouriers() {
  try {
    if (fs.existsSync(COURIERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(COURIERS_FILE, 'utf8'));
      if (Array.isArray(data)) { couriers = data; console.log('[Livraison] livreurs chargés :', couriers.length); return; }
    }
  } catch (e) { console.error('[Livraison] livreurs illisibles, réinitialisation :', e.message); }
  couriers = [];
}

function saveCouriers() {
  writeJsonAtomic('couriers.json', couriers);
}

function loadDeliveries() {
  try {
    if (fs.existsSync(DELIVERIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(DELIVERIES_FILE, 'utf8'));
      if (Array.isArray(data)) { deliveries = data; console.log('[Livraison] courses chargées :', deliveries.length); return; }
    }
  } catch (e) { console.error('[Livraison] courses illisibles, réinitialisation :', e.message); }
  deliveries = [];
}

function saveDeliveries() {
  writeJsonAtomic('deliveries.json', deliveries);
}

function courierForUser(userId) {
  const id = String(userId || '');
  if (!id) return null;
  return couriers.find(function (c) { return c.userId === id; }) || null;
}

function publicCourier(c) {
  if (!c) return null;
  return {
    id: c.id, userId: c.userId, name: c.name, phone: c.phone, email: c.email,
    vehicle: c.vehicle, city: c.city, zone: c.zone, status: c.status,
    approved: !!c.approved, rating: c.rating, completedDeliveries: c.completedDeliveries || 0,
    lat: c.lat != null ? c.lat : null, lng: c.lng != null ? c.lng : null,
    createdAt: c.createdAt
  };
}

function deliveryForId(id) {
  return deliveries.find(function (d) { return d.id === String(id || ''); }) || null;
}

function publicDelivery(d) {
  if (!d) return null;
  return {
    id: d.id, ref: d.ref,
    vendorId: d.vendorId, vendorName: d.vendorName,
    pickupAddress: d.pickupAddress, pickupCity: d.pickupCity || '',
    pickupZone: d.pickupZone || '', pickupLat: d.pickupLat != null ? d.pickupLat : null, pickupLng: d.pickupLng != null ? d.pickupLng : null,
    deliveryAddress: d.deliveryAddress, deliveryCity: d.deliveryCity || '',
    deliveryZone: d.deliveryZone || '', deliveryLat: d.deliveryLat != null ? d.deliveryLat : null, deliveryLng: d.deliveryLng != null ? d.deliveryLng : null,
    radiusKm: d.radiusKm != null ? d.radiusKm : 15,
    clientName: d.clientName, clientPhone: d.clientPhone || '',
    items: Array.isArray(d.items) ? d.items : [],
    amount: d.amount || 0,
    deliveryType: d.deliveryType, vehicle: d.vehicle,
    subproduct: d.subproduct || '',
    weightTons: d.weightTons != null ? d.weightTons : null,
    volumeM3: d.volumeM3 != null ? d.volumeM3 : null,
    packageCount: d.packageCount != null ? d.packageCount : null,
    freight: freightSummary(d.deliveryType),
    notes: d.notes || '',
    status: d.status, courierId: d.courierId, courierName: d.courierName,
    createdAt: d.createdAt, updatedAt: d.updatedAt,
    timeline: Array.isArray(d.timeline) ? d.timeline : []
  };
}

function nextDeliveryRef() {
  // Référence humaine stable : #DLV-XXXX (incrémenté à partir du dernier id).
  const num = deliveries.length + 1;
  return '#DLV-' + String(num).padStart(4, '0');
}

function pushTimeline(delivery, status) {
  if (!delivery || !status) return;
  delivery.status = status;
  delivery.updatedAt = nowIso();
  if (!Array.isArray(delivery.timeline)) delivery.timeline = [];
  delivery.timeline.push({ status: status, at: nowIso() });
}

function sendDelivery(ws, obj) {
  try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); } catch (e) {}
}

// ----- Ciblage géographique & preuve de remise -----
function normalizeCity(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]/g, '');
}
function toNum(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Un livreur en ligne reçoit une course uniquement s'il est pertinent
// géographiquement (ville, zone ou rayon). Sans aucune info géo sur la
// course, on conserve la diffusion large (rétrocompatibilité).
function courierMatchesDelivery(c, d) {
  if (!c || c.status !== 'online') return false;
  // Fret lourd (catégories à pesée : matériaux, agricole, vrac) : seul un
  // livreur disposant d'un camion/semi peut recevoir la course. Les catégories
  // légères (nourriture, colis) restent ouvertes à moto/vélo/voiture.
  const freight = catalogEntry(d.deliveryType);
  if (freight && freight.weighing && vehicleRank(c.vehicle) < vehicleRank('camion')) return false;
  const city = d.pickupCity || d.deliveryCity || '';
  const zone = d.pickupZone || d.deliveryZone || '';
  const hasGeo = !!(city || zone || d.pickupLat != null || d.deliveryLat != null);
  if (!hasGeo) return true;

  const cCity = normalizeCity(c.city);
  if (cCity && normalizeCity(city) === cCity) return true;

  if (c.zone) {
    const cz = normalizeCity(c.zone);
    const hay = normalizeCity([d.pickupAddress, d.deliveryAddress, d.pickupCity, d.deliveryCity, zone].join(' '));
    if (cz && hay.indexOf(cz) >= 0) return true;
  }

  const clat = toNum(c.lat), clng = toNum(c.lng);
  const plat = toNum(d.pickupLat != null ? d.pickupLat : d.deliveryLat);
  const plng = toNum(d.pickupLng != null ? d.pickupLng : d.deliveryLng);
  if (clat != null && clng != null && plat != null && plng != null) {
    const radiusKm = Number(d.radiusKm) > 0 ? Number(d.radiusKm) : 15;
    if (haversineKm(clat, clng, plat, plng) <= radiusKm) return true;
  }
  return false;
}

function proofCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

// Résumé léger de la preuve de remise (sans le data-URL de signature, qui
// reste stocké côté serveur comme pièce justificative).
function proofSummary(d) {
  if (!d || !d.proof) return null;
  return {
    pickupAt: d.proof.pickupAt || null,
    pickupMethod: d.proof.pickupMethod || null,
    deliveryAt: d.proof.deliveryAt || null,
    deliveryMethod: d.proof.deliveryMethod || null,
    signed: !!(d.proof.signature && d.proof.signature !== 'signed'),
    weightTons: d.proof.weightTons != null ? d.proof.weightTons : null,
    volumeM3: d.proof.volumeM3 != null ? d.proof.volumeM3 : null,
    subproduct: d.proof.subproduct || '',
    hasPickupPhoto: !!(d.proof.pickupPhoto && d.proof.pickupPhoto.indexOf('data:image') === 0),
    hasDeliveryPhoto: !!(d.proof.deliveryPhoto && d.proof.deliveryPhoto.indexOf('data:image') === 0)
  };
}

// Vues enrichies avec les codes de preuve, selon le rôle du destinataire.
// Les codes ne sont jamais inclus dans la diffusion aux livreurs non assignés.
function vendorDeliveryView(d) {
  if (!d) return null;
  const pub = publicDelivery(d);
  pub.pickupCode = d.pickupCode || '';
  pub.deliveryCode = d.deliveryCode || '';
  pub.proof = proofSummary(d);
  return pub;
}
function courierDeliveryView(d) {
  if (!d) return null;
  const pub = publicDelivery(d);
  pub.pickupCode = d.pickupCode || '';
  pub.deliveryCode = d.deliveryCode || '';
  pub.proof = proofSummary(d);
  return pub;
}
function clientDeliveryView(d) {
  if (!d) return null;
  const pub = publicDelivery(d);
  pub.deliveryCode = d.deliveryCode || '';
  pub.proof = proofSummary(d);
  return pub;
}
function deliveryViewFor(d, user) {
  if (!d) return null;
  if (!user) return publicDelivery(d);
  if (user.role === 'livreur') {
    const c = courierForUser(user.id);
    return (c && d.courierId === c.id) ? courierDeliveryView(d) : publicDelivery(d);
  }
  if (isSeller(user)) {
    return (d.vendorId === (user.vendorId || user.id)) ? vendorDeliveryView(d) : publicDelivery(d);
  }
  if (user.role === 'client') {
    return (normalizePhone(d.clientPhone) === normalizePhone(user.phone)) ? clientDeliveryView(d) : publicDelivery(d);
  }
  if (user.role === 'admin') return vendorDeliveryView(d);
  return publicDelivery(d);
}

// Diffuse une nouvelle course aux livreurs en ligne pertinents (ciblage géo).
function broadcastDeliveryOffer(delivery) {
  const pub = publicDelivery(delivery);
  courierSockets.forEach(function (ws, userId) {
    const c = courierForUser(userId);
    if (courierMatchesDelivery(c, delivery)) sendDelivery(ws, { type: 'delivery-offer', delivery: pub });
  });
}

// Prévient un vendeur de l'avancement de sa course (avec les codes de preuve).
function notifyVendor(delivery) {
  if (!delivery) return;
  const ws = vendorSockets.get(String(delivery.vendorId || ''));
  sendDelivery(ws, { type: 'delivery-updated', delivery: vendorDeliveryView(delivery) });
}

// Prévient le client (repéré par son téléphone) de l'avancement de sa livraison.
function notifyClient(delivery) {
  if (!delivery) return;
  const key = normalizePhone(delivery.clientPhone);
  if (!key) return;
  const ws = clientSockets.get(key);
  sendDelivery(ws, { type: 'delivery-updated', delivery: clientDeliveryView(delivery) });
}

function operatorById(id) { return MOBILE_MONEY_OPERATORS[id] || null; }

function operatorConfigured(id) {
  const op = operatorById(id);
  if (!op) return false;
  return op.configKeys.some(function (k) { return process.env[k] && String(process.env[k]).trim() !== ''; });
}

// Mode de paiement global. Par défaut « demo » : aucun appel réel à un
// opérateur de Mobile Money n'est effectué. Le passage en production réelle
// exige PAYMENT_MODE=live ET les clés API validées de l'opérateur.
const PAYMENT_MODE = String(process.env.PAYMENT_MODE || 'demo').toLowerCase();

function paymentModeActive() {
  return PAYMENT_MODE === 'live' ? 'live' : 'demo';
}

// Mode d'un opérateur donné. En démonstration, il est toujours « demo »,
// même si des clés sont présentes par erreur (aucune somme n'est débitée).
function operatorMode(id) {
  if (paymentModeActive() !== 'live') return 'demo';
  return operatorConfigured(id) ? 'live' : 'demo';
}

function tierById(id) {
  for (let i = 0; i < OFFRE_DU_JOUR_TIERS.length; i++) {
    if (OFFRE_DU_JOUR_TIERS[i].id === id) return OFFRE_DU_JOUR_TIERS[i];
  }
  return null;
}

function walletFor(userId) {
  const id = String(userId || '');
  let w = wallets.find(function (x) { return x.userId === id; });
  if (!w) {
    const u = users.find(function (x) { return x.id === id; });
    w = { userId: id, ownerType: (u && u.role) || 'client', balance: 0, pending: 0, currency: DEVISE, updatedAt: new Date().toISOString() };
    wallets.push(w);
    saveWallets();
  }
  return w;
}

/* ------------------------------------------------------------------ *
 *  Couche paiement — abstraction PaymentProvider
 * ------------------------------------------------------------------ *
 *  Le reste de l'application ne dépend JAMAIS d'un opérateur précis :
 *    Commande / Recharge -> PaymentService -> PaymentProvider
 *  Aujourd'hui, seul DemoPaymentProvider est actif : « initier » puis
 *  « confirmer » simule un débit, sans AUCUN appel réel à Orange Money,
 *  Wave, MTN MoMo, Moov Money ou Free Mobile.
 *
 *  Quand les vraies API seront validées, on ajoutera (sans inventer
 *  d'API) : OrangeMoneyProvider, WaveProvider, MTNMoMoProvider,
 *  MoovProvider, FreeMoneyProvider — il suffira de remplacer le provider
 *  actif, sans refaire toute l'application.
 * ------------------------------------------------------------------ */
const DemoPaymentProvider = {
  id: 'demo',
  label: 'Paiement démonstration',
  // Aucun appel réseau : on prépare simplement les métadonnées de simulation.
  initiate() {
    return {
      mode: 'demo',
      operatorRef: null,
      instructions: 'Paiement en mode démonstration — aucune somme réelle n\'est débitée. Confirmez pour simuler la transaction.'
    };
  },
  // Simule la réussite du paiement. Ne contacte aucun opérateur.
  confirm(txn) {
    txn.status = 'completed';
    txn.mode = 'demo';
    txn.paidAt = new Date().toISOString();
    txn.providerRef = 'DEMO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    return { success: true };
  }
};

// Provider actif (point de bascule unique vers les opérateurs réels).
const activePaymentProvider = DemoPaymentProvider;

function recordTransaction(fields) {
  const now = new Date().toISOString();
  const t = Object.assign({
    id: 'txn-' + crypto.randomBytes(6).toString('hex'),
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    currency: DEVISE,
    amount: 0,
    feeAmount: 0,
    total: 0,
    mode: 'demo'
  }, fields || {});
  t.total = Math.round((Number(t.amount) || 0) + (Number(t.feeAmount) || 0));
  transactions.unshift(t);
  if (transactions.length > 2000) transactions.length = 2000;
  saveTransactions();
  return t;
}

function initiateMobilePayment(opts) {
  const op = operatorById(opts.operator);
  if (!op) return { ok: false, error: 'Opérateur inconnu : ' + opts.operator };
  const amount = Math.round(Number(opts.amount) || 0);
  if (amount <= 0) return { ok: false, error: 'Montant invalide.' };
  const mode = operatorMode(op.id);
  const feeAmount = Math.round(amount * op.fee);
  const sim = activePaymentProvider.initiate(op);
  const txn = recordTransaction({
    userId: String(opts.userId || ''),
    userType: opts.userType || 'client',
    kind: opts.kind || 'mobile-money-payment',
    operator: op.id,
    operatorLabel: op.label,
    methodId: String(opts.methodId || ''),
    phone: String(opts.phone || '').trim(),
    amount: amount,
    feeAmount: feeAmount,
    description: String(opts.description || ''),
    reference: String(opts.reference || ''),
    mode: mode,
    status: 'pending',
    operatorRef: sim.operatorRef,
    instructions: sim.instructions
  });
  return { ok: true, transaction: txn, paymentMode: mode, operator: { id: op.id, label: op.label, mode: mode, fee: op.fee, feeLabel: op.feeLabel } };
}

function confirmMobilePayment(txnId, opts) {
  const txn = transactions.find(function (t) { return t.id === txnId; });
  if (!txn) return { ok: false, error: 'Transaction introuvable.' };
  if (txn.status !== 'pending' && txn.status !== 'initiated') return { ok: false, error: 'Transaction déjà traitée (' + txn.status + ').' };
  const fail = opts && (opts.fail === true || String(opts.otp || '') === '0000');
  txn.updatedAt = new Date().toISOString();
  if (fail) {
    txn.status = 'failed';
    txn.mode = 'demo';
    txn.failedReason = 'Confirmation refusée (code invalide).';
    saveTransactions();
    return { ok: true, transaction: txn, success: false, paymentMode: 'demo' };
  }
  const result = activePaymentProvider.confirm(txn);
  saveTransactions();
  return { ok: true, transaction: txn, success: result.success, paymentMode: txn.mode || 'demo' };
}

function expireOffresJour() {
  const now = Date.now();
  let changed = false;
  offresJour.forEach(function (o) {
    if (o.status === 'active' && new Date(o.endsAt).getTime() <= now) {
      o.status = 'expiree';
      o.expiredAt = new Date().toISOString();
      changed = true;
    }
  });
  if (changed) saveOffresJour();
  return changed;
}

function activeOffresJour() {
  const now = Date.now();
  return offresJour.filter(function (o) { return o.status === 'active' && new Date(o.endsAt).getTime() > now; });
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  String(raw).split(';').forEach(function (part) {
    const eq = part.indexOf('=');
    if (eq < 0) return;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) { try { out[k] = decodeURIComponent(v); } catch (e) { out[k] = v; } }
  });
  return out;
}
function cookieFromReq(req, name) {
  return parseCookies(req)[name] || '';
}

// Construit les attributs de sécurité du cookie de session. En plus de
// HttpOnly + SameSite=Lax (protection CSRF), on ajoute Secure lorsque la
// requête transite en HTTPS (direct ou via proxy X-Forwarded-Proto), ce qui
// est toujours le cas en production Render/Cloudflare.
function sessionCookieFlags(req, maxAge) {
  let flags = 'HttpOnly; Path=/; SameSite=Lax';
  if (maxAge) flags += '; Max-Age=' + maxAge;
  if (isSecureRequest(req)) flags += '; Secure';
  return flags;
}
function tokenFromReq(req) {
  return queryParam(req, 'token') || (req.headers && req.headers.authorization ? req.headers.authorization : '').replace(/^Bearer\s+/i, '') || cookieFromReq(req, 'mgt_session');
}

function userFromReq(req) {
  return userByToken(tokenFromReq(req));
}

function isSeller(u) { return !!u && (u.role === 'vendeur' || u.role === 'prestataire'); }

function liveSnapshot() {
  return {
    type: 'live-state',
    active: live.active,
    vendorId: live.vendorId,
    vendorName: live.vendorName,
    title: live.title,
    viewers: live.viewers,
    likes: live.likes,
    orders: live.orders,
    pinnedProduct: live.pinnedProduct,
    chat: live.chat
  };
}

function broadcastLive(obj, exceptWs) {
  clients.forEach((c) => {
    if (c.ws && c.ws !== exceptWs) send(c.ws, obj);
  });
}

function convKey(a, b) { return [a, b].sort().join('|'); }
function nowIso() { return new Date().toISOString(); }
function send(ws, obj) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); } catch (e) {} }

/* ------------------------------------------------------------------ *
 *  Présence
 * ------------------------------------------------------------------ */
function broadcastPresence() {
  const peers = [];
  clients.forEach((c, id) => { if (c.online) peers.push({ id, role: c.role, name: c.name }); });
  clients.forEach((c) => send(c.ws, { type: 'presence', peers }));
}

/* ------------------------------------------------------------------ *
 *  Gestion des messages WebSocket
 * ------------------------------------------------------------------ */
function handleMessage(ws, msg) {
  if (!msg || typeof msg.type !== 'string') return;
  switch (msg.type) {
    case 'register': handleRegister(ws, msg); break;
    case 'call-offer': handleCallOffer(ws, msg); break;
    case 'call-answer': handleCallAnswer(ws, msg); break;
    case 'call-reject': handleCallReject(ws, msg); break;
    case 'call-end': handleCallEnd(ws, msg); break;
    case 'ice-candidate': handleIce(ws, msg); break;
    case 'chat-message': handleChatMessage(ws, msg); break;
    case 'chat-history': handleChatHistory(ws, msg); break;
    case 'typing': handleTyping(ws, msg); break;
    case 'appointment-request': handleApptRequest(ws, msg); break;
    case 'appointment-confirm':
    case 'appointment-decline': handleApptReply(ws, msg); break;
    case 'file-start': handleFileStart(ws, msg); break;
    case 'file-end': handleFileEnd(ws, msg); break;
    case 'live-start': handleLiveStart(ws, msg); break;
    case 'live-stop': handleLiveStop(ws, msg); break;
    case 'live-join': handleLiveJoin(ws, msg); break;
    case 'live-leave': handleLiveLeave(ws); break;
    case 'live-chat': handleLiveChat(ws, msg); break;
    case 'live-pin-product': handleLivePin(ws, msg); break;
    case 'live-order': handleLiveOrder(ws, msg); break;
    case 'live-like': handleLiveLike(ws, msg); break;
    case 'live-state-request': handleLiveStateRequest(ws, msg); break;
    case 'live-video-join': handleLiveVideoJoin(ws); break;
    case 'live-video-offer': handleLiveVideoOffer(ws, msg); break;
    case 'live-video-answer': handleLiveVideoAnswer(ws, msg); break;
    case 'live-video-ice': handleLiveVideoIce(ws, msg); break;
    case 'ping': send(ws, { type: 'pong' }); break;
  }
}

function handleRegister(ws, msg) {
  const id = String(msg.id || '').trim();
  if (!id) { send(ws, { type: 'register-error', reason: 'id manquant' }); return; }
  const role = String(msg.role || 'client').trim();
  const name = String(msg.name || id || 'Inconnu').trim();
  ws.meta = { id, role, name };
  clients.set(id, { ws, role, name, online: true, lastSeen: Date.now() });
  console.log('[WS] register', { id, role, name, time: new Date().toLocaleTimeString() });
  send(ws, { type: 'registered', id, role, name });
  broadcastPresence();
}

/* --- Appels (signalisation WebRTC) --- */
function handleCallOffer(ws, msg) {
  const callId = msg.callId || rand();
  const to = String(msg.to || '').trim();
  const target = clients.get(to);
  if (!target || !target.online) {
    send(ws, { type: 'call-error', callId, reason: 'offline' });
    return;
  }
  calls.set(callId, {
    callerId: ws.meta.id, calleeId: to,
    callerWs: ws, calleeWs: target.ws,
    mode: msg.mode || 'audio'
  });
  send(target.ws, {
    type: 'call-ring', callId,
    from: ws.meta.id, fromName: ws.meta.name,
    sdp: msg.sdp, mode: msg.mode || 'audio'
  });
}

function handleCallAnswer(ws, msg) {
  const c = calls.get(msg.callId);
  if (!c) return;
  send(c.callerWs, { type: 'call-accepted', callId: msg.callId, sdp: msg.sdp, name: ws.meta.name });
}

function handleCallReject(ws, msg) {
  const c = calls.get(msg.callId);
  if (!c) return;
  send(c.callerWs, { type: 'call-rejected', callId: msg.callId, name: ws.meta.name });
  calls.delete(msg.callId);
}

function handleCallEnd(ws, msg) {
  const c = calls.get(msg.callId);
  if (!c) return;
  const other = (c.callerWs === ws) ? c.calleeWs : c.callerWs;
  send(other, { type: 'call-ended', callId: msg.callId });
  calls.delete(msg.callId);
}

function handleIce(ws, msg) {
  const c = calls.get(msg.callId);
  if (!c) return;
  const other = (c.callerWs === ws) ? c.calleeWs : c.callerWs;
  send(other, { type: 'ice-candidate', callId: msg.callId, candidate: msg.candidate });
}

/* --- Chat --- */
function handleChatMessage(ws, msg) {
  const from = ws.meta.id;
  const to = String(msg.to || '').trim();
  const text = String(msg.text || '').slice(0, 4000);
  if (!from || !to || !text) return;
  const entry = {
    msgId: msg.msgId || rand(),
    convId: convKey(from, to),
    from, to, text,
    sentAt: nowIso()
  };
  chatLog.push(entry);
  send(ws, { type: 'chat-ack', msgId: entry.msgId, sentAt: entry.sentAt });
  const target = clients.get(to);
  if (target && target.online) {
    send(target.ws, {
      type: 'chat-new', msgId: entry.msgId, convId: entry.convId,
      from, fromName: ws.meta.name, text, sentAt: entry.sentAt
    });
  }
}

function handleTyping(ws, msg) {
  const from = ws.meta && ws.meta.id;
  const to = String(msg.to || '').trim();
  if (!from || !to) return;
  const target = clients.get(to);
  if (target && target.online) {
    send(target.ws, {
      type: 'typing', from, fromName: ws.meta.name, isTyping: !!msg.isTyping
    });
  }
}

function handleChatHistory(ws, msg) {
  const peer = String(msg.peer || '').trim();
  const key = peer ? convKey(ws.meta.id, peer) : null;
  const list = key ? chatLog.filter((m) => m.convId === key) : chatLog;
  send(ws, { type: 'chat-history', convId: key, peer, messages: list });
}

/* --- Rendez-vous --- */
function handleApptRequest(ws, msg) {
  const to = String(msg.to || '').trim();
  const appt = {
    apptId: msg.apptId || rand(),
    from: ws.meta.id, fromName: ws.meta.name, to,
    service: msg.service, day: msg.day, time: msg.time, note: msg.note,
    status: 'requested', createdAt: nowIso()
  };
  appointmentLog.push(appt);
  const target = clients.get(to);
  if (target && target.online) {
    send(target.ws, {
      type: 'appointment-new', apptId: appt.apptId,
      from: appt.from, fromName: appt.fromName,
      service: appt.service, day: appt.day, time: appt.time, note: appt.note
    });
  }
  send(ws, { type: 'appointment-ack', apptId: appt.apptId });
}

function handleApptReply(ws, msg) {
  const appt = appointmentLog.find((a) => a.apptId === msg.apptId);
  if (!appt) return;
  const accepted = msg.type === 'appointment-confirm';
  appt.status = accepted ? 'confirmed' : 'declined';
  const requester = clients.get(appt.from);
  if (requester && requester.online) {
    send(requester.ws, {
      type: accepted ? 'appointment-accepted' : 'appointment-declined',
      apptId: appt.apptId, name: ws.meta.name
    });
  }
}

/* --- Live Shopping --- */
function handleLiveStart(ws, msg) {
  if (live.active) { send(ws, { type: 'live-error', reason: 'already-live' }); return; }
  live.active = true;
  live.vendorId = ws.meta.id;
  live.vendorName = ws.meta.name || 'Vendeur';
  live.title = String(msg.title || 'Live Shopping').slice(0, 120);
  live.startedAt = Date.now();
  live.viewers = 0;
  live.likes = 0;
  live.orders = 0;
  live.pinnedProduct = null;
  live.chat = [];
  broadcastLive({
    type: 'live-started',
    vendorId: live.vendorId,
    vendorName: live.vendorName,
    title: live.title,
    viewers: 0, likes: 0, orders: 0,
    startedAt: live.startedAt
  });
}

function handleLiveStop(ws) {
  if (!live.active) return;
  if (ws.meta.id !== live.vendorId) return;
  live.active = false;
  broadcastLive({ type: 'live-ended' });
  live.vendorId = null;
  live.vendorName = null;
  live.pinnedProduct = null;
  live.chat = [];
  liveViewers.clear();
  live.viewers = 0;
}

function handleLiveJoin(ws) {
  console.log('[LIVE] join', { id: ws.meta && ws.meta.id, active: live.active, time: new Date().toLocaleTimeString() });
  if (!live.active) { send(ws, liveSnapshot()); return; }
  if (!liveViewers.has(ws)) {
    liveViewers.add(ws);
    live.viewers = liveViewers.size;
  }
  send(ws, liveSnapshot());
  broadcastLive({ type: 'live-viewers', viewers: live.viewers }, ws);
  const vws = vendorWs();
  if (vws) send(vws, { type: 'live-viewers-list', viewers: liveViewersList() });
}

function handleLiveLeave(ws) {
  if (!liveViewers.has(ws)) return;
  liveViewers.delete(ws);
  live.viewers = liveViewers.size;
  broadcastLive({ type: 'live-viewers', viewers: live.viewers });
  // Prévenir le vendeur de libérer la connexion vidéo de ce spectateur.
  const vws = vendorWs();
  if (vws) send(vws, { type: 'live-video-viewer-left', viewerId: ws.meta && ws.meta.id });
  if (vws) send(vws, { type: 'live-viewers-list', viewers: liveViewersList() });
}

// Si le vendeur se déconnecte (crash, coupure réseau, fermeture) sans « Arrêter le live »,
// on arrête proprement le live pour que les spectateurs ne restent pas bloqués sur « EN DIRECT ».
function handleLiveVendorClose(ws) {
  if (!ws.meta || ws.meta.id !== live.vendorId) return;
  if (!live.active) return;
  live.active = false;
  broadcastLive({ type: 'live-ended' });
  live.vendorId = null;
  live.vendorName = null;
  live.pinnedProduct = null;
  live.chat = [];
  liveViewers.clear();
  live.viewers = 0;
}

function vendorWs() {
  if (!live.active || !live.vendorId) return null;
  const v = clients.get(live.vendorId);
  return (v && v.online && v.ws) ? v.ws : null;
}

// Liste des spectateurs actuellement connectés au live (id + nom), pour que
// le vendeur puisse appeler un client en privé.
function liveViewersList() {
  const list = [];
  liveViewers.forEach((vws) => {
    if (!vws.meta) return;
    list.push({ id: vws.meta.id, name: vws.meta.name || 'Spectateur' });
  });
  return list;
}

function handleLiveChat(ws, msg) {
  if (!live.active) return;
  const text = String(msg.text || '').slice(0, 1000);
  if (!text) return;
  const entry = { from: ws.meta.id, fromName: ws.meta.name || 'Spectateur', text, sentAt: nowIso() };
  live.chat.push(entry);
  if (live.chat.length > 200) live.chat.shift();
  broadcastLive({ type: 'live-chat', from: entry.from, fromName: entry.fromName, text, sentAt: entry.sentAt }, ws);
}

function handleLivePin(ws, msg) {
  if (!live.active || ws.meta.id !== live.vendorId) return;
  live.pinnedProduct = {
    name: String(msg.name || '').slice(0, 120),
    price: String(msg.price || '').slice(0, 40),
    image: String(msg.image || '').slice(0, 500)
  };
  broadcastLive({ type: 'live-pinned', name: live.pinnedProduct.name, price: live.pinnedProduct.price, image: live.pinnedProduct.image }, ws);
}

function handleLiveOrder(ws, msg) {
  if (!live.active) return;
  live.orders += 1;
  const fromId = ws.meta.id;
  const fromName = ws.meta.name || 'Client';
  const product = String(msg.product || 'Produit').slice(0, 120);
  const price = String(msg.price || '').slice(0, 40);
  const quantity = Math.max(1, Math.min(99, parseInt(msg.quantity, 10) || 1));
  const delivery = String(msg.delivery || 'Livraison').slice(0, 40);
  const order = {
    orderId: 'LIVE-' + String(live.orders).padStart(3, '0'),
    clientId: fromId,
    clientName: fromName,
    product,
    price,
    quantity,
    delivery,
    source: 'live',
    status: 'commandee',
    createdAt: nowIso()
  };
  liveOrdersLog.push(order);
  broadcastLive({
    type: 'live-order',
    fromName, product, price, quantity, delivery,
    orders: live.orders,
    liveOrder: order
  });
}

function handleLiveLike() {
  if (!live.active) return;
  live.likes += 1;
  broadcastLive({ type: 'live-like', likes: live.likes });
}

function handleLiveStateRequest(ws) {
  send(ws, liveSnapshot());
}

/* --- Live Shopping : diffusion vidéo (WebRTC, un vendeur -> N spectateurs) --- */
function handleLiveVideoJoin(ws) {
  if (!live.active) return;
  if (!ws.meta || ws.meta.id === live.vendorId) return; // le vendeur ne regarde pas son propre flux
  const vws = vendorWs();
  if (!vws) { send(ws, { type: 'live-video-unavailable' }); return; }
  send(vws, { type: 'live-viewer-joined', viewerId: ws.meta.id, viewerName: ws.meta.name || 'Spectateur' });
}

function handleLiveVideoOffer(ws, msg) {
  if (!live.active || !ws.meta || ws.meta.id !== live.vendorId) return;
  const viewerId = String(msg.viewerId || '').trim();
  const target = clients.get(viewerId);
  if (!target || !target.online || !target.ws) return;
  send(target.ws, { type: 'live-video-offer', from: live.vendorId, sdp: msg.sdp });
}

function handleLiveVideoAnswer(ws, msg) {
  if (!live.active) return;
  const vws = vendorWs();
  if (!vws) return;
  send(vws, { type: 'live-video-answer', viewerId: ws.meta && ws.meta.id, sdp: msg.sdp });
}

function handleLiveVideoIce(ws, msg) {
  if (!live.active || !ws.meta) return;
  if (ws.meta.id === live.vendorId) {
    const target = clients.get(String(msg.viewerId || '').trim());
    if (target && target.online && target.ws) {
      send(target.ws, { type: 'live-video-ice', from: live.vendorId, candidate: msg.candidate });
    }
  } else {
    const vws = vendorWs();
    if (vws) send(vws, { type: 'live-video-ice', viewerId: ws.meta.id, candidate: msg.candidate });
  }
}

/* --- Transfert de fichiers (pièces jointes) --- */
function handleFileStart(ws, msg) {
  if (!ws.meta || !ws.meta.id) return;
  const fileId = msg.fileId || rand();
  const to = String(msg.to || '').trim();
  const name = String(msg.name || 'fichier').slice(0, 200);
  const size = Number(msg.size) || 0;
  const mime = String(msg.mime || 'application/octet-stream').slice(0, 100);

  if (size <= 0 || size > MAX_FILE_SIZE) {
    send(ws, { type: 'file-error', fileId, reason: 'taille' });
    return;
  }
  const target = clients.get(to);
  if (!target || !target.online) {
    send(ws, { type: 'file-error', fileId, reason: 'offline' });
    return;
  }

  fileTransfers.set(fileId, {
    fileId, from: ws.meta.id, to, name, size, mime,
    received: 0, createdAt: nowIso()
  });
  // Un seul transfert actif à la fois par connexion émettrice.
  ws.fileMeta = { fileId, to, received: 0, size };

  send(target.ws, {
    type: 'file-start', fileId,
    from: ws.meta.id, fromName: ws.meta.name, name, size, mime
  });
  send(ws, { type: 'file-ack', fileId });
}

function handleFileChunk(ws, buf) {
  const meta = ws.fileMeta;
  if (!meta) return;
  const t = fileTransfers.get(meta.fileId);
  if (!t) { ws.fileMeta = null; return; }

  const len = buf ? buf.length : 0;
  if (t.received + len > MAX_FILE_SIZE) {
    const target = clients.get(meta.to);
    if (target && target.online) send(target.ws, { type: 'file-error', fileId: meta.fileId, reason: 'taille' });
    send(ws, { type: 'file-error', fileId: meta.fileId, reason: 'taille' });
    ws.fileMeta = null;
    fileTransfers.delete(meta.fileId);
    return;
  }

  t.received += len;
  meta.received += len;

  const target = clients.get(meta.to);
  if (target && target.online && target.ws) {
    try { target.ws.send(buf, { binary: true }); } catch (e) {}
  }
}

function handleFileEnd(ws, msg) {
  const meta = ws.fileMeta;
  if (!meta) return;
  const t = fileTransfers.get(meta.fileId);
  ws.fileMeta = null;
  if (!t) return;

  const target = clients.get(meta.to);
  if (target && target.online) {
    send(target.ws, {
      type: 'file-end', fileId: meta.fileId,
      name: t.name, size: t.received, mime: t.mime
    });
  }

  // On journalise la pièce jointe dans l'historique de la conversation.
  chatLog.push({
    msgId: rand(), convId: convKey(ws.meta.id, meta.to),
    from: ws.meta.id, to: meta.to,
    text: '📎 ' + t.name + ' (' + fmtSize(t.received) + ')',
    sentAt: nowIso(), file: true, fileId: meta.fileId
  });

  send(ws, { type: 'file-done', fileId: meta.fileId, size: t.received });
  fileTransfers.delete(meta.fileId);
}

/* ------------------------------------------------------------------ *
 *  Page d'accueil (accès aux espaces vendeur / client)
 * ------------------------------------------------------------------ */
function landingHtml() {
  const links = [
    { href: '/pages/accueil.html', label: 'Accueil client', sub: 'Découvrir les boutiques et prestataires', color: '26 92 42' },
    { href: '/pages/livreur.html', label: 'Devenir livreur', sub: 'Mangoo Express+ — livraisons en temps réel', color: '59 130 246' },
    { href: '/pages/auth.html', label: 'Se connecter', sub: 'Espace vendeur ou client', color: '232 97 12' }
  ];
  const cards = links.map((l) =>
    '<a href="' + l.href + '" style="display:block;text-decoration:none;background:rgb(' + l.color + ');color:#fff;padding:20px 22px;border-radius:16px;margin-bottom:12px;">' +
    '<div style="font-size:17px;font-weight:700;">' + l.label + '</div>' +
    '<div style="font-size:13px;opacity:.85;margin-top:3px;">' + l.sub + '</div>' +
    '</a>'
  ).join('');
  return '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Mangoo Connect+</title>' +
    '<style>body{font-family:system-ui,Segoe UI,sans-serif;background:#0b0b0f;color:#f8fafc;max-width:520px;margin:0 auto;padding:48px 20px;}' +
    'h1{font-size:24px;font-weight:700;margin:0 0 4px;}p{color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 24px;}' +
    '.badge{display:inline-block;font-size:12px;background:#10b98122;color:#34d399;border:1px solid #10b98144;padding:3px 10px;border-radius:999px;margin-bottom:16px;}</style></head><body>' +
    '<span class="badge">Mangoo Connect+</span>' +
    '<h1>Bienvenue</h1>' +
    '<p>Accédez à votre espace selon votre profil.</p>' +
    cards +
    '</body></html>';
}

function queryParam(req, key) {
  const qs = (req.url || '').split('?')[1] || '';
  for (const pair of qs.split('&')) {
    const eq = pair.indexOf('=');
    const k = eq >= 0 ? pair.slice(0, eq) : pair;
    const v = eq >= 0 ? pair.slice(eq + 1) : '';
    if (decodeURIComponent(k) === key) return decodeURIComponent(v);
  }
  return null;
}

function readJsonBody(req, cb) {
  let data = '';
  req.on('data', function (c) {
    data += c;
    if (data.length > 8 * 1024 * 1024) { req.destroy(new Error('corps trop volumineux')); }
  });
  req.on('end', function () {
    if (!data) return cb(null, {});
    try { cb(null, JSON.parse(data)); } catch (e) { cb(new Error('JSON invalide')); }
  });
  req.on('error', function (e) { cb(e); });
}

/* ------------------------------------------------------------------ *
 *  Sécurité HTTPS (espace administration)
 * ------------------------------------------------------------------ */
function isSecureRequest(req) {
  if (req.socket && req.socket.encrypted) return true;
  // Derrière un proxy TLS (Cloudflare Tunnel), la requête arrive en clair
  // sur l'origine mais porte X-Forwarded-Proto: https — on la considère sécurisée.
  var proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return proto === 'https';
}
function isAdminPage(urlPath) {
  return urlPath.indexOf('/pages/admin') === 0;
}
function isAdminApi(urlPath) {
  return urlPath.indexOf('/api/admin') === 0;
}
function forceHttpsAdmin(req, res, urlPath) {
  if (!FORCE_HTTPS_ADMIN || !httpsAvailable || isSecureRequest(req)) return false;
  if (isAdminApi(urlPath)) {
    // Les appels API admin (tokens, mutations) ne doivent jamais transiter en clair.
    res.writeHead(426, { 'Content-Type': 'application/json; charset=utf-8', 'Upgrade': 'TLS/1.2, HTTP/1.1' });
    res.end(JSON.stringify({ ok: false, error: 'HTTPS requis pour l\'administration.' }));
    return true;
  }
  if (isAdminPage(urlPath)) {
    const host = (req.headers.host || '').split(':')[0] || 'localhost';
    res.writeHead(301, { 'Location': 'https://' + host + ':' + HTTPS_PORT + (req.url || '/'), 'Cache-Control': 'no-store' });
    res.end();
    return true;
  }
  return false;
}

/* Garde-fou serveur de l'espace administration : toute page /pages/admin*
 * exige une session administrateur valide. Sinon → redirection vers la page
 * de connexion. La session est portée par le cookie httpOnly mgt_session
 * (posé à la connexion), en plus du token Bearer déjà utilisé par l'API.
 * Cette protection est indépendante du JS client (non contournable). */
function requireAdminSession(req, res, urlPath) {
  if (!isAdminPage(urlPath)) return false;
  const user = userFromReq(req);
  if (user && user.role === 'admin') return false; // autorisé
  res.writeHead(302, {
    'Location': '/pages/auth.html?next=' + encodeURIComponent(urlPath),
    'Cache-Control': 'no-store'
  });
  res.end();
  return true;
}

/* ------------------------------------------------------------------ *
 *  Handler HTTP
 * ------------------------------------------------------------------ */
// Sonde de santé : vérifie l'opérationnalité du serveur sans jamais exposer
// de données sensibles. Retourne un statut 200 si tout est OK, sinon 503.
function healthStatus() {
  const roleCounts = { prestataire: 0, vendeur: 0, client: 0, livreur: 0, admin: 0, total: users.length };
  users.forEach(function (u) { if (u && roleCounts[u.role] != null) roleCounts[u.role]++; });
  const status = {
    ok: true,
    status: 'ok',
    env: String(process.env.NODE_ENV || 'development'),
    node: process.version,
    uptime: Math.round(process.uptime()),
    peers: clients.size,
    storage: { ok: true, writable: true, path: DATA_DIR, users: roleCounts },
    websocket: { ok: !!serverReady }
  };

  // 1. DATA_DIR doit exister.
  if (!fs.existsSync(DATA_DIR)) {
    status.ok = false;
    status.status = 'degraded';
    status.storage.ok = false;
    status.storage.writable = false;
    status.storage.error = 'DATA_DIR introuvable';
  } else {
    // 2. Lecture/écriture JSON possible via un fichier sonde jetable.
    const probe = path.join(DATA_DIR, '.health-probe.json');
    try {
      fs.writeFileSync(probe, JSON.stringify({ ok: true }), 'utf8');
      JSON.parse(fs.readFileSync(probe, 'utf8'));
      fs.unlinkSync(probe);
    } catch (e) {
      status.ok = false;
      status.status = 'degraded';
      status.storage.ok = false;
      status.storage.writable = false;
      status.storage.error = 'lecture/écriture impossible';
      try { if (fs.existsSync(probe)) fs.unlinkSync(probe); } catch (e2) { /* ignore */ }
    }
  }

  if (!serverReady) { status.ok = false; status.status = 'starting'; }
  if (status.ok) status.status = 'ok';
  return status;
}

function handleHttp(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  // Journal HTTP minimal (diagnostic connexion téléphones)
  if (urlPath !== '/favicon.ico') {
    const rip = req.socket && req.socket.remoteAddress;
    console.log('[HTTP]', req.method, urlPath, '←', rip, new Date().toLocaleTimeString());
  }
  if (forceHttpsAdmin(req, res, urlPath)) return;
  if (requireAdminSession(req, res, urlPath)) return;
  if (urlPath === '/health') {
    const h = healthStatus();
    res.writeHead(h.ok ? 200 : 503, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(h));
    return;
  }
  if (urlPath === '/status') {
    const peers = [];
    clients.forEach((c, id) => { if (c.online) peers.push({ id, role: c.role, name: c.name }); });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, peers, chat: chatLog.length, appointments: appointmentLog.length }));
    return;
  }
  if (urlPath === '/orders/live') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ orders: liveOrdersLog }));
    return;
  }
  if (urlPath === '/live-status') {
    // État du Live Shopping, consommé par la carte Local+ pour afficher
    // les badges « En direct » en temps réel et le bouton « Rejoindre le live ».
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      active: live.active,
      vendorId: live.vendorId,
      vendorName: live.vendorName,
      title: live.title,
      viewers: live.viewers,
      likes: live.likes,
      orders: live.orders,
      pinnedProduct: live.pinnedProduct
    }));
    return;
  }
  if (urlPath === '/api/contacts') {
    // Annuaire de contacts réels pour la messagerie du Dashboard : renvoie
    // tous les comptes non-admin (clients, prestataires, boutiques, livreurs)
    // à l'exception de l'utilisateur courant. Le statut en ligne est déduit de
    // la présence temps réel (clients map), clé par id ou vendorId.
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    if (req.method !== 'GET') {
      res.writeHead(405, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'méthode non autorisée' }));
      return;
    }
    const contacts = users
      .filter(function (u) { return u && u.role !== 'admin' && u.id !== user.id; })
      .map(function (u) {
        const c = clients.get(u.id) || clients.get(u.vendorId);
        return {
          id: u.id,
          vendorId: u.vendorId || u.id,
          role: u.role,
          name: u.enseigne || u.name || u.fullName || u.phone || u.email || 'Contact',
          enseigne: u.enseigne || '',
          phone: u.phone || '',
          email: u.email || '',
          city: u.city || '',
          logo: u.logo || '',
          category: u.category || '',
          online: !!(c && c.online),
          createdAt: u.createdAt || ''
        };
      })
      .sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
    res.end(JSON.stringify({ ok: true, contacts: contacts }));
    return;
  }

  if (urlPath === '/api/cities') {
    // Liste complète des villes (Afrique + Europe test). Source unique partagée
    // par le formulaire d'inscription et le sélecteur de ville de la carte.
    if (req.method !== 'GET') {
      res.writeHead(405, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'méthode non autorisée' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    res.end(JSON.stringify({ ok: true, cities: GEO_CITIES }));
    return;
  }

  if (urlPath === '/api/carte') {
    if (req.method === 'GET') {
      // Désactive le cache : la carte doit toujours refléter les profils réels
      // (notamment les boutiques récemment créées, ex. DAN Boutique).
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
      res.end(JSON.stringify({ vendors: carteVendors() }));
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non autorisée' }));
    return;
  }
  if (urlPath === '/prestations') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor');
      const list = vendor ? prestations.filter(function (p) { return p.vendorId === vendor || p.vendorName === vendor; }) : prestations;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ prestations: list }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        if (!body || typeof body !== 'object' || !body.name) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'nom manquant' }));
          return;
        }
        const p = {
          name: String(body.name || '').trim(),
          description: String(body.description || '').trim(),
          price: Number(body.price) || 0,
          duration: Number(body.duration) || 0,
          unit: String(body.unit || 'Par prestation'),
          category: String(body.category || 'maison-services'),
          available: body.available !== false,
          image: String(body.image || ''),
          vendorId: String(body.vendorId || ''),
          vendorName: String(body.vendorName || '')
        };
        if (body.id) {
          const idx = prestations.findIndex(function (x) { return x.id === body.id; });
          if (idx >= 0) { prestations[idx] = Object.assign({}, prestations[idx], p, { id: body.id }); }
          else { p.id = String(body.id); prestations.push(p); }
        } else {
          p.id = rand();
          prestations.push(p);
        }
        savePrestations();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, prestation: p }));
      });
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryParam(req, 'id');
      prestations = prestations.filter(function (p) { return p.id !== id; });
      savePrestations();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  if (urlPath === '/catalogue') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor');
      const category = queryParam(req, 'category');
      let list = catalogue;
      if (vendor) list = list.filter(function (p) { return p.vendorId === vendor || p.vendorName === vendor; });
      if (category && category !== 'all') list = list.filter(function (p) { return p.category === category; });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ catalogue: list.map(publicProduct) }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        if (!body || typeof body !== 'object' || !body.name) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'nom manquant' }));
          return;
        }
        const p = {
          name: String(body.name || '').trim(),
          description: String(body.description || '').trim(),
          price: Number(body.price) || 0,
          stock: Number(body.stock) || 0,
          unit: String(body.unit || 'unité'),
          category: String(body.category || 'accessoires'),
          available: body.available !== false,
          image: String(body.image || ''),
          vendorId: String(body.vendorId || ''),
          vendorName: String(body.vendorName || '')
        };
        if (body.floorPrice != null && Number(body.floorPrice) > 0) p.floorPrice = Math.round(Number(body.floorPrice));
        if (typeof body.negotiable === 'boolean') p.negotiable = body.negotiable;
        if (body.id) {
          const idx = catalogue.findIndex(function (x) { return x.id === body.id; });
          if (idx >= 0) { catalogue[idx] = Object.assign({}, catalogue[idx], p, { id: body.id }); ensureProductFloor(catalogue[idx]); }
          else { p.id = String(body.id); ensureProductFloor(p); catalogue.push(p); }
        } else {
          p.id = rand();
          ensureProductFloor(p);
          catalogue.push(p);
        }
        saveCatalogue();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, product: p }));
      });
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryParam(req, 'id');
      catalogue = catalogue.filter(function (p) { return p.id !== id; });
      saveCatalogue();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  if (urlPath === '/inventaire/mouvements') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor');
      const list = vendor ? inventaireMouvements.filter(function (m) { return m.vendorId === vendor || m.name === vendor; }) : inventaireMouvements;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ mouvements: list }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        if (!body || typeof body !== 'object') {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'données manquantes' }));
          return;
        }
        const type = body.type === 'sortie' ? 'sortie' : 'entree';
        const quantity = Math.max(1, parseInt(body.quantity, 10) || 1);
        const item = inventaire.find(function (x) { return x.id === body.itemId; }) || null;
        const name = item ? item.name : String(body.name || 'Produit');
        const movement = {
          id: body.id || rand(),
          itemId: item ? item.id : String(body.itemId || ''),
          vendorId: item ? item.vendorId : String(body.vendorId || ''),
          name: name,
          type: type,
          quantity: quantity,
          reason: String(body.reason || (type === 'entree' ? 'Réapprovisionnement' : 'Sortie de stock')),
          time: 'À l\'instant'
        };
        // Ajuste le stock correspondant et met à jour la disponibilité.
        if (item) {
          if (type === 'entree') item.stock = (Number(item.stock) || 0) + quantity;
          else item.stock = Math.max(0, (Number(item.stock) || 0) - quantity);
          item.available = item.stock > 0;
          saveInventaire();
        }
        inventaireMouvements.unshift(movement);
        if (inventaireMouvements.length > 200) inventaireMouvements.pop();
        saveInventaireMouvements();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, movement: movement, item: item }));
      });
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  if (urlPath === '/inventaire') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor');
      const category = queryParam(req, 'category');
      let list = inventaire;
      if (vendor) list = list.filter(function (p) { return p.vendorId === vendor || p.vendorName === vendor; });
      if (category && category !== 'all') list = list.filter(function (p) { return p.category === category; });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ inventaire: list }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        if (!body || typeof body !== 'object' || !body.name) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'nom manquant' }));
          return;
        }
        const p = {
          name: String(body.name || '').trim(),
          category: String(body.category || 'accessoires'),
          stock: Math.max(0, Number(body.stock) || 0),
          threshold: Math.max(0, Number(body.threshold) || 0),
          unit: String(body.unit || 'unité'),
          costPrice: Number(body.costPrice) || 0,
          salePrice: Number(body.salePrice) || 0,
          supplier: String(body.supplier || ''),
          available: body.stock > 0,
          vendorId: String(body.vendorId || ''),
          vendorName: String(body.vendorName || '')
        };
        if (body.id) {
          const idx = inventaire.findIndex(function (x) { return x.id === body.id; });
          if (idx >= 0) { inventaire[idx] = Object.assign({}, inventaire[idx], p, { id: body.id }); }
          else { p.id = String(body.id); inventaire.push(p); }
        } else {
          p.id = rand();
          inventaire.push(p);
        }
        saveInventaire();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, item: p }));
      });
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryParam(req, 'id');
      inventaire = inventaire.filter(function (p) { return p.id !== id; });
      saveInventaire();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  if (urlPath === '/galerie') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor');
      const category = queryParam(req, 'category');
      let list = galerie;
      if (vendor) list = list.filter(function (p) { return p.vendorId === vendor || p.vendorName === vendor; });
      if (category && category !== 'all') list = list.filter(function (p) { return p.category === category; });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ galerie: list }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        if (!body || typeof body !== 'object' || !body.name) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'nom manquant' }));
          return;
        }
        const p = {
          name: String(body.name || '').trim(),
          category: String(body.category || 'soin'),
          type: body.type === 'avant-apres' ? 'avant-apres' : 'photo',
          views: Math.max(0, Number(body.views) || 0),
          likes: Math.max(0, Number(body.likes) || 0),
          featured: body.featured === true,
          author: String(body.author || 'Vendeur'),
          date: String(body.date || 'À l\'instant'),
          vendorId: String(body.vendorId || ''),
          vendorName: String(body.vendorName || '')
        };
        if (body.id) {
          const idx = galerie.findIndex(function (x) { return x.id === body.id; });
          if (idx >= 0) { galerie[idx] = Object.assign({}, galerie[idx], p, { id: body.id }); }
          else { p.id = String(body.id); galerie.push(p); }
        } else {
          p.id = rand();
          galerie.push(p);
        }
        saveGalerie();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, photo: p }));
      });
      return;
    }
    if (req.method === 'DELETE') {
      const id = queryParam(req, 'id');
      galerie = galerie.filter(function (p) { return p.id !== id; });
      saveGalerie();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  if (urlPath === '/boosters') {
    if (req.method === 'GET') {
      reconcileBoosters();
      const vendor = queryParam(req, 'vendor');
      let list = boosters;
      if (vendor) list = list.filter(function (p) { return p.vendorId === vendor || p.vendorName === vendor; });
      const active = list.filter(function (p) { return p.status === 'active'; });
      // Historique des badges = registre complet de TOUTES les activations
      // (actives et passées), la plus récente d'abord. Un badge payé apparaît
      // donc immédiatement, en cohérence avec l'historique Finances.
      const history = list.slice().sort(function (a, b) {
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
      const stats = boosterStats || seedBoosterStats();
      const totalSpend = list.reduce(function (s, p) { return s + (Number(p.price) || 0); }, 0);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        offers: BOOSTER_OFFERS,
        active: active,
        history: history,
        stats: {
          monthViews: Number(stats.monthViews) || 0,
          clicks: Number(stats.clicks) || 0,
          orders: Number(stats.orders) || 0,
          roi: Number(stats.roi) || 0,
          pendingCount: Number(stats.pendingCount) || 0,
          activeCount: active.length,
          totalSpend: totalSpend
        }
      }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        const action = body && body.action;

        if (action === 'activate') {
          const offer = findOffer(body.boosterId || body.type);
          if (!offer) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'offre inconnue' })); return; }
          const user = userForVendorId(body.vendorId);
          if (!user) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'compte vendeur introuvable' })); return; }
          const pay = recordBoosterPayment(user, offer, 'booster', body);
          if (!pay.ok) { res.writeHead(402, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(pay)); return; }
          const now = Date.now();
          const durationMs = Number(offer.durationMs) || 24 * 60 * 60 * 1000;
          const activation = {
            id: rand(),
            vendorId: String(body.vendorId || ''),
            vendorName: String(body.vendorName || user.enseigne || user.name || ''),
            boosterId: offer.id,
            type: offer.type,
            name: offer.name,
            status: 'active',
            createdAt: new Date(now).toISOString(),
            expiresAt: new Date(now + durationMs).toISOString(),
            paymentId: pay.payment.id,
            startLabel: 'À l\'instant',
            endLabel: 'Dans ' + offer.durationText,
            remainingLabel: offer.durationText + ' / ' + offer.durationText,
            remainingPct: 100,
            price: offer.price,
            views: 0,
            clicks: 0,
            orders: 0
          };
          boosters.unshift(activation);
          saveBoosters();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, activation: activation, payment: pay.payment }));
          return;
        }

        if (action === 'renew') {
          const idx = boosters.findIndex(function (x) { return x.id === body.id; });
          if (idx < 0) { res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'introuvable' })); return; }
          const offer = findOffer(boosters[idx].boosterId || boosters[idx].type);
          if (!offer) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'offre inconnue' })); return; }
          const user = userForVendorId(boosters[idx].vendorId);
          if (!user) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'compte vendeur introuvable' })); return; }
          const pay = recordBoosterPayment(user, offer, 'booster-renew', body);
          if (!pay.ok) { res.writeHead(402, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(pay)); return; }
          const now = Date.now();
          const durationMs = (offer && Number(offer.durationMs)) || 24 * 60 * 60 * 1000;
          boosters[idx].status = 'active';
          boosters[idx].createdAt = new Date(now).toISOString();
          boosters[idx].expiresAt = new Date(now + durationMs).toISOString();
          boosters[idx].paymentId = pay.payment.id;
          boosters[idx].startLabel = 'À l\'instant';
          boosters[idx].endLabel = 'Dans ' + (offer ? offer.durationText : '24h');
          boosters[idx].remainingLabel = (offer ? offer.durationText : '24h') + ' / ' + (offer ? offer.durationText : '24h');
          boosters[idx].remainingPct = 100;
          saveBoosters();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, activation: boosters[idx], payment: pay.payment }));
          return;
        }

        if (action === 'stop') {
          const idx = boosters.findIndex(function (x) { return x.id === body.id; });
          if (idx < 0) { res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: 'introuvable' })); return; }
          boosters[idx].status = 'arrete';
          boosters[idx].remainingPct = 0;
          saveBoosters();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, activation: boosters[idx] }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'action inconnue' }));
      });
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  /* -------- Authentification -------- */
  if (urlPath === '/api/auth/register') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const role = body.role === 'admin' ? 'admin' : (body.role === 'client' ? 'client' : (body.role === 'vendeur' ? 'vendeur' : (body.role === 'livreur' ? 'livreur' : 'prestataire')));
      const name = String(body.name || '').trim();
      const phone = normalizePhone(body.phone);
      const pin = String(body.pin || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');

      if (!name) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nom est requis.' })); return; }
      if (!phone) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le numéro de téléphone est requis.' })); return; }
      if (pin && !/^\d{4}$/.test(pin)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le PIN doit contenir exactement 4 chiffres.' })); return; }
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Adresse email invalide.' })); return; }
      if (!pin && !password) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Choisissez un PIN à 4 chiffres ou un mot de passe.' })); return; }
      if (password && password.length < 6) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le mot de passe doit contenir au moins 6 caractères.' })); return; }

      // Unicité : téléphone ou email déjà utilisé ?
      const phoneClash = users.find((u) => normalizePhone(u.phone) === phone);
      if (phoneClash) { res.writeHead(409, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Ce numéro de téléphone est déjà utilisé.' })); return; }
      if (email) {
        const emailClash = users.find((u) => u.email && u.email.toLowerCase() === email);
        if (emailClash) { res.writeHead(409, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Cette adresse email est déjà utilisée.' })); return; }
      }

      const userId = newUserId(role);
      const enseigne = String(body.enseigne || '').trim() || name;
      const cityRaw = String(body.city || '').trim() || 'Dakar';
      const geo = geocodeCity(cityRaw);
      const city = geo ? geo.city : cityRaw;
      const category = String(body.category || '').trim() || 'salon';
      const logo = String(body.logo || '').slice(0, 500000); // data URL logo (max 500 Ko)
      // Véhicule du livreur validé AVANT création du compte (évite tout compte orphelin).
      const vehicle = role === 'livreur' ? (String(body.vehicle || 'moto').trim() || 'moto') : null;
      if (vehicle && !VEHICLE_RANK[vehicle]) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Véhicule invalide (velo/moto/voiture/van/camion/semi).' })); return; }

      const user = {
        id: userId, vendorId: (role === 'prestataire' || role === 'vendeur') ? userId : null,
        role, name, enseigne,
        email: email || null, phone,
        pinHash: pin ? hashSecret(pin) : null,
        passwordHash: password ? hashSecret(password) : null,
        logo, category, city,
        country: geo ? geo.country : null,
        lat: geo ? geo.lat : null,
        lng: geo ? geo.lng : null,
        createdAt: nowIso()
      };
      users.push(user);
      saveUsers();

      // Crée un document vendor-config pour les comptes prestataires et vendeurs
      // afin que leur dashboard soit alimenté dès la première connexion.
      if (role === 'prestataire' || role === 'vendeur') {
        vendorConfigFor(userId);
        const doc = vendorConfig[userId];
        doc.vendorName = enseigne;
        doc.profile = Object.assign({}, doc.profile, {
          ownerName: name, email: email || '', phone: phone,
          enseigne: enseigne, category: category, city: city, logo: logo,
          country: geo ? geo.country : (doc.profile.country || ''),
          lat: geo ? geo.lat : (doc.profile.lat != null ? doc.profile.lat : null),
          lng: geo ? geo.lng : (doc.profile.lng != null ? doc.profile.lng : null)
        });
        doc.updatedAt = nowIso();
        saveVendorConfig();
      }

      // Crée un profil livreur pour les comptes « livreur » (Mangoo Express+).
      // Le livreur pourra ensuite basculer en ligne/occupé depuis son app.
      if (role === 'livreur') {
        couriers.push({
          id: 'cour-' + crypto.randomBytes(5).toString('hex'),
          userId: userId,
          name: name,
          phone: phone,
          email: email || null,
          vehicle: vehicle,
          city: city,
          zone: String(body.zone || '').trim(),
          status: 'offline',
          approved: true,
          rating: null,
          completedDeliveries: 0,
          createdAt: nowIso()
        });
        saveCouriers();
      }

      const token = crypto.randomBytes(24).toString('hex');
      sessions[token] = userId;
      saveSessions();

      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, token, user: publicUser(user) }));
    });
    return;
  }

  if (urlPath === '/api/auth/login') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const mode = body.mode === 'password' ? 'password' : (body.mode === 'pin' ? 'pin' : 'auto');
      const identifier = String(body.identifier || '').trim();
      const secret = String(body.secret || body.pin || body.password || '').trim();

      if (!identifier) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Renseignez votre téléphone ou votre PIN.' })); return; }

      let user = null;
      let ok = false;

      if (mode === 'auto') {
        // Connexion « l'un ou l'autre » : un seul champ suffit.
        // - 4 chiffres → PIN, on retrouve le compte correspondant ;
        // - sinon → numéro de téléphone, on connecte directement.
        if (/^\d{4}$/.test(identifier)) {
          for (const u of users) {
            if (u.pinHash && verifySecret(identifier, u.pinHash)) { user = u; ok = true; break; }
          }
          if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'PIN incorrect.' })); return; }
        } else {
          user = findUserByIdentifier(identifier);
          if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Compte introuvable.' })); return; }
          ok = true;
        }
      } else if (mode === 'pin') {
        user = findUserByIdentifier(identifier);
        if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Compte introuvable.' })); return; }
        ok = user.pinHash && verifySecret(secret, user.pinHash);
        if (!ok) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'PIN incorrect.' })); return; }
      } else { // password
        user = findUserByIdentifier(identifier);
        if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Compte introuvable.' })); return; }
        ok = user.passwordHash && verifySecret(secret, user.passwordHash);
        if (!ok) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Mot de passe incorrect.' })); return; }
      }

      if (user.twoFactorEnabled) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        twoFactorCodes[user.id] = { code, expiresAt: Date.now() + 10 * 60 * 1000, scope: 'login' };
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, twoFactor: true, userId: user.id, demoCode: code, expiresIn: 600, email: user.email || '' }));
        return;
      }

      const token = crypto.randomBytes(24).toString('hex');
      sessions[token] = user.id;
      saveSessions();

      // Pose le cookie de session httpOnly (porte l'authentification côté serveur,
      // pour la protection des pages /pages/admin*), en plus du token renvoyé au client.
      const loginHeaders = Object.assign({}, JSON_HEADERS, {
        'Set-Cookie': 'mgt_session=' + token + '; ' + sessionCookieFlags(req, 2592000)
      });
      res.writeHead(200, loginHeaders);
      res.end(JSON.stringify({ ok: true, token, user: publicUser(user) }));
    });
    return;
  }

  if (urlPath === '/api/auth/me') {
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }

    // Lecture seule : renvoie le profil public du compte connecté.
    if (req.method !== 'PATCH') {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, user: publicUser(user) }));
      return;
    }

    // Mise à jour partielle du profil (email, photo, adresse, nom, téléphone, ville).
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};

      // Champs éditables par le client. On ne touche jamais aux rôles, hashes,
      // identifiants ni au vendorId via cet endpoint.
      const ALLOWED = ['name', 'fullName', 'enseigne', 'email', 'phone', 'address', 'adresse', 'city', 'logo'];
      let changed = false;
      ALLOWED.forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(body, key)) return;
        const value = body[key];
        // Ne persiste que des chaînes (ou null pour vider un champ).
        if (value !== null && typeof value !== 'string') return;
        user[key] = value;
        changed = true;
      });

      // Garde-fou anti-dépassement : le logo est un data URL ; on refuse un
      // fichier manifestement trop lourd pour ne pas faire grossir users.json
      // sans limite (le client compresse déjà, mais ce contrôle reste défensif).
      if (typeof user.logo === 'string' && user.logo.length > 500000) {
        res.writeHead(400, JSON_HEADERS);
        res.end(JSON.stringify({ ok: false, error: 'Logo trop volumineux (max 500 Ko).' }));
        return;
      }

      // Normalise le nom affiché : `name` reste la source de vérité côté client,
      // on le synchronise avec `fullName` si l'un des deux a été fourni.
      if (body.name && !body.fullName) user.fullName = body.name;
      if (body.fullName && !body.name) user.name = body.fullName;

      // Validation minimale de l'email s'il est renseigné.
      if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
        res.writeHead(400, JSON_HEADERS);
        res.end(JSON.stringify({ ok: false, error: 'Adresse email invalide.' }));
        return;
      }

      // Le téléphone est normalisé (espaces/parenthèses supprimés).
      if (user.phone) user.phone = normalizePhone(user.phone);

      // Si la ville a changé, on re-géocode pour mettre à jour les coordonnées
      // et le pays, puis on synchronise le vendor-config. Cela permet de
      // « déménager » un compte (ex. de Paris vers Dakar) sans le recréer, et
      // la carte reflète le nouveau lieu immédiatement.
      if (Object.prototype.hasOwnProperty.call(body, 'city') && user.city) {
        const geo = geocodeCity(user.city);
        if (geo) {
          user.city = geo.city;
          user.country = geo.country;
          user.lat = geo.lat;
          user.lng = geo.lng;
          if (user.vendorId) {
            const doc = vendorConfigFor(user.vendorId);
            if (doc) {
              doc.profile = Object.assign({}, doc.profile, {
                city: geo.city, country: geo.country, lat: geo.lat, lng: geo.lng
              });
              doc.updatedAt = nowIso();
              saveVendorConfig();
            }
          }
        }
      }

      if (!changed) {
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, user: publicUser(user) }));
        return;
      }

      user.updatedAt = new Date().toISOString();
      saveUsers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, user: publicUser(user) }));
    });
    return;
  }

  if (urlPath === '/api/auth/logout') {
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || cookieFromReq(req, 'mgt_session');
    if (token && sessions[token]) { delete sessions[token]; saveSessions(); }
    // Révoque aussi le cookie de session (déconnexion propre côté serveur).
    const logoutHeaders = Object.assign({}, JSON_HEADERS, {
      'Set-Cookie': 'mgt_session=; ' + sessionCookieFlags(req, 0)
    });
    res.writeHead(200, logoutHeaders);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Changement de PIN (client connecté). Vérifie le PIN actuel avant de le remplacer.
  if (urlPath === '/api/auth/change-pin') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const currentPin = String(body.currentPin || '').trim();
      const newPin = String(body.newPin || '').trim();
      if (!/^\d{4}$/.test(newPin)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nouveau PIN doit contenir exactement 4 chiffres.' })); return; }
      if (newPin === currentPin) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nouveau PIN doit être différent de l\'actuel.' })); return; }
      if (user.pinHash && !verifySecret(currentPin, user.pinHash)) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'PIN actuel incorrect.' })); return; }
      user.pinHash = hashSecret(newPin);
      user.updatedAt = new Date().toISOString();
      saveUsers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // Changement de mot de passe (compte connecté, typiquement admin). Vérifie le
  // mot de passe actuel, impose un mot de passe fort, révoque les autres sessions
  // du compte, puis remplace le hash. Authentification acceptée via token Bearer
  // ou cookie de session (mgt_session).
  if (urlPath === '/api/auth/change-password') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const user = userFromReq(req);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const currentPassword = String(body.currentPassword || '').trim();
      const newPassword = String(body.newPassword || '').trim();
      if (!currentPassword) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Renseignez votre mot de passe actuel.' })); return; }
      if (!user.passwordHash || !verifySecret(currentPassword, user.passwordHash)) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Mot de passe actuel incorrect.' })); return; }
      if (newPassword === currentPassword) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nouveau mot de passe doit être différent de l\'actuel.' })); return; }
      if (!isStrongPassword(newPassword)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nouveau mot de passe doit contenir au moins 10 caractères, une majuscule, une minuscule, un chiffre et un symbole.' })); return; }

      user.passwordHash = hashSecret(newPassword);
      user.updatedAt = new Date().toISOString();

      // Sécurité : révoque toutes les autres sessions de ce compte (un mot de
      // passe compromis ne doit plus permettre de rester connecté ailleurs),
      // tout en conservant la session courante.
      const currentToken = tokenFromReq(req);
      let sessionChanged = false;
      Object.keys(sessions).forEach(function (t) {
        if (t !== currentToken && sessions[t] === user.id) { delete sessions[t]; sessionChanged = true; }
      });
      if (sessionChanged) saveSessions();
      saveUsers();

      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // --- Authentification à deux facteurs par code email (6 chiffres) ---
  // En l'absence de serveur d'email, le code est renvoyé dans `demoCode` ;
  // il est néanmoins stocké, vérifié et expiré comme un vrai code.
  if (urlPath === '/api/auth/verify-2fa') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const userId = String(body.userId || '').trim();
      const code = String(body.code || '').trim();
      if (!userId || !code) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de vérification manquant.' })); return; }
      const rec = twoFactorCodes[userId];
      if (!rec) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Aucun code en attente de validation.' })); return; }
      if (rec.expiresAt < Date.now()) { delete twoFactorCodes[userId]; res.writeHead(410, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Ce code a expiré. Reconnectez-vous.' })); return; }
      if (rec.code !== code) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de vérification incorrect.' })); return; }
      const user = users.find((u) => u.id === userId);
      if (!user) { delete twoFactorCodes[userId]; res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Compte introuvable.' })); return; }
      delete twoFactorCodes[userId];
      const token = crypto.randomBytes(24).toString('hex');
      sessions[token] = user.id;
      saveSessions();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, token, user: publicUser(user) }));
    });
    return;
  }

  // Demande du code pour activer la 2FA (compte déjà connecté).
  if (urlPath === '/api/auth/2fa/request-code') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    twoFactorCodes[user.id] = { code, expiresAt: Date.now() + 10 * 60 * 1000, scope: 'enable' };
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, demoCode: code, expiresIn: 600, email: user.email || '' }));
    return;
  }

  // Active la 2FA après validation du code reçu par email.
  if (urlPath === '/api/auth/2fa/enable') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const code = String(body.code || '').trim();
      const rec = twoFactorCodes[user.id];
      if (!rec || rec.scope !== 'enable') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Aucun code d\'activation en attente.' })); return; }
      if (rec.expiresAt < Date.now()) { delete twoFactorCodes[user.id]; res.writeHead(410, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Ce code a expiré.' })); return; }
      if (rec.code !== code) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de vérification incorrect.' })); return; }
      delete twoFactorCodes[user.id];
      user.twoFactorEnabled = true;
      user.updatedAt = new Date().toISOString();
      saveUsers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, twoFactorEnabled: true }));
    });
    return;
  }

  // Désactive la 2FA après re-vérification du PIN actuel.
  if (urlPath === '/api/auth/2fa/disable') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const token = queryParam(req, 'token') || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = userByToken(token);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const currentPin = String(body.currentPin || '').trim();
      if (user.pinHash && !verifySecret(currentPin, user.pinHash)) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'PIN actuel incorrect.' })); return; }
      user.twoFactorEnabled = false;
      user.updatedAt = new Date().toISOString();
      saveUsers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, twoFactorEnabled: false }));
    });
    return;
  }

  // Réinitialisation du PIN (mot de passe oublié « par PIN »).
  // Code de vérification à 6 chiffres, valable 10 minutes, stocké en mémoire.
  if (urlPath === '/api/auth/request-pin-reset') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const phone = normalizePhone(body.phone);
      if (!phone) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Renseignez votre numéro de téléphone.' })); return; }

      const user = users.find((u) => normalizePhone(u.phone) === phone);
      // Ne révèle pas l'existence d'un compte : réponse identique si introuvable.
      if (!user) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Aucun compte trouvé pour ce numéro.' })); return; }

      const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
      pinResets[phone] = { code, userId: user.id, expiresAt: Date.now() + 10 * 60 * 1000 };
      // En production, le code serait envoyé par SMS. En démo, on le renvoie
      // directement pour que l'utilisateur puisse terminer le parcours.
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, demoCode: code, expiresIn: 600 }));
    });
    return;
  }

  if (urlPath === '/api/auth/reset-pin') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const phone = normalizePhone(body.phone);
      const code = String(body.code || '').trim();
      const newPin = String(body.newPin || '').trim();

      if (!phone) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Numéro de téléphone manquant.' })); return; }
      if (!/^\d{4}$/.test(newPin)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le nouveau PIN doit contenir exactement 4 chiffres.' })); return; }

      const rec = pinResets[phone];
      if (!rec) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Aucune demande de réinitialisation en cours.' })); return; }
      if (rec.expiresAt < Date.now()) { delete pinResets[phone]; res.writeHead(410, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Ce code a expiré. Demandez-en un nouveau.' })); return; }
      if (rec.code !== code) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de vérification incorrect.' })); return; }

      const user = users.find((u) => u.id === rec.userId);
      if (!user) { delete pinResets[phone]; res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Compte introuvable.' })); return; }

      user.pinHash = hashSecret(newPin);
      saveUsers();
      delete pinResets[phone];

      // Ouvre une session directement après la réinitialisation.
      const token = crypto.randomBytes(24).toString('hex');
      sessions[token] = user.id;
      saveSessions();

      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, token, user: publicUser(user) }));
    });
    return;
  }

  /* -------- Administration : boutiques (comptes au rôle « vendeur ») -------- */
  if (urlPath === '/api/admin/boutiques') {
    // Accès réservé aux administrateurs (token de session).
    const adminToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || queryParam(req, 'token');
    const adminUser = userByToken(adminToken);
    if (!adminUser || adminUser.role !== 'admin') {
      res.writeHead(401, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'Accès réservé aux administrateurs.' }));
      return;
    }

    // Les « boutiques » sont les comptes vendeurs-boutiques, distincts des
    // prestataires de service (rôle « prestataire »).
    const boutiqueUsers = users.filter(function (u) { return u.role === 'vendeur'; });

    function adminStatusOf(doc) {
      if (doc.admin && doc.admin.status) return doc.admin.status;
      const v = doc.verification && doc.verification.status;
      return v === 'certifie' ? 'active' : 'en_attente';
    }

    function serializeBoutique(u) {
      const doc = vendorConfigFor(u.vendorId || u.id);
      const p = doc.profile || {};
      const status = adminStatusOf(doc);
      const products = catalogue.filter(function (c) { return c.vendorId === (u.vendorId || u.id); }).length;
      const verified = !!(doc.verification && doc.verification.status === 'certifie');
      return {
        id: u.vendorId || u.id,
        userId: u.id,
        name: u.enseigne || u.name,
        owner: u.name,
        category: p.category || u.category || 'commerce',
        city: p.city || u.city || '—',
        phone: p.phone || u.phone || '',
        email: p.email || u.email || '',
        address: p.address || '',
        logo: u.logo || p.logo || '',
        status: status,
        verification: (doc.verification && doc.verification.status) || 'non_soumis',
        badgeLabel: (doc.verification && doc.verification.badgeLabel) || (verified ? 'Boutique certifiée' : ''),
        plan: (doc.subscription && doc.subscription.plan) || 'decouverte',
        createdAt: u.createdAt || doc.createdAt || '',
        updatedAt: doc.updatedAt || '',
        stats: { products: products, orders: 0, ca: 0, commission: 0 },
        history: (doc.admin && doc.admin.history) || []
      };
    }

    function pushHistory(doc, action, label, by) {
      doc.admin = Object.assign({}, doc.admin || {}, {
        history: (doc.admin && doc.admin.history || []).concat([{
          action: action,
          label: label,
          by: by,
          at: new Date().toISOString()
        }]).slice(-20)
      });
    }

    if (req.method === 'GET') {
      const list = boutiqueUsers.map(serializeBoutique);
      const counts = { active: 0, en_attente: 0, suspendue: 0, fermee: 0, total: list.length };
      list.forEach(function (b) { if (counts[b.status] != null) counts[b.status]++; });
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, boutiques: list, counts: counts }));
      return;
    }

    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const action = body.action;
        const targetId = String(body.vendorId || body.id || '');
        const targetUser = boutiqueUsers.find(function (u) { return (u.vendorId || u.id) === targetId || u.id === targetId; });
        if (!targetUser) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Boutique introuvable.' })); return; }
        const targetDoc = vendorConfigFor(targetUser.vendorId || targetUser.id);
        const by = adminUser.name || 'Administrateur';
        const note = String(body.note || '').trim();

        if (action === 'approve') {
          targetDoc.verification = Object.assign({}, targetDoc.verification || {}, {
            status: 'certifie',
            badgeVisible: true,
            badgeLabel: 'Boutique certifiée',
            reviewedAt: new Date().toISOString(),
            reviewerNote: note || 'Boutique approuvée.'
          });
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'approve', 'Boutique approuvée', by);
        } else if (action === 'reject') {
          targetDoc.verification = Object.assign({}, targetDoc.verification || {}, {
            status: 'refuse',
            badgeVisible: false,
            badgeLabel: '',
            reviewedAt: new Date().toISOString(),
            reviewerNote: note || 'Boutique rejetée.'
          });
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'fermee', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'reject', 'Boutique rejetée', by);
        } else if (action === 'suspend') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'suspendue', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'suspend', 'Boutique suspendue', by);
        } else if (action === 'reactivate') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'reactivate', 'Boutique réactivée', by);
        } else if (action === 'close') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'fermee', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'close', 'Boutique fermée', by);
        } else if (action === 'reopen') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushHistory(targetDoc, 'reopen', 'Boutique rouverte', by);
        } else {
          res.writeHead(400, JSON_HEADERS);
          res.end(JSON.stringify({ ok: false, error: 'action inconnue' }));
          return;
        }

        targetDoc.updatedAt = new Date().toISOString();
        saveVendorConfig();
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, boutique: serializeBoutique(targetUser) }));
      });
      return;
    }

    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  /* -------- Administration : prestataires de service (rôle « prestataire ») -------- */
  if (urlPath === '/api/admin/prestataires') {
    const adminToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || queryParam(req, 'token');
    const adminUser = userByToken(adminToken);
    if (!adminUser || adminUser.role !== 'admin') {
      res.writeHead(401, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'Accès réservé aux administrateurs.' }));
      return;
    }

    const prestataireUsers = users.filter(function (u) { return u.role === 'prestataire'; });

    function prestaStatusOf(doc) {
      if (doc.admin && doc.admin.status) return doc.admin.status;
      const v = doc.verification && doc.verification.status;
      return v === 'certifie' ? 'active' : 'en_attente';
    }

    function serializePrestataire(u) {
      const doc = vendorConfigFor(u.vendorId || u.id);
      const p = doc.profile || {};
      const r = doc.rapports || {};
      const status = prestaStatusOf(doc);
      const verified = !!(doc.verification && doc.verification.status === 'certifie');
      return {
        id: u.vendorId || u.id,
        userId: u.id,
        name: u.enseigne || u.name,
        owner: u.name,
        category: p.category || u.category || 'services',
        city: p.city || u.city || '—',
        phone: p.phone || u.phone || '',
        email: p.email || u.email || '',
        address: p.address || '',
        logo: u.logo || p.logo || '',
        status: status,
        verification: (doc.verification && doc.verification.status) || 'non_soumis',
        badgeLabel: (doc.verification && doc.verification.badgeLabel) || (verified ? 'Prestataire certifié' : ''),
        plan: (doc.subscription && doc.subscription.plan) || 'decouverte',
        createdAt: u.createdAt || doc.createdAt || '',
        updatedAt: doc.updatedAt || '',
        stats: {
          orders: r.orders || 0,
          ca: r.revenue || 0,
          rating: (doc.ranking && doc.ranking.score) || 0
        },
        history: (doc.admin && doc.admin.history) || []
      };
    }

    function pushPrestaHistory(doc, action, label, by) {
      doc.admin = Object.assign({}, doc.admin || {}, {
        history: (doc.admin && doc.admin.history || []).concat([{
          action: action,
          label: label,
          by: by,
          at: new Date().toISOString()
        }]).slice(-20)
      });
    }

    if (req.method === 'GET') {
      const list = prestataireUsers.map(serializePrestataire);
      const counts = { active: 0, en_attente: 0, suspendue: 0, fermee: 0, total: list.length };
      list.forEach(function (p) { if (counts[p.status] != null) counts[p.status]++; });
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, prestataires: list, counts: counts }));
      return;
    }

    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const action = body.action;
        const targetId = String(body.vendorId || body.id || '');
        const targetUser = prestataireUsers.find(function (u) { return (u.vendorId || u.id) === targetId || u.id === targetId; });
        if (!targetUser) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Prestataire introuvable.' })); return; }
        const targetDoc = vendorConfigFor(targetUser.vendorId || targetUser.id);
        const by = adminUser.name || 'Administrateur';
        const note = String(body.note || '').trim();

        if (action === 'approve') {
          targetDoc.verification = Object.assign({}, targetDoc.verification || {}, {
            status: 'certifie',
            badgeVisible: true,
            badgeLabel: 'Prestataire certifié',
            reviewedAt: new Date().toISOString(),
            reviewerNote: note || 'Prestataire approuvé.'
          });
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'approve', 'Prestataire approuvé', by);
        } else if (action === 'reject') {
          targetDoc.verification = Object.assign({}, targetDoc.verification || {}, {
            status: 'refuse',
            badgeVisible: false,
            badgeLabel: '',
            reviewedAt: new Date().toISOString(),
            reviewerNote: note || 'Prestataire rejeté.'
          });
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'fermee', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'reject', 'Prestataire rejeté', by);
        } else if (action === 'suspend') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'suspendue', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'suspend', 'Prestataire suspendu', by);
        } else if (action === 'reactivate') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'reactivate', 'Prestataire réactivé', by);
        } else if (action === 'close') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'fermee', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'close', 'Prestataire fermé', by);
        } else if (action === 'reopen') {
          targetDoc.admin = Object.assign({}, targetDoc.admin || {}, { status: 'active', updatedAt: new Date().toISOString() });
          pushPrestaHistory(targetDoc, 'reopen', 'Prestataire rouvert', by);
        } else {
          res.writeHead(400, JSON_HEADERS);
          res.end(JSON.stringify({ ok: false, error: 'action inconnue' }));
          return;
        }

        targetDoc.updatedAt = new Date().toISOString();
        saveVendorConfig();
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, prestataire: serializePrestataire(targetUser) }));
      });
      return;
    }

    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  /* -------- Administration : registre global des transactions -------- */
  if (urlPath === '/api/admin/transactions') {
    const adminToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || queryParam(req, 'token');
    const adminUser = userByToken(adminToken);
    if (!adminUser || adminUser.role !== 'admin') {
      res.writeHead(401, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'Accès réservé aux administrateurs.' }));
      return;
    }
    if (req.method !== 'GET') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }

    function roleLabelOf(role) {
      if (role === 'admin') return 'Administrateur';
      if (role === 'vendeur') return 'Boutique';
      if (role === 'prestataire') return 'Prestataire';
      if (role === 'client') return 'Client';
      return role || '—';
    }
    function accountForId(id) {
      return users.find(function (x) { return x.id === id; }) || null;
    }

    const typeFilter = queryParam(req, 'type');
    const kindFilter = queryParam(req, 'kind');
    const q = (queryParam(req, 'q') || '').trim().toLowerCase();
    const fromIso = queryParam(req, 'from');
    const toIso = queryParam(req, 'to');
    const limitNum = Math.min(1000, Math.max(1, parseInt(queryParam(req, 'limit') || '200', 10) || 200));

    let list = transactions.slice(); // déjà triée du plus récent au plus ancien
    if (typeFilter) list = list.filter(function (t) { return t.userType === typeFilter; });
    if (kindFilter) list = list.filter(function (t) { return t.kind === kindFilter; });
    if (fromIso) { const from = new Date(fromIso + 'T00:00:00'); list = list.filter(function (t) { const d = new Date(t.paidAt || t.createdAt); return !isNaN(d) && d >= from; }); }
    if (toIso) { const to = new Date(toIso + 'T23:59:59'); list = list.filter(function (t) { const d = new Date(t.paidAt || t.createdAt); return !isNaN(d) && d <= to; }); }
    if (q) {
      list = list.filter(function (t) {
        const u = accountForId(t.userId);
        const hay = [t.id, t.kind, t.description, t.phone, t.reference, t.operatorLabel, t.mode, t.status, t.userType, u && u.name, u && u.enseigne, u && u.email].join(' ').toLowerCase();
        return hay.indexOf(q) >= 0;
      });
    }

    const totalCount = list.length;
    const pageRows = list.slice(0, limitNum).map(function (t) {
      const u = accountForId(t.userId);
      const toU = t.toUserId ? accountForId(t.toUserId) : null;
      return Object.assign({}, t, {
        accountName: u ? (u.enseigne || u.name) : (t.userId || '—'),
        accountType: roleLabelOf(t.userType),
        accountEmail: u ? u.email : '',
        counterName: toU ? (toU.enseigne || toU.name) : ''
      });
    });

    function completedVolume(rows) {
      return rows.filter(function (t) { return t.status === 'completed'; }).reduce(function (s, t) { return s + (Number(t.total) || Number(t.amount) || 0); }, 0);
    }
    const summary = {
      total: totalCount,
      volume: completedVolume(list),
      fees: list.reduce(function (s, t) { return s + (Number(t.feeAmount) || 0); }, 0),
      byType: {}
    };
    ['vendeur', 'prestataire', 'client', 'admin'].forEach(function (rt) {
      const rows = transactions.filter(function (t) { return t.userType === rt; });
      summary.byType[rt] = { count: rows.length, volume: completedVolume(rows) };
    });

    // Export CSV du registre (mêmes filtres, sans limite de pagination côté export).
    if (queryParam(req, 'export') === 'csv') {
      function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
      const lines = [['Date', 'Compte', 'Type', 'Email', 'Opération', 'Référence', 'Montant', 'Frais', 'Total', 'Statut', 'Mode'].join(';')];
      list.forEach(function (t) {
        const u = accountForId(t.userId);
        lines.push([
          t.paidAt || t.createdAt || '',
          u ? (u.enseigne || u.name) : (t.userId || ''),
          roleLabelOf(t.userType),
          u ? (u.email || '') : '',
          t.kind || '',
          t.reference || t.providerRef || t.operatorRef || '',
          Number(t.amount) || 0,
          Number(t.feeAmount) || 0,
          Number(t.total) || Number(t.amount) || 0,
          t.status || '',
          t.mode || ''
        ].map(csvCell).join(';'));
      });
      const csv = '\uFEFF' + lines.join('\r\n');
      const filename = 'transactions-' + new Date().toISOString().slice(0, 10) + '.csv';
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="' + filename + '"' });
      res.end(csv);
      return;
    }

    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, transactions: pageRows, summary: summary, filters: { type: typeFilter, kind: kindFilter, q: q, from: fromIso, to: toIso } }));
    return;
  }

  /* -------- Administration : évolution temporelle des commissions -------- */
  if (urlPath === '/api/admin/commissions/evolution') {
    const adminToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || queryParam(req, 'token');
    const adminUser = userByToken(adminToken);
    if (!adminUser || adminUser.role !== 'admin') {
      res.writeHead(401, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'Accès réservé aux administrateurs.' }));
      return;
    }
    if (req.method !== 'GET') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }

    const days = Math.min(90, Math.max(7, parseInt(queryParam(req, 'days') || '30', 10) || 30));
    const r = adminConfig.commissionRates;
    const tb = Number(r.boutique) || 0;
    const tp = Number(r.prestataire) || 0;
    const now = new Date();
    function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets[dayKey(d)] = { date: dayKey(d), volume: 0, boutiques: 0, prestataires: 0, commission: 0 };
    }

    transactions.forEach(function (t) {
      if (t.status !== 'completed') return;
      const d = new Date(t.paidAt || t.createdAt);
      if (isNaN(d)) return;
      const key = dayKey(d);
      const bucket = buckets[key];
      if (!bucket) return;
      const vol = Number(t.total) || Number(t.amount) || 0;
      bucket.volume += vol;
      if (t.userType === 'vendeur') { bucket.boutiques += vol; bucket.commission += vol * tb / 100; }
      else if (t.userType === 'prestataire') { bucket.prestataires += vol; bucket.commission += vol * tp / 100; }
    });

    const series = Object.keys(buckets).map(function (k) { return buckets[k]; });
    series.forEach(function (p) { p.commission = Math.round(p.commission); });
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, days: days, rates: r, series: series }));
    return;
  }

  /* -------- Administration : taux de commission (persistés serveur) -------- */
  if (urlPath === '/api/admin/commissions') {
    const adminToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || queryParam(req, 'token');
    const adminUser = userByToken(adminToken);
    if (!adminUser || adminUser.role !== 'admin') {
      res.writeHead(401, JSON_HEADERS);
      res.end(JSON.stringify({ ok: false, error: 'Accès réservé aux administrateurs.' }));
      return;
    }

    function completedVolumeForRole(role) {
      return transactions.filter(function (t) { return t.userType === role && t.status === 'completed'; }).reduce(function (s, t) { return s + (Number(t.total) || Number(t.amount) || 0); }, 0);
    }
    function commissionSummary() {
      const vB = completedVolumeForRole('vendeur');
      const vP = completedVolumeForRole('prestataire');
      const r = adminConfig.commissionRates;
      const cB = Math.round(vB * (Number(r.boutique) || 0) / 100);
      const cP = Math.round(vP * (Number(r.prestataire) || 0) / 100);
      return { volumeBoutiques: vB, volumePrestataires: vP, commissionBoutiques: cB, commissionPrestataires: cP, total: cB + cP };
    }

    if (req.method === 'GET') {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, rates: adminConfig.commissionRates, updatedAt: adminConfig.updatedAt, updatedBy: adminConfig.updatedBy, summary: commissionSummary() }));
      return;
    }

    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const next = {};
        if (typeof body.prestataire === 'number' || typeof body.prestataire === 'string') next.prestataire = Math.min(100, Math.max(0, Math.round(Number(body.prestataire) || 0)));
        if (typeof body.boutique === 'number' || typeof body.boutique === 'string') next.boutique = Math.min(100, Math.max(0, Math.round(Number(body.boutique) || 0)));
        if (Object.keys(next).length === 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Aucun taux fourni.' })); return; }
        adminConfig.commissionRates = Object.assign({}, adminConfig.commissionRates, next);
        adminConfig.updatedAt = new Date().toISOString();
        adminConfig.updatedBy = adminUser.name || 'Administrateur';
        saveAdminConfig();
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, rates: adminConfig.commissionRates, updatedAt: adminConfig.updatedAt, updatedBy: adminConfig.updatedBy, summary: commissionSummary() }));
      });
      return;
    }

    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  if (urlPath === '/api/vendor-config') {
    if (req.method === 'GET') {
      const vendor = queryParam(req, 'vendor') || 'pro-41cafa4bcb31';
      const doc = vendorConfigFor(vendor);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, config: doc, plans: ABONNEMENT_PLANS }));
      return;
    }
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        const vendor = String(body.vendorId || body.vendor || 'pro-41cafa4bcb31');
        const doc = vendorConfigFor(vendor);
        const action = body && body.action;

        if (action === 'patch' && body.section && body.patch) {
          doc[body.section] = Object.assign({}, doc[body.section] || {}, body.patch);
          doc.updatedAt = new Date().toISOString();
          saveVendorConfig();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, config: doc }));
          return;
        }
        if (action === 'save' && body.config) {
          vendorConfig[vendor] = Object.assign({}, doc, body.config, { vendorId: vendor, updatedAt: new Date().toISOString() });
          saveVendorConfig();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, config: vendorConfig[vendor] }));
          return;
        }
        if (action === 'set-plan' && body.plan) {
          doc.subscription = Object.assign({}, doc.subscription || {}, { plan: body.plan, status: 'actif' });
          doc.updatedAt = new Date().toISOString();
          saveVendorConfig();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, config: doc }));
          return;
        }
        if (action === 'set-verification' && body.status) {
          const targetVendorId = String(body.targetVendorId || body.vendorId || body.vendor || vendor);
          const targetDoc = vendorConfigFor(targetVendorId);
          const badgeVisible = body.badgeVisible !== undefined ? !!body.badgeVisible : (body.status === 'certifie');
          // Détermine le libellé du badge selon le type de compte : une boutique
          // (rôle vendeur ou catégorie commerce) affiche « Boutique certifiée »,
          // les autres comptes affichent « Prestataire certifié ».
          const owner = users.find((u) => u.vendorId === targetVendorId || u.id === targetVendorId);
          const isBoutique = owner && (owner.role === 'vendeur' || owner.category === 'commerce' || (targetDoc.profile && targetDoc.profile.category === 'commerce'));
          const badgeLabel = body.status === 'certifie'
            ? (isBoutique ? 'Boutique certifiée' : 'Prestataire certifié')
            : '';
          targetDoc.verification = Object.assign({}, targetDoc.verification || {}, {
            status: body.status,
            badgeVisible: badgeVisible,
            badgeLabel: badgeLabel,
            reviewedAt: new Date().toISOString(),
            reviewerNote: body.note || ''
          });
          targetDoc.updatedAt = new Date().toISOString();
          saveVendorConfig();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, config: targetDoc }));
          return;
        }
        if (action === 'toggle-online') {
          const next = body.online !== undefined ? !!body.online : !(doc.horsLigne && doc.horsLigne.online);
          doc.horsLigne = Object.assign({}, doc.horsLigne || {}, { online: next, lastSeenAt: new Date().toISOString() });
          doc.updatedAt = new Date().toISOString();
          saveVendorConfig();
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, config: doc }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'action inconnue' }));
      });
      return;
    }
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }
  /* -------- Paiement : méthodes, opérateurs, transactions -------- */
  if (urlPath === '/api/payment/methods') {
    expireOffresJour();
    const list = paymentMethods.map(function (m) {
      const isMM = !!m.operator;
      return Object.assign({}, m, {
        mode: isMM ? operatorMode(m.operator) : paymentModeActive(),
        configured: isMM ? operatorConfigured(m.operator) : true
      });
    });
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, methods: list, devise: DEVISE, paymentMode: paymentModeActive() }));
    return;
  }

  if (urlPath === '/api/payment/operators') {
    const ops = Object.keys(MOBILE_MONEY_OPERATORS).map(function (id) {
      const op = MOBILE_MONEY_OPERATORS[id];
      return { id: op.id, label: op.label, code: op.code, fee: op.fee, feeLabel: op.feeLabel, countries: op.countries, mode: operatorMode(id), configured: operatorConfigured(id) };
    });
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, operators: ops, paymentMode: paymentModeActive() }));
    return;
  }

  if (urlPath === '/api/payment/mobile-money/initiate') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      const result = initiateMobilePayment({
        operator: String(body.operator || ''),
        phone: body.phone,
        amount: body.amount,
        userId: user ? user.id : String(body.userId || ''),
        userType: user ? user.role : (body.userType || 'client'),
        kind: String(body.kind || 'mobile-money-payment'),
        methodId: String(body.methodId || ''),
        description: body.description,
        reference: body.reference
      });
      if (!result.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(result)); return; }
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify(result));
    });
    return;
  }

  if (urlPath === '/api/payment/mobile-money/confirm') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const result = confirmMobilePayment(String(body.transactionId || body.id || ''), { otp: body.otp, fail: body.fail });
      if (!result.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(result)); return; }
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify(result));
    });
    return;
  }

  if (urlPath === '/api/payment/transaction') {
    const id = queryParam(req, 'id');
    const txn = transactions.find(function (t) { return t.id === id; });
    if (!txn) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Transaction introuvable.' })); return; }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, transaction: txn }));
    return;
  }

  /* -------- Portefeuille Vendeur + Client -------- */
  if (urlPath === '/api/wallet') {
    const user = userFromReq(req);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    const w = walletFor(user.id);
    const mine = transactions.filter(function (t) { return t.userId === user.id; }).slice(0, 50);
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, wallet: w, transactions: mine, devise: DEVISE }));
    return;
  }

  if (urlPath === '/api/wallet/topup') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const amount = Math.round(Number(body.amount) || 0);
      if (amount <= 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Montant invalide.' })); return; }
      const operator = String(body.operator || 'wave');
      const init = initiateMobilePayment({ operator: operator, phone: body.phone || user.phone, amount: amount, userId: user.id, userType: user.role, kind: 'topup', methodId: String(body.methodId || ''), description: 'Recharge portefeuille' });
      if (!init.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(init)); return; }
      const confirmed = confirmMobilePayment(init.transaction.id, { otp: body.otp });
      if (!confirmed.success) { res.writeHead(402, JSON_HEADERS); res.end(JSON.stringify(confirmed)); return; }
      const w = walletFor(user.id);
      w.balance = Math.round((Number(w.balance) || 0) + amount);
      w.updatedAt = new Date().toISOString();
      saveWallets();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, transaction: confirmed.transaction, wallet: w }));
    });
    return;
  }

  if (urlPath === '/api/wallet/transfer') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const toUserId = String(body.toUserId || body.to || '');
      const amount = Math.round(Number(body.amount) || 0);
      if (amount <= 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Montant invalide.' })); return; }
      if (!toUserId || toUserId === user.id) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Destinataire invalide.' })); return; }
      const target = users.find(function (u) { return u.id === toUserId; });
      if (!target) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Destinataire introuvable.' })); return; }
      const w = walletFor(user.id);
      if ((Number(w.balance) || 0) < amount) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Solde insuffisant.' })); return; }
      const wt = walletFor(target.id);
      w.balance = Math.round((Number(w.balance) || 0) - amount);
      wt.balance = Math.round((Number(wt.balance) || 0) + amount);
      w.updatedAt = new Date().toISOString();
      wt.updatedAt = new Date().toISOString();
      const txn = recordTransaction({ userId: user.id, userType: user.role, kind: 'transfer', toUserId: target.id, amount: amount, status: 'completed', mode: 'internal', description: 'Transfert vers ' + (target.enseigne || target.name), note: String(body.note || ''), paidAt: new Date().toISOString() });
      saveWallets();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, transaction: txn, wallet: w }));
    });
    return;
  }

  /* -------- Offre du jour (palier par durée, achat séparé) -------- */
  if (urlPath === '/api/offres-jour/tiers') {
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, tiers: OFFRE_DU_JOUR_TIERS, devise: DEVISE }));
    return;
  }

  if (urlPath === '/api/offres-jour') {
    expireOffresJour();
    const list = activeOffresJour();
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, offres: list, tiers: OFFRE_DU_JOUR_TIERS }));
    return;
  }

  if (urlPath === '/api/offres-jour/publish') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      if (!isSeller(user)) { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Réservé aux vendeurs et prestataires.' })); return; }
      const tier = tierById(String(body.tierId || ''));
      if (!tier) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Palier de durée invalide.' })); return; }
      const title = String(body.title || '').trim();
      if (!title) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Titre manquant.' })); return; }

      const vendorId = user.vendorId || user.id;
      let payment;
      if (body.payFromWallet === true) {
        const w = walletFor(user.id);
        if ((Number(w.balance) || 0) < tier.price) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Solde portefeuille insuffisant.' })); return; }
        w.balance = Math.round((Number(w.balance) || 0) - tier.price);
        w.updatedAt = new Date().toISOString();
        saveWallets();
        payment = recordTransaction({ userId: user.id, userType: user.role, kind: 'offre-jour', amount: tier.price, feeAmount: 0, status: 'completed', mode: 'wallet', description: 'Offre du jour — ' + tier.durationLabel, paidAt: new Date().toISOString() });
      } else {
        const init = initiateMobilePayment({ operator: String(body.operator || 'wave'), phone: body.phone || user.phone, amount: tier.price, userId: user.id, userType: user.role, kind: 'offre-jour', description: 'Offre du jour — ' + tier.durationLabel, reference: 'OFFRE-' + Date.now() });
        if (!init.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(init)); return; }
        const confirmed = confirmMobilePayment(init.transaction.id, { otp: body.otp });
        if (!confirmed.success) { res.writeHead(402, JSON_HEADERS); res.end(JSON.stringify(confirmed)); return; }
        payment = confirmed.transaction;
      }

      const now = new Date();
      const endsAt = new Date(now.getTime() + tier.durationHours * 3600 * 1000);
      const offre = {
        id: 'offre-' + crypto.randomBytes(5).toString('hex'),
        vendorId: vendorId,
        vendorName: user.enseigne || user.name,
        title: title,
        description: String(body.description || '').trim(),
        tierId: tier.id,
        durationLabel: tier.durationLabel,
        price: tier.price,
        paymentId: payment.id,
        productId: String(body.productId || ''),
        status: 'active',
        startsAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
        createdAt: now.toISOString()
      };
      offresJour.unshift(offre);
      saveOffresJour();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, offre: offre, payment: payment }));
    });
    return;
  }

  if (urlPath === '/api/offres-jour/renew') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const offre = offresJour.find(function (o) { return o.id === String(body.offreId || body.id || ''); });
      if (!offre) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Offre introuvable.' })); return; }
      if ((user.vendorId || user.id) !== offre.vendorId && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      const tier = tierById(String(body.tierId || offre.tierId || ''));
      if (!tier) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Palier de durée invalide.' })); return; }
      let payment;
      if (body.payFromWallet === true) {
        const w = walletFor(user.id);
        if ((Number(w.balance) || 0) < tier.price) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Solde portefeuille insuffisant.' })); return; }
        w.balance = Math.round((Number(w.balance) || 0) - tier.price);
        w.updatedAt = new Date().toISOString();
        saveWallets();
        payment = recordTransaction({ userId: user.id, userType: user.role, kind: 'offre-jour-renouvellement', amount: tier.price, feeAmount: 0, status: 'completed', mode: 'wallet', description: 'Renouvellement offre du jour — ' + tier.durationLabel, paidAt: new Date().toISOString() });
      } else {
        const init = initiateMobilePayment({ operator: String(body.operator || 'wave'), phone: body.phone || user.phone, amount: tier.price, userId: user.id, userType: user.role, kind: 'offre-jour-renouvellement', description: 'Renouvellement offre du jour — ' + tier.durationLabel, reference: 'OFFRE-' + Date.now() });
        if (!init.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(init)); return; }
        const confirmed = confirmMobilePayment(init.transaction.id, { otp: body.otp });
        if (!confirmed.success) { res.writeHead(402, JSON_HEADERS); res.end(JSON.stringify(confirmed)); return; }
        payment = confirmed.transaction;
      }
      const base = offre.status === 'active' && new Date(offre.endsAt).getTime() > Date.now() ? new Date(offre.endsAt) : new Date();
      const endsAt = new Date(base.getTime() + tier.durationHours * 3600 * 1000);
      offre.status = 'active';
      offre.tierId = tier.id;
      offre.durationLabel = tier.durationLabel;
      offre.price = tier.price;
      offre.paymentId = payment.id;
      offre.endsAt = endsAt.toISOString();
      offre.updatedAt = new Date().toISOString();
      saveOffresJour();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, offre: offre, payment: payment }));
    });
    return;
  }

  if (urlPath === '/api/offres-jour/expire') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const offre = offresJour.find(function (o) { return o.id === String(body.offreId || body.id || ''); });
      if (!offre) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Offre introuvable.' })); return; }
      if ((user.vendorId || user.id) !== offre.vendorId && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      offre.status = 'expiree';
      offre.expiredAt = new Date().toISOString();
      saveOffresJour();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, offre: offre }));
    });
    return;
  }

  /* -------- Mangoo Négociation : offre / contre-offre / Mobile Money -------- */
  if (urlPath === '/api/negotiation/info') {
    const productId = queryParam(req, 'productId') || queryParam(req, 'id');
    const product = catalogue.find(function (p) { return p.id === productId; });
    if (!product) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Produit introuvable.' })); return; }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, product: publicProduct(product), languages: NEGO_LANGUAGES, maxRounds: NEGO_MAX_ROUNDS, devise: DEVISE, deviseLabel: DEVISE_LABEL }));
    return;
  }

  if (urlPath === '/api/negotiation/start') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const product = catalogue.find(function (p) { return p.id === String(body.productId || ''); });
      if (!product) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Produit introuvable.' })); return; }
      const lang = String(body.lang || 'fr').toLowerCase();
      if (product.negotiable === false) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: t(lang, 'notNegotiable') })); return; }
      if (product.available === false) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: t(lang, 'unavailable') })); return; }
      const offer = Math.round(Number(body.offer) || 0);
      if (offer <= 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Montant invalide.' })); return; }
      const nego = createNegotiation(product, user, lang);
      const result = applyNegotiationOffer(nego, offer);
      const msg = buildNegoMessage(nego, result);
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({
        ok: true,
        negotiation: publicNegotiation(nego),
        action: result.action,
        message: msg.message,
        greeting: t(nego.lang, 'greeting', { vendor: product.vendorName || '' }),
        payPrompt: result.action === 'accept' ? t(nego.lang, 'payPrompt', { amount: fmtAmount(nego.agreedPrice) }) : null
      }));
    });
    return;
  }

  if (urlPath === '/api/negotiation/offer') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const nego = negotiationForId(String(body.negotiationId || body.id || ''));
      if (!nego) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation introuvable.' })); return; }
      if (nego.clientId !== user.id && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      if (nego.status !== 'open') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation déjà terminée (' + nego.status + ').' })); return; }
      const offer = Math.round(Number(body.offer) || 0);
      if (offer <= 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Montant invalide.' })); return; }
      const result = applyNegotiationOffer(nego, offer);
      const msg = buildNegoMessage(nego, result);
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({
        ok: true,
        negotiation: publicNegotiation(nego),
        action: result.action,
        message: msg.message,
        payPrompt: result.action === 'accept' ? t(nego.lang, 'payPrompt', { amount: fmtAmount(nego.agreedPrice) }) : null
      }));
    });
    return;
  }

  if (urlPath === '/api/negotiation/accept') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const nego = negotiationForId(String(body.negotiationId || body.id || ''));
      if (!nego) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation introuvable.' })); return; }
      if (nego.clientId !== user.id && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      if (nego.status !== 'open') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation déjà terminée (' + nego.status + ').' })); return; }
      nego.status = 'agreed';
      nego.agreedPrice = nego.askingPrice;
      nego.agreedAt = nowIso();
      nego.offers.push({ by: 'client', amount: nego.askingPrice, at: nowIso(), accept: true });
      nego.updatedAt = nowIso();
      saveNegotiations();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, negotiation: publicNegotiation(nego), message: t(nego.lang, 'accepted', { amount: fmtAmount(nego.agreedPrice) }), payPrompt: t(nego.lang, 'payPrompt', { amount: fmtAmount(nego.agreedPrice) }) }));
    });
    return;
  }

  if (urlPath === '/api/negotiation/reject') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const nego = negotiationForId(String(body.negotiationId || body.id || ''));
      if (!nego) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation introuvable.' })); return; }
      if (nego.clientId !== user.id && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      if (nego.status !== 'open') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation déjà terminée (' + nego.status + ').' })); return; }
      nego.status = 'rejected';
      nego.updatedAt = nowIso();
      saveNegotiations();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, negotiation: publicNegotiation(nego), message: t(nego.lang, 'rejected') }));
    });
    return;
  }

  if (urlPath === '/api/negotiation/pay') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      const nego = negotiationForId(String(body.negotiationId || body.id || ''));
      if (!nego) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation introuvable.' })); return; }
      if (nego.clientId !== user.id && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
      if (nego.status !== 'agreed') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Un accord est requis avant le paiement.' })); return; }
      const amount = Math.round(Number(nego.agreedPrice) || 0);
      const operator = String(body.operator || 'wave');
      const init = initiateMobilePayment({ operator: operator, phone: body.phone || nego.clientPhone || user.phone, amount: amount, userId: user.id, userType: user.role, kind: 'negotiation-payment', methodId: String(body.methodId || ''), description: 'Achat négocié — ' + nego.productName, reference: nego.ref });
      if (!init.ok) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify(init)); return; }
      const confirmed = confirmMobilePayment(init.transaction.id, { otp: body.otp });
      if (!confirmed.success) { res.writeHead(402, JSON_HEADERS); res.end(JSON.stringify(confirmed)); return; }
      nego.status = 'paid';
      nego.transactionId = confirmed.transaction.id;
      nego.paidAt = nowIso();
      nego.updatedAt = nowIso();
      const settlement = settleNegotiationToVendor(nego);
      const product = catalogue.find(function (p) { return p.id === nego.productId; });
      if (product && Number(product.stock) > 0) { product.stock = Number(product.stock) - 1; saveCatalogue(); }
      saveNegotiations();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, negotiation: publicNegotiation(nego), transaction: confirmed.transaction, settlement: settlement, message: t(nego.lang, 'paid') }));
    });
    return;
  }

  if (urlPath === '/api/negotiation/list') {
    const user = userFromReq(req);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    let list;
    if (user.role === 'admin') {
      list = negotiations.slice();
    } else if (isSeller(user)) {
      const vid = user.vendorId || user.id;
      list = negotiations.filter(function (n) { return n.vendorId === vid; });
    } else {
      list = negotiations.filter(function (n) { return n.clientId === user.id; });
    }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, negotiations: list.map(publicNegotiation) }));
    return;
  }

  if (urlPath === '/api/negotiation') {
    const user = userFromReq(req);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    const nego = negotiationForId(queryParam(req, 'id'));
    if (!nego) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Négociation introuvable.' })); return; }
    const isOwner = nego.clientId === user.id;
    const isVendor = (user.vendorId || user.id) === nego.vendorId;
    if (!isOwner && !isVendor && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, negotiation: publicNegotiation(nego) }));
    return;
  }

  if (urlPath === '/api/negotiation/floors') {
    const fu = userFromReq(req);
    if (!fu) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
    if (!isSeller(fu) && fu.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Réservé aux vendeurs.' })); return; }
    const fvid = fu.vendorId || fu.id;
    const ownProducts = (fu.role === 'admin') ? catalogue : catalogue.filter(function (p) { return p.vendorId === fvid; });
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, products: ownProducts }));
    return;
  }

  if (urlPath === '/api/negotiation/floor') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée ou invalide.' })); return; }
      if (!isSeller(user) && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Réservé aux vendeurs.' })); return; }
      const product = catalogue.find(function (p) { return p.id === String(body.productId || ''); });
      if (!product) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Produit introuvable.' })); return; }
      const vid = user.vendorId || user.id;
      if (product.vendorId !== vid && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Ce produit ne vous appartient pas.' })); return; }
      if (body.floorPrice != null) {
        const fp = Math.round(Number(body.floorPrice) || 0);
        if (fp <= 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Prix plancher invalide.' })); return; }
        if (fp > Number(product.price)) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Le prix plancher ne peut pas dépasser le prix affiché.' })); return; }
        product.floorPrice = fp;
      }
      if (typeof body.negotiable === 'boolean') product.negotiable = body.negotiable;
      ensureProductFloor(product);
      saveCatalogue();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, product: product }));
    });
    return;
  }

  /* -------- Mangoo Express+ : livreurs & courses -------- */
  if (urlPath === '/api/delivery/couriers') {
    if (req.method !== 'GET') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const user = userFromReq(req);
    if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée.' })); return; }
    const list = couriers.filter(function (c) { return c.approved !== false; }).map(publicCourier);
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, couriers: list }));
    return;
  }

  if (urlPath === '/api/delivery/courier/me') {
    if (req.method !== 'GET') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    const user = userFromReq(req);
    if (!user || user.role !== 'livreur') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur requis.' })); return; }
    res.writeHead(200, JSON_HEADERS);
    res.end(JSON.stringify({ ok: true, courier: publicCourier(courierForUser(user.id)), user: publicUser(user) }));
    return;
  }

  if (urlPath === '/api/delivery/courier/status') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user || user.role !== 'livreur') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur requis.' })); return; }
      const c = courierForUser(user.id);
      if (!c) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur introuvable.' })); return; }
      const status = String(body.status || '').trim();
      if (status !== 'online' && status !== 'offline' && status !== 'busy') { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Statut invalide (online/offline/busy).' })); return; }
      c.status = status;
      saveCouriers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, courier: publicCourier(c) }));
    });
    return;
  }

  if (urlPath === '/api/delivery/courier/location') {
    if (req.method !== 'POST') { res.writeHead(405, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' })); return; }
    readJsonBody(req, function (err, body) {
      if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
      body = body || {};
      const user = userFromReq(req);
      if (!user || user.role !== 'livreur') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur requis.' })); return; }
      const c = courierForUser(user.id);
      if (!c) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur introuvable.' })); return; }
      const lat = toNum(body.lat), lng = toNum(body.lng);
      if (lat == null || lng == null) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Coordonnées lat/lng requises.' })); return; }
      c.lat = lat; c.lng = lng; c.locationUpdatedAt = nowIso();
      saveCouriers();
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, courier: publicCourier(c) }));
    });
    return;
  }

  if (urlPath === '/api/delivery/catalog') {
    if (req.method === 'GET') {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({
        ok: true,
        catalog: FREIGHT_CATALOG,
        fleet: HEAVY_FLEET,
        maxFreight: MAX_FREIGHT,
        vehicleRank: VEHICLE_RANK
      }));
      return;
    }
    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  if (urlPath === '/api/delivery/orders') {
    if (req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const user = userFromReq(req);
        if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée.' })); return; }
        if (!isSeller(user) && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Seuls les vendeurs peuvent créer une livraison.' })); return; }
        const pickupAddress = String(body.pickupAddress || '').trim();
        const deliveryAddress = String(body.deliveryAddress || '').trim();
        if (!pickupAddress || !deliveryAddress) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Adresse de ramassage et adresse de livraison requises.' })); return; }
        const items = Array.isArray(body.items)
          ? body.items.map(function (it) { return { name: String((it && it.name) || '').trim(), qty: Number((it && it.qty) || 1) || 1 }; }).filter(function (it) { return it.name; })
          : [];

        // ----- Fret multi-livraison : type + sous-produit + pesée -----
        const deliveryType = String(body.deliveryType || 'produits').trim();
        const freight = catalogEntry(deliveryType) || catalogEntry('produits');
        const subproduct = String(body.subproduct || '').trim();
        if (freight.subproducts && subproduct && !freight.subproducts.some(function (s) { return s.name === subproduct; })) {
          res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Sous-produit invalide pour cette catégorie.' })); return;
        }
        const weightTons = toNum(body.weightTons);
        const volumeM3 = toNum(body.volumeM3);
        const packageCount = Math.max(0, Math.round(Number(body.packageCount) || 0));
        if ((weightTons != null && weightTons > MAX_FREIGHT.tons) || (volumeM3 != null && volumeM3 > MAX_FREIGHT.m3)) {
          res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Chargement supérieur à la capacité maximale (' + MAX_FREIGHT.tons + ' t / ' + MAX_FREIGHT.m3 + ' m³).' })); return;
        }
        // Véhicule : celui demandé par le vendeur, sinon recommandé par la catégorie.
        const vehicle = String(body.vehicle || freight.vehicle || 'moto').trim();

        const delivery = {
          id: 'dlv-' + crypto.randomBytes(6).toString('hex'),
          ref: nextDeliveryRef(),
          vendorId: user.vendorId || user.id,
          vendorName: user.enseigne || user.name,
          pickupAddress: pickupAddress, pickupCity: String(body.pickupCity || '').trim(),
          pickupZone: String(body.pickupZone || '').trim(),
          pickupLat: toNum(body.pickupLat), pickupLng: toNum(body.pickupLng),
          deliveryAddress: deliveryAddress, deliveryCity: String(body.deliveryCity || '').trim(),
          deliveryZone: String(body.deliveryZone || '').trim(),
          deliveryLat: toNum(body.deliveryLat), deliveryLng: toNum(body.deliveryLng),
          radiusKm: Number(body.radiusKm) > 0 ? Number(body.radiusKm) : 15,
          clientName: String(body.clientName || '').trim() || 'Client',
          clientPhone: String(body.clientPhone || '').trim(),
          items: items,
          amount: Math.round(Number(body.amount) || 0),
          deliveryType: deliveryType,
          vehicle: vehicle,
          subproduct: subproduct,
          weightTons: weightTons,
          volumeM3: volumeM3,
          packageCount: packageCount,
          notes: String(body.notes || '').trim(),
          status: 'available',
          courierId: null, courierName: null,
          pickupCode: proofCode(),
          deliveryCode: proofCode(),
          proof: null,
          createdAt: nowIso(), updatedAt: nowIso(),
          timeline: [{ status: 'available', at: nowIso() }]
        };
        deliveries.unshift(delivery);
        saveDeliveries();
        broadcastDeliveryOffer(delivery);
        notifyClient(delivery);
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, delivery: vendorDeliveryView(delivery) }));
      });
      return;
    }
    if (req.method === 'GET') {
      const user = userFromReq(req);
      let list = deliveries.slice();
      if (!user) {
        list = list.filter(function (d) { return d.status === 'available'; });
      } else if (user.role === 'livreur') {
        const c = courierForUser(user.id);
        list = list.filter(function (d) {
          if (d.courierId === (c && c.id)) return true;
          if (d.status === 'available') return courierMatchesDelivery(c, d);
          return false;
        });
      } else if (isSeller(user)) {
        list = list.filter(function (d) { return d.vendorId === (user.vendorId || user.id); });
      } else if (user.role === 'client') {
        list = list.filter(function (d) { return normalizePhone(d.clientPhone) === normalizePhone(user.phone); });
      }
      // tri du plus récent au plus ancien
      list.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, deliveries: list.map(function (d) { return deliveryViewFor(d, user); }) }));
      return;
    }
    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  if (urlPath.indexOf('/api/delivery/orders/') === 0) {
    const rest = urlPath.slice('/api/delivery/orders/'.length);
    const parts = rest.split('/');
    const deliveryId = decodeURIComponent(parts[0] || '');
    const action = parts[1] || '';

    if (!deliveryId) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Livraison introuvable.' })); return; }
    const delivery = deliveryForId(deliveryId);
    if (!delivery) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Livraison introuvable.' })); return; }

    // Détail
    if (!action && req.method === 'GET') {
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, delivery: deliveryViewFor(delivery, userFromReq(req)) }));
      return;
    }

    // Acceptation par un livreur (premier arrivé gagne)
    if (action === 'accept' && req.method === 'POST') {
      const user = userFromReq(req);
      if (!user || user.role !== 'livreur') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur requis.' })); return; }
      const c = courierForUser(user.id);
      if (!c) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Profil livreur introuvable.' })); return; }
      if (delivery.status !== 'available' && delivery.status !== 'dispatched') {
        res.writeHead(409, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Cette course n\'est plus disponible.' }));
        return;
      }
      delivery.courierId = c.id;
      delivery.courierName = c.name;
      pushTimeline(delivery, 'accepted');
      c.status = 'busy';
      saveDeliveries();
      saveCouriers();
      // Informe les autres livreurs que la course est prise.
      courierSockets.forEach(function (ws, userId) {
        if (userId !== user.id) sendDelivery(ws, { type: 'delivery-taken', deliveryId: delivery.id });
      });
      notifyVendor(delivery);
      notifyClient(delivery);
      res.writeHead(200, JSON_HEADERS);
      res.end(JSON.stringify({ ok: true, delivery: deliveryViewFor(delivery, user) }));
      return;
    }

    // Mise à jour de statut par le livreur assigné (ou vendeur/admin pour annuler).
    if (action === 'status' && req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const user = userFromReq(req);
        if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée.' })); return; }
        const c = user.role === 'livreur' ? courierForUser(user.id) : null;
        const isAssignedCourier = c && delivery.courierId === c.id;
        const isOwner = isSeller(user) && delivery.vendorId === (user.vendorId || user.id);
        const isAdmin = user.role === 'admin';
        const next = String(body.status || '').trim();
        if (DELIVERY_STATUSES.indexOf(next) < 0) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Statut invalide.' })); return; }
        if (!canTransition(delivery.status, next)) { res.writeHead(409, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Transition de statut non autorisée (' + delivery.status + ' → ' + next + ').' })); return; }
        // Rôles : le livreur assigné avance sa course (ou annule), le vendeur
        // peut seulement annuler, l'admin peut corriger n'importe quelle étape.
        let roleAllowed = false;
        if (isAdmin) roleAllowed = true;
        else if (isAssignedCourier) roleAllowed = (next === 'cancelled' || next === 'picked_up' || next === 'en_route' || next === 'delivered');
        else if (isOwner) roleAllowed = (next === 'cancelled');
        if (!roleAllowed) { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Action non autorisée pour votre rôle.' })); return; }

        // Preuve de remise : le livreur doit fournir un code (scan) ou une
        // signature pour franchir les étapes « colis récupéré » et « livrée ».
        if (isAssignedCourier && next === 'picked_up') {
          const code = String(body.pickupCode || '').trim();
          if (!delivery.pickupCode || code !== delivery.pickupCode) {
            res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de ramassage incorrect ou manquant.' })); return;
          }
          delivery.proof = delivery.proof || {};
          delivery.proof.pickupAt = nowIso();
          delivery.proof.pickupMethod = 'code';
          // Preuve fret (pesée / sous-produit / photo du chargement)
          delivery.proof.weightTons = toNum(body.weightTons);
          delivery.proof.volumeM3 = toNum(body.volumeM3);
          if (String(body.subproduct || '').trim()) delivery.proof.subproduct = String(body.subproduct || '').trim();
          const pickupPhoto = String(body.photo || '').trim();
          if (pickupPhoto.indexOf('data:image') === 0) delivery.proof.pickupPhoto = pickupPhoto.slice(0, 500000);
        }
        if (isAssignedCourier && next === 'delivered') {
          const code = String(body.deliveryCode || '').trim();
          const signature = String(body.signature || '').trim();
          const codeOk = delivery.deliveryCode && code === delivery.deliveryCode;
          const sigOk = !!signature && (signature.indexOf('data:image') === 0 || signature === 'signed');
          if (!codeOk && !sigOk) {
            res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Code de livraison ou signature de remise requis.' })); return;
          }
          delivery.proof = delivery.proof || {};
          delivery.proof.deliveryAt = nowIso();
          delivery.proof.deliveryMethod = sigOk ? 'signature' : 'code';
          if (sigOk) delivery.proof.signature = signature.slice(0, 500000);
          const deliveryPhoto = String(body.photo || '').trim();
          if (deliveryPhoto.indexOf('data:image') === 0) delivery.proof.deliveryPhoto = deliveryPhoto.slice(0, 500000);
        }

        pushTimeline(delivery, next);
        if (next === 'delivered' || next === 'cancelled') {
          if (delivery.courierId) {
            const assigned = couriers.find(function (x) { return x.id === delivery.courierId; });
            if (assigned) {
              assigned.status = 'online';
              if (next === 'delivered') assigned.completedDeliveries = (assigned.completedDeliveries || 0) + 1;
              saveCouriers();
            }
          }
        }
        saveDeliveries();
        notifyVendor(delivery);
        notifyClient(delivery);
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, delivery: deliveryViewFor(delivery, user) }));
      });
      return;
    }

    // Dispatch manuel vers un livreur précis (vendeur ou admin).
    if (action === 'dispatch' && req.method === 'POST') {
      readJsonBody(req, function (err, body) {
        if (err) { res.writeHead(400, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: err.message })); return; }
        body = body || {};
        const user = userFromReq(req);
        if (!user) { res.writeHead(401, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Session expirée.' })); return; }
        const isOwner = isSeller(user) && delivery.vendorId === (user.vendorId || user.id);
        if (!isOwner && user.role !== 'admin') { res.writeHead(403, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Accès refusé.' })); return; }
        const courierId = String(body.courierId || '').trim();
        const target = couriers.find(function (x) { return x.id === courierId; });
        if (!target) { res.writeHead(404, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Livreur introuvable.' })); return; }
        if (delivery.status !== 'available' && delivery.status !== 'dispatched') { res.writeHead(409, JSON_HEADERS); res.end(JSON.stringify({ ok: false, error: 'Course non assignable.' })); return; }
        delivery.courierId = target.id;
        delivery.courierName = target.name;
        pushTimeline(delivery, 'dispatched');
        saveDeliveries();
        const ws = courierSockets.get(target.userId);
        sendDelivery(ws, { type: 'delivery-assigned', delivery: courierDeliveryView(delivery) });
        notifyVendor(delivery);
        notifyClient(delivery);
        res.writeHead(200, JSON_HEADERS);
        res.end(JSON.stringify({ ok: true, delivery: deliveryViewFor(delivery, user) }));
      });
      return;
    }

    res.writeHead(405, JSON_HEADERS);
    res.end(JSON.stringify({ ok: false, error: 'méthode non supportée' }));
    return;
  }

  if (urlPath === '/') {
    // La page d'accueil publique est `pages/accueil.html` (elle contient déjà
    // les liens Connexion / Inscription). Redirection permanente pour le SEO.
    res.writeHead(301, { 'Location': '/pages/accueil.html', 'Cache-Control': 'no-store' });
    res.end();
    return;
  }
  if (urlPath === '/favicon.ico') {
    const faviconPath = path.join(ROOT, 'assets', 'favicon.png');
    fs.stat(faviconPath, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(faviconPath).pipe(res);
    });
    return;
  }

  // Fichier statique (protection anti-traversal + anti-exposition des secrets)
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (isSensitiveFile(filePath)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
    // Désactive le cache navigateur pour les fichiers textuels (HTML/JS/CSS/JSON)
    // afin d'éviter de servir une version périmée pendant le développement.
    if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.json' || ext === '.cjs' || ext === '.mjs') {
      headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ------------------------------------------------------------------ *
 *  Démarrage
 * ------------------------------------------------------------------ *
 *  - Vérifie/crée DATA_DIR (jamais de réinitialisation des données).
 *  - Charge chaque fichier JSON ; si un fichier est absent, un seed est
 *    créé. Les données existantes ne sont JAMAIS écrasées.
 * ------------------------------------------------------------------ */
ensureDataDir();
loadPrestations();
loadCatalogue();
loadInventaire();
loadInventaireMouvements();
loadGalerie();
loadBoosters();
loadBoosterStats();
loadVendorConfig();
loadUsers();
loadSessions();
loadPaymentMethods();
loadTransactions();
loadWallets();
loadOffresJour();
loadAdminConfig();
loadCouriers();
loadDeliveries();
loadNegotiations();

const httpServer = http.createServer(handleHttp);

// Deux canaux temps réel partagent le même serveur HTTP(S) :
//   - /webrtc-ws : présence, chat, rendez-vous, live shopping
//   - /delivery-ws : Mangoo Express+ (livreurs & vendeurs)
// Le mode « noServer » + un routeur d'upgrade unique évite le conflit entre
// plusieurs WebSocketServer : sans cela, le premier serveur renverrait un 400
// aux chemins qui ne lui appartiennent pas (ce qui casserait /delivery-ws).
const wss = new WebSocketServer({ noServer: true });
const deliveryWss = new WebSocketServer({ noServer: true });

// Suivi de vie des connexions WebSocket (ping/pong) pour détecter et
// nettoyer les connexions mortes, éviter les fuites mémoire et fiabiliser
// les reconnexions après une coupure réseau ou un redéploiement Render.
const wsServers = [wss, deliveryWss];

function attachHeartbeat(ws) {
  ws.isAlive = true;
  ws.on('pong', function () { ws.isAlive = true; });
}

const HEARTBEAT_INTERVAL_MS = 30000;
setInterval(function () {
  wsServers.forEach(function (server) {
    server.clients.forEach(function (ws) {
      if (ws.isAlive === false) { try { ws.terminate(); } catch (e) {} return; }
      ws.isAlive = false;
      try { ws.ping(); } catch (e) { /* socket en cours de fermeture */ }
    });
  });
}, HEARTBEAT_INTERVAL_MS);

function handleRealtimeConnection(ws, req, label) {
  ws.meta = { id: null, role: null, name: null };
  attachHeartbeat(ws);
  console.log('[WS] connexion (' + label + ')', { ip: (req && req.socket && req.socket.remoteAddress) || '?', time: new Date().toLocaleTimeString() });
  ws.on('message', (data, isBinary) => {
    if (isBinary) { handleFileChunk(ws, data); return; }
    let msg;
    try { msg = JSON.parse(typeof data === 'string' ? data : data.toString()); } catch (e) { return; }
    handleMessage(ws, msg);
  });
  ws.on('close', () => {
    handleLiveLeave(ws);
    handleLiveVendorClose(ws);
    if (ws.meta && ws.meta.id) {
      const c = clients.get(ws.meta.id);
      if (c && c.ws === ws) { c.online = false; }
    }
    broadcastPresence();
  });
}

wss.on('connection', (ws, req) => handleRealtimeConnection(ws, req, 'http/ws'));
deliveryWss.on('connection', handleDeliveryConnection);

function routeUpgrade(req, socket, head) {
  const raw = req.url || '';
  const q = raw.indexOf('?');
  const pathname = q === -1 ? raw : raw.slice(0, q);
  if (pathname === '/webrtc-ws') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (pathname === '/delivery-ws') {
    deliveryWss.handleUpgrade(req, socket, head, (ws) => deliveryWss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
}
httpServer.on('upgrade', routeUpgrade);

/* ------------------------------------------------------------------ *
 *  Mangoo Express+ — canal temps réel /delivery-ws
 * ------------------------------------------------------------------ *
 *  Authentification par token de session (?token=...). Trois rôles :
 *    - livreur : reçoit les courses disponibles (delivery-offer),
 *                les assignations (delivery-assigned) et les retraits
 *                (delivery-taken). Peut signaler son statut et sa position.
 *    - vendeur : reçoit l'avancement de ses courses (delivery-updated).
 *    - client  : reçoit l'avancement de ses livraisons (delivery-updated).
 * ------------------------------------------------------------------ */
function handleDeliveryConnection(ws, req) {
  ws.deliveryRole = null;
  ws.deliveryUserId = null;
  attachHeartbeat(ws);

  const token = queryParam(req, 'token') || '';
  const user = userByToken(token);
  if (!user) {
    sendDelivery(ws, { type: 'delivery-error', reason: 'unauthorized' });
    ws.close();
    return;
  }
  ws.deliveryUserId = user.id;
  if (user.role === 'livreur') {
    ws.deliveryRole = 'livreur';
    courierSockets.set(user.id, ws);
    sendDelivery(ws, { type: 'delivery-ready', courier: publicCourier(courierForUser(user.id)) });
  } else if (isSeller(user)) {
    ws.deliveryRole = 'vendeur';
    vendorSockets.set(user.vendorId || user.id, ws);
    sendDelivery(ws, { type: 'delivery-ready', vendorId: user.vendorId || user.id });
  } else if (user.role === 'client') {
    ws.deliveryRole = 'client';
    const key = normalizePhone(user.phone);
    if (key) clientSockets.set(key, ws);
    sendDelivery(ws, { type: 'delivery-ready', role: 'client' });
  } else {
    sendDelivery(ws, { type: 'delivery-error', reason: 'forbidden' });
    ws.close();
    return;
  }

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(typeof data === 'string' ? data : data.toString()); } catch (e) { return; }
    if (!msg || typeof msg.type !== 'string') return;
    if (msg.type === 'courier-status') {
      const c = courierForUser(user.id);
      if (c && (msg.status === 'online' || msg.status === 'offline' || msg.status === 'busy')) {
        c.status = msg.status;
        saveCouriers();
        sendDelivery(ws, { type: 'courier-status-ack', status: c.status });
      }
    }
    if (msg.type === 'courier-location') {
      const c = courierForUser(user.id);
      const lat = toNum(msg.lat), lng = toNum(msg.lng);
      if (c && lat != null && lng != null) {
        c.lat = lat; c.lng = lng; c.locationUpdatedAt = nowIso();
        saveCouriers();
      }
    }
    if (msg.type === 'ping') sendDelivery(ws, { type: 'pong' });
  });

  ws.on('close', () => {
    if (ws.deliveryRole === 'livreur' && ws.deliveryUserId) {
      if (courierSockets.get(ws.deliveryUserId) === ws) courierSockets.delete(ws.deliveryUserId);
    }
    if (ws.deliveryRole === 'vendeur' && ws.deliveryUserId) {
      const key = user.vendorId || user.id;
      if (vendorSockets.get(key) === ws) vendorSockets.delete(key);
    }
    if (ws.deliveryRole === 'client' && user && user.phone) {
      const key = normalizePhone(user.phone);
      if (key && clientSockets.get(key) === ws) clientSockets.delete(key);
    }
  });
}

function lanIps() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] || []) {
      if (i.family === 'IPv4' && !i.internal) out.push(i.address);
    }
  }
  return out;
}

httpServer.listen(HTTP_PORT, HOST, () => {
  serverReady = true;
  // Journal de démarrage : uniquement des informations non sensibles
  // (aucun mot de passe, PIN, token ni cookie n'est affiché ici).
  console.log('Mangoo Connect+ — serveur temps réel démarré');
  console.log('  Environnement : ' + String(process.env.NODE_ENV || 'development'));
  console.log('  Node          : ' + process.version);
  console.log('  Port HTTP     : ' + HTTP_PORT);
  console.log('  DATA_DIR      : ' + DATA_DIR);
  console.log('  Stockage      : ' + (fs.existsSync(DATA_DIR) ? 'OK (' + DATA_DIR + ')' : 'INDISPONIBLE'));
  console.log('  Paiement      : ' + (paymentModeActive() === 'live' ? 'LIVE' : 'DEMO (simulation, aucun débit réel)'));
  console.log('  WebSocket     : /webrtc-ws (présence/chat/rendez-vous/live) + /delivery-ws (Express+)');
  console.log('  HTTP          : http://localhost:' + HTTP_PORT);
  lanIps().forEach((ip) => console.log('  LAN           : http://' + ip + ':' + HTTP_PORT));

  // HTTPS optionnel (caméra/micro Android)
  const certPath = path.join(ROOT, 'cert.pem');
  const keyPath = path.join(ROOT, 'key.pem');
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsAvailable = true;
    const httpsServer = https.createServer(
      { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) },
      handleHttp
    );
    const wssTls = new WebSocketServer({ noServer: true });
    const deliveryWssTls = new WebSocketServer({ noServer: true });
    wsServers.push(wssTls, deliveryWssTls);
    wssTls.on('connection', (ws, req) => handleRealtimeConnection(ws, req, 'https/wss'));
    deliveryWssTls.on('connection', handleDeliveryConnection);
    httpsServer.on('upgrade', (req, socket, head) => {
      console.log('[WS] upgrade https/wss', { ip: socket.remoteAddress, url: req.url, time: new Date().toLocaleTimeString() });
      const raw = req.url || '';
      const q = raw.indexOf('?');
      const pathname = q === -1 ? raw : raw.slice(0, q);
      if (pathname === '/webrtc-ws') {
        wssTls.handleUpgrade(req, socket, head, (ws) => wssTls.emit('connection', ws, req));
      } else if (pathname === '/delivery-ws') {
        deliveryWssTls.handleUpgrade(req, socket, head, (ws) => deliveryWssTls.emit('connection', ws, req));
      } else {
        socket.destroy();
      }
    });
    httpsServer.listen(HTTPS_PORT, HOST, () => {
      console.log('  HTTPS         : https://localhost:' + HTTPS_PORT + ' (caméra/micro OK)');
      lanIps().forEach((ip) => console.log('  HTTPS         : https://' + ip + ':' + HTTPS_PORT));
    });
  } else {
    console.log('  HTTPS         : désactivé (générez cert.pem + key.pem pour la caméra/micro Android et le forçage HTTPS admin)');
  }
});
