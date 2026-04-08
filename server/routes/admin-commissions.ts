import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware pour vérifier les permissions admin (copié de admin-shops.ts)
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

// === ROUTES POUR LA GESTION DES COMMISSIONS ===

// Obtenir toutes les règles de commission
router.get('/commission-rules', 
  checkAdminPermission('commissions.read'),
  async (req, res) => {
    try {
      const { page = '1', limit = '20', is_active, category_id, search } = req.query as any;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('commission_rules')
        .select(`
          *,
          category:shop_categories(id, name, name_fr, name_en)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
      if (category_id) query = query.eq('category_id', category_id);
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Paginer
      query = query.range(offset, offset + limitNum - 1);

      const { data: rules, error, count } = await query;

      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la récupération des règles de commission' 
        });
      }

      res.json({
        success: true,
        data: rules,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count,
          totalPages: Math.ceil(count! / limitNum)
        }
      });
    } catch (error) {
      console.error('Erreur récupération règles commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir une règle de commission spécifique
router.get('/commission-rules/:id', 
  checkAdminPermission('commissions.read'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const { data: rule, error } = await supabase
        .from('commission_rules')
        .select(`
          *,
          category:shop_categories(id, name, name_fr, name_en)
        `)
        .eq('id', id)
        .single();

      if (error || !rule) {
        return res.status(404).json({ 
          success: false, 
          error: 'Règle de commission non trouvée' 
        });
      }

      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      console.error('Erreur récupération règle commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Créer une nouvelle règle de commission
router.post('/commission-rules', 
  checkAdminPermission('commissions.create'),
  async (req, res) => {
    try {
      const {
        name,
        description,
        commission_type,
        commission_value,
        min_amount = 0,
        max_amount,
        category_id,
        is_active = true
      } = req.body;

      // Validation
      if (!name || !commission_type || commission_value === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Champs requis manquants: name, commission_type, commission_value' 
        });
      }

      if (!['percentage', 'fixed'].includes(commission_type)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Type de commission invalide. Doit être "percentage" ou "fixed"' 
        });
      }

      if (commission_type === 'percentage' && (commission_value < 0 || commission_value > 100)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Pourcentage de commission invalide. Doit être entre 0 et 100' 
        });
      }

      if (commission_type === 'fixed' && commission_value < 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Montant de commission fixe invalide. Doit être positif' 
        });
      }

      const { data: rule, error } = await supabase
        .from('commission_rules')
        .insert({
          name,
          description,
          commission_type,
          commission_value,
          min_amount,
          max_amount,
          category_id,
          is_active
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erreur création règle commission:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la création de la règle de commission' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: 'commission_rule_created',
        resource_type: 'commission_rule',
        resource_id: rule.id,
        details: { rule: rule },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        message: 'Règle de commission créée avec succès',
        data: rule
      });
    } catch (error) {
      console.error('Erreur création règle commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Mettre à jour une règle de commission
router.patch('/commission-rules/:id', 
  checkAdminPermission('commissions.update'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validation des champs modifiables
      const allowedFields = [
        'name', 'description', 'commission_type', 'commission_value',
        'min_amount', 'max_amount', 'category_id', 'is_active'
      ];
      
      const filteredUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          (filteredUpdates as any)[key] = (updates as any)[key];
        }
      });

      // Validation si commission_type ou commission_value sont modifiés
      if (filteredUpdates.commission_type || filteredUpdates.commission_value !== undefined) {
        const commissionType = filteredUpdates.commission_type || 'percentage';
        const commissionValue = filteredUpdates.commission_value;

        if (commissionType === 'percentage' && (commissionValue < 0 || commissionValue > 100)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Pourcentage de commission invalide. Doit être entre 0 et 100' 
          });
        }

        if (commissionType === 'fixed' && commissionValue < 0) {
          return res.status(400).json({ 
            success: false, 
            error: 'Montant de commission fixe invalide. Doit être positif' 
          });
        }
      }

      const { data: rule, error } = await supabase
        .from('commission_rules')
        .update(filteredUpdates)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !rule) {
        return res.status(404).json({ 
          success: false, 
          error: 'Règle de commission non trouvée ou erreur de mise à jour' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: (req as any).adminUser.id,
        action: 'commission_rule_updated',
        resource_type: 'commission_rule',
        resource_id: id,
        details: { updates: filteredUpdates },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Règle de commission mise à jour avec succès',
        data: rule
      });
    } catch (error) {
      console.error('Erreur mise à jour règle commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Supprimer une règle de commission
router.delete('/commission-rules/:id', 
  checkAdminPermission('commissions.delete'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier si la règle est utilisée par des boutiques
      const { data: shopsUsingRule } = await supabase
        .from('shops')
        .select('id, name')
        .eq('commission_rule_id', id)
        .limit(1);

      if (shopsUsingRule && shopsUsingRule.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cette règle de commission est utilisée par des boutiques et ne peut pas être supprimée' 
        });
      }

      const { error } = await supabase
        .from('commission_rules')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Erreur lors de la suppression de la règle de commission' 
        });
      }

      // Logger l'action
      await supabase.from('admin_activity_logs').insert({
        admin_user_id: req.adminUser.id,
        action: 'commission_rule_deleted',
        resource_type: 'commission_rule',
        resource_id: id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Règle de commission supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression règle commission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les statistiques des commissions
router.get('/commission-stats', 
  checkAdminPermission('analytics.read'),
  async (req, res) => {
    try {
      const { period = '30' } = req.query; // nombre de jours
      const startDate = new Date();
      const days = typeof period === 'string' ? parseInt(period) : 30;
      startDate.setDate(startDate.getDate() - days);

      // Récupérer toutes les boutiques avec leurs règles de commission
      const { data: shops } = await supabase
        .from('shops')
        .select(`
          id, name, commission_rule_id,
          commission_rule:commission_rules(id, name, commission_type, commission_value)
        `)
        .eq('status', 'approved');

      // Récupérer les analytics des shops
      const { data: analytics } = await supabase
        .from('shop_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0]);

      // Calculer les statistiques par règle de commission
      const statsByRule = {};
      const totalStats = {
        total_revenue: 0,
        total_commission: 0,
        total_orders: 0,
        shops_count: shops?.length || 0
      };

      shops?.forEach(shop => {
        const rule = shop.commission_rule as any;
        if (!rule) return;

        const shopAnalytics = analytics?.filter(a => a.shop_id === shop.id) || [];
        const shopRevenue = shopAnalytics.reduce((sum, a) => sum + parseFloat(a.total_revenue || 0), 0);
        const shopOrders = shopAnalytics.reduce((sum, a) => sum + (a.total_orders || 0), 0);

        let commissionAmount = 0;
        if (rule.commission_type === 'percentage') {
          commissionAmount = (shopRevenue * rule.commission_value) / 100;
        } else {
          commissionAmount = shopOrders * rule.commission_value;
        }

        if (!statsByRule[rule.id]) {
          statsByRule[rule.id] = {
            rule_id: rule.id,
            rule_name: rule.name,
            commission_type: rule.commission_type,
            commission_value: rule.commission_value,
            total_revenue: 0,
            total_commission: 0,
            total_orders: 0,
            shops_count: 0
          };
        }

        statsByRule[rule.id].total_revenue += shopRevenue;
        statsByRule[rule.id].total_commission += commissionAmount;
        statsByRule[rule.id].total_orders += shopOrders;
        statsByRule[rule.id].shops_count += 1;

        totalStats.total_revenue += shopRevenue;
        totalStats.total_commission += commissionAmount;
        totalStats.total_orders += shopOrders;
      });

      res.json({
        success: true,
        data: {
          period_days: typeof period === 'string' ? parseInt(period) : 30,
          total_stats: totalStats,
          by_rule: Object.values(statsByRule)
        }
      });
    } catch (error) {
      console.error('Erreur statistiques commissions:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;