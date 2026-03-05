# Guide de Maintenance et Troubleshooting - MangooTech

## 🚨 Procédures d'Urgence

### Pannes Critiques - Actions Immédiates

#### 1. Site Inaccessible
**Symptômes** : Erreur 404, page blanche, temps de chargement infini

**Actions immédiates** :
1. Vérifier le statut GitHub Pages : `https://github.com/Fode1960/MangooTech/settings/pages`
2. Vérifier les Actions GitHub : `https://github.com/Fode1960/MangooTech/actions`
3. Tester l'URL de production : `https://fode1960.github.io/MangooTech/`

**Script de diagnostic rapide** :
```bash
# Test de connexion
curl -I https://fode1960.github.io/MangooTech/

# Vérification du build
npm run build

# Test local
npm run preview
```

#### 2. Erreurs de Paiement Massives
**Symptômes** : Tous les paiements échouent, erreurs Stripe/PayPal

**Actions immédiates** :
1. Vérifier le dashboard Stripe : `https://dashboard.stripe.com/test/payments`
2. Vérifier les webhooks : `https://dashboard.stripe.com/test/webhooks`
3. Exécuter le script de vérification :
```bash
node check-webhook-logs.js
node debug-payment-issue.js
```

#### 3. Problème d'Authentification
**Symptômes** : Impossible de se connecter, erreurs 400

**Actions immédiates** :
1. Vérifier les logs Supabase : `https://app.supabase.com/project/ptrqhtwstldphjaraufi/auth/logs`
2. Tester la connexion avec un compte de test
3. Vérifier les variables d'environnement

## 🔍 Diagnostic Systématique

### 1. Vérification de l'État du Système

#### Script de Diagnostic Complet
```bash
# Exécuter le diagnostic complet
node diagnostic-pack-persistant.cjs

# Vérifier l'état des packs
node check-user-pack-status.js

# Analyser les performances
node monitor-performance-metrics.js
```

#### Points de Vérification
- [ ] Base de données Supabase accessible
- [ ] Edge Functions opérationnelles
- [ ] Webhooks Stripe/PayPal actifs
- [ ] GitHub Actions fonctionnelles
- [ ] Certificats SSL valides
- [ ] Quota Supabase non atteint

### 2. Logs et Monitoring

#### Outils de Monitoring
```bash
# Logs en temps réel
tail -f /var/log/nginx/error.log

# Métriques de performance
node monitor-performance-metrics.js

# Vérification des webhooks
node check-webhook-logs.js
```

#### Métriques Clés à Surveiller
- Temps de réponse moyen : < 2 secondes
- Taux d'erreur : < 1%
- Disponibilité : > 99.9%
- Taux de conversion : > 2%

## 🛠️ Problèmes Courants et Solutions

### Problème 1 : "Pack non attribué après inscription"

**Symptômes** :
- Nouvel utilisateur sans pack après inscription
- Dashboard vide ou erreur de chargement

**Causes possibles** :
- Erreur RLS (Row Level Security)
- Fonction smart-pack-change échouée
- Timeout lors de l'assignation

**Solution étape par étape** :
```bash
# 1. Vérifier l'utilisateur
check-specific-user-packs.sql

# 2. Forcer l'assignation du pack gratuit
node force-pack-update.js

# 3. Corriger les RLS si nécessaire
node fix-rls-policies.cjs
```

**Script de correction automatique** :
```javascript
// Correction immédiate
const fixUserPack = async (userId) => {
  try {
    // Assigner pack gratuit
    await assignPackToUser(userId, '0a85e74a-4aec-480a-8af1-7b57391a80d2')
    
    // Synchroniser selected_pack
    await syncSelectedPack(userId)
    
    console.log(`✅ Pack corrigé pour l'utilisateur ${userId}`)
  } catch (error) {
    console.error(`❌ Erreur lors de la correction:`, error)
  }
}
```

### Problème 2 : "Erreur 400 lors de la connexion"

**Symptômes** :
- Message "Invalid login credentials"
- Erreur récurrente après reset du mot de passe

**Causes possibles** :
- Format d'email invalide
- Caractères spéciaux dans le mot de passe
- Session corrompue dans localStorage

**Solution** :
```javascript
// Nettoyer la session
localStorage.clear()
sessionStorage.clear()

// Forcer la déconnexion
await supabase.auth.signOut()

// Réessayer la connexion
```

### Problème 3 : "Paiement réussi mais pack non mis à jour"

**Symptômes** :
- Paiement confirmé dans Stripe/PayPal
- Pack utilisateur inchangé
- Aucune mise à jour du dashboard

**Diagnostic** :
```bash
# Vérifier les webhooks
node check-webhook-logs.js

# Vérifier la dernière transaction
node debug-payment-issue.js

# Forcer la synchronisation
node auto-fix-pack-sync-after-payment.js
```

**Correction manuelle** :
```sql
-- Trouver la dernière transaction réussie
SELECT * FROM transactions 
WHERE user_id = 'USER_ID' 
AND status = 'completed' 
ORDER BY created_at DESC 
LIMIT 1;

-- Forcer l'activation du pack
UPDATE user_packs 
SET status = 'active', pack_id = 'NEW_PACK_ID'
WHERE user_id = 'USER_ID' AND status = 'active';
```

### Problème 4 : "Multiple packs actifs"

**Symptômes** :
- Utilisateur avec plusieurs packs "actifs"
- Incohérences dans le dashboard
- Erreurs de calcul de prix

**Solution automatique** :
```bash
# Détection et correction
node auto-fix-pack-complete.cjs

# Vérification
node check-pack-ids.sql
```

### Problème 5 : "Erreur de migration de pack"

**Symptômes** :
- Échec du changement de pack
- Erreur "smart-pack-change"
- Redirection échouée

**Analyse** :
```bash
# Voir les logs détaillés
node debug-pack-change-realtime.cjs

# Test de la fonction
node test-pack-change-complet.js
```

## 📊 Maintenance Préventive

### 1. Maintenance Hebdomadaire

#### Vérifications systématiques :
- [ ] Logs d'erreur Supabase
- [ ] Statut des webhooks Stripe/PayPal
- [ ] Métriques de performance
- [ ] Backup de la base de données
- [ ] Mise à jour des dépendances critiques

#### Scripts à exécuter :
```bash
# Vérification complète
node diagnostic-pack-persistant.cjs

# Nettoyage des données orphelines
node cleanup-orphaned-data.js

# Mise à jour des statistiques
node update-analytics.js
```

### 2. Maintenance Mensuelle

#### Tâches de maintenance :
- [ ] Analyse des patterns d'erreur
- [ ] Optimisation des requêtes SQL
- [ ] Vérification de la cohérence des données
- [ ] Mise à jour de la documentation
- [ ] Test de restauration de backup

### 3. Maintenance Trimestrielle

#### Revue de performance :
- [ ] Analyse des métriques de conversion
- [ ] Optimisation des images et assets
- [ ] Audit de sécurité
- [ ] Plan de capacité et scalabilité
- [ ] Mise à jour majeure des dépendances

## 🔄 Procédures de Backup et Restauration

### Backup de la Base de Données

#### Backup Automatique (Supabase)
- Backups automatiques quotidiens par Supabase
- Retention : 7 jours pour le plan gratuit
- Accès via le dashboard Supabase

#### Backup Manuel
```bash
# Export complet via Supabase CLI
supabase db dump --schema public > backup_$(date +%Y%m%d).sql

# Export des données critiques
pg_dump -h db.supabase.co -U postgres -d postgres \
  --table=users --table=user_packs --table=transactions \
  --data-only > critical_data_$(date +%Y%m%d).sql
```

### Restauration

#### Restauration Partielle
```sql
-- Restaurer un utilisateur spécifique
COPY users FROM '/path/to/backup/users.csv' DELIMITER ',' CSV HEADER;

-- Restaurer les packs utilisateur
COPY user_packs FROM '/path/to/backup/user_packs.csv' DELIMITER ',' CSV HEADER;
```

#### Restauration Complète
```bash
# Restaurer via Supabase CLI
supabase db restore backup_20240101.sql

# Vérifier l'intégrité après restauration
node verify-database-integrity.js
```

## 📞 Escalation et Support

### Niveaux de Support

#### Niveau 1 - Support Technique
**Responsable** : Équipe de maintenance
**Temps de réponse** : 4 heures ouvrées
**Compétences** : Diagnostic, scripts de correction, configuration

#### Niveau 2 - Développement
**Responsable** : Équipe de développement
**Temps de réponse** : 1 jour ouvré
**Compétences** : Corrections de code, nouvelles fonctionnalités

#### Niveau 3 - Architecture
**Responsable** : Architecte système
**Temps de réponse** : 2 jours ouvrés
**Compétences** : Refonte architecture, décisions critiques

### Procédure d'Escalation

1. **Documenter le problème** :
   - Description détaillée
   - Étapes de reproduction
   - Logs et captures d'écran
   - Impact sur les utilisateurs

2. **Tentatives de résolution** :
   - Scripts de diagnostic exécutés
   - Solutions appliquées
   - Résultats obtenus

3. **Escalade** :
   - Créer une issue GitHub détaillée
   - Contacter le niveau supérieur
   - Fournir toute la documentation

## 🆘 Contacts d'Urgence

### Support Technique
- **Email** : support@mangoo.tech
- **Téléphone** : +221 XX XXX XXXX
- **Slack** : #support-urgent

### Fournisseurs Critiques
- **Supabase Support** : support@supabase.io
- **Stripe Support** : https://support.stripe.com/
- **PayPal Support** : https://www.paypal.com/support

### Documentation en Ligne
- **Documentation principale** : https://docs.mangoo.tech
- **Status des services** : https://status.mangoo.tech
- **GitHub Issues** : https://github.com/Fode1960/MangooTech/issues

---

**Ce guide doit être régulièrement mis à jour. Dernière révision : $(date)**

**Pour toute question ou amélioration de ce guide, contacter l'équipe technique principale.**