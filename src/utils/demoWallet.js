const WALLET_STORAGE_KEY = 'demo_wallet_balances';

export function getWalletStorageKey() {
  return WALLET_STORAGE_KEY;
}

export function getWalletKeyFromUser(user, fallbackKey = '') {
  const byId = String(user?.id || '').trim();
  if (byId) return byId;
  const byEmail = String(user?.email || '').trim();
  if (byEmail) return byEmail;
  return String(fallbackKey || '').trim();
}

export function readWalletBalances() {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function writeWalletBalances(next) {
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(next));
  notifyWalletUpdated();
}

export function ensureWalletBalance(walletKey, defaultBalance = 300000) {
  const key = String(walletKey || '').trim();
  if (!key) return null;
  const balances = readWalletBalances();
  const current = Number(balances[key]);
  if (Number.isFinite(current)) return current;
  balances[key] = defaultBalance;
  writeWalletBalances(balances);
  return defaultBalance;
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
  const balances = readWalletBalances();
  const current = Number(balances[key]);
  const base = Number.isFinite(current) ? current : 0;
  balances[key] = base + value;
  writeWalletBalances(balances);
  return balances[key];
}

export function debitWalletBalance(walletKey, amount) {
  const key = String(walletKey || '').trim();
  const value = Number(amount);
  if (!key || !Number.isFinite(value) || value <= 0) return null;
  const balances = readWalletBalances();
  const current = Number(balances[key]);
  const base = Number.isFinite(current) ? current : 0;
  balances[key] = Math.max(0, base - value);
  writeWalletBalances(balances);
  return balances[key];
}

export function notifyWalletUpdated() {
  try {
    window.dispatchEvent(new Event('mangoo-wallet-updated'));
  } catch {
    // ignore
  }
}

