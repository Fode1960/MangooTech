import express from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token manquant'
      });
    }

    if (!requireSupabase(req, res)) return;

    const { data: { user }, error: authError } = await supabase!.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    const { data: adminUser } = await supabase!
      .from('admin_users')
      .select('id, role_id, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé: Administrateur requis'
      });
    }

    (req as any).user = user;
    (req as any).adminUser = adminUser;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification admin'
    });
  }
};

router.get('/products', authenticateAdmin, async (_req, res) => {
  try {
    if (!requireSupabase(_req, res)) return;

    const { data, error } = await supabase!
      .from('boost_products')
      .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active, created_at, updated_at')
      .order('kind', { ascending: true })
      .order('duration_hours', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, products: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.patch('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;

    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ success: false, error: 'id manquant' });

    const patch: any = {};
    if (req.body?.price_xof !== undefined) patch.price_xof = Number(req.body.price_xof);
    if (req.body?.currency !== undefined) patch.currency = String(req.body.currency || 'XOF').toUpperCase();
    if (req.body?.title !== undefined) patch.title = String(req.body.title || '');
    if (req.body?.description !== undefined) patch.description = String(req.body.description || '');
    if (req.body?.active !== undefined) patch.active = Boolean(req.body.active);
    if (req.body?.sponsored_tier !== undefined) {
      const v = req.body.sponsored_tier;
      patch.sponsored_tier = v === 'bronze' || v === 'argent' || v === 'or' ? v : null;
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('boost_products')
      .update(patch)
      .eq('id', id)
      .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active, created_at, updated_at')
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, product: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;
    const search = String(req.query.search || '').trim().toLowerCase();

    let q = supabase!
      .from('users')
      .select('id, email, first_name, last_name')
      .order('created_at', { ascending: false })
      .limit(20);

    if (search) q = q.ilike('email', `%${search}%`);

    const { data, error } = await q;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, users: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.get('/credits/balance', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;
    const userId = String(req.query.user_id || '').trim();
    if (!userId) return res.status(400).json({ success: false, error: 'user_id manquant' });

    const now = new Date();
    const { data, error } = await supabase!
      .from('user_credits')
      .select('amount, expires_at, used_at')
      .eq('user_id', userId);

    if (error) return res.status(500).json({ success: false, error: error.message });

    const rows = Array.isArray(data) ? data : [];
    let sum = 0;
    for (const r of rows) {
      const usedAt = (r as any).used_at;
      if (usedAt) continue;
      const expiresAt = (r as any).expires_at;
      if (expiresAt) {
        const d = new Date(String(expiresAt));
        if (!Number.isNaN(d.getTime()) && d.getTime() <= now.getTime()) continue;
      }
      sum += Number((r as any).amount || 0);
    }

    res.json({ success: true, balanceXof: Math.floor(sum) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.post('/credits/grant', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;

    const userId = String(req.body?.user_id || '').trim();
    const amount = Number(req.body?.amount_xof);
    const description = String(req.body?.description || 'Crédit admin').trim();
    const expiresAt = req.body?.expires_at ? String(req.body.expires_at) : null;

    if (!userId) return res.status(400).json({ success: false, error: 'user_id manquant' });
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'amount_xof invalide' });

    const nowIso = new Date().toISOString();
    const { data, error } = await supabase!
      .from('user_credits')
      .insert({
        user_id: userId,
        amount: Math.floor(amount),
        type: 'admin_grant',
        description,
        created_at: nowIso,
        expires_at: expiresAt,
        metadata: {
          source: 'admin_boost',
        }
      })
      .select('*')
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, credit: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.get('/vendor-boosts', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;
    const vendorId = String(req.query.vendor_id || '').trim();
    const vendorKind = String(req.query.vendor_kind || '').trim().toLowerCase();
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendor_id manquant' });
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendor_kind invalide' });

    const { data, error } = await supabase!
      .from('vendor_boosts')
      .select('vendor_id, vendor_kind, sponsored_until, sponsored_tier, promo_until, new_until, updated_at')
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind)
      .maybeSingle();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, row: data || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

function baseUntil(now: Date, iso: any): Date {
  const d = iso ? new Date(String(iso)) : null;
  if (!d || Number.isNaN(d.getTime())) return now;
  return d.getTime() > now.getTime() ? d : now;
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

router.post('/vendor-boosts/activate', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;

    const vendorId = String(req.body?.vendor_id || '').trim();
    const vendorKind = String(req.body?.vendor_kind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boost_kind || '').trim().toLowerCase();
    const durationHours = Number(req.body?.duration_hours);
    const tier = req.body?.sponsored_tier ? String(req.body.sponsored_tier).trim().toLowerCase() : null;

    if (!vendorId) return res.status(400).json({ success: false, error: 'vendor_id manquant' });
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendor_kind invalide' });
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') return res.status(400).json({ success: false, error: 'boost_kind invalide' });
    if (!Number.isFinite(durationHours) || durationHours <= 0) return res.status(400).json({ success: false, error: 'duration_hours invalide' });
    if (boostKind === 'sponsored' && tier && tier !== 'bronze' && tier !== 'argent' && tier !== 'or') {
      return res.status(400).json({ success: false, error: 'sponsored_tier invalide' });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const { data: current, error: readError } = await supabase!
      .from('vendor_boosts')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind)
      .maybeSingle();

    if (readError) return res.status(500).json({ success: false, error: readError.message });

    const patch: any = {
      vendor_id: vendorId,
      vendor_kind: vendorKind,
      updated_at: nowIso,
    };

    let expiresAt: Date | null = null;
    if (boostKind === 'sponsored') {
      const start = baseUntil(now, (current as any)?.sponsored_until);
      expiresAt = addHours(start, durationHours);
      patch.sponsored_until = expiresAt.toISOString();
      patch.sponsored_tier = tier || (current as any)?.sponsored_tier || 'bronze';
    }
    if (boostKind === 'promo') {
      const start = baseUntil(now, (current as any)?.promo_until);
      expiresAt = addHours(start, durationHours);
      patch.promo_until = expiresAt.toISOString();
    }
    if (boostKind === 'new') {
      const start = baseUntil(now, (current as any)?.new_until);
      expiresAt = addHours(start, durationHours);
      patch.new_until = expiresAt.toISOString();
    }

    const { error: upsertError } = await supabase!
      .from('vendor_boosts')
      .upsert(patch, { onConflict: 'vendor_id,vendor_kind' });

    if (upsertError) return res.status(500).json({ success: false, error: upsertError.message });

    const adminUser = (req as any).user;
    try {
      await supabase!
        .from('boost_orders')
        .insert({
          id: crypto.randomUUID(),
          user_id: String(adminUser?.id || ''),
          vendor_id: vendorId,
          vendor_kind: vendorKind,
          boost_kind: boostKind,
          duration_hours: Math.floor(durationHours),
          amount_xof: 0,
          currency: 'XOF',
          status: 'active',
          sponsored_tier: boostKind === 'sponsored' ? (patch.sponsored_tier || null) : null,
          paid_at: nowIso,
          activated_at: nowIso,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          metadata: { source: 'admin_manual' },
          created_at: nowIso,
          updated_at: nowIso,
        });
    } catch {
    }

    const { data: nextRow } = await supabase!
      .from('vendor_boosts')
      .select('vendor_id, vendor_kind, sponsored_until, sponsored_tier, promo_until, new_until, updated_at')
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind)
      .maybeSingle();

    res.json({ success: true, row: nextRow || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.post('/vendor-boosts/stop', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;

    const vendorId = String(req.body?.vendor_id || '').trim();
    const vendorKind = String(req.body?.vendor_kind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boost_kind || '').trim().toLowerCase();

    if (!vendorId) return res.status(400).json({ success: false, error: 'vendor_id manquant' });
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendor_kind invalide' });
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') return res.status(400).json({ success: false, error: 'boost_kind invalide' });

    const patch: any = { updated_at: new Date().toISOString() };
    if (boostKind === 'sponsored') {
      patch.sponsored_until = null;
      patch.sponsored_tier = null;
    }
    if (boostKind === 'promo') patch.promo_until = null;
    if (boostKind === 'new') patch.new_until = null;

    const { error } = await supabase!
      .from('vendor_boosts')
      .update(patch)
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind);

    if (error) return res.status(500).json({ success: false, error: error.message });

    const { data } = await supabase!
      .from('vendor_boosts')
      .select('vendor_id, vendor_kind, sponsored_until, sponsored_tier, promo_until, new_until, updated_at')
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind)
      .maybeSingle();

    res.json({ success: true, row: data || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

router.post('/vendor-boosts/stop-all', authenticateAdmin, async (req, res) => {
  try {
    if (!requireSupabase(req, res)) return;

    const vendorId = String(req.body?.vendor_id || '').trim();
    const vendorKind = String(req.body?.vendor_kind || '').trim().toLowerCase();
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendor_id manquant' });
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendor_kind invalide' });

    const patch: any = {
      sponsored_until: null,
      sponsored_tier: null,
      promo_until: null,
      new_until: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase!
      .from('vendor_boosts')
      .upsert({ vendor_id: vendorId, vendor_kind: vendorKind, ...patch }, { onConflict: 'vendor_id,vendor_kind' });

    if (error) return res.status(500).json({ success: false, error: error.message });

    const { data } = await supabase!
      .from('vendor_boosts')
      .select('vendor_id, vendor_kind, sponsored_until, sponsored_tier, promo_until, new_until, updated_at')
      .eq('vendor_id', vendorId)
      .eq('vendor_kind', vendorKind)
      .maybeSingle();

    res.json({ success: true, row: data || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || String(error) });
  }
});

export default router;
