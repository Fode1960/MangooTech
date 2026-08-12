# Architecture MangooTech

> Documentation d'architecture technique - v167 (12/08/2026)

## Vue d'ensemble

MangooTech est une plateforme e-commerce africaine de mise en relation boutiques/prestataires et clients. Elle combine une carte interactive (Local+), du Live Shopping avec streaming WebRTC, une messagerie temps réel, des notifications push, et un système de paiement multi-méthodes.

**Stack :** React + TailwindCSS (frontend monolithe), Node.js/Express (API), WebSocket natif (signalisation WebRTC), Supabase (DB), Stripe/PayPal/Mobile Money (paiements).

---

## Schéma global

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR CLIENT                         │
│  (Edge/Chrome sur PC, Chrome sur Android)                       │
│  mangoo-local.html (1.77 MB monolithe)                          │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Local+   │ Dashboard│ Live     │ Chat     │ Paiement │      │
│  │ Map      │ Presta   │ Shopping │ Connect+ │ Modal    │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└──────────────┬──────────────────────────────────────────────────┘
               │  HTTP/HTTPS + WebSocket
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVEUR STATIQUE : Port 3015                  │
│  serve-dist.cjs (production) / Vite (développement)              │
│                                                                  │
│  Rôle : Servir mangoo-local.html + assets + proxy               │
│  Proxy HTTP  → /api/*, /socket.io  → 3045                       │
│  Proxy WS    → /webrtc-ws         → 3008                        │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌──────────────┐  ┌──────────────────────────────────────────────┐
│ API Express  │  │        WebSocket WebRTC : Port 3008           │
│ Port 3045    │  │  webrtc-websocket-server-3008.js              │
│              │  │                                              │
│ 27 routeurs  │  │  Rôles :                                     │
│ REST +       │  │  • Signalisation WebRTC (offer/answer/ICE)   │
│ Socket.IO    │  │  • Présence vendeurs (online/offline)        │
│ (live, meet) │  │  • Push notifications (web-push)             │
│              │  │  • Live Shopping (rooms, viewers, produits)   │
│              │  │  • Chat Connect+ (messages, historique)       │
│              │  │  • Horaires d'ouverture                       │
└──────┬───────┘  └──────────────┬───────────────────────────────┘
       │                         │
       ▼                         ▼
┌──────────────┐  ┌──────────────────────────────────────────────┐
│   Supabase   │  │         Stockage Fichiers JSON                 │
│ (DB, Auth)   │  │  server/data/                                 │
│              │  │  • local-sync.json (vendors, shops, users)    │
│              │  │  • connect-plus-chat-store.json               │
│              │  │  • push-subscriptions.json                    │
│              │  │  • my-products-*.json                         │
└──────────────┘  └──────────────────────────────────────────────┘
```

---

## Les 3 serveurs

### 1. Serveur Statique — Port 3015

| Propriété | Valeur |
|-----------|--------|
| Fichier | `serve-dist.cjs` (prod), `vite.config.js` (dev) |
| Rôle | Servir le frontend + proxy vers backends |
| Page racine | `mangoo-local.html` |
| Build | `npx vite build` → `dist/` |

**Proxys :**

| Préfixe | Cible | Type |
|---------|-------|------|
| `/api/*` | `http://127.0.0.1:3045` | HTTP |
| `/socket.io` | `http://127.0.0.1:3045` | HTTP + WS |
| `/webrtc-ws` | `http://127.0.0.1:3008` | WebSocket upgrade |

**SPA Fallback :** Toute URL sans extension → `mangoo-local.html`.

### 2. API Express — Port 3045

| Propriété | Valeur |
|-----------|--------|
| Point d'entrée | `server/server.ts` |
| Fichier app | `server/app.ts` |
| Framework | Express.js + Socket.IO |
| Démarrage dev | `npx tsx watch server/server.ts` |

**Familles de routes (27 routeurs) :**

| Famille | Routes clés |
|---------|-------------|
| Authentification | `/api/auth`, `/api/local-sync` |
| Paiements | `/api/payments`, `/api/mobile-money`, `/api/stripe-webhooks`, `/api/paypal` |
| Commandes | `/api/orders`, `/api/live-orders` |
| Boosts | `/api/boosts` |
| Live Shopping | `/api/live-shopping` |
| Produits | `/api/products`, `/api/my-products` |
| Boutiques | `/api/shops`, `/api/shops/simple` |
| Chat | `/api/connect-plus` |
| Admin | `/api/admin/*` (9 routeurs : shops, providers, accounts, commissions, analytics, payments, boosts, pricing-policy, users) |
| Infra | `/api/health`, `/api/local-sync`, `/api/geolocation`, `/api/delivery-tracking`, `/api/routing` |

**Temps réel :**
- `liveShoppingSocket.ts` — Socket.IO pour sessions Live Shopping
- `internalMeetSocket.ts` — Socket.IO pour réunions internes (LiveKit)

### 3. WebSocket WebRTC — Port 3008

| Propriété | Valeur |
|-----------|--------|
| Fichier | `server/servers/webrtc-websocket-server-3008.js` |
| Modules | `webrtc-push-store.js`, `webrtc-live-sessions.js` |
| Démarrage dev | `node server/servers/webrtc-websocket-server-3008.js` |

**25+ types de messages WebSocket :**

| Domaine | Messages |
|---------|----------|
| Présence | `register-presence`, `ping`/`pong` |
| Signalisation WebRTC | `offer`, `answer`, `ice-candidate`, `join-room`, `leave-room` |
| Appels | `call-notification`, `call-accepted`, `call-ended`, `call-routing`, `incoming-call` |
| Chat Connect+ | `chat-message`, `chat-notification`, `chat-routing`, `incoming-chat` |
| Live Shopping | `live:start/stop`, `live:join/leave`, `live:products`, `live:chat`, `live:webrtc-relay`, `live:get-viewers`, `live:vendor-status` |

**Endpoints HTTP sur port 3008 :**

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /push/vapid-public-key` | Clé VAPID |
| `POST /push/subscribe` | Souscription push |
| `GET /presence/check` | Vérifier présence vendeur |
| `GET /chat/history` | Historique chat |
| `GET /hours/check` | Vérifier horaires |

---

## Flux de données

### Stockage

| Niveau | Technologie | Contenu |
|--------|-------------|---------|
| Frontend (cache) | `localStorage` | Vendors, produits, boosts, sessions, configs |
| Backend (fichiers) | `server/data/*.json` | Vendors, shops, users, chat, push subscriptions, produits |
| Backend (cloud) | Supabase | Données principales (utilisateurs, commandes, transactions) |

### Flux Live Shopping

```
Vendeur                         Serveur WS 3008                Client
   │                                  │                           │
   │──── live:start ─────────────────▶│                           │
   │                                  │── live:vendor-status ────▶│ (badge LIVE)
   │                                  │                           │
   │◀─── live:started ───────────────│                           │
   │                                  │                           │
   │                                  │◀── live:join ────────────│
   │◀── live:viewer-joined ──────────│                           │
   │                                  │── live:joined ───────────▶│
   │                                  │                           │
   │──── WebRTC offer ───────────────▶│── WebRTC offer ─────────▶│
   │◀─── WebRTC answer ──────────────│◀── WebRTC answer ────────│
   │◀══════════ Media Stream (P2P) ═══════════════════════════▶│
```

### Flux Appel Privé + Restauration Audio Live

```
Vendeur (en Live)                 Client
   │                                  │
   │◀──── call-notification ─────────│
   │──── call-accepted ──────────────▶│
   │◀══════ Appel Audio (P2P) ═════▶│
   │                                  │
   │──── call-ended ─────────────────▶│
   │                                  │
   │ _lpRestoreLiveMic() v3 :         │
   │ • Close all Live PC connections  │
   │ • Wait 600ms                     │
   │ • getUserMedia({audio:true})     │
   │ • Replace audio track in stream  │
   │ • Rebuild viewer connections     │
   │                                  │
   │◀══════ Live Audio restauré ═══════════════════════════════▶│
```

---

## Arbre du projet

```
MangooTech/
├── public/
│   ├── mangoo-local.html        ← Frontend monolithe (1.77 MB)
│   ├── sw.js                    ← Service Worker (push)
│   ├── test-webrtc-audio.html   ← Test WebRTC
│   └── favicon.svg
├── server/
│   ├── server.ts                ← Point d'entrée API (port 3045)
│   ├── app.ts                   ← Configuration Express
│   ├── routes/                  ← 27 fichiers de routes
│   ├── services/                ← 15 services métier
│   ├── data/                    ← Fichiers JSON (local-sync, chat, push...)
│   └── servers/
│       └── webrtc-websocket-server-3008.js  ← Serveur WS (port 3008)
├── src/                         ← Code React (app principale, composants)
├── serve-dist.cjs               ← Serveur statique production (port 3015)
├── vite.config.js               ← Configuration Vite
├── package.json
└── docs/                        ← Documentation (ce dossier)
    ├── architecture.md
    ├── specs.md
    └── checklist.md
```

---

## Infrastructure externe

| Service | Rôle |
|---------|------|
| **Cloudflare Tunnel** | Exposition HTTPS publique pour tests PC↔Android (`trycloudflare.com`) |
| **Supabase** | Base de données principale, authentification |
| **Stripe** | Paiements par carte |
| **PayPal** | Paiements PayPal |
| **Orange/Moov/MTN/Wave** | Paiements Mobile Money |
| **LiveKit** | Réunions internes (vidéo/audio multi-parties) |
| **Leaflet/OSRM** | Cartographie et calcul d'itinéraires |

---

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance les 3 serveurs en parallèle (Vite + API + WebRTC) |
| `npm run build` | Build production Vite → `dist/` |
| `npm run server:dev` | API uniquement (port 3045) |
| `npm run webrtc:dev` | WebSocket uniquement (port 3008) |

---

## Règles d'ingénierie (19 règles)

Voir [project_memory.md](../.trae/memory/projects/-c-Users-mdans-Documents-MangooTech/project_memory.md) pour la liste complète. Les 3 règles fondamentales :

1. **Cycle strict** : IMPLÉMENTER → TESTER → ATTEINDRE 10/10 → APPROUVER → SUITE
2. **Cloudflare et Supabase sont les références** — ne rien casser de ce qui est validé
3. **REPLACE, pas MERGE** — supprimer le code/données obsolètes, ne pas fusionner avec l'ancien
