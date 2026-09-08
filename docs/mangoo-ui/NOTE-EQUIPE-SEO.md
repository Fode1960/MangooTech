# Note équipe — SEO & partage social de Mangoo

Date : septembre 2026 · Objet : fondations techniques SEO, rendu serveur des fiches (aperçus de partage) et images de partage dédiées 1200×630

---

## Ce qui a été mis en place

### 1. Fiches boutiques et prestataires (`fiche-boutique.html` / `fiche.html`)

Chaque fiche expose désormais :

- `meta description`, `canonical`, `robots` (index, follow), `theme-color`
- Open Graph complet : `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `og:locale`
- Twitter Card (`summary_large_image`)
- Données structurées Schema.org :
  - `Store` pour les boutiques
  - `ProfessionalService` pour les prestataires
  - avec nom, description, image, téléphone, adresse (ville/pays) et note

Côté navigateur, ces balises sont mises à jour dynamiquement quand la fiche charge les infos du vendeur (titre, description, image, URL canonique, JSON-LD).

### 2. `robots.txt`

Disponible sur `https://mangoo.tech/robots.txt`. Il autorise l'indexation des pages publiques et bloque les espaces privés : connexion/inscription, tableaux de bord (`dashboard-*`), espace client (`client-*`), administration (`admin*`), panier (`checkout`), messagerie (`chat`), livreur, lives vendeur/client et l'API (`/api/`). Il pointe aussi vers le sitemap.

### 3. `sitemap.xml`

Disponible sur `https://mangoo.tech/sitemap.xml`. Généré dynamiquement à chaque requête, il liste :

- les 15 pages publiques (accueil, carte, annuaire, comparatif, lives, blog, aide, FAQ, contact, paiements, pages légales…)
- toutes les fiches boutiques et prestataires (priorité plus élevée `0.9`)

### 4. Rendu serveur des fiches (SSR / pré-rendu) — le point clé

**Pourquoi c'était nécessaire :** les aperçus de partage (WhatsApp, Facebook, Telegram) et certains moteurs **n'exécutent pas le JavaScript**. Avant ce correctif, partager le lien d'une fiche affichait un titre et une image génériques, quel que soit le vendeur.

**Comment c'est résolu :** le serveur intercepte les requêtes vers `fiche.html` et `fiche-boutique.html` lorsqu'elles contiennent `?vendorId=…`. Il résout le vendeur côté serveur et réinjecte les vraies balises (titre, description, image, URL, JSON-LD) dans le HTML **avant** de répondre.

**Résultat concret :** partager le lien d'une boutique affiche désormais son nom, sa description et son image de partage. Google voit aussi ces balises sans avoir à exécuter le JS, ce qui renforce le référencement.

### 5. Images de partage dédiées (1200×630)

Chaque fiche dispose maintenant d'une **image de partage dédiée** au format recommandé par les réseaux sociaux (1200×630), générée côté serveur à la demande :

- `https://mangoo.tech/og/<vendorId>.png` → image de la fiche (nom, catégorie, ville, note, initiales)
- `https://mangoo.tech/og/default.png` → image générique MangooTech (repli)

L'image est un PNG rendu à partir d'un SVG (police Poppins embarquée, couleurs de marque) via `@resvg/resvg-js`, puis **mis en cache** dans `DATA_DIR/og-cache` (régénéré uniquement si le contenu change). Aucun appel réseau au moment du rendu : l'image est servie directement par le serveur.

---

## Comment ça marche (technique, bref)

Tout est dans `server.cjs` (et `og-image.cjs`) :

- **Domaine centralisé** : plus aucun `https://mangoo.tech` en dur dans le code SEO. Le domaine est résolu dynamiquement :
  - `SITE_URL` (variable d'environnement) si définie — recommandé en production ;
  - sinon déduit de la requête via `X-Forwarded-Host`/`Host` + schéma `http(s)` selon `X-Forwarded-Proto`.
  - La fonction `siteBase(req)` centralise cette logique ; sitemap, robots.txt, métadonnées et images OG l'utilisent.
- `resolveVendorForSeo(vendorId)` : retrouve le vendeur via l'annuaire interne.
- `injectFicheSeo(html, vendor, type, id, base)` : remplace les balises `<title>`, `meta description`, Open Graph, Twitter et le bloc JSON-LD dans le HTML servi.
- `serveOgImage(req, res, vendorId)` + route `/og/<vendorId>.png` : génère/sert le PNG de partage (module `og-image.cjs`).
- Une route dédiée, placée avant le gestionnaire de fichiers statiques, sert les fiches avec ces balises injectées.

La logique côté serveur est volontairement identique à celle côté client (fonction `applySeo` dans les pages), pour garantir une cohérence parfaite.

---

## Points d'attention / limites connues

1. **Contenu JavaScript** : le corps de la fiche (catalogue, avis) reste chargé en JS. Google l'exécute et l'indexe, mais l'idéal à terme serait un pré-rendu complet de la page.
2. **Cache des images OG** : les PNG sont mis en cache dans `DATA_DIR/og-cache` (jamais versionné). Si les données d'un vendeur changent (nom, note, ville), le PNG est régénéré automatiquement (cache indexé par le contenu). Veiller à ce que ce dossier vive sur le Persistent Disk en production.
3. **Domaine** : en production, définir `SITE_URL=https://mangoo.tech` (ou le domaine réel) pour des URLs absolues stables. Sans `SITE_URL`, le domaine est déduit de la requête, ce qui fonctionne aussi (y compris multi-domaines `demo.`, `preview.`, `admin.`).

---

## Prochaines étapes recommandées

1. **Vérifier l'indexation** : ajouter le site dans Google Search Console et Bing Webmaster Tools, puis soumettre `https://mangoo.tech/sitemap.xml`.
2. **Contrôler les aperçus** : tester un partage réel via Facebook Sharing Debugger (`developers.facebook.com/tools/debug`) et valider les aperçus WhatsApp/Telegram (l'image 1200×630 doit apparaître).
3. **Contenu longue traîne** : alimenter le blog avec des guides locaux (« ouvrir un salon à Dakar », « combien coûte une livraison ») pour capter les recherches informatives et gagner des backlinks.
4. **Backlinks locaux** : encourager chaque vendeur à lier sa fiche Mangoo depuis son site / Google Business / Facebook.

---

Récapitulatif des commits associés : `ea97dcb` (fondations SEO), `9974f14` (rendu serveur des fiches), puis le commit « domaine centralisé + images de partage 1200×630 ».
