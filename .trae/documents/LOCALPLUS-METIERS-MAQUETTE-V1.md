# Maquette logique — Local+ Métiers (V1)

Objectif: intégrer de nouveaux métiers (services du quotidien) dans le Local+ existant **sans rien casser**.

Contraintes validées:
- Le concept Local+ actuel reste inchangé; tout ajout est **additif**.
- Le canal principal de contact est **Mangoo Connect+**.
- Sur la carte: **1 prestataire = 1 pin** = atelier / quartier de base.
- Pour “Se déplace”: en liste **badge uniquement**; détail quartiers dans la fiche.

---

## 1) Modèle mental (Boussole Mangoo)

En 3 secondes, l’utilisateur doit comprendre:
1) Je choisis un **métier**.
2) Je vois les prestataires **près de moi**.
3) Je contacte via **Mangoo Connect+**.

---

## 2) Écrans (wireframes)

### Écran A — Local+ (Carte + Liste)

```
┌──────────────────────────────────────────────────────┐
│ Recherche: [ Plombier, Tailleur, Réparateur… ]  (⋯)   │  ← (⋯) = Filtres
├──────────────────────────────────────────────────────┤
│ Familles (chips horizontales):                         │
│ [Bâtiment] [Auto/Moto] [Réparation] [Mode] [Bois] ... │
│ Filtres rapides: [🚗 Se déplace] [✅ Vérifié] [⏱️ Dispo] │
├──────────────────────────────────────────────────────┤
│                    CARTE (pins)                        │
│  - 1 pin = atelier/quartier base                        │
│  - pas de cercles/rayons par défaut                     │
├──────────────────────────────────────────────────────┤
│ LISTE (cards)                                          │
│ [Nom]  Métier principal • 1,2 km                        │
│ Badges (max 2): ✅ Vérifié  🚗 Se déplace  (+2)          │
│ Actions: [Mangoo Connect+] [Appeler] [Itinéraire]       │
└──────────────────────────────────────────────────────┘
```

Règles d’affichage:
- Si aucun filtre: comportement actuel Local+.
- Si Famille sélectionnée: filtre par `category`.
- Si Métier sélectionné (via Filtres): filtre par `trade` (ou `tags`).
- Badges visibles sur card: **max 2**, le reste dans la fiche.

---

### Écran B — Panneau Filtres

```
┌────────────── Filtres ───────────────┐
│ Famille:  (Bâtiment & Dépannage)     │
│ Métier:   (Plombier)                 │
│ Distance: (2 km | 5 km | 10 km)      │
│ Toggles:  [x] Se déplace             │
│           [ ] Disponible maintenant  │
│           [ ] Vérifié                │
│                                      │
│           [ Appliquer ]              │
└──────────────────────────────────────┘
```

Règles:
- La liste “Métier” dépend de la “Famille”.
- “Distance” influence le tri/filtrage, mais ne change pas la carte.

---

### Écran C — Fiche Prestataire (Sheet)

```
┌────────────────────────────────────────┐
│ Nom prestataire • Métier • Quartier    │
│ Badges: ✅ 🚗 ⚡ 🛍️ 📄 ⭐               │
│ Actions: [Mangoo Connect+] [Appeler]   │
│          [Itinéraire]                  │
├────────────────────────────────────────┤
│ Services proposés                      │
│ Zone couverte                          │
│  - 🚗 Se déplace                        │
│  - Quartiers: Koumassi, Marcory, ...   │
│  - Rayon (option): 5 km                │
│ Horaires                               │
│ Portfolio (photos)                     │
│ Avis                                   │
├────────────────────────────────────────┤
│ Onglets optionnels (si applicable):    │
│ [Produits] (🛍️)   [Profil] (📄)        │
└────────────────────────────────────────┘
```

Règles:
- “Quartiers couverts” n’apparaît **pas** sur la card liste, uniquement ici.
- Onglet “Produits” uniquement si une mini-boutique est active.
- Onglet “Profil” uniquement si une fiche mini-site existe.

---

### Écran D — Mangoo Connect+

```
┌──────────── Mangoo Connect+ ───────────┐
│ Message pré-rempli:                     │
│ "Bonjour, je cherche un [métier] à      │
│ [quartier]. Disponible ?"               │
│                                        │
│ Actions: [Envoyer] [Photo] [Position]  │
│ Option: Demande de devis (simple)      │
└────────────────────────────────────────┘
```

---

## 3) Badges officiels (V1)

Badges recommandés (6–8 max):
- ✅ Vérifié
- 🚗 Se déplace
- ⚡ Urgence / Dépannage
- 🛍️ Boutique (produits)
- 📄 Profil (mini-site)
- ⭐ Recommandé / Top (mise en avant)
- ⏱️ Disponible maintenant (optionnel)

Règle: sur la liste, afficher **max 2 badges** + “+x”.

---

## 4) Familles & métiers (proposition V1)

Familles (chips):
- Bâtiment & Dépannage
- Auto & Moto
- Réparation & Électronique
- Mode & Textile
- Bois & Mobilier
- Services à domicile
- Agriculture (optionnel)

Exemples de métiers:
- Bâtiment & Dépannage: Plombier, Électricien, Peintre bâtiment, Ferronnier, Forgeron
- Auto & Moto: Mécanicien
- Réparation & Électronique: Réparateur téléphone, Réparateur électroménager
- Mode & Textile: Tailleur/Couturier, Tisserand, Cordonnier
- Bois & Mobilier: Menuisier, Ébéniste
- Services à domicile: Aide ménagère
- Agriculture: Fermier

---

## 5) Règles “Mini-site” vs “Mini-boutique” (sans obligation)

- Mini-site (Profil): utile pour tous les prestataires (service).
- Mini-boutique (Produits): uniquement si le métier vend naturellement des articles (tailleur, menuisier, réparateur…).

Sur la carte:
- C’est un **badge** (🛍️), pas un secteur séparé.

---

## 6) Présentation verticale (comme comptes Client/Vendeur du formel)

### Compte Client (Local+)
- Mes demandes (Mangoo Connect+)
- Mes favoris Local+
- Historique
- Paramètres

### Compte Prestataire Local+
- Mon profil Local+
- Métiers & services
- Zone & disponibilité
- Demandes (Mangoo Connect+)
- Portfolio
- Boutique (si activée)
- Abonnement / Visibilité

---

## 7) Non-régression (garantie)

Tout ajout doit respecter:
- Pas de suppression/renommage des champs existants.
- Nouveaux champs optionnels uniquement.
- Si un prestataire n’a pas de `trade`, il apparaît comme aujourd’hui.

