# Système de Paiement Complet - Documentation Technique

## Vue d'ensemble
Ce document présente l'infrastructure complète du système de paiement implémentée pour MangooTech, incluant les paiements locaux (Mobile Money) et internationaux (Stripe, PayPal).

## Architecture du Système

### 1. Routes API des Paiements

#### 📊 Tableau de bord Admin Payments
- **Endpoint**: `GET /api/admin/payments/stats`
- **Description**: Statistiques générales des paiements avec répartition par méthode, devise et pays
- **Fonctionnalités**:
  - Total des transactions et revenus
  - Taux de réussite/échec
  - Répartition par méthode de paiement
  - Analyse géographique par pays
  - Support des périodes personnalisées

#### 💳 Analytics par Méthode de Paiement
- **Endpoint**: `GET /api/admin/payments/methods`
- **Description**: Analyse détaillée par méthode de paiement
- **Méthodes supportées**:
  - Orange Money
  - MTN Mobile Money
  - Moov Money
  - Stripe
  - PayPal
  - Carte bancaire

#### 🌍 Analytics par Pays
- **Endpoint**: `GET /api/admin/payments/countries`
- **Description**: Performance des paiements par pays avec taux de conversion

#### 📋 Gestion des Transactions
- **Endpoint**: `GET /api/admin/payments/transactions`
- **Description**: Liste complète des transactions avec filtres avancés
- **Filtres disponibles**:
  - Statut (succeeded, failed, pending)
  - Méthode de paiement
  - Pays et devise
  - Période
  - Recherche par ID ou description

#### 💰 Gestion des Commissions
- **Endpoint**: `GET /api/admin/payments/commissions`
- **Description**: Métriques détaillées des commissions par transaction

### 2. Webhooks Automatiques

#### Webhooks Mobile Money
- **Orange Money**: `POST /api/mobile-money-webhooks/orange`
- **MTN MoMo**: `POST /api/mobile-money-webhooks/mtn`
- **Moov Money**: `POST /api/mobile-money-webhooks/moov`
- **Universel**: `POST /api/mobile-money-webhooks/universal`

**Fonctionnalités**:
- Vérification des signatures HMAC
- Mise à jour automatique du statut des transactions
- Calcul et distribution automatiques des commissions
- Notification des utilisateurs
- Mise à jour des analytics en temps réel

### 3. Système de Commission Automatique

#### Configuration des Commissions
- **Endpoint**: `GET|PUT /api/admin/commissions/config`
- **Taux par défaut**:
  - Plateforme: 2.5%
  - Orange Money: 1%
  - MTN Money: 1.5%
  - Moov Money: 1%
  - Stripe: 2.9%
  - PayPal: 3.4%

#### Calcul Automatique
- **Endpoint**: `POST /api/admin/commissions/calculate`
- **Fonctionnalités**:
  - Calcul en temps réel des commissions
  - Support multi-devises
  - Commission minimum: 100 XOF
  - Distribution automatique aux boutiques

#### Traitement des Commissions
- **Endpoint**: `POST /api/admin/commissions/process/:transactionId`
- **Processus**:
  1. Vérification de la transaction
  2. Calcul des commissions
  3. Création de l'entrée commission
  4. Mise à jour de la transaction
  5. Notification des parties concernées

### 4. Configuration des Méthodes de Paiement

#### Gestion de la Configuration
- **Endpoint**: `GET|PUT /api/admin/payment-methods/config`
- **Paramètres configurables**:
  - Activation/désactivation des méthodes
  - Frais de traitement
  - Limites de montant (min/max)
  - Pays et devises supportées
  - Clés API (stockées de manière sécurisée)

#### Test de Configuration
- **Endpoint**: `POST /api/admin/payment-methods/test/:method`
- **Fonctionnalités**:
  - Vérification de la configuration
  - Test de montant et devise
  - Simulation de transaction

### 5. Système de Notification

#### Types de Notifications
- **Paiement réussi**: Email de confirmation avec détails
- **Paiement échoué**: Email d'alerte avec instructions
- **Paiement en attente**: Email d'information
- **Commission versée**: Notification aux boutiques

#### Configuration des Notifications
- **Email**: SMTP configurable avec templates HTML
- **SMS**: Support Africa's Talking (configurable)
- **Push**: Support OneSignal (configurable)

#### Préférences Utilisateur
- **Endpoint**: `GET|PUT /api/notifications/preferences/:userId`
- **Options**:
  - Activation/désactivation par type
  - Choix du canal (email, SMS, push)
  - Fréquence des notifications

### 6. Réconciliation et Rapports

#### Rapport de Réconciliation
- **Endpoint**: `POST /api/admin/reconciliation/reconciliation`
- **Fonctionnalités**:
  - Comparaison des transactions avec les paiements
  - Détection des anomalies
  - Rapport des écarts
  - Export CSV/JSON

#### Rapport Financier
- **Endpoint**: `POST /api/admin/reconciliation/financial`
- **Métriques**:
  - Revenu total
  - Commissions perçues
  - Revenu net
  - Taux de réussite
  - Analyse temporelle

#### Tableau de Bord de Réconciliation
- **Endpoint**: `GET /api/admin/reconciliation/dashboard`
- **Indicateurs**:
  - Transactions en attente
  - Anomalies détectées
  - Alertes critiques
  - Aperçu des dernières transactions

### 7. Export de Données

#### Export des Paiements
- **Endpoint**: `GET /api/admin/payments/export`
- **Formats**: CSV, JSON
- **Données exportées**:
  - Transaction ID
  - Date et heure
  - Montant et devise
  - Statut
  - Méthode de paiement
  - Pays
  - Commissions
  - Description

## Configuration Environnement

### Variables d'Environnement Requises

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# Mobile Money
ORANGE_MONEY_API_KEY=your_orange_key
ORANGE_MONEY_WEBHOOK_SECRET=your_orange_webhook_secret
MTN_MOMO_API_KEY=your_mtn_key
MTN_MOMO_WEBHOOK_SECRET=your_mtn_webhook_secret
MOOV_MONEY_API_KEY=your_moov_key
MOOV_MONEY_WEBHOOK_SECRET=your_moov_webhook_secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@mangootech.com

# SMS (Africa's Talking)
SMS_API_KEY=your_africastalking_key
SMS_USERNAME=your_africastalking_username

# Push Notifications (OneSignal)
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_api_key
```

## Installation et Démarrage

### 1. Installation des Dépendances
```bash
npm install
```

### 2. Configuration des Variables d'Environnement
Créez un fichier `.env` avec les variables ci-dessus.

### 3. Démarrage du Serveur
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

### 4. Test du Système
```bash
# Lancer les tests complets
node test-payment-system.mjs
```

## Structure de la Base de Données

### Tables Principales

#### transactions
- `id` (UUID, PK)
- `transaction_id` (String, unique)
- `user_id` (UUID, FK)
- `shop_id` (UUID, FK)
- `amount` (Decimal)
- `currency` (String)
- `status` (String)
- `payment_method` (String)
- `country` (String)
- `commission_amount` (Decimal)
- `platform_fee` (Decimal)
- `shop_earning` (Decimal)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### commissions
- `id` (UUID, PK)
- `transaction_id` (UUID, FK)
- `platform_commission` (Decimal)
- `payment_processing_fee` (Decimal)
- `total_commission` (Decimal)
- `shop_earning` (Decimal)
- `commission_rate` (Decimal)
- `status` (String)
- `paid_at` (Timestamp)
- `created_at` (Timestamp)

#### payments (Stripe)
- `id` (UUID, PK)
- `payment_intent_id` (String, unique)
- `amount` (Decimal)
- `currency` (String)
- `status` (String)
- `customer_id` (String)
- `metadata` (JSON)
- `created_at` (Timestamp)

#### notifications
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `type` (String)
- `title` (String)
- `content` (Text)
- `metadata` (JSON)
- `read` (Boolean)
- `email_sent` (Boolean)
- `created_at` (Timestamp)

## Sécurité

### 1. Authentification
- JWT tokens pour l'authentification
- Middleware de vérification des permissions admin
- Rate limiting sur les endpoints sensibles

### 2. Validation des Webhooks
- Vérification HMAC des signatures
- Validation des payloads
- Protection contre les attaques de répétition

### 3. Chiffrement
- HTTPS obligatoire en production
- Chiffrement des données sensibles
- Stockage sécurisé des clés API

### 4. Conformité
- Conformité PCI DSS pour les cartes
- Respect des réglementations locales (UEMOA)
- Protection des données personnelles (RGPD)

## Monitoring et Maintenance

### Logs
- Logging structuré avec timestamps
- Niveaux de log: ERROR, WARN, INFO, DEBUG
- Rotation automatique des logs

### Monitoring
- Endpoints de health check
- Métriques de performance
- Alertes en cas d'anomalies

### Maintenance
- Scripts de backup automatique
- Nettoyage périodique des données
- Mise à jour des taux de change

## Support et Débogage

### Endpoints de Test
- Webhooks de test pour chaque opérateur
- Simulation de transactions
- Vérification de la configuration

### Outils de Débogage
- Interface admin complète
- Logs détaillés des transactions
- Rapports d'erreur automatisés

### Support Technique
- Documentation API complète
- Exemples d'intégration
- Guide de dépannage

## Performance

### Optimisations
- Indexation des colonnes fréquemment interrogées
- Cache des configurations
- Pagination des résultats
- Requêtes optimisées

### Évolutivité
- Architecture micro-services ready
- Support de la montée en charge
- Distribution géographique possible

## Roadmap Future

### Phase 2 (Prochaine)
- [ ] Intégration avec plus d'opérateurs Mobile Money
- [ ] Support des paiements récurrents
- [ ] Système de remboursement automatisé
- [ ] API de paiement unifiée

### Phase 3 (Future)
- [ ] Support des cryptomonnaies
- [ ] Paiements par QR code
- [ ] Intégration avec les banques locales
- [ ] Système de crédit et prêt

## Contact et Support

Pour toute question ou support technique:
- Email: tech-support@mangootech.com
- Documentation API: `/api/docs`
- Status du système: `/api/health`

---

*Dernière mise à jour: Février 2025*
*Version: 1.2.0*