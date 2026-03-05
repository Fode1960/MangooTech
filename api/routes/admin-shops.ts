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
      
      // Vérifier si l'utilisateur est admin
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

      // Récupérer les permissions du rôle
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

      // Vérifier la permission
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

// === ROUTES POUR LA GESTION DES BOUTIQUES ===

// Obtenir toutes les boutiques (avec filtres et pagination)
router.get('/shops', 
  checkAdminPermission('shops.read'),
  async (req, res) => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status, 
        category_id, 
        search,
        verified,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query as any;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;
      
      let query = supabase
        .from('shops')
        .select(`
          *,
          user:auth.users!user_id(id, email, raw_user_meta_data),
          category:shop_categories(id, name, name_fr, name_en),
          commission_rule:commission_rules(id, name, commission_type, commission_value)
        `, { count: 'exact' });

      // Appliquer les filtres
      if (status) query = query.eq('status', status);
      if (category_id) query = query.eq('category_id', category_id);
      if (verified !== undefined) query = query.eq('is_verified', verified === 'true');
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Trier et paginer
      query = query
        .order(sort_by as string, { ascending: sort_order === 'asc' })
        .range(offset, offset + limitNum - 1);

      const { data: shops, error, count } = await query;

      if (error) {
        console.error('Erreur récupération boutiques:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la récupération des boutiques' 
        });
      }

      // Calculer les métriques pour chaque boutique
      const shopsWithMetrics = await Promise.all(
        shops.map(async (shop) => {
          // Récupérer les métriques des 30 derniers jours
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { data: analytics } = await supabase
            .from('shop_analytics')
            .select('*')
            .eq('shop_id', (shop as any).id)
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

          const metrics = analytics?.reduce((acc, day) => ({
            total_revenue: acc.total_revenue + parseFloat(day.total_revenue || 0),
            total_orders: acc.total_orders + (day.total_orders || 0),
            successful_payments: acc.successful_payments + (day.successful_payments || 0),
            failed_payments: acc.failed_payments + (day.failed_payments || 0),
            mobile_money_payments: acc.mobile_money_payments + (day.mobile_money_payments || 0),
            orange_money_payments: acc.orange_money_payments + (day.orange_money_payments || 0),
            mtn_money_payments: acc.mtn_money_payments + (day.mtn_money_payments || 0),
            moov_money_payments: acc.moov_money_payments + (day.moov_money_payments || 0)
          }), {
            total_revenue: 0,
            total_orders: 0,
            successful_payments: 0,
            failed_payments: 0,
            mobile_money_payments: 0,
            orange_money_payments: 0,
            mtn_money_payments: 0,
            moov_money_payments: 0
          }) || {};

          return {
            ...(shop as any),
            metrics_30_days: metrics
          };
        })
      );

      res.json({
        success: true,
        data: shopsWithMetrics,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count! / limitNum)
        }
      });
    } catch (error) {
      console.error('Erreur générale:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir une boutique spécifique
router.get('/shops/:id', 
  checkAdminPermission('shops.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: shop, error } = await supabase
        .from('shops')
        .select(`
          *,
          user:auth.users!user_id(id, email, raw_user_meta_data),
          category:shop_categories(id, name, name_fr, name_en),
          commission_rule:commission_rules(id, name, commission_type, commission_value)
        `)
        .eq('id', id)
        .single();

      if (error || !shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée' 
        });
      }

      // Récupérer les analytics des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .eq('shop_id', id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Récupérer l'historique des paiements
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('shop_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      res.json({
        success: true,
        data: {
          ...(shop as any),
          analytics_30_days: analytics,
          recent_payments: payments
        }
      });
    } catch (error) {
      console.error('Erreur récupération boutique:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Mettre à jour une boutique
router.patch('/shops/:id', 
  checkAdminPermission('shops.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validation des champs modifiables
      const allowedFields = [
        'status', 'category_id', 'commission_rule_id', 'is_verified',
        'website_url', 'facebook_url', 'instagram_url', 'whatsapp_number',
        'logo_url', 'cover_image_url', 'name', 'description', 'address', 'phone', 'email'
      ];
      
      const filteredUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          (filteredUpdates as any)[key] = (updates as any)[key];
        }
      });

      // Si le statut change vers 'approved', mettre à jour la date
      if (filteredUpdates.status === 'approved') {
        filteredUpdates.approved_at = new Date().toISOString();
      }

      // Si la vérification change, mettre à jour la date
      if (filteredUpdates.is_verified === true) {
        filteredUpdates.verified_at = new Date().toISOString();
      }

      const { data: shop, error } = await supabase
        .from('shops')
        .update(filteredUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée ou erreur de mise à jour' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: 'shop_updated',
        resource_type: 'shop',
        resource_id: id,
        details: { updates: filteredUpdates },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Boutique mise à jour avec succès',
        data: shop
      });
    } catch (error) {
      console.error('Erreur mise à jour boutique:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Approuver une boutique
router.patch('/shops/:id/approve', 
  checkAdminPermission('shops.approve'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;

      const { data: shop, error } = await supabase
        .from('shops')
        .update({ 
          status: approved ? 'approved' : 'rejected',
          approved_at: approved ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: approved ? 'shop_approved' : 'shop_rejected',
        resource_type: 'shop',
        resource_id: id,
        details: { approved },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Boutique ${approved ? 'approuvée' : 'rejetée'} avec succès`,
        data: shop
      });
    } catch (error) {
      console.error('Erreur approbation boutique:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Suspendre/Réactiver une boutique
router.patch('/shops/:id/suspend', 
  checkAdminPermission('shops.suspend'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { suspended } = req.body;

      const { data: shop, error } = await supabase
        .from('shops')
        .update({ 
          status: suspended ? 'suspended' : 'active'
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: suspended ? 'shop_suspended' : 'shop_reactivated',
        resource_type: 'shop',
        resource_id: id,
        details: { suspended },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Boutique ${suspended ? 'suspendue' : 'réactivée'} avec succès`,
        data: shop
      });
    } catch (error) {
      console.error('Erreur suspension boutique:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les statistiques des boutiques
router.get('/shops/stats', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      // Statistiques générales
      const { data: stats, error } = await supabase
        .from('shops')
        .select('status, is_verified')
        .not('status', 'is', null);

      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la récupération des statistiques' 
        });
      }

      const totalShops = stats.length;
      const statusCounts = stats.reduce((acc, shop) => {
        acc[shop.status] = (acc[shop.status] || 0) + 1;
        return acc;
      }, {});

      const verifiedCount = stats.filter(shop => shop.is_verified).length;

      // Statistiques des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentAnalytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      const monthlyMetrics = recentAnalytics?.reduce((acc, day) => ({
        total_revenue: acc.total_revenue + parseFloat(day.total_revenue || 0),
        total_orders: acc.total_orders + (day.total_orders || 0),
        successful_payments: acc.successful_payments + (day.successful_payments || 0),
        failed_payments: acc.failed_payments + (day.failed_payments || 0),
        mobile_money_payments: acc.mobile_money_payments + (day.mobile_money_payments || 0),
        orange_money_payments: acc.orange_money_payments + (day.orange_money_payments || 0),
        mtn_money_payments: acc.mtn_money_payments + (day.mtn_money_payments || 0),
        moov_money_payments: acc.moov_money_payments + (day.moov_money_payments || 0)
      }), {
        total_revenue: 0,
        total_orders: 0,
        successful_payments: 0,
        failed_payments: 0,
        mobile_money_payments: 0,
        orange_money_payments: 0,
        mtn_money_payments: 0,
        moov_money_payments: 0
      }) || {};

      res.json({
        success: true,
        data: {
          total_shops: totalShops,
          status_distribution: statusCounts,
          verified_shops: verifiedCount,
          unverified_shops: totalShops - verifiedCount,
          monthly_metrics: monthlyMetrics
        }
      });
    } catch (error) {
      console.error('Erreur statistiques boutiques:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Upload de logo pour une boutique
router.post('/shops/:id/logo',
  checkAdminPermission('shops.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier que la boutique existe
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('id', id)
        .single();

      if (shopError || !shop) {
        return res.status(404).json({ 
          success: false, 
          error: 'Boutique non trouvée' 
        });
      }

      // Ici vous devriez utiliser un middleware de upload de fichiers
      // Pour cet exemple, nous supposons que le logo_url est fourni dans le body
      const { logo_url } = req.body;

      if (!logo_url) {
        return res.status(400).json({ 
          success: false, 
          error: 'URL du logo manquant' 
        });
      }

      // Mettre à jour le logo de la boutique
      const { data: updatedShop, error: updateError } = await supabase
        .from('shops')
        .update({ logo_url })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la mise à jour du logo' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: 'shop_logo_updated',
        resource_type: 'shop',
        resource_id: id,
        details: { logo_url },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Logo mis à jour avec succès',
        data: updatedShop
      });
    } catch (error) {
      console.error('Erreur upload logo:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;