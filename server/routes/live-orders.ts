import express from 'express'
import {
  confirmLiveOrderReceived,
  createLiveOrder,
  getLiveOrder,
  listLiveOrdersByRoom,
  markLiveOrderDelivered,
  setLiveOrderPayment,
} from '../services/liveOrdersStore'

const router = express.Router()

const safeString = (v: any) => String(v ?? '').trim()

router.post('/create', async (req, res) => {
  try {
    const roomId = safeString(req.body?.roomId)
    const shopSlug = safeString(req.body?.shopSlug) || undefined
    const shopName = safeString(req.body?.shopName) || undefined
    const shopCountry = safeString(req.body?.shopCountry) || undefined
    const buyerId = safeString(req.body?.buyerId) || undefined
    const buyerName = safeString(req.body?.buyerName) || undefined
    const qtyRaw = req.body?.qty
    const pricingRaw = req.body?.pricing

    const product = {
      id: safeString(req.body?.product?.id),
      title: safeString(req.body?.product?.title),
      priceCfa: Number(req.body?.product?.priceCfa),
      imageUrl: safeString(req.body?.product?.imageUrl) || undefined,
    }

    const order = createLiveOrder({
      roomId,
      shopSlug,
      shopName,
      shopCountry,
      product,
      qty: qtyRaw,
      pricing: pricingRaw,
      buyerId,
      buyerName,
    })

    const created = await order
    if (!created) return res.status(400).json({ success: false, error: 'invalid_order' })

    res.json({ success: true, order: created })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

router.get('/by-room/:roomId', async (req, res) => {
  try {
    const roomId = safeString(req.params.roomId)
    if (!roomId) return res.status(400).json({ success: false, error: 'missing_roomId' })
    const orders = await listLiveOrdersByRoom(roomId)

    res.json({ success: true, orders })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = safeString(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'missing_id' })
    const order = await getLiveOrder(id)
    if (!order) return res.status(404).json({ success: false, error: 'not_found' })
    res.json({ success: true, order })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

router.post('/:id/set-payment', async (req, res) => {
  try {
    const id = safeString(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'missing_id' })
    const next = await setLiveOrderPayment(id, {
      provider: safeString(req.body?.provider) as any,
      method: safeString(req.body?.method) || undefined,
      status: safeString(req.body?.status) as any,
      paymentId: safeString(req.body?.paymentId) || undefined,
      transactionId: safeString(req.body?.transactionId) || undefined,
      currency: safeString(req.body?.currency) || undefined,
      amount: Number(req.body?.amount),
      paidAt: safeString(req.body?.paidAt) || undefined,
    } as any)
    if (!next) return res.status(404).json({ success: false, error: 'not_found' })
    res.json({ success: true, order: next })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

router.post('/:id/mark-delivered', async (req, res) => {
  try {
    const id = safeString(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'missing_id' })
    const existing = await getLiveOrder(id)
    if (!existing) return res.status(404).json({ success: false, error: 'not_found' })
    if (existing.status === 'cancelled') return res.status(409).json({ success: false, error: 'cancelled' })
    if (String(existing?.payment?.status || '') !== 'succeeded') return res.status(409).json({ success: false, error: 'not_paid' })
    const next = await markLiveOrderDelivered(id)
    if (!next) return res.status(409).json({ success: false, error: 'not_allowed' })
    res.json({ success: true, order: next })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

router.post('/:id/confirm-received', async (req, res) => {
  try {
    const id = safeString(req.params.id)
    if (!id) return res.status(400).json({ success: false, error: 'missing_id' })
    const existing = await getLiveOrder(id)
    if (!existing) return res.status(404).json({ success: false, error: 'not_found' })
    if (existing.status === 'cancelled') return res.status(409).json({ success: false, error: 'cancelled' })
    if (String(existing?.payment?.status || '') !== 'succeeded') return res.status(409).json({ success: false, error: 'not_paid' })
    const next = await confirmLiveOrderReceived(id)
    if (!next) return res.status(409).json({ success: false, error: 'not_allowed' })
    res.json({ success: true, order: next })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

export default router
