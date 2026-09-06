# Mangoo Connect+ — Documentation

## Carte Local+

La carte `pages/carte.html` met en avant les boutiques et prestataires locaux.

### Liens profonds

Tu peux partager une vue précise de la carte en ajoutant des paramètres après `#` dans l'URL. Les paramètres se combinent avec `&`.

| Lien | Effet |
| --- | --- |
| `carte.html#ville=Libreville` | Ouvre la carte centrée sur Libreville |
| `carte.html#ville=Dakar&rayon=10` | Dakar, rayon fixé à 10 km |
| `carte.html#ville=Dakar&rayon=25` | Dakar, rayon fixé à 25 km |
| `carte.html#ville=Abidjan&rayon=pays` | Abidjan, affichage « Tout le pays » (Côte d'Ivoire) |
| `carte.html#live` | Active le filtre « En direct » |

Valeurs de `rayon` acceptées : `5`, `10`, `25`, ou `pays` (pour « Tout le pays »).

### Logique de découverte

La carte démarre à **5 km**, puis élargit automatiquement tant qu'il n'y a **aucun** commerce dans la ville :

1. `5 km` → `10 km` → `25 km` (élargissement automatique si `0` résultat).
2. Si `1` à `5` résultats, un bandeau propose « Voir à X km » sans élargir de force.
3. Au-delà, le bouton « Tout le pays » affiche l'ensemble du pays.

### Scope ville / pays

Un utilisateur à Paris voit les commerces de Paris, celui de Libreville voit ceux de Libreville, etc. Le sélecteur « Ma ville » permet de changer de ville à tout moment.

## Détection de position

Au chargement, la carte :

1. Utilise la géolocalisation du navigateur.
2. Détecte la ville connue la plus proche.
3. Confirme la ville/pays réels via reverse-geocoding Nominatim (OpenStreetMap).

Le reverse-geocoding est mis en cache localement pendant 7 jours.

> **Production** : Nominatim limite l'usage à environ 1 requête/seconde par IP. Pour un trafic réel, héberger sa propre instance Nominatim ou utiliser un géocodeur commercial (Google, Mapbox, Geoapify, Here).
