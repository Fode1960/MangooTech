import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware pour vérifier les permissions admin
const checkAdminPermission = (permission: string) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          error: 'Token manquant' 
        });
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Token invalide' 
        });
      }

      const userId = user.id;
      
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role_id, is_active')
        .eq('user_id', userId)
        .single();

      if (!adminUser || !adminUser.is_active) {
        return res.status(403).json({ 
          success: false, 
          error: 'Accès refusé: Utilisateur non autorisé' 
        });
      }

      const { data: role } = await supabase
        .from('user_roles')
        .select('permissions')
        .eq('id', adminUser.role_id)
        .single();

      if (!role) {
        return res.status(403).json({ 
          success: false, 
          error: 'Rôle non trouvé' 
        });
      }

      const permissions = role.permissions;
      const [resource, action] = permission.split('.');
      
      if (!permissions[resource] || !permissions[resource].includes(action)) {
        return res.status(403).json({ 
          success: false, 
          error: `Permission refusée: ${permission}` 
        });
      }

      (req as any).adminUser = adminUser;
      (req as any).user = user;
      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur lors de la vérification des permissions' 
      });
    }
  };
};

// === ROUTES POUR LES ANALYTICS DES PAIEMENTS ===

// Statistiques générales des paiements
router.get('/payments/stats', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const { period = '30', start_date, end_date } = req.query as any;
      
      let startDate, endDate;
      if (start_date && end_date) {
        startDate = new Date(start_date as string);
        endDate = new Date(end_date as string);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period as string));
      }

      // Transactions totales
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, status, payment_method, currency, country, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Paiements Stripe
      const { data: stripePayments } = await supabase
        .from('payments')
        .select('amount, status, currency, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculer les statistiques
      const totalTransactions = transactions?.length || 0;
      const successfulTransactions = transactions?.filter(t => t.status === 'succeeded').length || 0;
      const failedTransactions = transactions?.filter(t => t.status === 'failed').length || 0;
      const pendingTransactions = transactions?.filter(t => t.status === 'pending').length || 0;

      const totalRevenue = transactions?.reduce((sum, t) => {
        if (t.status === 'succeeded') {
          return sum + parseFloat(t.amount || 0);
        }
        return sum;
      }, 0) || 0;

      const stripeRevenue = stripePayments?.reduce((sum, p) => {
        if (p.status === 'succeeded') {
          return sum + parseFloat(p.amount || 0);
        }
        return sum;
      }, 0) || 0;

      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions * 100).toFixed(2) : 0;
      const failureRate = totalTransactions > 0 ? (failedTransactions / totalTransactions * 100).toFixed(2) : 0;

      // Répartition par méthode de paiement
      const paymentMethods = transactions?.reduce((acc, transaction) => {
        const method = transaction.payment_method || 'unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count += 1;
        if (transaction.status === 'succeeded') {
          acc[method].amount += parseFloat(transaction.amount || 0);
        }
        return acc;
      }, {} as Record<string, { count: number; amount: number }>) || {};

      // Répartition par devise
      const currencies = transactions?.reduce((acc, transaction) => {
        const currency = transaction.currency || 'XOF';
        if (!acc[currency]) {
          acc[currency] = { count: 0, amount: 0 };
        }
        acc[currency].count += 1;
        if (transaction.status === 'succeeded') {
          acc[currency].amount += parseFloat(transaction.amount || 0);
        }
        return acc;
      }, {} as Record<string, { count: number; amount: number }>) || {};

      // Répartition par pays
      const countries = transactions?.reduce((acc, transaction) => {
        const country = transaction.country || 'Unknown';
        if (!acc[country]) {
          acc[country] = { count: 0, amount: 0 };
        }
        acc[country].count += 1;
        if (transaction.status === 'succeeded') {
          acc[country].amount += parseFloat(transaction.amount || 0);
        }
        return acc;
      }, {} as Record<string, { count: number; amount: number }>) || {};

      res.json({
        success: true,
        data: {
          period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          },
          overview: {
            total_transactions: totalTransactions,
            successful_transactions: successfulTransactions,
            failed_transactions: failedTransactions,
            pending_transactions: pendingTransactions,
            total_revenue: totalRevenue,
            stripe_revenue: stripeRevenue,
            success_rate: parseFloat(successRate),
            failure_rate: parseFloat(failureRate)
          },
          payment_methods: paymentMethods,
          currencies: currencies,
          countries: countries
        }
      });
    } catch (error) {
      console.error('Erreur stats paiements:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Analytics par méthode de paiement
router.get('/payments/methods', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const { period = '30', group_by = 'day' } = req.query as any;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));

      // Récupérer les données de shop_analytics
      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Agréger les données
      const totals = analytics?.reduce((acc, day) => ({
        orange_money: acc.orange_money + (day.orange_money_payments || 0),
        mtn_money: acc.mtn_money + (day.mtn_money_payments || 0),
        moov_money: acc.moov_money + (day.moov_money_payments || 0),
        card: acc.card + (day.card_payments || 0),
        cash: acc.cash + (day.cash_payments || 0),
        mobile_money: acc.mobile_money + (day.mobile_money_payments || 0)
      }), {
        orange_money: 0,
        mtn_money: 0,
        moov_money: 0,
        card: 0,
        cash: 0,
        mobile_money: 0
      }) || {
        orange_money: 0,
        mtn_money: 0,
        moov_money: 0,
        card: 0,
        cash: 0,
        mobile_money: 0
      };

      // Données pour le graphique temporel
      let timelineData = [];
      
      if (group_by === 'day') {
        timelineData = analytics?.map(day => ({
          date: day.date,
          orange_money: day.orange_money_payments || 0,
          mtn_money: day.mtn_money_payments || 0,
          moov_money: day.moov_money_payments || 0,
          card: day.card_payments || 0,
          cash: day.cash_payments || 0,
          mobile_money: day.mobile_money_payments || 0
        })) || [];
      } else if (group_by === 'week') {
        // Grouper par semaine
        const weeks = {};
        analytics?.forEach(day => {
          const date = new Date(day.date);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weeks[weekKey]) {
            weeks[weekKey] = {
              date: weekKey,
              orange_money: 0,
              mtn_money: 0,
              moov_money: 0,
              card: 0,
              cash: 0,
              mobile_money: 0
            };
          }
          
          weeks[weekKey].orange_money += day.orange_money_payments || 0;
          weeks[weekKey].mtn_money += day.mtn_money_payments || 0;
          weeks[weekKey].moov_money += day.moov_money_payments || 0;
          weeks[weekKey].card += day.card_payments || 0;
          weeks[weekKey].cash += day.cash_payments || 0;
          weeks[weekKey].mobile_money += day.mobile_money_payments || 0;
        });
        timelineData = Object.values(weeks);
      }

      // Calculer les pourcentages
      const totalPayments = totals.orange_money + totals.mtn_money + totals.moov_money + totals.card + totals.cash;
      const totalMobileMoney = totals.orange_money + totals.mtn_money + totals.moov_money;

      const percentages = {
        orange_money: totalPayments > 0 ? ((totals.orange_money / totalPayments) * 100).toFixed(2) : 0,
        mtn_money: totalPayments > 0 ? ((totals.mtn_money / totalPayments) * 100).toFixed(2) : 0,
        moov_money: totalPayments > 0 ? ((totals.moov_money / totalPayments) * 100).toFixed(2) : 0,
        card: totalPayments > 0 ? ((totals.card / totalPayments) * 100).toFixed(2) : 0,
        cash: totalPayments > 0 ? ((totals.cash / totalPayments) * 100).toFixed(2) : 0,
        mobile_money: totalPayments > 0 ? ((totals.mobile_money / totalPayments) * 100).toFixed(2) : 0
      };

      res.json({
        success: true,
        data: {
          period_days: parseInt(period),
          group_by: group_by,
          totals: totals,
          percentages: percentages,
          timeline: timelineData
        }
      });
    } catch (error) {
      console.error('Erreur analytics méthodes paiement:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Analytics par pays
router.get('/payments/countries', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const { period = '30', limit = 10 } = req.query as any;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));

      // Récupérer les transactions avec les données de pays
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, status, country, payment_method, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Agréger par pays
      const countries = transactions?.reduce((acc, transaction) => {
        const country = transaction.country || 'Unknown';
        if (!acc[country]) {
          acc[country] = {
            country: country,
            transactions: 0,
            successful_transactions: 0,
            failed_transactions: 0,
            total_amount: 0,
            successful_amount: 0,
            payment_methods: {}
          };
        }
        
        acc[country].transactions += 1;
        acc[country].total_amount += parseFloat(transaction.amount || 0);
        
        if (transaction.status === 'succeeded') {
          acc[country].successful_transactions += 1;
          acc[country].successful_amount += parseFloat(transaction.amount || 0);
        } else if (transaction.status === 'failed') {
          acc[country].failed_transactions += 1;
        }
        
        // Répartition par méthode de paiement
        const method = transaction.payment_method || 'unknown';
        if (!acc[country].payment_methods[method]) {
          acc[country].payment_methods[method] = 0;
        }
        acc[country].payment_methods[method] += 1;
        
        return acc;
      }, {} as Record<string, any>) || {};

      // Convertir en tableau et trier par montant total
      const countryArray = Object.values(countries)
        .map((country: any) => ({
          ...country,
          success_rate: country.transactions > 0 ? 
            ((country.successful_transactions / country.transactions) * 100).toFixed(2) : 0,
          avg_transaction_amount: country.transactions > 0 ? 
            (country.total_amount / country.transactions).toFixed(2) : 0
        }))
        .sort((a, b) => b.successful_amount - a.successful_amount)
        .slice(0, parseInt(limit as string));

      // Statistiques globales
      const totals = countryArray.reduce((acc, country) => ({
        total_transactions: acc.total_transactions + country.transactions,
        total_successful: acc.total_successful + country.successful_transactions,
        total_failed: acc.total_failed + country.failed_transactions,
        total_amount: acc.total_amount + country.total_amount,
        total_successful_amount: acc.total_successful_amount + country.successful_amount
      }), {
        total_transactions: 0,
        total_successful: 0,
        total_failed: 0,
        total_amount: 0,
        total_successful_amount: 0
      });

      res.json({
        success: true,
        data: {
          period_days: parseInt(period),
          countries: countryArray,
          totals: {
            ...totals,
            overall_success_rate: totals.total_transactions > 0 ? 
              ((totals.total_successful / totals.total_transactions) * 100).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      console.error('Erreur analytics pays:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Liste des transactions avec filtres avancés
router.get('/payments/transactions', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        payment_method,
        country,
        currency,
        start_date,
        end_date,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query as any;

      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (status) {
        query = query.eq('status', status);
      }
      if (payment_method) {
        query = query.eq('payment_method', payment_method);
      }
      if (country) {
        query = query.eq('country', country);
      }
      if (currency) {
        query = query.eq('currency', currency);
      }
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      if (search) {
        query = query.or(`transaction_id.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Trier
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data: transactions, count, error } = await query;

      if (error) {
        throw error;
      }

      // Calculer les statistiques pour cette page
      const pageStats = transactions?.reduce((acc, t) => ({
        total_amount: acc.total_amount + parseFloat(t.amount || 0),
        successful_amount: acc.successful_amount + (t.status === 'succeeded' ? parseFloat(t.amount || 0) : 0),
        count: acc.count + 1,
        successful_count: acc.successful_count + (t.status === 'succeeded' ? 1 : 0)
      }), {
        total_amount: 0,
        successful_amount: 0,
        count: 0,
        successful_count: 0
      }) || {
        total_amount: 0,
        successful_amount: 0,
        count: 0,
        successful_count: 0
      };

      res.json({
        success: true,
        data: {
          transactions: transactions || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            total_pages: Math.ceil((count || 0) / parseInt(limit))
          },
          page_stats: {
            ...pageStats,
            success_rate: pageStats.count > 0 ? 
              ((pageStats.successful_count / pageStats.count) * 100).toFixed(2) : 0
          }
        }
      });
    } catch (error) {
      console.error('Erreur liste transactions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Détails d'une transaction spécifique
router.get('/payments/transactions/:id', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Récupérer la transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (transactionError || !transaction) {
        return res.status(404).json({ 
          success: false, 
          error: 'Transaction non trouvée' 
        });
      }

      // Récupérer les données utilisateur si disponible
      let userData = null;
      if (transaction.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name, phone, country')
          .eq('id', transaction.user_id)
          .single();
        userData = user;
      }

      // Récupérer les données de boutique si disponible
      let shopData = null;
      if (transaction.shop_id) {
        const { data: shop } = await supabase
          .from('shops')
          .select('name, slug, owner_id')
          .eq('id', transaction.shop_id)
          .single();
        shopData = shop;
      }

      // Récupérer l'historique des statuts
      const { data: statusHistory } = await supabase
        .from('transaction_status_history')
        .select('status, reason, created_at')
        .eq('transaction_id', id)
        .order('created_at', { ascending: true });

      res.json({
        success: true,
        data: {
          transaction: transaction,
          user: userData,
          shop: shopData,
          status_history: statusHistory || []
        }
      });
    } catch (error) {
      console.error('Erreur détails transaction:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Métriques de commission
router.get('/payments/commissions', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const { period = '30' } = req.query as any;
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));

      // Récupérer les transactions avec commissions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, commission_amount, platform_fee, shop_earning, status, payment_method, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'succeeded');

      // Calculer les métriques de commission
      const totals = transactions?.reduce((acc, t) => ({
        total_revenue: acc.total_revenue + parseFloat(t.amount || 0),
        total_commissions: acc.total_commissions + parseFloat(t.commission_amount || 0),
        total_platform_fees: acc.total_platform_fees + parseFloat(t.platform_fee || 0),
        total_shop_earnings: acc.total_shop_earnings + parseFloat(t.shop_earning || 0),
        transaction_count: acc.transaction_count + 1
      }), {
        total_revenue: 0,
        total_commissions: 0,
        total_platform_fees: 0,
        total_shop_earnings: 0,
        transaction_count: 0
      }) || {
        total_revenue: 0,
        total_commissions: 0,
        total_platform_fees: 0,
        total_shop_earnings: 0,
        transaction_count: 0
      };

      // Commissions par méthode de paiement
      const commissionsByMethod = transactions?.reduce((acc, t) => {
        const method = t.payment_method || 'unknown';
        if (!acc[method]) {
          acc[method] = {
            commission_amount: 0,
            transaction_count: 0,
            revenue: 0
          };
        }
        acc[method].commission_amount += parseFloat(t.commission_amount || 0);
        acc[method].transaction_count += 1;
        acc[method].revenue += parseFloat(t.amount || 0);
        return acc;
      }, {} as Record<string, { commission_amount: number; transaction_count: number; revenue: number }>) || {};

      // Taux de commission moyen
      const avgCommissionRate = totals.total_revenue > 0 ? 
        ((totals.total_commissions / totals.total_revenue) * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          period_days: parseInt(period),
          totals: {
            ...totals,
            avg_commission_rate: parseFloat(avgCommissionRate)
          },
          commissions_by_method: commissionsByMethod
        }
      });
    } catch (error) {
      console.error('Erreur commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Export des données de paiement
router.get('/payments/export', 
  checkAdminPermission('payments.read'),
  async (req, res) => {
    try {
      const {
        format = 'csv',
        start_date,
        end_date,
        status,
        payment_method,
        country
      } = req.query as any;

      let query = supabase
        .from('transactions')
        .select('*');

      // Appliquer les filtres
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (payment_method) {
        query = query.eq('payment_method', payment_method);
      }
      if (country) {
        query = query.eq('country', country);
      }

      const { data: transactions, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (format === 'csv') {
        // Générer CSV
        const headers = [
          'Transaction ID', 'Date', 'Montant', 'Devise', 'Statut',
          'Méthode de paiement', 'Pays', 'Commission', 'Frais plateforme',
          'Revenu boutique', 'Description'
        ];
        
        const csvContent = [
          headers.join(','),
          ...(transactions?.map(t => [
            t.transaction_id,
            t.created_at,
            t.amount,
            t.currency,
            t.status,
            t.payment_method,
            t.country,
            t.commission_amount || 0,
            t.platform_fee || 0,
            t.shop_earning || 0,
            `"${(t.description || '').replace(/"/g, '""')}"`
          ].join(',')) || [])
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payments_export_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="payments_export_${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          success: true,
          export_date: new Date().toISOString(),
          filters: { start_date, end_date, status, payment_method, country },
          data: transactions
        });
      }
    } catch (error) {
      console.error('Erreur export paiements:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;