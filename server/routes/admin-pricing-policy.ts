import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()

const STORE_PATH = path.resolve(process.cwd(), 'server', 'data', 'pricing-policy.json')

function ensureDir() {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true })
  } catch {
  }
}

router.get('/', (req, res) => {
  try {
    const raw = fs.existsSync(STORE_PATH) ? fs.readFileSync(STORE_PATH, 'utf8') : ''
    const parsed = raw ? JSON.parse(raw) : null
    res.json({ success: true, data: parsed })
  } catch {
    res.json({ success: true, data: null })
  }
})

router.put('/', (req, res) => {
  const allow =
    String(process.env.NODE_ENV || '').toLowerCase() !== 'production' ||
    String(process.env.VERCEL || '').trim() === ''

  if (!allow) return res.status(403).json({ success: false, error: 'forbidden' })

  try {
    const next = req.body
    if (!next || typeof next !== 'object') return res.status(400).json({ success: false, error: 'invalid_body' })
    ensureDir()
    const tmp = `${STORE_PATH}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
    fs.renameSync(tmp, STORE_PATH)
    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

export default router
