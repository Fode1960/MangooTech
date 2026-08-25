#!/usr/bin/env node
'use strict';

/*
 * Régénère un fichier .env local avec des secrets forts.
 * Ne s'applique qu'au PREMIER démarrage (data/users.json absent).
 *
 * Usage :  node scripts/generate-env.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');

function genPassword() {
  return crypto.randomBytes(24).toString('base64url');
}
function genPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const email = process.env.ADMIN_EMAIL || 'admin@mangootech.com';
const password = process.env.ADMIN_PASSWORD || genPassword();
const pin = process.env.ADMIN_PIN || genPin();

const content = [
  '# Fichier généré automatiquement — NE PAS COMMITTER (ignoré par .gitignore)',
  'PORT=8080',
  'HTTPS_PORT=8443',
  '',
  'ADMIN_EMAIL=' + email,
  'ADMIN_PASSWORD=' + password,
  'ADMIN_PIN=' + pin,
  '',
  'FORCE_HTTPS_ADMIN=true',
  ''
].join('\n');

fs.writeFileSync(ENV_PATH, content, 'utf8');

console.log('============================================================');
console.log('  .env généré : ' + ENV_PATH);
console.log('  Email    : ' + email);
console.log('  Mot de passe : ' + password);
console.log('  PIN      : ' + pin);
console.log('  (conservez ces identifiants, ils ne sont jamais réaffichés)');
console.log('============================================================');
