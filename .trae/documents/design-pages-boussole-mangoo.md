# Design des pages — Boussole Mangoo (desktop-first)

## Style global (tokens & règles)
- Fond: blanc (#FFFFFF) avec zones de contenu sur cartes (#F7F7F8)
- Couleur primaire: Mangoo Orange (#F57C00) ; accent: bleu info (#2563EB) ; danger: rouge (#DC2626)
- Typo: sans-serif lisible (ex. Inter), base 18px (desktop), interlignage 1.4–1.6
- Icônes: style plein, très contrasté, tailles 32–48px sur actions principales
- Boutons:
  - Primaire: fond #F57C00, texte blanc, hauteur min 48px, rayon 12px
  - Secondaire: contour #111827, fond blanc
  - États: hover (assombrir 6–8%), focus (outline 2px #2563EB)
- Liens: soulignés au hover, toujours accompagnés d’une icône quand possible
- Accessibilité ciblée “peu lettrés”:
  - Texte minimal (1–2 mots par action)
  - Pictos systématiques
  - Option “Réécouter” visible
  - Feedback immédiat (son + couleur + texte court)

## Composants transverses (toutes pages couvertes)
### Bouton flottant “Boussole”
- Position: bas-droite (desktop), sticky
- Contenu: icône boussole + label court (“Aide”)
- Interactions:
  - Click: ouvre un panneau latéral (drawer) “Boussole”
  - Lecture vocale: annonce “Aide” au focus

### Panneau latéral “Boussole” (drawer)
- Largeur: 360–420px (desktop)
- Structure:
  - En-tête: titre + bouton fermer
  - Corps: 1 étape à la fois (carte)
  - Pied: actions “Réécouter”, “Continuer”, “Recommencer”
- Surbrillance: l’élément cible sur la page est encadré (outline) + léger voile sur le reste

### Voix (TTS)
- Déclenchement: au focus/clic des tuiles et au lancement d’étapes
- Contrôles: mute, vitesse (1–3), bouton “Réécouter”

---

## Page 1 — Connexion
### Layout
- Grille simple en 2 colonnes (desktop):
  - Gauche: formulaire Connexion (carte)
  - Droite: “Guidance rapide” (carte Boussole)
- Espacement: 24px entre blocs, 16px dans les cartes

### Meta information
- Title: “Connexion — Mangoo”
- Description: “Se connecter avec aide vocale et icônes.”
- Open Graph: titre + courte description + type website

### Structure
1. Barre supérieure légère (logo + lien retour)
2. Carte “Connexion”
3. Carte “Boussole te guide” (démarrage guidance)

### Sections & composants
- Carte “Connexion”
  - Champ identifiant (label court + icône)
  - Champ mot de passe (label court + icône)
  - Bouton primaire “Entrer” (icône porte)
  - Lien secondaire “Mot de passe ?” (icône clé)
  - Zone feedback:
    - Succès: bandeau vert + phrase courte
    - Erreur: bandeau rouge + phrase courte + bouton “Réécouter”
- Carte “Boussole te guide”
  - 3 tuiles d’aide (grandes): “Me connecter”, “J’ai un souci”, “Réécouter”
  - Une seule action par tuile

---

## Page 2 — Accueil / Navigation
### Layout
- Mise en page en sections empilées
- Section principale: grille de tuiles 3x2 (desktop)
- Section secondaire: bandeau “Je veux…” avec boutons d’intention

### Meta information
- Title: “Accueil — Mangoo”
- Description: “Naviguer par icônes et guidance.”
- Open Graph: titre + description

### Structure
1. Header (logo, avatar, bouton Boussole)
2. Grille de tuiles principales (rubriques)
3. Bandeau “Je veux…” (parcours guidés)

### Sections & composants
- Tuiles de rubriques
  - Icône 48px + libellé 1–2 mots
  - Lecture vocale du libellé au focus
  - État actif: bordure #F57C00
- Bandeau “Je veux…”
  - 3–5 boutons max, gros formats
  - Click: lance un parcours Boussole lié à l’intention
- Indications contextuelles
  - Texte très court: “Choisis une image.”
  - Bouton “Réécouter” à côté

---

## Page 3 — Boussole (Assistant)
### Layout
- Dashboard 2 colonnes (desktop):
  - Gauche: “Parcours” (liste courte)
  - Droite: “Étape en cours” + contrôles

### Meta information
- Title: “Boussole — Mangoo”
- Description: “Aide pas-à-pas par voix et surbrillance.”
- Open Graph: titre + description

### Structure
1. Header (titre + retour)
2. Bloc “Continuer” (si parcours en cours)
3. Bloc “Choisir un parcours”
4. Bloc “Réglages”

### Sections & composants
- Carte “Continuer”
  - Affiche: nom du parcours (icône) + étape actuelle
  - Boutons: “Continuer”, “Recommencer”
- Carte “Choisir un parcours”
  - Liste courte (3–6)
  - Chaque item: icône + titre court + bouton “Démarrer”
- Carte “Réglages”
  - Toggle “Voix”
  - Slider “Vitesse” (1–3)
  - Toggle “Texte très grand”
  - Sélecteur “Langue” (si disponible)

---

## Responsive (règles minimales)
- < 1024px: passer en 1 colonne, drawer Boussole plein écran
- Actions principales toujours visibles (boutons 48px min)
- Grilles de tuiles: 2 colonnes puis 1 colonne
