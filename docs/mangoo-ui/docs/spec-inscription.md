# Mini-spécification — Module Inscription & Authentification

> État : **implémenté** dans `server.cjs` + `pages/auth.html` + `pages/forgot-password.html`.
> Objectif : système de comptes réel (connexion/création/récupération), interconnecté aux pages Vendeur et Admin.

## 1. Rôles

| Rôle | Qui | Droits clés |
| --- | --- | --- |
| `client` | Utilisateur qui cherche des commerces | Consulter la carte, les fiches, chatter, commander |
| `prestataire` | Professionnel de service (boutique) | Gérer sa boutique, prestations, stock, promotions, live, boosters |
| `admin` | Équipe Mangoo Tech | Valider les certifications, modérer, gérer les comptes |

Le rôle `admin` n'est **jamais** attribuable en libre inscription : il est défini manuellement côté serveur.

## 2. Méthode de connexion (implémentée)

Le prestataire peut se connecter **au choix** :

- **Par téléphone + PIN à 4 chiffres** — méthode simple, adaptée aux utilisateurs peu lettrés (héritée de l'ancienne version Android).
- **Par email + mot de passe** — pour ceux qui préfèrent la méthode classique.

La bascule entre les deux se fait dans le formulaire de connexion.

## 3. Champs d'inscription (implémentés)

### Commun à tous les comptes
- Nom complet (obligatoire)
- Téléphone (obligatoire, unique, format international `+221...` / `+225...`)
- PIN à 4 chiffres (obligatoire, sert à la connexion)
- Email (optionnel, unique, format validé)
- Ville (obligatoire — alimente le scope Local+)
- Acceptation CGU (obligatoire)

### Compte professionnel (prestataire) — en plus
- Nom de l'enseigne (obligatoire)
- Catégorie (`salon`, `couture`, `restauration`, `artisanat`, `reparation`, `commerce`, `autre`)
- **Logo de la boutique** (optionnel, upload image → injecté dans la fiche boutique)

## 4. Sécurité (implémentée)

- Mots de passe et PIN **hachés** via `crypto.scryptSync` natif de Node (aucune dépendance npm). Jamais stockés en clair.
- Sessions par **token** (`crypto.randomBytes`), persistées dans `data/sessions.json`.
- Comptes persistés dans `data/users.json`.
- Comparaison des secrets en temps constant (`timingSafeEqual`).
- Email et téléphone **uniques** (rejet `409` si déjà utilisés).

## 5. Récupération de compte (mot de passe oublié « par PIN »)

Parcours en 3 étapes sur `pages/forgot-password.html` :

1. Saisir le numéro de téléphone → un **code à 6 chiffres** est généré (valable 10 min, stocké en mémoire).
2. Saisir le code reçu (en production : envoyé par SMS ; en démo : affiché à l'écran).
3. Définir un **nouveau PIN à 4 chiffres** + confirmation.

## 6. Guidance vocale (accessibilité)

Chaque formulaire (`auth.html`, `forgot-password.html`) propose un bouton « Écouter les instructions » utilisant `speechSynthesis` en `fr-FR`, pour guider les prestataires peu lettrés.

## 7. Endpoints REST (implémentés)

| Méthode | Route | Rôle | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Créer un compte (client ou prestataire) |
| POST | `/api/auth/login` | public | Connexion par PIN (`mode: pin`) ou email (`mode: password`) |
| GET | `/api/auth/me` | connecté | Renvoie l'utilisateur courant (via token) |
| POST | `/api/auth/logout` | connecté | Révoque la session |
| POST | `/api/auth/request-pin-reset` | public | Demande un code de réinitialisation (par téléphone) |
| POST | `/api/auth/reset-pin` | public | Valide le code et définit un nouveau PIN |

## 8. Comptes de démonstration

| Rôle | Nom | Téléphone | Email | PIN | Mot de passe |
| --- | --- | --- | --- | --- | --- |
| Prestataire | Amina Diop — « Chez Amina » | `+221 33 821 12 34` | `contact@chezamina.sn` | `2580` | `amina2026` |
| Admin | Administrateur Mangoo | `+225 00 000 00 00` | `admin@mangootech.com` | `0000` | `admin2026` |

> Ces comptes sont créés automatiquement au premier démarrage du serveur (seed), sauf si `data/users.json` existe déjà.

## 9. Redirection après connexion

| Rôle | Page cible |
| --- | --- |
| `prestataire` | `dashboard-overview.html` |
| `client` | `client-dashboard.html` |
| `admin` | `admin.html` |

## 10. Interconnexion modules

- À la création d'un compte `prestataire`, un document `vendor-config` lui est automatiquement créé (nom d'enseigne, catégorie, ville, logo), de sorte que son dashboard soit alimenté dès la première connexion.
- Le logo uploadé est enregistré dans le profil et affiché sur la fiche boutique.

## 11. Évolutions non encore implémentées (piste)

- Vérification de l'email pour activer le compte.
- Rate-limiting sur la connexion (anti force-brute).
- Certification « Prestataire certifié » validée par un admin (la structure `verification` existe déjà côté config).
- JWT à expiration + refresh token (actuellement : token opaque simple).
