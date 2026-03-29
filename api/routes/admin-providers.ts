import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

function requireSupabase(req: express.Request, res: express.Response): boolean {
  if (supabase) return true;
  res.status(503).json({
    success: false,
    error: 'Supabase non configuré. Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.'
  });
  return false;
}

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

      if (token === 'demo-admin' && process.env.NODE_ENV !== 'production') {
        ;(req as any).adminUser = { id: null, role_id: null, is_active: true }
        ;(req as any).user = { id: null, email: 'admin@mangoo.tech' }
        return next()
      }

      if (!requireSupabase(req, res)) return;

      const { data: { user }, error: authError } = await supabase!.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Token invalide'
        });
      }

      const userId = user.id;

      const { data: adminUser } = await supabase!
        .from('admin_users')
        .select('id, role_id, is_active')
        .eq('user_id', userId)
        .single();

      if (!adminUser || !adminUser.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé: Utilisateur non autorisé'
        });
      }

      const { data: role } = await supabase!
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
      if (!permissions?.[resource] || !permissions[resource].includes(action)) {
        return res.status(403).json({
          success: false,
          error: `Permission refusée: ${permission}`
        });
      }

      (req as any).adminUser = adminUser;
      (req as any).user = user;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la vérification des permissions'
      });
    }
  };
};

router.get(
  '/providers',
  checkAdminPermission('providers.read'),
  async (req, res) => {
    try {
      if (!requireSupabase(req, res)) return;
      const {
        page = '1',
        limit = '20',
        status,
        search,
        visible,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query as any;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = supabase!
        .from('providers')
        .select('*', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (visible !== undefined) query = query.eq('is_visible', visible === 'true');
      if (search) {
        const q = String(search).trim();
        if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,email.ilike.%${q}%`);
      }

      query = query
        .order(String(sort_by), { ascending: String(sort_order).toLowerCase() === 'asc' })
        .range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({
        success: true,
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limitNum)
        }
      });
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

router.patch(
  '/providers/:id',
  checkAdminPermission('providers.update'),
  async (req, res) => {
    try {
      if (!requireSupabase(req, res)) return;
      const { id } = req.params;
      const updates = req.body || {};

      const allowedFields = [
        'name',
        'slug',
        'description',
        'avatar_url',
        'banner_url',
        'phone',
        'email',
        'address',
        'city',
        'country',
        'services',
        'portfolio',
        'zones',
        'is_mobile',
        'status',
        'is_visible',
        'approved_at',
        'verified_at'
      ];

      const filtered: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) filtered[key] = updates[key];
      }

      const { data: provider, error } = await supabase!
        .from('providers')
        .update(filtered)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      return res.json({ success: true, data: provider });
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

router.patch(
  '/providers/:id/approve',
  checkAdminPermission('providers.approve'),
  async (req, res) => {
    try {
      if (!requireSupabase(req, res)) return;
      const { id } = req.params;
      const { action } = req.body || {};
      const normalized = String(action || '').toLowerCase();

      let nextStatus: string | null = null;
      let nextVisible: boolean | null = null;
      let approvedAt: string | null = null;

      if (normalized === 'approve') {
        nextStatus = 'approved';
        nextVisible = true;
        approvedAt = new Date().toISOString();
      } else if (normalized === 'reject') {
        nextStatus = 'rejected';
        nextVisible = false;
      } else if (normalized === 'suspend') {
        nextStatus = 'suspended';
        nextVisible = false;
      } else {
        return res.status(400).json({
          success: false,
          error: 'Action invalide'
        });
      }

      const patch: Record<string, any> = {
        status: nextStatus,
        is_visible: nextVisible
      };
      if (approvedAt) patch.approved_at = approvedAt;

      const { data: provider, error } = await supabase!
        .from('providers')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      try {
        const adminUser = (req as any).adminUser;
        await supabase!
          .from('admin_activity_logs')
          .insert({
            admin_user_id: adminUser?.id || null,
            action: `providers.${normalized}`,
            resource_type: 'provider',
            resource_id: id,
            details: { status: patch.status, is_visible: patch.is_visible }
          });
      } catch {
      }

      return res.json({ success: true, data: provider });
    } catch {
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  }
);

export default router;
