import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { MOBILE_MONEY_CONFIG } from '../config/payments.js'
import { activateUserPack, deactivateOtherActivePacks } from '../services/packActivation.js'
import { createDemoPayment, confirmDemoPayment, activateDemoUserPack } from '../services/demoBillingStore.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getRate(method: string) {
  if (method === 'orange_money') return 0.01
  if (method === 'mtn_momo') return 0.015
  if (method === 'moov_money') return 0.012
  return 0.01
}

router.post('/create-payment', async (req, res) => {
  try {
    const {
      user_id,
      amount,
      currency = 'XOF',
      method,
      phone_number,
      description,
      pack_id,
      pack_name,
      pack_price,
    } = req.body

    console.log(`📱 Requête paiement mobile reçue:`, { user_id, amount, currency, method, phone_number })

    if (!amount || !method || !phone_number) {
      return res.status(400).json({ success: false, error: 'missing_parameters', details: 'amount, method, and phone_number are required' })
    }

    const rate = getRate(method)
    const amountNumber = Math.round(parseFloat(amount))
    const amountInCents = Math.round(amountNumber * 100)
    const minFeeCents = currency.toUpperCase() === 'XOF' ? 100 * 100 : 50
    const processingFeeCents = Math.max(Math.round(amountInCents * rate), minFeeCents)
    const netAmountCents = amountInCents - processingFeeCents

    const transactionId = `MM${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Gérer les utilisateurs anonymes - générer un UUID si nécessaire
    let finalUserId = user_id;
    if (user_id === 'anonymous' || !user_id) {
      finalUserId = randomUUID();
      console.log(`🔄 Génération UUID anonyme: ${finalUserId}`);
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        user_id: finalUserId,
        amount: amountInCents,
        currency: currency.toUpperCase(),
        payment_method: method,
        status: 'pending',
        processing_fee: processingFeeCents,
        net_amount: netAmountCents,
        metadata: {
          phone_number,
          description,
          pack_id,
          pack_name,
          pack_price,
          provider: method,
          transaction_id: transactionId,
          created_via: 'api',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      const msg = String(error.message || '').toLowerCase()
      const shouldFallback = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
      if (shouldFallback) {
        const demo = createDemoPayment({
          userId: finalUserId,
          amount: amountNumber,
          currency,
          method,
          phoneNumber: phone_number,
          description,
          packId: pack_id,
          packName: pack_name,
          packPrice: pack_price,
        })
        return res.json({ success: true, paymentId: demo.paymentId, transactionId: demo.transactionId, next: 'confirm', demo: true })
      }
      return res.status(500).json({ success: false, error: 'database_error', details: error.message })
    }

    res.json({ success: true, paymentId: payment.id, transactionId, next: 'confirm' })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e.message })
  }
})

router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentId, transactionId, outcome = 'succeeded' } = req.body

    if (!paymentId || !transactionId) {
      return res.status(400).json({ success: false, error: 'missing_parameters' })
    }

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (fetchError) {
      const msg = String(fetchError.message || '').toLowerCase()
      const shouldFallback = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
      if (shouldFallback) {
        const demoConfirm = confirmDemoPayment({ paymentId, transactionId, outcome })
        if (demoConfirm.status === 'succeeded') {
          const packId = demoConfirm.payment?.metadata?.pack_id
          if (packId) {
            activateDemoUserPack({ userId: demoConfirm.payment.user_id, packId, source: 'mobile_money_confirm_demo' })
          }
        }
        return res.json({ success: true, status: demoConfirm.status, demo: true })
      }
      return res.status(404).json({ success: false, error: 'payment_not_found' })
    }

    if (!payment) {
      return res.status(404).json({ success: false, error: 'payment_not_found' })
    }

    const status = outcome === 'succeeded' ? 'succeeded' : 'failed'

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        failure_reason: status === 'failed' ? 'simulated_failure' : null,
        metadata: {
          ...payment.metadata,
          mobile_money_event: 'confirm',
          confirmed_at: new Date().toISOString(),
          transaction_id: transactionId,
        },
      })
      .eq('id', paymentId)

    if (updateError) {
      return res.status(500).json({ success: false, error: 'update_error', details: updateError.message })
    }

    if (status === 'succeeded') {
      await supabase.from('transactions').insert({
        payment_id: paymentId,
        user_id: payment.user_id,
        amount: payment.amount,
        currency: payment.currency,
        type: 'success',
        status: 'completed',
        metadata: {
          payment_method: payment.payment_method,
          processed_at: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      })

      const packId = payment?.metadata?.pack_id
      if (packId) {
        try {
          await deactivateOtherActivePacks({ supabase, userId: payment.user_id, keepPackId: packId })
          await activateUserPack({
            supabase,
            userId: payment.user_id,
            packId,
            source: 'mobile_money_confirm',
            transaction: { paymentId, transactionId },
          })
        } catch (e) {
          console.error('Activation pack (mobile money) échouée:', e)
        }
      }
    }

    res.json({ success: true, status })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e.message })
  }
})

router.get('/config-check', async (req, res) => {
  try {
    const config = {
      orange_money: !!MOBILE_MONEY_CONFIG.orange_money.apiKey,
      mtn_momo: !!MOBILE_MONEY_CONFIG.mtn_momo.apiKey,
      moov_money: !!MOBILE_MONEY_CONFIG.moov_money.apiKey,
    }
    res.json({ success: true, config })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'internal_error', details: e.message })
  }
})

export default router
