#!/usr/bin/env node
/* =========================================================================
   Mangoo Connect+ — sauvegarde locale des données (DATA_DIR)
   -------------------------------------------------------------------------
   Objectif : produire une archive horodatée du répertoire de données,
   sans jamais modifier les fichiers d'origine, et gérer la rétention.

   Usage :
     node backup-data.cjs

   Configuration par variables d'environnement (fichier .env optionnel) :
     BACKUP_ENABLED         true pour activer (défaut : false)
     BACKUP_DIR             dossier de destination (défaut : <DATA_DIR>/backups)
     BACKUP_RETENTION_DAYS  nombre de jours de conservation (défaut : 7)

   ATTENTION — limite connue :
     Cette sauvegarde LOCALE ne protège pas contre une perte du serveur
     lui-même (disque perdu = sauvegarde perdue). La prochaine étape est
     l'envoi des archives vers un stockage externe (Cloudflare R2, S3,
     Backblaze B2 ou équivalent).

   Préparation Render :
     - Le script est autonome (aucune dépendance externe, Node natif).
     - Utilisable directement par un Render Cron Job :
         commande : node backup-data.cjs
         BACKUP_ENABLED=true  (et BACKUP_DIR pointant sur un volume si besoin)
   ========================================================================= */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = __dirname;

// Charge un éventuel fichier .env local sans écraser l'environnement.
(function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(function (line) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) return;
      const key = m[1];
      if (process.env[key] !== undefined) return;
      let val = m[2];
      if (val.length >= 2 && ((val[0] === '"' && val[val.length - 1] === '"') || (val[0] === "'" && val[val.length - 1] === "'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    });
  } catch (e) { console.error('[Backup] lecture .env impossible :', e.message); }
})();

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const BACKUP_ENABLED = String(process.env.BACKUP_ENABLED || 'false').toLowerCase() === 'true';
// Par défaut, les archives sont stockées SOUS DATA_DIR (ex. /app/data/backups)
// afin de vivre sur le Persistent Disk Render, et non dans l'espace éphémère du
// conteneur. BACKUP_DIR peut être redirigé vers un emplacement persistant dédié.
const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR || path.join(DATA_DIR, 'backups'));
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10) || 7;

// --- Sauvegarde externe (S3-compatible : Cloudflare R2 / S3 / Backblaze B2) ---
const BACKUP_EXTERNAL = String(process.env.BACKUP_EXTERNAL || 'false').toLowerCase() === 'true';
const S3_ENDPOINT = String(process.env.BACKUP_S3_ENDPOINT || '').replace(/\/+$/, '');
const S3_BUCKET = String(process.env.BACKUP_S3_BUCKET || '');
const S3_REGION = String(process.env.BACKUP_S3_REGION || 'auto');
const S3_ACCESS_KEY = String(process.env.BACKUP_S3_ACCESS_KEY_ID || '');
const S3_SECRET_KEY = String(process.env.BACKUP_S3_SECRET_ACCESS_KEY || '');

function log(msg) { console.log('[Backup]', msg); }

function collectDataFiles() {
  const files = {};
  let count = 0;
  for (const entry of fs.readdirSync(DATA_DIR)) {
    if (!entry.endsWith('.json')) continue;
    if (entry.indexOf('.tmp-') !== -1) continue; // fichiers temporaires d'écriture atomique
    const p = path.join(DATA_DIR, entry);
    try {
      const raw = fs.readFileSync(p, 'utf8');
      JSON.parse(raw); // valide le JSON avant archivage
      files[entry] = raw;
      count++;
    } catch (e) {
      log('AVERTISSEMENT : fichier ignoré (illisible/corrompu) ' + entry + ' : ' + e.message);
    }
  }
  return { files, count };
}

function cleanupOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;
  const now = Date.now();
  const limit = RETENTION_DAYS * 24 * 3600 * 1000;
  let removed = 0;
  for (const entry of fs.readdirSync(BACKUP_DIR)) {
    if (entry.indexOf('mangoo-backup-') !== 0 || !entry.endsWith('.json.gz')) continue;
    const p = path.join(BACKUP_DIR, entry);
    try {
      if (now - fs.statSync(p).mtimeMs > limit) { fs.unlinkSync(p); removed++; }
    } catch (e) { log('AVERTISSEMENT : nettoyage impossible ' + entry + ' : ' + e.message); }
  }
  if (removed > 0) log('rétention : ' + removed + ' ancienne(s) archive(s) supprimée(s) (conservation ' + RETENTION_DAYS + ' j).');
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

// Signe une requête PUT object S3 avec AWS Signature Version 4.
function awsSignV4(accessKey, secretKey, region, service, method, url, payload, contentType, amzDate) {
  const u = new URL(url);
  const host = u.host;
  const canonicalUri = u.pathname;
  const canonicalQuery = u.search ? u.search.slice(1) : '';
  const payloadHash = sha256Hex(payload);
  const headers = {
    'content-type': contentType,
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate
  };
  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedKeys.map(function (k) { return k + ':' + String(headers[k]).trim() + '\n'; }).join('');
  const signedHeaders = sortedKeys.join(';');
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const dateStamp = amzDate.slice(0, 8);
  const scope = dateStamp + '/' + region + '/' + service + '/aws4_request';
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256Hex(canonicalRequest)].join('\n');
  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
  const authorization = 'AWS4-HMAC-SHA256 Credential=' + accessKey + '/' + scope + ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;
  return { payloadHash: payloadHash, authorization: authorization };
}

// Upload une archive vers le bucket externe (timestamp + latest.json.gz).
async function uploadExternal(key, body) {
  if (!BACKUP_EXTERNAL) return;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    log('AVERTISSEMENT : upload externe activé mais paramètres S3 incomplets — ignoré.');
    return;
  }
  const amzDate = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const contentType = 'application/gzip';
  const url = S3_ENDPOINT + '/' + S3_BUCKET + '/' + encodeURIComponent(key);
  const sig = awsSignV4(S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, 's3', 'PUT', url, body, contentType, amzDate);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
      'x-amz-content-sha256': sig.payloadHash,
      'x-amz-date': amzDate,
      'Authorization': sig.authorization
    },
    body: body
  });
  if (!res.ok) {
    throw new Error('upload S3 ' + key + ' : HTTP ' + res.status + ' ' + (res.statusText || ''));
  }
  log('upload externe : ' + key + ' (' + body.length + ' octets)');
}

async function run() {
  if (!BACKUP_ENABLED) {
    log('désactivé (BACKUP_ENABLED != true). Rien à faire.');
    return 0;
  }
  if (!fs.existsSync(DATA_DIR)) {
    log('ERREUR : DATA_DIR introuvable : ' + DATA_DIR);
    return 1;
  }

  // 1. Collecte (lecture seule, ne modifie jamais les données).
  const { files, count } = collectDataFiles();

  // 2. Archive horodatée compressée (gzip).
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = 'mangoo-backup-' + stamp + '.json.gz';
  const payload = JSON.stringify({
    createdAt: new Date().toISOString(),
    dataDir: DATA_DIR,
    files: files
  }, null, 2);
  const gz = zlib.gzipSync(payload, { level: 9 });

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const dest = path.join(BACKUP_DIR, archiveName);
  fs.writeFileSync(dest, gz);

  // 3. Vérification de l'archive.
  const stat = fs.statSync(dest);
  if (!stat.isFile() || stat.size === 0) {
    log('ERREUR : archive vide ou non créée : ' + dest);
    return 1;
  }
  log('archive créée : ' + dest + ' (' + stat.size + ' octets, ' + count + ' fichier(s) JSON)');

  // 4. Upload externe (R2/S3/B2), si activé.
  await uploadExternal(archiveName, gz);
  await uploadExternal('latest.json.gz', gz);

  // 5. Rétention.
  cleanupOldBackups();
  return 0;
}

(async function main() {
  try {
    process.exit(await run());
  } catch (e) {
    log('ERREUR FATALE : ' + e.message);
    process.exit(1);
  }
})();
