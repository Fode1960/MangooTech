import { Router } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { BOOST_PRODUCTS } from '../config/boostPricing';
import { localBoostProductsStore } from '../services/localBoostProductsStore';
import { localVendorBoostsStore } from '../services/localVendorBoostsStore';
import { localBoostCreditsStore } from '../services/localBoostCreditsStore';
import { localSyncStore } from '../services/localSyncStore';
import { localBoostOrdersStore } from '../services/localBoostOrdersStore';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type BoostKind = 'sponsored' | 'promo' | 'new';
type SponsoredTier = 'bronze' | 'argent' | 'or';

function isUuidLike(value: string): boolean {
  const v = String(value || '').trim()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
}

function isPrivateIpv4(host: string): boolean {
  const h = String(host || '').trim()
  if (!h) return false
  const hostOnly = h.includes(':') ? h.split(':')[0] : h
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostOnly)
  if (!m) return false
  const a = Number(m[1]), b = Number(m[2]), c = Number(m[3]), d = Number(m[4])
  const parts = [a, b, c, d]
  if (parts.some((x) => !Number.isFinite(x) || x < 0 || x > 255)) return false
  if (a === 10) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function getOriginHost(origin: string): string {
  const o = String(origin || '').trim()
  if (!o) return ''
  try {
    const u = new URL(o)
    return String(u.hostname || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

function isTrustedDevRequest(req: any): boolean {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    if (!isDev) return false
    const hostHeader = String(req?.hostname || req?.headers?.host || '').toLowerCase()
    const origin = String(req?.headers?.origin || '').toLowerCase()
    const originHost = getOriginHost(origin)
    const hostOnly = hostHeader.includes(':') ? hostHeader.split(':')[0] : hostHeader
    const isLocalhost =
      hostHeader.includes('localhost') ||
      hostHeader.includes('127.0.0.1') ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      originHost === 'localhost' ||
      originHost === '127.0.0.1' ||
      originHost === '::1'
    if (isLocalhost) return true
    if (isPrivateIpv4(hostOnly)) return true
    if (isPrivateIpv4(originHost)) return true
  } catch {
  }
  return false
}

async function purchaseWithLocalCredits(params: {
  email: string
  vendorId: string
  vendorKind: 'shop' | 'provider'
  boostKind: BoostKind
  durationHours: number
}): Promise<{ success: true; row: any; balanceXof: number; vendorId: string }> {
  const email = String(params.email || '').trim().toLowerCase()
  const vendorId = String(params.vendorId || '').trim()
  const vendorKind = String(params.vendorKind || '').trim().toLowerCase() as any
  const boostKind = String(params.boostKind || '').trim().toLowerCase() as any
  const durationHours = Math.floor(Number(params.durationHours || 0))

  if (!email || !email.includes('@')) throw new Error('Email invalide')
  if (!vendorId) throw new Error('vendorId manquant')
  if (vendorKind !== 'shop' && vendorKind !== 'provider') throw new Error('vendorKind invalide')
  if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') throw new Error('boostKind invalide')
  if (!Number.isFinite(durationHours) || durationHours <= 0) throw new Error('durationHours invalide')

  let candidates: any[] = []
  try {
    const db = await fetchBoostProductsFromDb()
    const rows = Array.isArray(db) ? db.filter((p) => p.active) : []
    candidates = rows.filter((p) => String(p.kind) === boostKind && Number(p.duration_hours) === durationHours)
  } catch {
    candidates = []
  }
  if (!candidates.length) {
    const products = localBoostProductsStore.seedDefaults().filter((p) => p.active)
    candidates = products.filter((p) => String(p.kind) === boostKind && Number(p.duration_hours) === durationHours)
  }
  const pickBest = (list: any[]) => {
    let best: any = null
    for (const p of list) {
      if (!best) {
        best = p
        continue
      }
      const ta = Date.parse(String(p?.updated_at || ''))
      const tb = Date.parse(String(best?.updated_at || ''))
      const a = Number.isFinite(ta) ? ta : 0
      const b = Number.isFinite(tb) ? tb : 0
      if (a !== b) {
        if (a > b) best = p
        continue
      }
      const pa = Math.floor(Number(p?.price_xof || 0))
      const pb = Math.floor(Number(best?.price_xof || 0))
      if (pa >= pb) best = p
    }
    return best
  }
  const match = pickBest(candidates)
  if (!match) throw new Error('Aucune offre active correspondante')

  const canonicalVendorId = await normalizeVendorIdForPurchase({ vendorId, vendorKind, userEmail: email })

  localBoostCreditsStore.debit(email, Number(match.price_xof))

  const row = localVendorBoostsStore.activate({
    vendorId: canonicalVendorId,
    vendorKind,
    boostKind: boostKind as any,
    durationHours,
    sponsoredTier: boostKind === 'sponsored' ? (match.sponsored_tier as any) : null,
  })

  try {
    const expiresAt =
      boostKind === 'sponsored'
        ? row.sponsored_until
        : boostKind === 'promo'
          ? row.promo_until
          : row.new_until

    localBoostOrdersStore.create({
      vendor_id: canonicalVendorId,
      vendor_kind: vendorKind as any,
      boost_kind: boostKind as any,
      duration_hours: durationHours,
      amount_xof: Number(match.price_xof) || 0,
      currency: String(match.currency || 'XOF'),
      status: 'active',
      expires_at: expiresAt ? String(expiresAt) : null,
    })
  } catch {
  }

  try {
    const vendor = localSyncStore.listLocalPlusVendors().find((v: any) => String(v?.id || '') === vendorId) as any
    const toTierNum = (t: any) => (t === 'or' ? 3 : t === 'argent' ? 2 : t === 'bronze' ? 1 : null)
    const patch: any = {}
    if (row.sponsored_until) patch.sponsoredUntil = Date.parse(String(row.sponsored_until))
    if (row.promo_until) patch.promoUntil = Date.parse(String(row.promo_until))
    if (row.new_until) patch.newUntil = Date.parse(String(row.new_until))
    if (row.sponsored_tier) patch.sponsoredTier = toTierNum(row.sponsored_tier)
    if (vendor && Object.keys(patch).length) {
      void localSyncStore.upsertLocalPlusVendor({ ...vendor, ...patch }, email)
    }
  } catch {
  }

  const balanceXof = localBoostCreditsStore.getBalanceXof(email)
  return { success: true, row, balanceXof, vendorId: canonicalVendorId }
}

async function resolveOwnedShopIdByEmail(emailRaw: string): Promise<string> {
  const email = String(emailRaw || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return ''

  const attempt = async (withOwnerEmail: boolean) => {
    const q = supabase
      .from('shops')
      .select(withOwnerEmail ? 'id,owner_email,email,created_at' : 'id,email,created_at')
      .order('created_at', { ascending: false })
      .limit(1)
    if (withOwnerEmail) return await q.or(`owner_email.eq.${email},email.eq.${email}`)
    return await q.eq('email', email)
  }

  let r: any = await attempt(true)
  if (r?.error) {
    const msg = String(r.error.message || '').toLowerCase()
    const missingOwnerEmail =
      (msg.includes('could not find') && msg.includes('owner_email')) ||
      (msg.includes('owner_email') && (msg.includes('does not exist') || msg.includes('column') || msg.includes('schema cache')))
    if (missingOwnerEmail) r = await attempt(false)
  }

  const row = Array.isArray(r?.data) ? r.data[0] : null
  const id = row?.id ? String(row.id).trim() : ''
  return isUuidLike(id) ? id : ''
}

async function normalizeVendorIdForPurchase(params: { vendorId: string; vendorKind: string; userEmail: string | null | undefined }) {
  const vendorKind = String(params.vendorKind || '').trim().toLowerCase()
  const vendorId = String(params.vendorId || '').trim()
  if (vendorKind !== 'shop') return vendorId
  if (isUuidLike(vendorId)) return vendorId

  const candidates: string[] = []
  const add = (v: any) => {
    const s = String(v || '').trim()
    if (s && !candidates.includes(s)) candidates.push(s)
  }
  add(vendorId)
  if (vendorId.startsWith('local_')) add(vendorId.slice(6))
  if (vendorId.startsWith('s_')) add(`local_${vendorId}`)

  const resolveFromLocalPlus = async (inputId: string): Promise<string> => {
    try {
      const id = String(inputId || '').trim()
      if (!id) return ''
      const list = localSyncStore.listLocalPlusVendors()
      const row = Array.isArray(list)
        ? (list.find((v: any) => String(v?.id || '').trim() === id) ||
          list.find((v: any) => String(v?.id || '').trim() === id.replace(/^local_/, ''))) as any
        : null
      if (!row) return ''

      const slug = String(row?.slug || '').trim()
      if (slug) {
        try {
          const { data } = await supabase.from('shops').select('id').eq('slug', slug).maybeSingle()
          const shopId = data?.id ? String(data.id).trim() : ''
          if (isUuidLike(shopId)) return shopId
        } catch {
        }
      }

      const email = String(row?.ownerEmail || row?.owner_email || row?.email || row?.contact_email || '').trim().toLowerCase()
      if (email && email.includes('@')) {
        const resolved = await resolveOwnedShopIdByEmail(email)
        if (resolved) return resolved
      }
    } catch {
    }
    return ''
  }

  for (const raw of candidates) {
    if (isUuidLike(raw)) return raw

    if (raw.startsWith('local-') && raw.includes('@')) {
      const resolved = await resolveOwnedShopIdByEmail(raw.slice(6))
      if (resolved) return resolved
      continue
    }

    if (raw.startsWith('s_') || raw.startsWith('local_')) {
      const resolved = await resolveFromLocalPlus(raw)
      if (resolved) return resolved
      continue
    }

    if (/^[0-9]{6,}$/.test(raw)) {
      const resolved = await resolveFromLocalPlus(raw)
      if (resolved) return resolved
      continue
    }

    if (raw.includes('-') && !raw.includes('@') && raw.length <= 80) {
      try {
        const { data } = await supabase.from('shops').select('id').eq('slug', raw).maybeSingle()
        const id = data?.id ? String(data.id).trim() : ''
        if (isUuidLike(id)) return id
      } catch {
      }
    }
  }

  const resolved = await resolveOwnedShopIdByEmail(params.userEmail || '')
  return resolved || vendorId
}

type DbBoostProduct = {
  id: string;
  kind: BoostKind;
  duration_hours: number;
  price_xof: number;
  currency: string;
  title: string;
  description: string;
  sponsored_tier: SponsoredTier | null;
  active: boolean;
};

function isLocalBoostPricingMode() {
  const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
  const isDev = env !== 'production'
  const mode = String(process.env.BOOST_PRICING_MODE || '').trim().toLowerCase()
  if (mode === 'supabase') return false
  if (mode === 'local') return isDev
  const hasSupabase =
    String(process.env.SUPABASE_URL || '').trim() && String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (hasSupabase) return false
  return isDev
}

function isBoostDiscoveryEnabled() {
  const flag = String(process.env.BOOST_DISCOVERY_ENABLED || '').trim()
  if (flag === '1') return true
  if (flag === '0') return false
  return true
}

function toStripeUnitAmount(amountXof: number, currency: string): number {
  const c = String(currency || 'xof').toLowerCase();
  const zeroDecimal = new Set(['xof', 'xaf', 'jpy', 'krw', 'vnd']);
  if (zeroDecimal.has(c)) return Math.round(amountXof);
  return Math.round(amountXof * 100);
}

async function authenticateUser(req: any, res: any): Promise<{ user: any } | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Token manquant' });
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Token invalide' });
    return null;
  }

  return { user };
}

function isBoostKind(value: unknown): value is BoostKind {
  return value === 'sponsored' || value === 'promo' || value === 'new';
}

function toSponsoredTier(value: unknown): SponsoredTier | null {
  if (value === 'bronze' || value === 'argent' || value === 'or') return value;
  return null;
}

async function fetchBoostProductsFromDb(): Promise<DbBoostProduct[] | null> {
  const { data, error } = await supabase
    .from('boost_products')
    .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
    .order('kind', { ascending: true })
    .order('duration_hours', { ascending: true });

  if (error || !data) return null;

  const rows = Array.isArray(data) ? data : [];
  const parsed: DbBoostProduct[] = [];
  for (const r of rows) {
    const kind = String((r as any).kind || '').trim().toLowerCase();
    if (!isBoostKind(kind)) continue;
    parsed.push({
      id: String((r as any).id),
      kind,
      duration_hours: Number((r as any).duration_hours),
      price_xof: Number((r as any).price_xof),
      currency: String((r as any).currency || 'XOF'),
      title: String((r as any).title || ''),
      description: String((r as any).description || ''),
      sponsored_tier: toSponsoredTier((r as any).sponsored_tier),
      active: Boolean((r as any).active),
    });
  }

  return parsed;
}

async function fetchBoostProductFromDb(boostKind: BoostKind, durationHours: number): Promise<DbBoostProduct | null> {
  const { data, error } = await supabase
    .from('boost_products')
    .select('id, kind, duration_hours, price_xof, currency, title, description, sponsored_tier, active')
    .eq('kind', boostKind)
    .eq('duration_hours', durationHours)
    .maybeSingle();

  if (error || !data) return null;

  const kind = String((data as any).kind || '').trim().toLowerCase();
  if (!isBoostKind(kind)) return null;

  return {
    id: String((data as any).id),
    kind,
    duration_hours: Number((data as any).duration_hours),
    price_xof: Number((data as any).price_xof),
    currency: String((data as any).currency || 'XOF'),
    title: String((data as any).title || ''),
    description: String((data as any).description || ''),
    sponsored_tier: toSponsoredTier((data as any).sponsored_tier),
    active: Boolean((data as any).active),
  };
}

async function getUserCreditBalanceXof(userId: string): Promise<number> {
  const now = new Date();
  const { data, error } = await supabase
    .from('user_credits')
    .select('amount, expires_at, used_at')
    .eq('user_id', userId);

  if (error || !data) return 0;
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
  return Math.floor(sum);
}

async function activateBoostForOrder(params: {
  order: any;
  boostKind: BoostKind;
  durationHours: number;
  sponsoredTier: SponsoredTier | null;
}): Promise<{ expiresAt: string | null } | null> {
  const { order, boostKind, durationHours, sponsoredTier } = params;
  const now = new Date();

  const { data: current } = await supabase
    .from('vendor_boosts')
    .select('*')
    .eq('vendor_id', String(order.vendor_id))
    .eq('vendor_kind', String(order.vendor_kind))
    .maybeSingle();

  const baseUntil = (iso: any) => {
    const d = iso ? new Date(String(iso)) : null;
    if (!d || Number.isNaN(d.getTime())) return now;
    return d.getTime() > now.getTime() ? d : now;
  };

  const addHours = (d: Date, hours: number) => new Date(d.getTime() + hours * 60 * 60 * 1000);

  const patch: any = {
    vendor_id: String(order.vendor_id),
    vendor_kind: String(order.vendor_kind),
    updated_at: new Date().toISOString(),
  };

  let expiresAt: Date | null = null;
  if (boostKind === 'sponsored') {
    const start = baseUntil(current?.sponsored_until);
    expiresAt = addHours(start, durationHours);
    patch.sponsored_until = expiresAt.toISOString();
    patch.sponsored_tier = sponsoredTier;
  } else if (boostKind === 'promo') {
    const start = baseUntil(current?.promo_until);
    expiresAt = addHours(start, durationHours);
    patch.promo_until = expiresAt.toISOString();
  } else if (boostKind === 'new') {
    const start = baseUntil(current?.new_until);
    expiresAt = addHours(start, durationHours);
    patch.new_until = expiresAt.toISOString();
  }

  await supabase
    .from('vendor_boosts')
    .upsert(patch, { onConflict: 'vendor_id,vendor_kind' });

  await supabase
    .from('boost_orders')
    .update({
      status: 'active',
      activated_at: new Date().toISOString(),
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(order.id));

  return { expiresAt: expiresAt ? expiresAt.toISOString() : null };
}

const repairBadgesHandler = async (req: any, res: any) => {
  try {
    const isDev = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
    if (!isDev) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }

    const allowBypass = isTrustedDevRequest(req)

    let email = ''
    let authUser: any = null
    try {
      const rawAuth = String(req.headers?.authorization || '').trim()
      if (rawAuth.toLowerCase().startsWith('bearer ')) {
        const auth = await authenticateUser(req, res)
        if (auth) {
          authUser = auth.user
          email = String(auth.user?.email || '').trim().toLowerCase()
        }
      }
    } catch {
    }

    if (!email && allowBypass) {
      const fromQuery = String(req.query?.email || '').trim().toLowerCase()
      const fromBody = String(req.body?.email || '').trim().toLowerCase()
      email = fromQuery || fromBody
    }

    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Email invalide.' })
      return
    }

    if (!authUser && allowBypass) {
      try {
        const { data, error } = await (supabase as any).auth.admin.listUsers({ page: 1, perPage: 200 })
        if (!error) {
          const list = Array.isArray(data?.users) ? data.users : []
          const found = list.find((u: any) => String(u?.email || '').trim().toLowerCase() === email) || null
          if (found?.id) authUser = found
        }
      } catch {
      }
    }

    const rawVendorId = String(req.body?.vendorId || '').trim()
    const rawVendorKind = String(req.body?.vendorKind || 'shop').trim().toLowerCase()

    let shopId = ''
    if (rawVendorKind === 'shop' && rawVendorId) {
      shopId = await normalizeVendorIdForPurchase({ vendorId: rawVendorId, vendorKind: 'shop', userEmail: email })
      if (!isUuidLike(shopId)) shopId = ''
    }
    if (!shopId && rawVendorKind === 'shop' && rawVendorId) {
      try {
        const localPlus = localSyncStore.listLocalPlusVendors()
        const vendors = Array.isArray(localPlus) ? localPlus : []
        const localMatch = vendors.find((v: any) => String(v?.id || '').trim() === rawVendorId && String(v?.kind || '').trim().toLowerCase() === 'shop') || null
        if (localMatch) shopId = rawVendorId
      } catch {
      }
    }
    if (!shopId) shopId = await resolveOwnedShopIdByEmail(email)
    if (!shopId) {
      res.status(400).json({ success: false, error: 'Aucune boutique liée à cet email.', email })
      return
    }

    let orders: any[] = []
    if (authUser?.id) {
      const { data: ordersData, error: ordersError } = await supabase
        .from('boost_orders')
        .select('boost_kind,expires_at,sponsored_tier,status,created_at')
        .eq('user_id', authUser.id)
        .eq('vendor_kind', 'shop')
        .in('status', ['active', 'paid'])
        .order('created_at', { ascending: false })
        .limit(50)
      if (ordersError) {
        res.status(500).json({ success: false, error: 'Erreur lecture commandes', details: ordersError.message })
        return
      }
      orders = Array.isArray(ordersData) ? ordersData : []
    }

    try {
      const orderVendorIds = new Set<string>([shopId])
      if (rawVendorId) orderVendorIds.add(rawVendorId)
      const localPlus = localSyncStore.listLocalPlusVendors()
      const vendors = Array.isArray(localPlus) ? localPlus : []
      const localMatch = vendors.find((v: any) => String(v?.id || '').trim() === rawVendorId && String(v?.kind || '').trim().toLowerCase() === 'shop') || null
      const ownerEmail = String(localMatch?.ownerEmail || '').trim().toLowerCase()
      if (ownerEmail && ownerEmail.includes('@')) {
        orderVendorIds.add(`local-${ownerEmail}`)
        const aliases = ownerEmail.endsWith('@exemple.com')
          ? [ownerEmail, ownerEmail.replace(/@exemple\.com$/i, '@example.com')]
          : ownerEmail.endsWith('@example.com')
            ? [ownerEmail, ownerEmail.replace(/@example\.com$/i, '@exemple.com')]
            : [ownerEmail]
        aliases.forEach((e) => orderVendorIds.add(`local-${e}`))
      }
      const localOrders = localBoostOrdersStore.listByVendors(Array.from(orderVendorIds), 'shop', 50)
      if (localOrders.length) orders = [...orders, ...localOrders]
    } catch {
    }

    const nowIso = new Date().toISOString()
    const toMs = (v: any) => {
      const t = v ? Date.parse(String(v)) : NaN
      return Number.isFinite(t) ? t : 0
    }
    const pickMaxIso = (a: any, b: any) => {
      const ta = toMs(a)
      const tb = toMs(b)
      if (tb > ta) return b
      return a
    }

    let maxSponsored: string | null = null
    let maxPromo: string | null = null
    let maxNew: string | null = null
    let sponsoredTier: SponsoredTier | null = null

    for (const o of Array.isArray(orders) ? orders : []) {
      const kind = String((o as any)?.boost_kind || '').trim().toLowerCase()
      const exp = (o as any)?.expires_at ? String((o as any).expires_at) : null
      if (!exp) continue
      if (kind === 'sponsored') {
        maxSponsored = pickMaxIso(maxSponsored, exp)
        const tier = toSponsoredTier((o as any)?.sponsored_tier)
        if (tier) sponsoredTier = tier
      } else if (kind === 'promo') {
        maxPromo = pickMaxIso(maxPromo, exp)
      } else if (kind === 'new') {
        maxNew = pickMaxIso(maxNew, exp)
      }
    }

    const { data: currentRow } = await supabase
      .from('vendor_boosts')
      .select('sponsored_until,promo_until,new_until,sponsored_tier')
      .eq('vendor_id', shopId)
      .eq('vendor_kind', 'shop')
      .maybeSingle()

    const nextSponsored = pickMaxIso(currentRow?.sponsored_until || null, maxSponsored)
    const nextPromo = pickMaxIso(currentRow?.promo_until || null, maxPromo)
    const nextNew = pickMaxIso(currentRow?.new_until || null, maxNew)
    const nextTier = sponsoredTier || toSponsoredTier(currentRow?.sponsored_tier) || null

    const { data: row, error: upsertError } = await supabase
      .from('vendor_boosts')
      .upsert(
        {
          vendor_id: shopId,
          vendor_kind: 'shop',
          sponsored_until: nextSponsored,
          sponsored_tier: nextTier,
          promo_until: nextPromo,
          new_until: nextNew,
          updated_at: nowIso,
        },
        { onConflict: 'vendor_id,vendor_kind' }
      )
      .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
      .maybeSingle()

    if (upsertError) {
      res.status(500).json({ success: false, error: 'Erreur écriture vendor_boosts', details: upsertError.message })
      return
    }

    res.json({ success: true, shopId, row })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
}

router.post('/dev/repair-badges', repairBadgesHandler)
router.get('/dev/repair-badges', (req, res) => {
  req.body = { ...(req.query || {}) }
  return repairBadgesHandler(req, res)
})

router.get('/pricing', (_req, res) => {
  if (isLocalBoostPricingMode()) {
    try {
      const list = localBoostProductsStore.seedDefaults()

      const score = (p: any) => {
        const hasTitle = String(p?.title || '').trim().length ? 1 : 0
        const hasDesc = String(p?.description || '').trim().length ? 1 : 0
        const updated = Date.parse(String(p?.updated_at || ''))
        const t = Number.isFinite(updated) ? updated : 0
        const price = Math.floor(Number(p?.price_xof || 0))
        return { hasTitle, hasDesc, t, price }
      }

      const better = (a: any, b: any) => {
        const sa = score(a)
        const sb = score(b)
        if (sa.t !== sb.t) return sa.t > sb.t
        if (sa.hasTitle !== sb.hasTitle) return sa.hasTitle > sb.hasTitle
        if (sa.hasDesc !== sb.hasDesc) return sa.hasDesc > sb.hasDesc
        return sa.price >= sb.price
      }

      const picked = new Map<string, any>()
      for (const p of list) {
        if (!p?.active) continue
        const kind = String(p.kind)
        const dur = Number(p.duration_hours)
        const key = `${kind}:${dur}`
        const existing = picked.get(key)
        if (!existing || better(p, existing)) picked.set(key, p)
      }

      const products = Array.from(picked.values()).map((p) => ({
        kind: p.kind,
        durationHours: p.duration_hours,
        priceXof: p.price_xof,
        currency: String(p.currency || 'XOF').toUpperCase(),
        title: p.title,
        description: p.description,
        sponsoredTier: p.kind === 'sponsored' ? (p.sponsored_tier === 'or' ? 3 : p.sponsored_tier === 'argent' ? 2 : 1) : null,
        active: p.active,
      }))

      const finalProducts = products.length ? products : BOOST_PRODUCTS
      res.json({ products: finalProducts })
      return
    } catch {
      res.json({ products: BOOST_PRODUCTS })
      return
    }
  }

  fetchBoostProductsFromDb()
    .then((rows) => {
      if (!rows) return res.json({ products: BOOST_PRODUCTS });
      const products = rows
        .filter((p) => p.active)
        .map((p) => ({
          kind: p.kind,
          durationHours: p.duration_hours,
          priceXof: p.price_xof,
          currency: String(p.currency || 'XOF').toUpperCase(),
          title: p.title,
          description: p.description,
          sponsoredTier: p.kind === 'sponsored' ? (p.sponsored_tier === 'or' ? 3 : p.sponsored_tier === 'argent' ? 2 : 1) : null,
          active: p.active,
        }));
      res.json({ products });
    })
    .catch(() => res.json({ products: BOOST_PRODUCTS }));
});

router.get('/vendor-boosts-active', async (req, res) => {
  try {
    if (!isBoostDiscoveryEnabled()) {
      res.json({ rows: [] })
      return
    }

    const parseMs = (v: any) => {
      const t = v ? Date.parse(String(v)) : NaN
      return Number.isFinite(t) ? t : 0
    }

    const mergeRow = (a: any, b: any) => {
      const out: any = { ...a }
      out.vendor_id = a.vendor_id
      out.vendor_kind = a.vendor_kind
      const sA = parseMs(a?.sponsored_until)
      const sB = parseMs(b?.sponsored_until)
      const pA = parseMs(a?.promo_until)
      const pB = parseMs(b?.promo_until)
      const nA = parseMs(a?.new_until)
      const nB = parseMs(b?.new_until)
      if (sB > sA) {
        out.sponsored_until = b?.sponsored_until
        out.sponsored_tier = b?.sponsored_tier ?? out.sponsored_tier
      }
      if (pB > pA) out.promo_until = b?.promo_until
      if (nB > nA) out.new_until = b?.new_until
      const uA = parseMs(a?.updated_at)
      const uB = parseMs(b?.updated_at)
      if (uB > uA) out.updated_at = b?.updated_at
      if (!out.sponsored_tier && b?.sponsored_tier) out.sponsored_tier = b.sponsored_tier
      return out
    }

    const normalizeRows = async (input: any[]) => {
      const rows = Array.isArray(input) ? input : []
      const isLocalShopId = (id: string) => id.startsWith('local-') && id.includes('@')
      const getEmailAliases = (emailRaw: string): string[] => {
        const email = String(emailRaw || '').trim().toLowerCase()
        if (!email || !email.includes('@')) return []
        const at = email.lastIndexOf('@')
        if (at <= 0) return [email]
        const local = email.slice(0, at)
        const domain = email.slice(at + 1)
        const out = new Set<string>()
        out.add(email)
        if (domain === 'example.com') out.add(`${local}@exemple.com`)
        if (domain === 'exemple.com') out.add(`${local}@example.com`)
        return Array.from(out)
      }
      const emails = Array.from(
        new Set(
          rows
            .filter((r: any) => String(r?.vendor_kind || '').trim().toLowerCase() === 'shop')
            .map((r: any) => String(r?.vendor_id || '').trim())
            .filter((id: string) => isLocalShopId(id))
            .map((id: string) => id.slice(6).trim().toLowerCase())
            .filter(Boolean)
        )
      )

      const emailToShopId = new Map<string, string>()
      const slugToShopId = new Map<string, string>()

      const addSlug = (v: any) => {
        const s = String(v || '').trim()
        if (!s) return
        if (s.includes('@')) return
        if (!s.includes('-')) return
        if (s.length > 80) return
        slugToShopId.set(s, '')
      }

      const localPlusCandidates = new Set<string>()
      for (const r of rows) {
        const vendorKind = String((r as any)?.vendor_kind || '').trim().toLowerCase()
        if (vendorKind !== 'shop') continue
        const id = String((r as any)?.vendor_id || '').trim()
        if (!id) continue
        if (id.startsWith('local_')) {
          localPlusCandidates.add(id)
          localPlusCandidates.add(id.replace(/^local_/, ''))
          addSlug(id.replace(/^local_/, ''))
        } else if (id.startsWith('s_')) {
          localPlusCandidates.add(id)
        } else {
          addSlug(id)
        }
      }

      const localPlusEmailSet = new Set<string>()
      if (localPlusCandidates.size) {
        try {
          const list = localSyncStore.listLocalPlusVendors()
          const vendors = Array.isArray(list) ? list : []
          for (const candidate of Array.from(localPlusCandidates)) {
            const row =
              vendors.find((v: any) => String(v?.id || '').trim() === candidate) ||
              vendors.find((v: any) => String(v?.id || '').trim() === candidate.replace(/^local_/, ''))
            if (!row) continue
            const slug = String((row as any)?.slug || '').trim()
            if (slug) addSlug(slug)
            const email = String(
              (row as any)?.ownerEmail || (row as any)?.owner_email || (row as any)?.email || (row as any)?.contact_email || ''
            )
              .trim()
              .toLowerCase()
            if (email && email.includes('@')) localPlusEmailSet.add(email)
          }
        } catch {
        }
      }

      const allEmails = Array.from(new Set([...(emails || []), ...Array.from(localPlusEmailSet)]))
      if (allEmails.length) {
        try {
          const withColumns = async (wantOwner: boolean, wantContact: boolean) => {
            const cols = [
              'id',
              'email',
              ...(wantOwner ? ['owner_email'] : []),
              ...(wantContact ? ['contact_email'] : []),
            ].join(',')
            const clauses = [
              ...allEmails.map((e) => `email.eq.${e}`),
              ...(wantOwner ? allEmails.map((e) => `owner_email.eq.${e}`) : []),
              ...(wantContact ? allEmails.map((e) => `contact_email.eq.${e}`) : []),
            ]
            return await supabase.from('shops').select(cols).or(clauses.join(',')).limit(200)
          }

          let r: any = await withColumns(true, true)
          if (r?.error) {
            const msg = String(r.error.message || '').toLowerCase()
            const missingContact = msg.includes('contact_email') && (msg.includes('does not exist') || msg.includes('could not find') || msg.includes('column') || msg.includes('schema cache'))
            if (missingContact) r = await withColumns(true, false)
          }
          if (r?.error) {
            const msg = String(r.error.message || '').toLowerCase()
            const missingOwner = msg.includes('owner_email') && (msg.includes('does not exist') || msg.includes('could not find') || msg.includes('column') || msg.includes('schema cache'))
            if (missingOwner) r = await withColumns(false, true)
          }
          if (r?.error) {
            const msg = String(r.error.message || '').toLowerCase()
            const missingOwner = msg.includes('owner_email') && (msg.includes('does not exist') || msg.includes('could not find') || msg.includes('column') || msg.includes('schema cache'))
            const missingContact = msg.includes('contact_email') && (msg.includes('does not exist') || msg.includes('could not find') || msg.includes('column') || msg.includes('schema cache'))
            if (missingOwner && missingContact) r = await withColumns(false, false)
          }

          const shops = Array.isArray((r as any)?.data) ? (r as any).data : []
          for (const s of shops) {
            const id = String((s as any)?.id || '').trim()
            if (!id) continue
            const emailA = String((s as any)?.email || '').trim().toLowerCase()
            const emailB = String((s as any)?.owner_email || '').trim().toLowerCase()
            const emailC = String((s as any)?.contact_email || '').trim().toLowerCase()
            if (emailA) emailToShopId.set(emailA, id)
            if (emailB) emailToShopId.set(emailB, id)
            if (emailC) emailToShopId.set(emailC, id)
          }
        } catch {
        }
      }

      const slugs = Array.from(slugToShopId.keys()).filter(Boolean)
      if (slugs.length) {
        try {
          const r = await supabase
            .from('shops')
            .select('id,slug')
            .in('slug', slugs)
          const shops = Array.isArray((r as any)?.data) ? (r as any).data : []
          for (const s of shops) {
            const slug = String((s as any)?.slug || '').trim()
            const id = String((s as any)?.id || '').trim()
            if (slug && id) slugToShopId.set(slug, id)
          }
        } catch {
        }
      }

      const resolveLocalPlus = (idInput: string): string => {
        const id = String(idInput || '').trim()
        if (!id) return ''
        try {
          const list = localSyncStore.listLocalPlusVendors()
          const vendors = Array.isArray(list) ? list : []
          const row =
            vendors.find((v: any) => String(v?.id || '').trim() === id) ||
            vendors.find((v: any) => String(v?.id || '').trim() === id.replace(/^local_/, ''))
          if (!row) return ''
          const slug = String((row as any)?.slug || '').trim()
          const bySlug = slug ? slugToShopId.get(slug) : ''
          if (bySlug) return bySlug
          const email = String(
            (row as any)?.ownerEmail || (row as any)?.owner_email || (row as any)?.email || (row as any)?.contact_email || ''
          )
            .trim()
            .toLowerCase()
          const byEmail = email ? emailToShopId.get(email) : ''
          return byEmail || ''
        } catch {
          return ''
        }
      }

      const uniq = new Map<string, any>()
      for (const r of rows) {
        const vendorKind = String((r as any)?.vendor_kind || '').trim().toLowerCase()
        let vendorId = String((r as any)?.vendor_id || '').trim()
        if (!vendorId || (vendorKind !== 'shop' && vendorKind !== 'provider')) continue
        if (vendorKind === 'shop') {
          if (isLocalShopId(vendorId)) {
            const email = vendorId.slice(6).trim().toLowerCase()
            const mapped = emailToShopId.get(email)
            if (mapped) vendorId = mapped
          } else if (vendorId.startsWith('local_')) {
            const stripped = vendorId.slice(6).trim()
            if (isUuidLike(stripped)) {
              vendorId = stripped
            } else {
              const bySlug = slugToShopId.get(stripped)
              if (bySlug) vendorId = bySlug
              else {
                const byLocalPlus = resolveLocalPlus(vendorId) || resolveLocalPlus(stripped)
                if (byLocalPlus) vendorId = byLocalPlus
              }
            }
          } else if (vendorId.startsWith('s_')) {
            const byLocalPlus = resolveLocalPlus(vendorId)
            if (byLocalPlus) vendorId = byLocalPlus
          } else {
            const bySlug = slugToShopId.get(vendorId)
            if (bySlug) vendorId = bySlug
          }
        }
        const key = `${vendorKind}:${vendorId}`
        const normalized = { ...r, vendor_kind: vendorKind, vendor_id: vendorId }
        const existing = uniq.get(key)
        uniq.set(key, existing ? mergeRow(existing, normalized) : normalized)
      }
      const normalizedRows = Array.from(uniq.values())
      try {
        const localPlus = localSyncStore.listLocalPlusVendors()
        const vendors = Array.isArray(localPlus) ? localPlus : []
        const emailToLocalPlusIds = new Map<string, string[]>()
        for (const v of vendors) {
          const kind = String((v as any)?.kind || '').trim().toLowerCase()
          if (kind !== 'shop') continue
          const ownerEmail = String((v as any)?.ownerEmail || (v as any)?.owner_email || (v as any)?.email || '')
            .trim()
            .toLowerCase()
          if (!ownerEmail || !ownerEmail.includes('@')) continue
          const id = String((v as any)?.id || '').trim()
          if (!id) continue
          const list = emailToLocalPlusIds.get(ownerEmail) || []
          if (!list.includes(id)) list.push(id)
          emailToLocalPlusIds.set(ownerEmail, list)
          for (const alias of getEmailAliases(ownerEmail)) {
            const l2 = emailToLocalPlusIds.get(alias) || []
            if (!l2.includes(id)) l2.push(id)
            emailToLocalPlusIds.set(alias, l2)
          }
        }

        const shopIds = Array.from(
          new Set(
            normalizedRows
              .filter((r: any) => String(r?.vendor_kind || '').trim().toLowerCase() === 'shop')
              .map((r: any) => String(r?.vendor_id || '').trim())
              .filter((id: string) => isUuidLike(id))
          )
        )

        if (shopIds.length) {
          const r = await supabase
            .from('shops')
            .select('id,email,owner_email,contact_email')
            .in('id', shopIds)
            .limit(200)

          const shops = Array.isArray((r as any)?.data) ? (r as any).data : []
          const shopIdToEmails = new Map<string, string[]>()
          for (const s of shops) {
            const id = String((s as any)?.id || '').trim()
            if (!id) continue
            const emails: string[] = []
            const a = String((s as any)?.email || '').trim().toLowerCase()
            const b = String((s as any)?.owner_email || '').trim().toLowerCase()
            const c = String((s as any)?.contact_email || '').trim().toLowerCase()
            if (a && a.includes('@')) emails.push(...getEmailAliases(a))
            if (b && b.includes('@')) emails.push(...getEmailAliases(b))
            if (c && c.includes('@')) emails.push(...getEmailAliases(c))
            const uniqEmails = Array.from(new Set(emails)).filter(Boolean)
            if (uniqEmails.length) shopIdToEmails.set(id, uniqEmails)
          }

          normalizedRows.forEach((row: any) => {
            const kind = String(row?.vendor_kind || '').trim().toLowerCase()
            const id = String(row?.vendor_id || '').trim()
            if (kind !== 'shop') return
            if (!isUuidLike(id)) return
            const emails = shopIdToEmails.get(id) || []
            if (!emails.length) return
            const aliases: string[] = []
            for (const e of emails) {
              const list = emailToLocalPlusIds.get(e) || []
              for (const vId of list) {
                const s = String(vId || '').trim()
                if (!s) continue
                if (s === id) continue
                if (!aliases.includes(s)) aliases.push(s)
              }
            }
            if (aliases.length) (row as any).vendor_id_aliases = aliases
          })
        }
      } catch {
      }

      return normalizedRows
    }

    const nowIso = new Date().toISOString()
    const remoteRows = await (async () => {
      try {
        const { data, error } = await supabase
          .from('vendor_boosts')
          .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
          .or(`sponsored_until.gte.${nowIso},promo_until.gte.${nowIso},new_until.gte.${nowIso}`)
        if (error || !data) return []
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    })()

    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    const includeLocal = isLocalBoostPricingMode() || isDev
    const localRows = includeLocal ? localVendorBoostsStore.listActive() : []
    const combined = [...(Array.isArray(localRows) ? localRows : []), ...(Array.isArray(remoteRows) ? remoteRows : [])]
    const normalized = await normalizeRows(combined as any[])
    res.json({ rows: normalized })
  } catch {
    res.json({ rows: [] })
  }
})

router.get('/vendor-boosts', async (req, res) => {
  try {
    const vendorIdInput = String(req.query?.vendorId || '').trim()
    const vendorKind = String(req.query?.vendorKind || '').trim().toLowerCase()
    if (!vendorIdInput) return res.status(400).json({ error: 'vendorId manquant' })
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ error: 'vendorKind invalide' })

    const parseMs = (v: any) => {
      const t = v ? Date.parse(String(v)) : NaN
      return Number.isFinite(t) ? t : 0
    }

    const mergeRow = (a: any, b: any) => {
      const out: any = { ...a }
      out.vendor_id = a.vendor_id
      out.vendor_kind = a.vendor_kind
      const sA = parseMs(a?.sponsored_until)
      const sB = parseMs(b?.sponsored_until)
      const pA = parseMs(a?.promo_until)
      const pB = parseMs(b?.promo_until)
      const nA = parseMs(a?.new_until)
      const nB = parseMs(b?.new_until)
      if (sB > sA) {
        out.sponsored_until = b?.sponsored_until
        out.sponsored_tier = b?.sponsored_tier ?? out.sponsored_tier
      }
      if (pB > pA) out.promo_until = b?.promo_until
      if (nB > nA) out.new_until = b?.new_until
      const uA = parseMs(a?.updated_at)
      const uB = parseMs(b?.updated_at)
      if (uB > uA) out.updated_at = b?.updated_at
      if (!out.sponsored_tier && b?.sponsored_tier) out.sponsored_tier = b.sponsored_tier
      return out
    }

    const candidates = await (async () => {
      const set = new Set<string>()
      const add = (v: any) => {
        const s = String(v || '').trim()
        if (s) set.add(s)
      }
      add(vendorIdInput)
      if (vendorKind === 'shop') {
        try {
          const addFromShop = (row: any) => {
            add(row?.id)
            add(row?.slug)
            const e = String(row?.email || row?.contact_email || '').trim().toLowerCase()
            if (e && e.includes('@')) add(`local-${e}`)
          }
          if (vendorIdInput.startsWith('local_')) {
            const stripped = vendorIdInput.replace(/^local_/, '').trim()
            if (stripped) add(stripped)
          }
          if (vendorIdInput.startsWith('s_')) {
            add(`local_${vendorIdInput}`)
          }
          if (vendorIdInput.startsWith('local-')) {
            const email = vendorIdInput.slice(6).trim().toLowerCase()
            if (email) {
              add(`local-${email}`)
              const resolved = await resolveOwnedShopIdByEmail(email)
              if (resolved) add(resolved)
              const r = await supabase
                .from('shops')
                .select('id,slug,email,contact_email')
                .or(`email.eq.${email},contact_email.eq.${email}`)
                .order('created_at', { ascending: false })
                .limit(1)
              const row = Array.isArray((r as any)?.data) ? (r as any).data[0] : null
              if (row) addFromShop(row)
            }
          } else if (isUuidLike(vendorIdInput)) {
            const r = await supabase.from('shops').select('id,slug,email,contact_email').eq('id', vendorIdInput).maybeSingle()
            if (!r?.error && r?.data) addFromShop(r.data)
          } else if (!vendorIdInput.startsWith('local_') && !vendorIdInput.startsWith('s_')) {
            const r = await supabase.from('shops').select('id,slug,email,contact_email').eq('slug', vendorIdInput).maybeSingle()
            if (!r?.error && r?.data) addFromShop(r.data)
          }
        } catch {
        }
      }
      return Array.from(set)
    })()

    if (!isLocalBoostPricingMode() && !isBoostDiscoveryEnabled()) {
      res.json({ row: null })
      return
    }

    let best: any = null
    if (candidates.length) {
      try {
        const { data, error } = await supabase
          .from('vendor_boosts')
          .select('vendor_id,vendor_kind,sponsored_until,sponsored_tier,promo_until,new_until,updated_at')
          .eq('vendor_kind', vendorKind)
          .in('vendor_id', candidates)
          .limit(20)
        if (!error && Array.isArray(data) && data.length) {
          const base: any = {
            vendor_id: vendorIdInput,
            vendor_kind: vendorKind,
            sponsored_until: null,
            sponsored_tier: null,
            promo_until: null,
            new_until: null,
            updated_at: new Date(0).toISOString(),
          }
          best = data.reduce((acc: any, row: any) => mergeRow(acc, row), base)
        }
      } catch {
      }
    }

    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    const includeLocal = isLocalBoostPricingMode() || isDev
    if (includeLocal) {
      const base: any = {
        vendor_id: vendorIdInput,
        vendor_kind: vendorKind,
        sponsored_until: null,
        sponsored_tier: null,
        promo_until: null,
        new_until: null,
        updated_at: new Date(0).toISOString(),
      }
      const merged = best ? mergeRow(base, best) : base
      for (const id of candidates) {
        const r = localVendorBoostsStore.get(id, vendorKind)
        if (r) best = best ? mergeRow(best, r) : mergeRow(merged, r)
      }
    }

    res.json({ row: best || null })
  } catch {
    res.json({ row: null })
  }
})

router.post('/dev/activate', (req, res) => {
  try {
    const isDev = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
    if (!isDev || !isLocalBoostPricingMode()) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const vendorId = String(req.body?.vendorId || '').trim()
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase()
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as any
    const durationHours = Math.floor(Number(req.body?.durationHours || 12))
    const sponsoredTier = String(req.body?.sponsoredTier || '').trim().toLowerCase() as any
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendorId manquant' })
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendorKind invalide' })
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') return res.status(400).json({ success: false, error: 'boostKind invalide' })
    if (![12, 24, 48, 72].includes(durationHours)) return res.status(400).json({ success: false, error: 'durationHours invalide' })
    const tier = sponsoredTier === 'bronze' || sponsoredTier === 'argent' || sponsoredTier === 'or' ? sponsoredTier : null
    const row = localVendorBoostsStore.activate({
      vendorId,
      vendorKind,
      boostKind,
      durationHours,
      sponsoredTier: tier,
    })
    res.json({ success: true, row })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || 'Erreur' })
  }
})

router.post('/dev/stop', (req, res) => {
  try {
    const isDev = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
    if (!isDev || !isLocalBoostPricingMode()) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const vendorId = String(req.body?.vendorId || '').trim()
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase()
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as any
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendorId manquant' })
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendorKind invalide' })
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') return res.status(400).json({ success: false, error: 'boostKind invalide' })
    const row = localVendorBoostsStore.stop(vendorId, vendorKind, boostKind)
    res.json({ success: true, row })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || 'Erreur' })
  }
})

router.post('/dev/stop-all', (req, res) => {
  try {
    const isDev = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
    if (!isDev || !isLocalBoostPricingMode()) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const vendorId = String(req.body?.vendorId || '').trim()
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase()
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendorId manquant' })
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendorKind invalide' })
    const row = localVendorBoostsStore.stopAll(vendorId, vendorKind)
    res.json({ success: true, row })
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || 'Erreur' })
  }
})

router.post('/purchase-with-credits-local', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    const allowDev = isDev && isTrustedDevRequest(req)
    if (!isLocalBoostPricingMode() && !allowDev) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const email = String(req.body?.email || '').trim().toLowerCase()
    const vendorId = String(req.body?.vendorId || '').trim()
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase() as any
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as any
    const durationHours = Math.floor(Number(req.body?.durationHours || 0))
    const result = await purchaseWithLocalCredits({
      email,
      vendorId,
      vendorKind,
      boostKind,
      durationHours,
    } as any)
    res.json(result)
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.post('/my-orders-local/import', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    if (!isDev) return res.status(404).json({ success: false, error: 'Not available' })
    if (!isTrustedDevRequest(req)) return res.status(403).json({ success: false, error: 'Forbidden' })

    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'Email invalide' })
    const orders = Array.isArray(req.body?.orders) ? req.body.orders : []
    const result = localBoostOrdersStore.importMany(orders as any)
    res.json({ success: true, imported: result.imported })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.get('/my-orders-local', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    const allowDev = isDev && isTrustedDevRequest(req)
    if (!isLocalBoostPricingMode() && !allowDev) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const email = String(req.query?.email || '').trim().toLowerCase()
    const vendorId = String(req.query?.vendorId || '').trim()
    const vendorKind = String(req.query?.vendorKind || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'email invalide' })
    if (!vendorId) return res.status(400).json({ success: false, error: 'vendorId manquant' })
    if (vendorKind !== 'shop' && vendorKind !== 'provider') return res.status(400).json({ success: false, error: 'vendorKind invalide' })
    const vendorIds = new Set<string>()
    vendorIds.add(vendorId)

    if (vendorKind === 'shop') {
      const addFromShopRow = (row: any) => {
        const id = String(row?.id || '').trim()
        const slug = String(row?.slug || '').trim()
        const e = String(row?.email || row?.contact_email || '').trim().toLowerCase()
        if (id) vendorIds.add(id)
        if (slug) vendorIds.add(slug)
        if (e && e.includes('@')) vendorIds.add(`local-${e}`)
      }

      try {
        if (vendorId.startsWith('local-')) {
          const e = vendorId.slice(6).trim().toLowerCase()
          const resolved = await resolveOwnedShopIdByEmail(e)
          if (resolved) vendorIds.add(resolved)
          const r = await supabase.from('shops').select('id,slug,email,contact_email').eq('email', e).order('created_at', { ascending: false }).limit(1)
          if (!r?.error && Array.isArray(r?.data) && r.data[0]) addFromShopRow(r.data[0])
        } else if (isUuidLike(vendorId)) {
          const r = await supabase.from('shops').select('id,slug,email,contact_email').eq('id', vendorId).maybeSingle()
          if (!r?.error && r?.data) addFromShopRow(r.data)
        } else {
          const r = await supabase.from('shops').select('id,slug,email,contact_email').eq('slug', vendorId).maybeSingle()
          if (!r?.error && r?.data) addFromShopRow(r.data)
        }
      } catch {
      }
    }

    const orders = localBoostOrdersStore.listByVendors(Array.from(vendorIds), vendorKind, 50)
    res.json({ success: true, orders })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.get('/credits-balance', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    const allowDev = isDev && isTrustedDevRequest(req)
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
    if (isLocalBoostPricingMode() || (allowDev && !token)) {
      const email = String(req.query?.email || '').trim().toLowerCase()
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email manquant' })
      const balanceXof = localBoostCreditsStore.getBalanceXof(email)
      res.json({ balanceXof })
      return
    }
    if (!token) {
      res.status(401).json({ error: 'Token manquant' })
      return
    }
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      res.status(401).json({ error: 'Token invalide' })
      return
    }
    const balanceXof = await getUserCreditBalanceXof(user.id)
    res.json({ balanceXof })
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

router.get('/credits-balance-dev', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    if (!isDev) return res.status(404).json({ success: false, error: 'Not available' })
    if (!isTrustedDevRequest(req)) return res.status(403).json({ success: false, error: 'Forbidden' })

    const email = String(req.query?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'Email invalide' })
    const balanceXof = localBoostCreditsStore.getBalanceXof(email)
    res.json({ success: true, balanceXof })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.post('/credits/set-dev', async (req, res) => {
  try {
    const env = String(process.env.NODE_ENV || '').trim().toLowerCase()
    const isDev = env !== 'production'
    if (!isDev) return res.status(404).json({ success: false, error: 'Not available' })
    if (!isTrustedDevRequest(req)) return res.status(403).json({ success: false, error: 'Forbidden' })

    const email = String(req.body?.email || '').trim().toLowerCase()
    const balanceXof = Math.floor(Number(req.body?.balance_xof ?? req.body?.balanceXof ?? 0))
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'Email invalide' })
    if (!Number.isFinite(balanceXof) || balanceXof < 0) return res.status(400).json({ success: false, error: 'Solde invalide' })
    localBoostCreditsStore.setBalanceXof(email, balanceXof, email)
    res.json({ success: true, balanceXof: localBoostCreditsStore.getBalanceXof(email) })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.post('/credits/topup', async (req, res) => {
  try {
    const isDev = String(process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'
    if (!isDev) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }

    const auth = await authenticateUser(req, res)
    if (!auth) return

    const amount = Math.floor(Number(req.body?.amount_xof || 0))
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ success: false, error: 'Montant invalide' })
      return
    }

    const email = String(auth.user?.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Email invalide' })
      return
    }

    if (isLocalBoostPricingMode()) {
      localBoostCreditsStore.grant(email, amount, email)
      const balanceXof = localBoostCreditsStore.getBalanceXof(email)
      res.json({ success: true, balanceXof })
      return
    }

    const nowIso = new Date().toISOString()
    const { error } = await supabase.from('user_credits').insert({
      user_id: auth.user.id,
      amount,
      type: 'dev_topup',
      description: 'Recharge crédits (dev)',
      created_at: nowIso,
      metadata: { source: 'dev_ui' },
    })
    if (error) {
      res.status(500).json({ success: false, error: 'Impossible de recharger les crédits', details: error.message })
      return
    }

    const balanceXof = await getUserCreditBalanceXof(auth.user.id)
    res.json({ success: true, balanceXof })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.post('/credits/topup-local', async (req, res) => {
  try {
    if (!isLocalBoostPricingMode()) {
      res.status(404).json({ success: false, error: 'Not available' })
      return
    }
    const email = String(req.body?.email || '').trim().toLowerCase()
    const amount = Number(req.body?.amount_xof)
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: 'Email invalide' })
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ success: false, error: 'Montant invalide' })
    localBoostCreditsStore.grant(email, Math.floor(amount), email)
    const balanceXof = localBoostCreditsStore.getBalanceXof(email)
    res.json({ success: true, balanceXof })
  } catch (e: any) {
    res.status(500).json({ success: false, error: String(e?.message || e || 'Erreur') })
  }
})

router.get('/my-orders', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const vendorId = String(req.query?.vendorId || '').trim();
    const vendorKind = String(req.query?.vendorKind || '').trim().toLowerCase();

    let q = supabase
      .from('boost_orders')
      .select('id, vendor_id, vendor_kind, boost_kind, duration_hours, amount_xof, currency, status, sponsored_tier, stripe_session_id, paid_at, activated_at, expires_at, created_at, updated_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (vendorId) q = q.eq('vendor_id', vendorId);
    if (vendorKind) q = q.eq('vendor_kind', vendorKind);

    const { data, error } = await q;
    if (error) return res.status(500).json({ error: 'Erreur lecture commandes', details: error.message });
    res.json({ orders: data || [] });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

router.post('/create-checkout-session', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const rawVendorId = String(req.body?.vendorId || '').trim();
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as BoostKind;
    const durationHours = Number(req.body?.durationHours);
    const currency = String(req.body?.currency || 'xof').trim().toLowerCase();

    if (!rawVendorId) return res.status(400).json({ error: 'vendorId manquant' });
    if (!vendorKind) return res.status(400).json({ error: 'vendorKind manquant' });
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') {
      return res.status(400).json({ error: 'boostKind invalide' });
    }

    const vendorId = await normalizeVendorIdForPurchase({
      vendorId: rawVendorId,
      vendorKind,
      userEmail: auth.user?.email,
    })

    const dbProduct = await fetchBoostProductFromDb(boostKind, durationHours);
    if (!dbProduct || !dbProduct.active) {
      return res.status(400).json({ error: 'Produit boost introuvable (durée invalide ou inactif)' });
    }

    const orderId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('boost_orders')
      .insert({
        id: orderId,
        user_id: auth.user.id,
        vendor_id: vendorId,
        vendor_kind: vendorKind,
        boost_kind: boostKind,
        duration_hours: dbProduct.duration_hours,
        amount_xof: dbProduct.price_xof,
        currency: currency.toUpperCase(),
        status: 'pending',
        sponsored_tier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        created_at: nowIso,
        updated_at: nowIso,
        metadata: rawVendorId && rawVendorId !== vendorId ? { original_vendor_id: rawVendorId } : undefined,
      });

    if (insertError) {
      return res.status(500).json({ error: 'Impossible de créer la commande boost', details: insertError.message });
    }

    const inferredOrigin = String(req.headers.origin || '').trim();
    const defaultFrontend = process.env.NODE_ENV === 'production' ? 'https://www.mangoo.tech' : 'http://localhost:5173';
    const frontendUrl = String(process.env.FRONTEND_URL || '').trim() || inferredOrigin || defaultFrontend;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: dbProduct.title,
              description: dbProduct.description,
            },
            unit_amount: toStripeUnitAmount(dbProduct.price_xof, currency),
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl.replace(/\/+$/g, '')}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl.replace(/\/+$/g, '')}/boost/cancel?order_id=${orderId}`,
      client_reference_id: `boost_${orderId}`,
      customer_email: auth.user.email || undefined,
      metadata: {
        type: 'boost',
        boostOrderId: orderId,
        userId: auth.user.id,
        vendorId,
        vendorKind,
        boostKind,
        durationHours: String(dbProduct.duration_hours),
      },
    });

    await supabase
      .from('boost_orders')
      .update({
        stripe_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    res.json({ orderId, sessionId: session.id, sessionUrl: session.url });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

router.post('/purchase-with-credits', async (req, res) => {
  try {
    const auth = await authenticateUser(req, res);
    if (!auth) return;

    const rawVendorId = String(req.body?.vendorId || '').trim();
    const vendorKind = String(req.body?.vendorKind || '').trim().toLowerCase();
    const boostKind = String(req.body?.boostKind || '').trim().toLowerCase() as BoostKind;
    const durationHours = Number(req.body?.durationHours);

    if (!rawVendorId) return res.status(400).json({ error: 'vendorId manquant' });
    if (!vendorKind) return res.status(400).json({ error: 'vendorKind manquant' });
    if (!isBoostKind(boostKind)) return res.status(400).json({ error: 'boostKind invalide' });
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return res.status(400).json({ error: 'durationHours invalide' });
    }

    const vendorId = await normalizeVendorIdForPurchase({
      vendorId: rawVendorId,
      vendorKind,
      userEmail: auth.user?.email,
    })

    if (isLocalBoostPricingMode()) {
      const email = String(auth.user?.email || '').trim().toLowerCase()
      const result = await purchaseWithLocalCredits({
        email,
        vendorId: rawVendorId,
        vendorKind: vendorKind as any,
        boostKind,
        durationHours: Math.floor(Number(durationHours || 0)),
      } as any)
      res.json(result)
      return
    }

    const dbProduct = await fetchBoostProductFromDb(boostKind, durationHours);
    if (!dbProduct || !dbProduct.active) {
      return res.status(400).json({ error: 'Produit boost introuvable (durée invalide ou inactif)' });
    }

    const balanceXof = await getUserCreditBalanceXof(auth.user.id);
    if (balanceXof < dbProduct.price_xof) {
      return res.status(400).json({ error: 'Crédits insuffisants', balanceXof, requiredXof: dbProduct.price_xof });
    }

    const orderId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('boost_orders')
      .insert({
        id: orderId,
        user_id: auth.user.id,
        vendor_id: vendorId,
        vendor_kind: vendorKind,
        boost_kind: boostKind,
        duration_hours: dbProduct.duration_hours,
        amount_xof: dbProduct.price_xof,
        currency: String(dbProduct.currency || 'XOF').toUpperCase(),
        status: 'paid',
        sponsored_tier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        paid_at: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
        metadata: {
          paid_via: 'credits',
          ...(rawVendorId && rawVendorId !== vendorId ? { original_vendor_id: rawVendorId } : {}),
        },
      });

    if (insertError) {
      return res.status(500).json({ error: 'Impossible de créer la commande boost', details: insertError.message });
    }

    const { error: creditError } = await supabase
      .from('user_credits')
      .insert({
        user_id: auth.user.id,
        amount: -Math.abs(dbProduct.price_xof),
        type: 'boost_purchase',
        description: `Achat boost (${boostKind}, ${dbProduct.duration_hours}h) pour vendor ${vendorId}`,
        created_at: nowIso,
        metadata: {
          boost_order_id: orderId,
          vendor_id: vendorId,
          vendor_kind: vendorKind,
          boost_kind: boostKind,
          duration_hours: dbProduct.duration_hours,
        },
      });

    if (creditError) {
      await supabase.from('boost_orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', orderId);
      return res.status(500).json({ error: 'Impossible de débiter les crédits', details: creditError.message });
    }

    const { data: order } = await supabase.from('boost_orders').select('*').eq('id', orderId).single();
    const activation = order
      ? await activateBoostForOrder({
          order,
          boostKind,
          durationHours: dbProduct.duration_hours,
          sponsoredTier: boostKind === 'sponsored' ? dbProduct.sponsored_tier : null,
        })
      : null;

    const nextBalanceXof = await getUserCreditBalanceXof(auth.user.id);
    res.json({ success: true, orderId, status: 'active', expiresAt: activation?.expiresAt || null, vendorId, balanceXof: nextBalanceXof });
  } catch (error: any) {
    res.status(500).json({ error: 'Erreur serveur', details: error?.message || String(error) });
  }
});

export default router;
