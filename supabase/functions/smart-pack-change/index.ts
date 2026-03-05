import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PackChangeRequest {
  packId: string
  successUrl?: string
  cancelUrl?: string
}

interface PackChangeResult {
  success: boolean
  message: string
  changeType?: string
  newPack?: Pack
  previousPack?: Pack
  requiresPayment: boolean
  checkoutUrl?: string
  priceDifference?: number
  prorationAmount?: number
  effectiveImmediately?: boolean
  creditApplied?: number
  subscriptionCancelled?: boolean
}

interface Pack {
  id: string
  name: string
  price: number
  currency: string
  description?: string
  is_recurring: boolean
}

interface UserPack {
  id: string
  user_id: string
  pack_id: string
  status: string
  started_at: string
  stripe_subscription_id?: string
  packs: Pack
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Non autorisé')
    }

    const { packId }: PackChangeRequest = await req.json()

    if (!packId) {
      throw new Error('Pack ID requis')
    }

    console.log(`\n=== 🎯 CHANGEMENT INTELLIGENT DE PACK ===`)
    console.log(`Utilisateur: ${user.id}`)
    console.log(`Nouveau pack demandé: ${packId}`)

    // 1. Utiliser la fonction calculate-pack-difference pour analyser
    console.log(`📞 Appel à calculate-pack-difference avec packId: ${packId}`)
    const analysisResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/calculate-pack-difference`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('Authorization')!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPackId: packId })
    })

    console.log(`📊 Réponse calculate-pack-difference: ${analysisResponse.status}`)
    
    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text()
      console.error(`❌ Erreur calculate-pack-difference (${analysisResponse.status}):`, errorText)
      throw new Error(`Erreur lors de l'analyse du changement de pack: ${errorText}`)
    }

    const analysis = await analysisResponse.json()
    
    console.log(`\n📊 ANALYSE:`)
    console.log(`Type de changement: ${analysis.changeType}`)
    console.log(`Paiement requis: ${analysis.requiresPayment}`)
    console.log(`Changement immédiat possible: ${analysis.canChangeImmediately}`)
    console.log(`Action recommandée: ${analysis.recommendedAction}`)

    // 2. Exécuter l'action appropriée selon le type de changement
    let result: PackChangeResult

    if (analysis.canChangeImmediately && !analysis.requiresPayment) {
      // Changement immédiat (downgrade ou même prix)
      console.log(`\n⚡ Exécution changement immédiat`)
      
      const immediateResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-immediate-change`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          newPackId: packId,
          reason: `Changement ${analysis.changeType}`,
          cancelSubscription: analysis.changeType === 'downgrade' && analysis.newPack.price === 0
        })
      })

      if (!immediateResponse.ok) {
        throw new Error('Erreur lors du changement immédiat')
      }

      const immediateResult = await immediateResponse.json()
      
      result = {
        success: immediateResult.success,
        message: immediateResult.message,
        changeType: analysis.changeType,
        newPack: analysis.newPack,
        previousPack: analysis.currentPack,
        requiresPayment: false,
        effectiveImmediately: true,
        creditApplied: immediateResult.creditApplied,
        subscriptionCancelled: immediateResult.subscriptionCancelled
      }
    } else if (analysis.requiresPayment) {
      // Changement nécessitant un paiement (upgrade)
      console.log(`\n💳 Exécution changement avec paiement`)
      
      const subscriptionResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-subscription-change`, {
        method: 'POST',
        headers: {
          'Authorization': req.headers.get('Authorization')!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          newPackId: packId,
          prorationBehavior: 'create_prorations'
        })
      })

      if (!subscriptionResponse.ok) {
        throw new Error('Erreur lors du changement d\'abonnement')
      }

      const subscriptionResult = await subscriptionResponse.json()
      
      result = {
        success: subscriptionResult.success,
        message: subscriptionResult.message,
        changeType: analysis.changeType,
        newPack: analysis.newPack,
        previousPack: analysis.currentPack,
        requiresPayment: true,
        checkoutUrl: subscriptionResult.checkoutUrl,
        priceDifference: subscriptionResult.priceDifference,
        prorationAmount: subscriptionResult.prorationAmount,
        effectiveImmediately: false
      }
    } else {
      throw new Error('Scénario de changement non supporté')
    }

    console.log(`\n=== ✅ RÉSULTAT FINAL ===`)
    console.log(`Succès: ${result.success}`)
    console.log(`Message: ${result.message}`)
    if (result.checkoutUrl) {
      console.log(`URL de paiement: ${result.checkoutUrl}`)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans smart-pack-change:', error)
    console.error('❌ Stack trace:', error.stack)
    console.error('❌ Type d\'erreur:', typeof error)
    console.error('❌ Erreur complète:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})