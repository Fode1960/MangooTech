/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { supabaseAdmin } from '../config/supabase'

const router = Router()

const readBearerToken = (req: Request): string | null => {
  const raw = String(req.headers.authorization || '').trim()
  if (!raw) return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

router.get('/resolve-roles', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = readBearerToken(req)
    const allowDevNoAuth = Boolean(process.env.DEV) || String(process.env.NODE_ENV || '').toLowerCase() !== 'production'

    let userId: string | null = null
    let email: string | null = null

    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token)
      if (error || !data?.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' })
        return
      }
      userId = data.user.id
      email = String(data.user.email || '').trim().toLowerCase() || null
    } else if (allowDevNoAuth) {
      email = String(req.query.email || '').trim().toLowerCase() || null
    } else {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    if (!email) {
      res.status(400).json({ success: false, error: 'Missing email' })
      return
    }

    let roles: string[] = ['client']
    let role: string = 'client'

    try {
      if (userId) {
        const { data: adminRow } = await supabaseAdmin
          .from('admin_users')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle()
        if (adminRow) {
          roles = Array.from(new Set([...roles, 'admin']))
          role = 'admin'
        }
      }
    } catch {
    }

    try {
      const safeShopMatch = async (column: string, value: string): Promise<boolean> => {
        const resp = await supabaseAdmin.from('shops').select('id').eq(column, value).limit(1)
        if (resp?.error) {
          const msg = String(resp.error.message || '').toLowerCase()
          const mentionsColumn = msg.includes(String(column || '').toLowerCase())
          const isMissingColumn = msg.includes('does not exist') || msg.includes('column') || msg.includes('schema cache')
          if (!mentionsColumn || !isMissingColumn) throw resp.error
          return false
        }
        return Array.isArray(resp?.data) && resp.data.length > 0
      }

      let hasOwnedShop = false

      if (userId) {
        const byUserId = await supabaseAdmin.from('shops').select('id').eq('user_id', userId).limit(1)
        hasOwnedShop = Array.isArray(byUserId?.data) && byUserId.data.length > 0
      }

      if (!hasOwnedShop) hasOwnedShop = await safeShopMatch('owner_email', email)

      if (hasOwnedShop) {
        roles = Array.from(new Set([...roles, 'vendor']))
        if (role === 'client') role = 'vendor'
      }
    } catch {
    }

    res.status(200).json({ success: true, email, roles, role })
  } catch {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement register logic
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement login logic
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (_req: Request, _res: Response): Promise<void> => {
  // TODO: Implement logout logic
})

export default router
