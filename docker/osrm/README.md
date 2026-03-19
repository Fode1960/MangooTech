# OSRM (itinéraires sans Google)

Objectif : héberger votre propre moteur d’itinéraire (routing) pour MangooTech, sans dépendre de Google.

## Prérequis
- Docker Desktop
- Connexion internet (téléchargement des données OSM)

## Démarrage rapide (Afrique) — multi-pays (CM/CI/SN)

1) Choisissez un extrait OpenStreetMap (PBF)
- Sources courantes : Geofabrik (par pays)
- Exemples : `cameroon-latest.osm.pbf`, `cote-d-ivoire-latest.osm.pbf`, `senegal-latest.osm.pbf`

2) Placez les fichiers PBF dans les dossiers (renommez en `region.osm.pbf`)
- `docker/osrm/data/cm/region.osm.pbf` (Cameroun)
- `docker/osrm/data/ci/region.osm.pbf` (Côte d'Ivoire)
- `docker/osrm/data/sn/region.osm.pbf` (Sénégal)

3) Lancez le build OSRM (ça peut prendre du temps)

```bash
docker compose -f docker/osrm/docker-compose.yml --profile build up
```

4) Lancez les serveurs OSRM

```bash
docker compose -f docker/osrm/docker-compose.yml up -d osrm-cm osrm-ci osrm-sn
```

5) Configurez MangooTech pour utiliser votre OSRM (multi‑pays)

Dans votre environnement API (ex: `.env` utilisé par `api/server.ts`) :

```bash
OSRM_ALLOW_PUBLIC_FALLBACK=false
OSRM_CM_BASE_URL=http://localhost:5001
OSRM_CI_BASE_URL=http://localhost:5002
OSRM_SN_BASE_URL=http://localhost:5003
```

## Tester

- API : `http://localhost:3045/api/routing/route?from=4.051056,9.767869&to=4.052000,9.768000`
- Page livreur : `http://localhost:3007/test-delivery-routing.html`

## Notes
- Vous pouvez étendre à d’autres pays en ajoutant un dossier `data/<pays>` + un service OSRM + une variable `OSRM_<PAYS>_BASE_URL`.
- En production, privilégier un hébergement proche des utilisateurs (Afrique) pour réduire la latence.
