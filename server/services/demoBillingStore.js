const state = {
  packs: [
    {
      id: 'pack_decouverte',
      name: 'Pack Découverte',
      description: 'Nouveaux artisans',
      price: 0,
      currency: 'XOF',
      billing_period: 'monthly',
      is_popular: false,
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'pack_visibilite',
      name: 'Pack Visibilité',
      description: 'Artisans en phase de croissance',
      price: 5000,
      currency: 'XOF',
      billing_period: 'monthly',
      is_popular: true,
      is_active: true,
      sort_order: 2,
    },
    {
      id: 'pack_professionnel',
      name: 'Pack Professionnel',
      description: 'Artisans organisés, organisations, PME',
      price: 10000,
      currency: 'XOF',
      billing_period: 'monthly',
      is_popular: false,
      is_active: true,
      sort_order: 3,
    },
    {
      id: 'pack_premium',
      name: 'Pack Premium',
      description: 'PME structurées et entrepreneurs avancés',
      price: 15000,
      currency: 'XOF',
      billing_period: 'monthly',
      is_popular: false,
      is_active: true,
      sort_order: 4,
    },
  ],
  payments: new Map(),
  userPacks: new Map(),
};

const nowIso = () => new Date().toISOString();

const clamp01 = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
};

const toMoneyInt = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.round(v));
};

const getDemoPack = (packId) => {
  return state.packs.find((p) => p.id === packId) || null;
};

const computeProrataQuote = ({ fromPackId, toPackId, now = new Date(), startedAt, expiresAt }) => {
  const fromPack = getDemoPack(fromPackId) || { id: fromPackId || null, name: fromPackId || 'Aucun', price: 0, currency: 'XOF', billing_period: 'monthly' };
  const toPack = getDemoPack(toPackId) || { id: toPackId, name: toPackId, price: 0, currency: 'XOF', billing_period: 'monthly' };

  const start = startedAt instanceof Date ? startedAt : null;
  const end = expiresAt instanceof Date ? expiresAt : null;
  const hasCycle = Boolean(start && end && end.getTime() > start.getTime());

  const ratio = hasCycle ? clamp01((end.getTime() - now.getTime()) / (end.getTime() - start.getTime())) : 1;

  const fromRemaining = toMoneyInt(Number(fromPack.price || 0) * ratio);
  const toRemaining = toMoneyInt(Number(toPack.price || 0) * ratio);
  const chargeAmount = toMoneyInt(Math.max(0, toRemaining - fromRemaining));
  const creditAmount = toMoneyInt(Math.max(0, fromRemaining - toRemaining));

  return {
    ratio,
    fromPack: { id: fromPack.id, name: fromPack.name, price: Number(fromPack.price || 0), currency: String(fromPack.currency || 'XOF') },
    toPack: { id: toPack.id, name: toPack.name, price: Number(toPack.price || 0), currency: String(toPack.currency || 'XOF') },
    fromRemaining,
    toRemaining,
    chargeAmount,
    creditAmount,
  };
};

const isDowngrade = (quote) => {
  const fromPrice = Number(quote?.fromPack?.price || 0);
  const toPrice = Number(quote?.toPack?.price || 0);
  return Number.isFinite(fromPrice) && Number.isFinite(toPrice) && toPrice < fromPrice;
};

export function listDemoPacks() {
  return state.packs.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export function quoteDemoUserPackChange({ userId, packId }) {
  const key = String(userId);
  const current = state.userPacks.get(key) || null;
  const now = new Date();

  if (!current) {
    return {
      mode: 'new_cycle',
      quote: computeProrataQuote({ fromPackId: null, toPackId: packId, now }),
      currentPack: null,
    };
  }

  const startedAt = current?.started_at ? new Date(current.started_at) : null;
  const expiresAt = current?.expires_at ? new Date(current.expires_at) : null;
  const isActive = Boolean(expiresAt && expiresAt.getTime() > now.getTime() && String(current.status || '') === 'active');

  if (!isActive) {
    return {
      mode: 'new_cycle',
      quote: computeProrataQuote({ fromPackId: null, toPackId: packId, now }),
      currentPack: current,
    };
  }

  const quote = computeProrataQuote({ fromPackId: current.pack_id, toPackId: packId, now, startedAt, expiresAt });
  const downgrade = isDowngrade(quote);
  if (downgrade) {
    return {
      mode: 'downgrade_scheduled',
      quote: {
        ...quote,
        chargeAmount: 0,
        creditAmount: 0,
        effectiveAt: expiresAt.toISOString(),
      },
      currentPack: current,
    };
  }

  return { mode: 'prorata', quote, currentPack: current };
}

export function createDemoPayment({
  userId,
  amount,
  currency,
  method,
  phoneNumber,
  description,
  packId,
  packName,
  packPrice,
}) {
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const row = {
    id: paymentId,
    user_id: userId,
    amount: Number(amount) || 0,
    currency: String(currency || 'XOF').toUpperCase(),
    payment_method: method,
    status: 'pending',
    metadata: {
      phone_number: phoneNumber,
      description,
      pack_id: packId,
      pack_name: packName,
      pack_price: packPrice,
      transaction_id: transactionId,
      created_via: 'demo',
    },
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  state.payments.set(paymentId, row);
  return { paymentId, transactionId, payment: row };
}

export function confirmDemoPayment({ paymentId, transactionId, outcome = 'succeeded' }) {
  const payment = state.payments.get(paymentId);
  if (!payment) {
    const err = new Error('payment_not_found');
    err.code = 'payment_not_found';
    throw err;
  }
  const status = outcome === 'succeeded' ? 'succeeded' : 'failed';
  payment.status = status;
  payment.updated_at = nowIso();
  payment.metadata = {
    ...payment.metadata,
    transaction_id: transactionId || payment.metadata?.transaction_id,
    confirmed_at: nowIso(),
    demo: true,
  };
  state.payments.set(paymentId, payment);
  return { payment, status };
}

export function activateDemoUserPack({ userId, packId, source = 'demo_payment', transactionId = null }) {
  const now = new Date();
  const pack = getDemoPack(packId) || {
    id: packId,
    name: packId,
    price: 0,
    currency: 'XOF',
    billing_period: 'monthly',
  };

  const key = String(userId);
  const previous = state.userPacks.get(key) || null;
  const prevExpires = previous?.expires_at ? new Date(previous.expires_at) : null;
  const prevStarted = previous?.started_at ? new Date(previous.started_at) : null;
  const prevActive = Boolean(prevExpires && prevExpires.getTime() > now.getTime() && String(previous?.status || '') === 'active');

  let startedAt = now;
  let expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  if (prevActive && prevStarted && prevExpires) {
    startedAt = prevStarted;
    expiresAt = prevExpires;
  }

  const quote = computeProrataQuote({
    fromPackId: prevActive ? previous?.pack_id : null,
    toPackId: pack.id,
    now,
    startedAt: prevActive ? startedAt : null,
    expiresAt: prevActive ? expiresAt : null,
  });

  const mode = prevActive ? 'prorata' : 'new_cycle';
  const downgrade = prevActive && isDowngrade(quote);

  if (previous && String(previous.pack_id) === String(pack.id)) {
    const merged = {
      ...previous,
      metadata: {
        ...(previous?.metadata || {}),
        source,
        activated_at: nowIso(),
        transactionId: transactionId || null,
        previous_pack_id: previous?.pack_id || null,
        mode: prevActive ? 'no_change' : mode,
        prorata: prevActive ? quote : (previous?.metadata?.prorata || null),
      },
    };
    state.userPacks.set(key, merged);
    return state.userPacks.get(key);
  }

  if (downgrade) {
    const scheduled = {
      ...previous,
      metadata: {
        ...(previous?.metadata || {}),
        source,
        activated_at: nowIso(),
        transactionId: transactionId || null,
        previous_pack_id: previous?.pack_id || null,
        mode: 'downgrade_scheduled',
        pending_pack_id: pack.id,
        pending_pack_effective_at: expiresAt.toISOString(),
        prorata: { ...quote, chargeAmount: 0, creditAmount: 0, effectiveAt: expiresAt.toISOString() },
      },
    };
    state.userPacks.set(key, scheduled);
    return state.userPacks.get(key);
  }

  state.userPacks.set(key, {
    user_id: userId,
    pack_id: pack.id,
    status: 'active',
    started_at: startedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    metadata: {
      source,
      activated_at: nowIso(),
      transactionId: transactionId || null,
      previous_pack_id: previous?.pack_id || null,
      mode,
      prorata: quote,
    },
  });
  return state.userPacks.get(key);
}

export function getDemoUserPack(userId) {
  return state.userPacks.get(String(userId)) || null;
}
