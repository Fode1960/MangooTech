# Note équipe — SEO & partage social de Mangoo

Date : septembre 2026 · Objet : fondations techniques SEO + rendu serveur des fiches (aperçus de partage)

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

**Comment c'est résolu :** le serveur intercepte les requêtes vers `fiche.html` et `fiche-boutique.html` lorsqu'elles contiennent `?vendorId=…`. Il résout le vendeur côté serveur et réinjecte les vraies balises (titre, description, image = logo du vendeur, URL, JSON-LD) dans le HTML **avant** de répondre.

**Résultat concret :** partager le lien d'une boutique affiche désormais son nom, sa description et son logo. Google voit aussi ces balises sans avoir à exécuter le JS, ce qui renforce le référencement.

---

## Comment ça marche (technique, bref)

Tout est dans `server.cjs` :

- `SITE_BASE` : domaine de référence, configurable via la variable d'environnement `SITE_URL` (défaut `https://mangoo.tech`).
- `resolveVendorForSeo(vendorId)` : retrouve le vendeur via l'annuaire interne.
- `injectFicheSeo(html, vendor, type, id)` : remplace les balises `<title>`, `meta description`, Open Graph, Twitter et le bloc JSON-LD dans le HTML servi.
- Une route dédiée, placée avant le gestionnaire de fichiers statiques, sert les fiches avec ces balises injectées.

La logique côté serveur est volontairement identique à celle côté client (fonction `applySeo` dans les pages), pour garantir une cohérence parfaite.

---

## Points d'attention / limites connues

1. **Image de partage** : l'`og:image` utilise actuellement le **logo du vendeur**. Ce n'est pas une image au format idéal 1200×630. Amélioration possible : générer une image de partage dédiée par fiche (nom + logo + ville) pour des aperçus encore plus soignés.
2. **Domaine codé en dur** : le domaine `https://mangoo.tech` est aussi présent dans les fichiers clients (`fiche.html`, `fiche-boutique.html`) et dans le sitemap. En cas de changement de domaine, il faut régler `SITE_URL` **et** mettre à jour ces fichiers.
3. **Contenu JavaScript** : le corps de la fiche (catalogue, avis) reste chargé en JS. Google l'exécute donc l'indexe, mais l'idéal à terme serait un pré-rendu complet de la page.

---

## Prochaines étapes recommandées

1. **Vérifier l'indexation** : ajouter le site dans Google Search Console et Bing Webmaster Tools, puis soumettre `https://mangoo.tech/sitemap.xml`.
2. **Contrôler les aperçus** : tester un partage réel via Facebook Sharing Debugger (`developers.facebook.com/tools/debug`) et valider les aperçus WhatsApp/Telegram.
3. **Image de partage dédiée** (1200×630) par fiche, pour un rendu optimal.
4. **Contenu longue traîne** : alimenter le blog avec des guides locaux (« ouvrir un salon à Dakar », « combien coûte une livraison ») pour capter les recherches informatives et gagner des backlinks.
5. **Backlinks locaux** : encourager chaque vendeur à lier sa fiche Mangoo depuis son site / Google Business / Facebook.

---

Récapitulatif des commits associés : `ea97dcb` (fondations SEO) et `9974f14` (rendu serveur des fiches).
