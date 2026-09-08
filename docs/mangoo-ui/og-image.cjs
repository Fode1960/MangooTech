#!/usr/bin/env node
'use strict';
/* =========================================================================
   Mangoo Connect+ — générateur d'images de partage (Open Graph) 1200×630
   -------------------------------------------------------------------------
   Rend un SVG déterministe (police Poppins embarquée, couleurs de marque)
   en PNG via @resvg/resvg-js. Les PNG générés sont mis en cache dans
   DATA_DIR/og-cache, nommés par hash de contenu (régénérés uniquement si
   le contenu change). Aucune dépendance réseau au moment du rendu.
   ========================================================================= */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const FONTS_DIR = path.join(ROOT, 'assets', 'fonts');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const CACHE_DIR = path.join(DATA_DIR, 'og-cache');

// Couleurs de marque Mangoo.
const BRAND = {
  primary: '#1a5c2a',
  primaryDark: '#103f1e',
  accent: '#e8610c',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.85)'
};

const FONT_FILES = ['Poppins-Regular.ttf', 'Poppins-SemiBold.ttf', 'Poppins-Bold.ttf'];

let Resvg = null;
try {
  Resvg = require('@resvg/resvg-js').Resvg;
} catch (e) {
  Resvg = null;
}

function resolveFontFiles() {
  return FONT_FILES
    .map(function (f) { return path.join(FONTS_DIR, f); })
    .filter(function (p) { try { return fs.existsSync(p); } catch (e) { return false; } });
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function clip(s, max) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trim() + '\u2026';
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'M';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function stars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '\u2605'.repeat(n) + '\u2606'.repeat(Math.max(0, 5 - n));
}

function ratingLabel(rating) {
  const n = Number(rating);
  if (!isFinite(n) || n <= 0) return '';
  return n.toFixed(1).replace('.', ',');
}

function buildVendorSvg(vendor, opts) {
  const o = opts || {};
  const name = clip(vendor && vendor.name, 24) || 'Prestataire';
  const category = clip((vendor && vendor.category) || (vendor && vendor.type === 'boutique' ? 'Boutique' : 'Prestataire'), 36);
  const location = clip([vendor && vendor.city, vendor && vendor.country].filter(Boolean).join(', '), 42);
  const rating = vendor && vendor.rating != null ? Number(vendor.rating) : null;
  const score = rating != null && rating > 0 ? ratingLabel(rating) : '';
  const starsTxt = rating != null && rating > 0 ? stars(rating) : '';
  const tagline = clip(o.tagline, 64) || 'Connectez-vous à vos prestataires et boutiques de proximité';

  const header = 'Mangoo<tspan fill="' + BRAND.accent + '">Tech</tspan>';

  let ratingBlock;
  if (starsTxt) {
    ratingBlock = '<text x="72" y="478" font-family="Poppins" font-weight="700" font-size="36" fill="' + BRAND.white + '">' + starsTxt +
      (score ? '  <tspan font-size="28" fill="' + BRAND.muted + '">' + score + '/5</tspan>' : '') + '</text>';
  } else {
    ratingBlock = '<text x="72" y="478" font-family="Poppins" font-weight="600" font-size="26" fill="' + BRAND.muted + '">Disponible sur MangooTech</text>';
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\n' +
    '  <defs>\n' +
    '    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">\n' +
    '      <stop offset="0" stop-color="' + BRAND.primary + '"/>\n' +
    '      <stop offset="1" stop-color="' + BRAND.primaryDark + '"/>\n' +
    '    </linearGradient>\n' +
    '    <radialGradient id="glow" cx="0.86" cy="0.12" r="0.75">\n' +
    '      <stop offset="0" stop-color="' + BRAND.accent + '" stop-opacity="0.55"/>\n' +
    '      <stop offset="1" stop-color="' + BRAND.accent + '" stop-opacity="0"/>\n' +
    '    </radialGradient>\n' +
    '  </defs>\n' +
    '  <rect width="1200" height="630" fill="url(#bg)"/>\n' +
    '  <rect width="1200" height="630" fill="url(#glow)"/>\n' +
    '  <circle cx="1090" cy="120" r="250" fill="' + BRAND.accent + '" opacity="0.10"/>\n' +
    '  <circle cx="70" cy="590" r="190" fill="#ffffff" opacity="0.05"/>\n' +
    '  <circle cx="240" cy="40" r="8" fill="#ffffff" opacity="0.25"/>\n' +
    '  <circle cx="480" cy="610" r="5" fill="#ffffff" opacity="0.20"/>\n' +
    '\n' +
    '  <text x="72" y="96" font-family="Poppins" font-weight="700" font-size="30" fill="' + BRAND.white + '">' + header + '</text>\n' +
    '  <text x="72" y="128" font-family="Poppins" font-weight="400" font-size="17" fill="' + BRAND.muted + '">' + esc(tagline) + '</text>\n' +
    '\n' +
    '  <rect x="72" y="156" width="64" height="6" rx="3" fill="' + BRAND.accent + '"/>\n' +
    '  <text x="72" y="206" font-family="Poppins" font-weight="600" font-size="24" fill="' + BRAND.accent + '">' + esc(category) + '</text>\n' +
    '\n' +
    '  <text x="72" y="316" font-family="Poppins" font-weight="700" font-size="64" fill="' + BRAND.white + '">' + esc(name) + '</text>\n' +
    '  <text x="72" y="372" font-family="Poppins" font-weight="400" font-size="26" fill="' + BRAND.muted + '">' + esc(location) + '</text>\n' +
    '\n' +
    ratingBlock + '\n' +
    '\n' +
    '  <circle cx="1020" cy="380" r="118" fill="#ffffff" opacity="0.08"/>\n' +
    '  <circle cx="1020" cy="380" r="92" fill="#ffffff" opacity="0.14"/>\n' +
    '  <text x="1020" y="414" font-family="Poppins" font-weight="700" font-size="68" fill="' + BRAND.white + '" text-anchor="middle">' + esc(initials(name)) + '</text>\n' +
    '</svg>\n';
}

function buildDefaultSvg(opts) {
  const o = opts || {};
  const tagline = clip(o.tagline, 64) || 'Connectez-vous à vos prestataires et boutiques de proximité';
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\n' +
    '  <defs>\n' +
    '    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">\n' +
    '      <stop offset="0" stop-color="' + BRAND.primary + '"/>\n' +
    '      <stop offset="1" stop-color="' + BRAND.primaryDark + '"/>\n' +
    '    </linearGradient>\n' +
    '    <radialGradient id="glow" cx="0.5" cy="0.4" r="0.9">\n' +
    '      <stop offset="0" stop-color="' + BRAND.accent + '" stop-opacity="0.30"/>\n' +
    '      <stop offset="1" stop-color="' + BRAND.accent + '" stop-opacity="0"/>\n' +
    '    </radialGradient>\n' +
    '  </defs>\n' +
    '  <rect width="1200" height="630" fill="url(#bg)"/>\n' +
    '  <rect width="1200" height="630" fill="url(#glow)"/>\n' +
    '  <circle cx="600" cy="315" r="230" fill="#ffffff" opacity="0.05"/>\n' +
    '  <circle cx="600" cy="315" r="180" fill="#ffffff" opacity="0.06"/>\n' +
    '  <circle cx="600" cy="315" r="130" fill="#ffffff" opacity="0.08"/>\n' +
    '  <text x="600" y="286" font-family="Poppins" font-weight="700" font-size="96" fill="' + BRAND.white + '" text-anchor="middle">Mangoo<tspan fill="' + BRAND.accent + '">Tech</tspan></text>\n' +
    '  <text x="600" y="360" font-family="Poppins" font-weight="400" font-size="28" fill="' + BRAND.muted + '" text-anchor="middle">' + esc(tagline) + '</text>\n' +
    '  <text x="600" y="430" font-family="Poppins" font-weight="600" font-size="22" fill="' + BRAND.accent + '" text-anchor="middle">Prestataires \u00b7 Boutiques \u00b7 Livraison</text>\n' +
    '</svg>\n';
}

function renderPng(vendor, opts) {
  if (!Resvg) return null;
  const svg = vendor ? buildVendorSvg(vendor, opts) : buildDefaultSvg(opts);
  const hash = crypto.createHash('sha256').update(svg, 'utf8').digest('hex').slice(0, 16);
  const cacheFile = path.join(CACHE_DIR, hash + '.png');

  try {
    if (fs.existsSync(cacheFile)) {
      const cached = fs.readFileSync(cacheFile);
      if (cached && cached.length) return cached;
    }
  } catch (e) { /* cache en lecture seule : on régénère */ }

  let png = null;
  try {
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        fontFiles: resolveFontFiles(),
        loadSystemFonts: false,
        defaultFontFamily: 'Poppins'
      }
    });
    png = resvg.render().asPng();
  } catch (e) {
    console.error('[OG] rendu SVG \u2192 PNG impossible :', e.message);
    return null;
  }

  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, png);
  } catch (e) { /* cache optionnel */ }

  return Buffer.from(png);
}

module.exports = { renderPng };
