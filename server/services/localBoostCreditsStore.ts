import fs from 'fs'
import path from 'path'

export type LocalBoostCreditAccount = {
  user_id: string
  email: string
  balance_xof: number
  updated_at: string
}

type LocalCreditsDb = {
  accounts: LocalBoostCreditAccount[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-boost-credits.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()

const safeRead = (): LocalCreditsDb => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return { accounts: Array.isArray(db?.accounts) ? db.accounts : [] }
  } catch {
    return { accounts: [] }
  }
}

const safeWrite = (db: LocalCreditsDb) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const normalizeEmail = (value: any) => {
  const e = String(value || '').trim().toLowerCase()
  return e || ''
}

export const localBoostCreditsStore = {
  listUsers: (search: string) => {
    const q = normalizeEmail(search)
    const db = safeRead()
    const users = (db.accounts || [])
      .filter((a) => {
        if (!q) return true
        const email = normalizeEmail(a.email)
        return email.includes(q)
      })
      .map((a) => ({
        id: String(a.user_id || a.email),
        email: String(a.email || ''),
        first_name: null,
        last_name: null,
      }))
    users.sort((a, b) => String(a.email).localeCompare(String(b.email), 'fr'))
    return users
  },

  getBalanceXof: (userIdOrEmail: string) => {
    const key = normalizeEmail(userIdOrEmail)
    if (!key) return 0
    const db = safeRead()
    const found = db.accounts.find((a) => normalizeEmail(a.user_id) === key || normalizeEmail(a.email) === key)
    return Math.floor(Number(found?.balance_xof || 0))
  },

  grant: (userIdOrEmail: string, amountXof: number, emailHint?: string) => {
    const key = normalizeEmail(userIdOrEmail) || normalizeEmail(emailHint)
    if (!key) throw new Error('user_id/email manquant')
    const amt = Math.floor(Number(amountXof))
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('Montant invalide')
    const db = safeRead()
    const idx = db.accounts.findIndex((a) => normalizeEmail(a.user_id) === key || normalizeEmail(a.email) === key)
    const now = nowIso()
    const current = idx >= 0 ? db.accounts[idx] : null
    const next: LocalBoostCreditAccount = {
      user_id: String(current?.user_id || key),
      email: String(current?.email || emailHint || key),
      balance_xof: Math.floor(Number(current?.balance_xof || 0)) + amt,
      updated_at: now,
    }
    if (idx >= 0) db.accounts[idx] = next
    else db.accounts.push(next)
    safeWrite(db)
    return next
  },

  debit: (email: string, amountXof: number) => {
    const key = normalizeEmail(email)
    if (!key) throw new Error('Email manquant')
    const amt = Math.floor(Number(amountXof))
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('Montant invalide')
    const db = safeRead()
    const idx = db.accounts.findIndex((a) => normalizeEmail(a.email) === key || normalizeEmail(a.user_id) === key)
    if (idx < 0) throw new Error('Solde insuffisant')
    const current = db.accounts[idx]
    const bal = Math.floor(Number(current?.balance_xof || 0))
    if (bal < amt) throw new Error('Solde insuffisant')
    db.accounts[idx] = { ...current, balance_xof: bal - amt, updated_at: nowIso() }
    safeWrite(db)
    return db.accounts[idx]
  },
}

