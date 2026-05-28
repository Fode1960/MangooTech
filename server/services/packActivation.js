export async function activateUserPack({ supabase, userId, packId, source = 'unknown', transaction = null }) {
  if (!supabase) throw new Error('supabase client is required');
  if (!userId) throw new Error('userId is required');
  if (!packId) throw new Error('packId is required');

  const now = new Date();

  const { data: pack, error: packError } = await supabase
    .from('packs')
    .select('*')
    .eq('id', packId)
    .single();

  if (packError || !pack) {
    throw new Error(packError?.message || `Pack not found: ${packId}`);
  }

  const resolvePeriod = () => {
    if (pack?.billing_period) {
      if (pack.billing_period === 'monthly') return { unit: 'month', value: 1 };
      if (pack.billing_period === 'yearly') return { unit: 'year', value: 1 };
      return null;
    }
    if (pack?.duration_type && pack?.duration_value) {
      if (pack.duration_type === 'monthly') return { unit: 'month', value: Number(pack.duration_value) || 1 };
      if (pack.duration_type === 'yearly') return { unit: 'year', value: Number(pack.duration_value) || 1 };
      return null;
    }
    return null;
  };

  const period = resolvePeriod();
  const expiresAt = (() => {
    if (!period) return null;
    const d = new Date(now);
    if (period.unit === 'month') d.setMonth(d.getMonth() + period.value);
    if (period.unit === 'year') d.setFullYear(d.getFullYear() + period.value);
    return d;
  })();

  const nextBillingAt = (() => {
    if (!expiresAt) return null;
    const price = Number(pack?.price ?? 0);
    if (!Number.isFinite(price) || price <= 0) return null;
    return expiresAt;
  })();

  const payload = {
    user_id: userId,
    pack_id: packId,
    status: 'active',
    metadata: {
      source,
      transaction,
      activated_at: now.toISOString(),
    },
  };

  const tryInsert = async (shape) => {
    const { error } = await supabase.from('user_packs').insert({ ...payload, ...shape });
    if (!error) return { ok: true };
    const msg = String(error.message || '').toLowerCase();
    return { ok: false, error, msg };
  };

  const shapeA = {
    started_at: now.toISOString(),
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    next_billing_date: nextBillingAt ? nextBillingAt.toISOString() : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const shapeB = {
    start_date: now.toISOString(),
    end_date: expiresAt ? expiresAt.toISOString() : null,
    next_billing_date: nextBillingAt ? nextBillingAt.toISOString() : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const attemptA = await tryInsert(shapeA);
  if (attemptA.ok) return { pack, expiresAt: expiresAt?.toISOString() || null };

  const columnMismatchA = attemptA.msg.includes('column') && attemptA.msg.includes('does not exist');
  if (!columnMismatchA) throw attemptA.error;

  const attemptB = await tryInsert(shapeB);
  if (attemptB.ok) return { pack, expiresAt: expiresAt?.toISOString() || null };
  throw attemptB.error;
}

export async function deactivateOtherActivePacks({ supabase, userId, keepPackId }) {
  if (!supabase) throw new Error('supabase client is required');
  if (!userId) throw new Error('userId is required');
  if (!keepPackId) throw new Error('keepPackId is required');

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('user_packs')
    .update({ status: 'cancelled', updated_at: now })
    .eq('user_id', userId)
    .neq('pack_id', keepPackId)
    .eq('status', 'active');

  if (error) {
    const msg = String(error.message || '').toLowerCase();
    const mightBeDifferentStatus = msg.includes('column') && msg.includes('does not exist');
    if (!mightBeDifferentStatus) throw error;
  }
}
