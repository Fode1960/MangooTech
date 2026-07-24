import { Router, type Request, type Response } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '..', 'data')

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const router = Router()

function getFilePath(shopId: string): string {
  const safe = String(shopId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
  return path.join(dataDir, `my-products-${safe}.json`)
}

// GET /api/my-products?shopId=xxx&stripPhotos=1
router.get('/', (req: Request, res: Response): void => {
  try {
    const shopId = String(req.query.shopId || '').trim()
    const stripPhotos = String(req.query.stripPhotos || '') === '1'
    if (!shopId) {
      res.status(400).json({ success: false, error: 'shopId requis' })
      return
    }
    const filePath = getFilePath(shopId)
    if (!fs.existsSync(filePath)) {
      res.status(200).json({ success: true, products: [] })
      return
    }
    const raw = fs.readFileSync(filePath, 'utf-8')
    let products = JSON.parse(raw)
    products = Array.isArray(products) ? products : []
    if (stripPhotos) {
      products = products.map((p: any) => {
        const { photo, ...rest } = p
        return rest
      })
    }
    res.status(200).json({ success: true, products })
  } catch (e: any) {
    console.error('[my-products] GET error:', e?.message || e)
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

// POST /api/my-products
// Body: { shopId: string, products: Array<{name,img,price,category,id,photo,audio,textDesc}> }
router.post('/', (req: Request, res: Response): void => {
  try {
    const { shopId, products } = req.body || {}
    if (!shopId) {
      res.status(400).json({ success: false, error: 'shopId requis' })
      return
    }
    if (!Array.isArray(products)) {
      res.status(400).json({ success: false, error: 'products doit etre un tableau' })
      return
    }
    const filePath = getFilePath(shopId)
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8')
    console.log(`[my-products] Sauvegarde: ${products.length} produit(s) pour shopId=${shopId}`)
    res.status(200).json({ success: true, count: products.length })
  } catch (e: any) {
    console.error('[my-products] POST error:', e?.message || e)
    res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
})

export default router
