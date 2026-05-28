const WALLET_STORAGE_KEY = 'demo_wallet_balances';
const WALLET_STORAGE_BACKUP_KEY = 'demo_wallet_balances_bak';

export function getWalletStorageKey() {
  return WALLET_STORAGE_KEY;
}

export function getWalletKeyFromUser(user, fallbackKey = '') {
  const byEmailRaw = String(user?.email || '').trim();
  const byEmail = byEmailRaw ? byEmailRaw.toLowerCase() : '';
  const byId = String(user?.id || '').trim();

  if (byEmail && byId) {
    try {
      const balances = readWalletBalances()
      const hasEmail = Number.isFinite(Number(balances[byEmail]))
      const hasId = Number.isFinite(Number(balances[byId]))
      if (!hasEmail && hasId) {
        try {
          updateWalletBalances((latest) => ({ ...latest, [byEmail]: latest?.[byId] }))
        } catch {
        }
      }
      return byEmail;
    } catch {
      return byEmail;
    }
  }

  if (byEmail) return byEmail;
  if (byId) return byId;
  return String(fallbackKey || '').trim();
}

export function readWalletBalances() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    try {
      const rawBak = localStorage.getItem(WALLET_STORAGE_BACKUP_KEY);
      const dataBak = rawBak ? JSON.parse(rawBak) : {};
      const safe = dataBak && typeof dataBak === 'object' ? dataBak : {};
      try {
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(safe));
      } catch {
      }
      return safe;
    } catch {
      return {};
    }
  }
}

export function writeWalletBalances(next) {
  const payload = JSON.stringify(next);
  try {
    localStorage.setItem(WALLET_STORAGE_BACKUP_KEY, payload);
  } catch {
  }
  localStorage.setItem(WALLET_STORAGE_KEY, payload);
  notifyWalletUpdated();
}

function updateWalletBalances(apply) {
  const current = readWalletBalances()
  const updated = apply(current && typeof current === 'object' ? current : {}) || {}
  const safe = updated && typeof updated === 'object' ? updated : {}
  writeWalletBalances(safe)
  return safe
}

export function ensureWalletBalance(walletKey, defaultBalance = 300000) {
  const key = String(walletKey || '').trim();
  if (!key) return null;
  const balances = readWalletBalances();
  const current = Number(balances[key]);
  if (Number.isFinite(current)) return current;
  updateWalletBalances((latest) => {
    const next = { ...latest }
    const existing = Number(next[key])
    if (!Number.isFinite(existing)) next[key] = defaultBalance
    return next
  })
  return defaultBalance
}

export function getWalletBalance(walletKey) {
  const key = String(walletKey || '').trim();
  if (!key) return null;
  const balances = readWalletBalances();
  const current = Number(balances[key]);
  return Number.isFinite(current) ? current : 0;
}

export function creditWalletBalance(walletKey, amount) {
  const key = String(walletKey || '').trim();
  const value = Number(amount);
  if (!key || !Number.isFinite(value) || value <= 0) return null;
  const out = updateWalletBalances((latest) => {
    const next = { ...latest }
    const current = Number(next[key])
    const base = Number.isFinite(current) ? current : 0
    next[key] = base + value
    return next
  })
  return Number(out[key]) || 0
}

export function debitWalletBalance(walletKey, amount) {
  const key = String(walletKey || '').trim();
  const value = Number(amount);
  if (!key || !Number.isFinite(value) || value <= 0) return null;
  const out = updateWalletBalances((latest) => {
    const next = { ...latest }
    const current = Number(next[key])
    const base = Number.isFinite(current) ? current : 0
    next[key] = Math.max(0, base - value)
    return next
  })
  return Number(out[key]) || 0
}

export function notifyWalletUpdated() {
  try {
    window.dispatchEvent(new Event('mangoo-wallet-updated'));
  } catch {
    // ignore
  }
}

