# Implémentation Boost Carte (DB + paiement + activation)

## 1) Pricing figé

Le pricing Boost est défini dans :

- [BOOST_PRICING.md](file:///c:/Users/mdans/Documents/MangooTech/BOOST_PRICING.md)

## 2) Base de données Supabase

Une migration SQL est fournie :

- [create_boost_tables.sql](file:///c:/Users/mdans/Documents/MangooTech/supabase/migrations/create_boost_tables.sql)

### Appliquer la migration

L’intégration Supabase automatisée n’est pas disponible dans cet environnement (erreur “Resource not found”).

Pour appliquer :

- Ouvrir Supabase Dashboard → SQL Editor
- Copier/coller le contenu de `supabase/migrations/create_boost_tables.sql`
- Exécuter

Tables créées :

- `boost_products` (catalogue)
- `boost_orders` (commandes)
- `vendor_boosts` (état actif par vendeur)

## 3) API & Stripe

### Endpoint de checkout (paiement unique)

- `POST /api/boosts/create-checkout-session`

Body JSON (exemple) :

```json
{
  "vendorId": "1775168535522",
  "vendorKind": "shop",
  "boostKind": "sponsored",
  "durationHours": 24,
  "currency": "xof"
}
```

Header requis :

- `Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`

### Webhook Stripe

Le webhook Stripe est géré ici :

- `POST /api/stripe-webhooks/webhook`

Événement requis côté Stripe :

- `checkout.session.completed`

Quand un checkout Boost est complété, l’API :

- marque la commande `boost_orders` comme payée
- met à jour `vendor_boosts` avec `*_until` (+ extension si déjà actif)
- marque la commande comme `active`

### Variables d’environnement

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`

## 4) Affichage Local+

Local+ synchronise maintenant les boosts depuis Supabase (table `vendor_boosts`) et les applique à la carte.

