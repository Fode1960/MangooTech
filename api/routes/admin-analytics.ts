import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware pour vérifier les permissions admin (copié des autres routes)
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

// === ROUTES POUR LES ANALYTICS DU DASHBOARD ===

// Dashboard overview - Statistiques générales
router.get('/dashboard/overview', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      const { period = '30' } = req.query as any; // nombre de jours
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));

      // Statistiques des boutiques
      const { data: shops } = await supabase
        .from('shops')
        .select('status, is_verified, created_at');

      // Statistiques des paiements
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, payment_method, created_at')
        .gte('created_at', startDate.toISOString());

      // Statistiques des utilisateurs
      const { data: users } = await supabase
        .from('auth.users')
        .select('created_at, email')
        .gte('created_at', startDate.toISOString());

      // Calculer les métriques
      const totalShops = shops?.length || 0;
      const activeShops = shops?.filter(s => s.status === 'approved').length || 0;
      const verifiedShops = shops?.filter(s => s.is_verified).length || 0;
      const newShopsThisPeriod = shops?.filter(s => new Date(s.created_at) >= startDate).length || 0;

      const totalPayments = payments?.length || 0;
      const successfulPayments = payments?.filter(p => p.status === 'succeeded').length || 0;
      const totalRevenue = payments?.reduce((sum, p) => {
        if (p.status === 'succeeded') {
          return sum + parseFloat(p.amount || 0);
        }
        return sum;
      }, 0) || 0;

      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments * 100).toFixed(2) : 0;

      // Répartition par méthode de paiement
      const paymentMethods = payments?.reduce((acc, payment) => {
        const method = payment.payment_method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {}) || {};

      // Nouveaux utilisateurs
      const newUsersThisPeriod = users?.length || 0;

      // Analytics des shops
      const { data: shopAnalytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0]);

      const totalShopRevenue = shopAnalytics?.reduce((sum, analytics) => 
        sum + parseFloat(analytics.total_revenue || 0), 0) || 0;

      const totalShopOrders = shopAnalytics?.reduce((sum, analytics) => 
        sum + (analytics.total_orders || 0), 0) || 0;

      const mobileMoneyBreakdown = shopAnalytics?.reduce((acc, analytics) => ({
        orange: acc.orange + (analytics.orange_money_payments || 0),
        mtn: acc.mtn + (analytics.mtn_money_payments || 0),
        moov: acc.moov + (analytics.moov_money_payments || 0)
      }), { orange: 0, mtn: 0, moov: 0 }) || { orange: 0, mtn: 0, moov: 0 };

      res.json({
        success: true,
        data: {
          period_days: parseInt(period as string),
          shops: {
            total: totalShops,
            active: activeShops,
            verified: verifiedShops,
            new_this_period: newShopsThisPeriod,
            approval_rate: totalShops > 0 ? ((activeShops / totalShops) * 100).toFixed(2) : 0
          },
          payments: {
            total: totalPayments,
            successful: successfulPayments,
            success_rate: paymentSuccessRate,
            total_revenue: totalRevenue,
            methods_distribution: paymentMethods,
            mobile_money_breakdown: mobileMoneyBreakdown
          },
          users: {
            new_this_period: newUsersThisPeriod
          },
          shop_metrics: {
            total_revenue: totalShopRevenue,
            total_orders: totalShopOrders
          }
        }
      });
    } catch (error) {
      console.error('Erreur dashboard overview:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Analytics des boutiques par période
router.get('/analytics/shops', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      const { 
        start_date, 
        end_date, 
        group_by = 'day' // day, week, month
      } = req.query as any;

      let startDate, endDate;
      
      if (start_date && end_date) {
        startDate = new Date(start_date as string);
        endDate = new Date(end_date as string);
      } else {
        // Par défaut: 30 derniers jours
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      // Récupérer les analytics
      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Grouper les données selon la période demandée
      let groupedData = [];
      
      if (group_by === 'day') {
        // Données par jour
        groupedData = analytics || [];
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
              total_revenue: 0,
              total_orders: 0,
              successful_payments: 0,
              failed_payments: 0,
              mobile_money_payments: 0,
              orange_money_payments: 0,
              mtn_money_payments: 0,
              moov_money_payments: 0
            };
          }
          
          weeks[weekKey].total_revenue += parseFloat(day.total_revenue || 0);
          weeks[weekKey].total_orders += day.total_orders || 0;
          weeks[weekKey].successful_payments += day.successful_payments || 0;
          weeks[weekKey].failed_payments += day.failed_payments || 0;
          weeks[weekKey].mobile_money_payments += day.mobile_money_payments || 0;
          weeks[weekKey].orange_money_payments += day.orange_money_payments || 0;
          weeks[weekKey].mtn_money_payments += day.mtn_money_payments || 0;
          weeks[weekKey].moov_money_payments += day.moov_money_payments || 0;
        });
        groupedData = Object.values(weeks);
      } else if (group_by === 'month') {
        // Grouper par mois
        const months = {};
        analytics?.forEach(day => {
          const date = new Date(day.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!months[monthKey]) {
            months[monthKey] = {
              date: `${monthKey}-01`,
              total_revenue: 0,
              total_orders: 0,
              successful_payments: 0,
              failed_payments: 0,
              mobile_money_payments: 0,
              orange_money_payments: 0,
              mtn_money_payments: 0,
              moov_money_payments: 0
            };
          }
          
          months[monthKey].total_revenue += parseFloat(day.total_revenue || 0);
          months[monthKey].total_orders += day.total_orders || 0;
          months[monthKey].successful_payments += day.successful_payments || 0;
          months[monthKey].failed_payments += day.failed_payments || 0;
          months[monthKey].mobile_money_payments += day.mobile_money_payments || 0;
          months[monthKey].orange_money_payments += day.orange_money_payments || 0;
          months[monthKey].mtn_money_payments += day.mtn_money_payments || 0;
          months[monthKey].moov_money_payments += day.moov_money_payments || 0;
        });
        groupedData = Object.values(months);
      }

      // Calculer les totaux
      const totals = groupedData.reduce((acc, period) => ({
        total_revenue: acc.total_revenue + parseFloat(period.total_revenue || 0),
        total_orders: acc.total_orders + (period.total_orders || 0),
        successful_payments: acc.successful_payments + (period.successful_payments || 0),
        failed_payments: acc.failed_payments + (period.failed_payments || 0),
        mobile_money_payments: acc.mobile_money_payments + (period.mobile_money_payments || 0),
        orange_money_payments: acc.orange_money_payments + (period.orange_money_payments || 0),
        mtn_money_payments: acc.mtn_money_payments + (period.mtn_money_payments || 0),
        moov_money_payments: acc.moov_money_payments + (period.moov_money_payments || 0)
      }), {
        total_revenue: 0,
        total_orders: 0,
        successful_payments: 0,
        failed_payments: 0,
        mobile_money_payments: 0,
        orange_money_payments: 0,
        mtn_money_payments: 0,
        moov_money_payments: 0
      });

      res.json({
        success: true,
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            group_by: group_by
          },
          totals: totals,
          data: groupedData
        }
      });
    } catch (error) {
      console.error('Erreur analytics shops:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Top performing shops
router.get('/analytics/top-shops', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      const { 
        limit = 10, 
        metric = 'revenue', // revenue, orders, conversion_rate
        period = '30' // derniers jours
      } = req.query;

      const startDate = new Date();
      const days = typeof period === 'string' ? parseInt(period) : 30;
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les analytics des shops
      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Agréger par shop
      const shopMetrics = {};
      analytics?.forEach(day => {
        if (!shopMetrics[day.shop_id]) {
          shopMetrics[day.shop_id] = {
            shop_id: day.shop_id,
            total_revenue: 0,
            total_orders: 0,
            successful_payments: 0,
            conversion_rate: 0,
            days_count: 0
          };
        }
        
        shopMetrics[day.shop_id].total_revenue += parseFloat(day.total_revenue || 0);
        shopMetrics[day.shop_id].total_orders += day.total_orders || 0;
        shopMetrics[day.shop_id].successful_payments += day.successful_payments || 0;
        shopMetrics[day.shop_id].conversion_rate += day.conversion_rate || 0;
        shopMetrics[day.shop_id].days_count += 1;
      });

      // Calculer les moyennes et trier
      const sortedShops = Object.values(shopMetrics)
        .map((shop: any) => ({
          ...shop,
          avg_conversion_rate: shop.conversion_rate / shop.days_count
        }))
        .sort((a: any, b: any) => {
          switch (metric) {
            case 'revenue':
              return b.total_revenue - a.total_revenue;
            case 'orders':
              return b.total_orders - a.total_orders;
            case 'conversion_rate':
              return b.avg_conversion_rate - a.avg_conversion_rate;
            default:
              return b.total_revenue - a.total_revenue;
          }
        })
        .slice(0, parseInt(limit as string));

      // Récupérer les détails des shops
      const shopIds = sortedShops.map(s => s.shop_id);
      const { data: shops } = await supabase
        .from('shops')
        .select('id, name, slug, status, is_verified, rating, review_count')
        .in('id', shopIds);

      // Combiner les données
      const topShops = sortedShops.map(shopMetric => {
        const shop = shops?.find(s => s.id === shopMetric.shop_id);
        return {
          ...shop,
          metrics: {
            total_revenue: shopMetric.total_revenue,
            total_orders: shopMetric.total_orders,
            successful_payments: shopMetric.successful_payments,
            avg_conversion_rate: shopMetric.avg_conversion_rate
          }
        };
      });

      res.json({
        success: true,
        data: {
          period_days: parseInt(period as string),
          metric: metric,
          top_shops: topShops
        }
      });
    } catch (error) {
      console.error('Erreur top shops analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Payment method analytics
router.get('/analytics/payment-methods', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      const { period = '30' } = req.query as any;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period as string));

      // Récupérer les analytics avec les données de paiement
      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select(`
          date,
          mobile_money_payments,
          card_payments,
          cash_payments,
          orange_money_payments,
          mtn_money_payments,
          moov_money_payments,
          successful_payments,
          failed_payments
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      // Agréger les données
      const totals = analytics?.reduce((acc, day) => ({
        mobile_money: acc.mobile_money + (day.mobile_money_payments || 0),
        card: acc.card + (day.card_payments || 0),
        cash: acc.cash + (day.cash_payments || 0),
        orange_money: acc.orange_money + (day.orange_money_payments || 0),
        mtn_money: acc.mtn_money + (day.mtn_money_payments || 0),
        moov_money: acc.moov_money + (day.moov_money_payments || 0),
        successful: acc.successful + (day.successful_payments || 0),
        failed: acc.failed + (day.failed_payments || 0)
      }), {
        mobile_money: 0,
        card: 0,
        cash: 0,
        orange_money: 0,
        mtn_money: 0,
        moov_money: 0,
        successful: 0,
        failed: 0
      }) || {
        mobile_money: 0,
        card: 0,
        cash: 0,
        orange_money: 0,
        mtn_money: 0,
        moov_money: 0,
        successful: 0,
        failed: 0
      };

      // Calculer les pourcentages
      const totalPayments = totals.mobile_money + totals.card + totals.cash;
      const totalMobileMoney = totals.orange_money + totals.mtn_money + totals.moov_money;

      const percentages = {
        mobile_money: totalPayments > 0 ? ((totals.mobile_money / totalPayments) * 100).toFixed(2) : 0,
        card: totalPayments > 0 ? ((totals.card / totalPayments) * 100).toFixed(2) : 0,
        cash: totalPayments > 0 ? ((totals.cash / totalPayments) * 100).toFixed(2) : 0,
        orange_money: totalMobileMoney > 0 ? ((totals.orange_money / totalMobileMoney) * 100).toFixed(2) : 0,
        mtn_money: totalMobileMoney > 0 ? ((totals.mtn_money / totalMobileMoney) * 100).toFixed(2) : 0,
        moov_money: totalMobileMoney > 0 ? ((totals.moov_money / totalMobileMoney) * 100).toFixed(2) : 0,
        success_rate: (totals.successful + totals.failed) > 0 ? 
          ((totals.successful / (totals.successful + totals.failed)) * 100).toFixed(2) : 0
      };

      // Données pour le graphique temporel
      const timelineData = analytics?.map(day => ({
        date: day.date,
        mobile_money: day.mobile_money_payments || 0,
        card: day.card_payments || 0,
        cash: day.cash_payments || 0,
        orange_money: day.orange_money_payments || 0,
        mtn_money: day.mtn_money_payments || 0,
        moov_money: day.moov_money_payments || 0,
        success_rate: day.successful_payments + day.failed_payments > 0 ? 
          ((day.successful_payments / (day.successful_payments + day.failed_payments)) * 100).toFixed(2) : 0
      })) || [];

      res.json({
        success: true,
        data: {
          period_days: parseInt(period),
          totals: totals,
          percentages: percentages,
          timeline: timelineData
        }
      });
    } catch (error) {
      console.error('Erreur payment methods analytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;