import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CancelSubscriptionRequest {
  reason?: string
  cancelImmediately?: boolean
  provideFeedback?: boolean
  feedbackText?: string
}

interface CancelSubscriptionResult {
  success: boolean
  message: string
  cancelledPack?: any
  subscriptionId?: string
  refundAmount?: number
  creditAmount?: number
  effectiveDate: string
  accessUntil?: string
  feedbackRecorded?: boolean
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

    const { 
      reason, 
      cancelImmediately = false,
      provideFeedback = false,
      feedbackText 
    }: CancelSubscriptionRequest = await req.json()

    console.log(`\n=== 🚫 ANNULATION D'ABONNEMENT ===`)
    console.log(`Utilisateur: ${user.id}`)
    console.log(`Raison: ${reason || 'Non spécifiée'}`)
    console.log(`Annulation immédiate: ${cancelImmediately}`)
    console.log(`Feedback fourni: ${provideFeedback}`)

    // 1. Récupérer l'abonnement actuel
    const { data: currentUserPack } = await supabaseClient
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!currentUserPack) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Aucun abonnement actif trouvé'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const currentPack = currentUserPack.packs
    console.log(`\n📦 Abonnement actuel: ${currentPack.name} (${currentPack.price} XOF/mois)`)
    console.log(`Stripe Subscription ID: ${currentUserPack.stripe_subscription_id || 'Aucun'}`)

    let refundAmount = 0
    let creditAmount = 0
    let accessUntil: string | undefined
    const _subscriptionCancelled = true

    // 2. Calculer les remboursements/crédits si applicable
    if (currentUserPack.started_at && currentPack.price > 0) {
      const startDate = new Date(currentUserPack.started_at)
      const now = new Date()
      const nextBillingDate = new Date(startDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      
      const totalDays = Math.ceil((nextBillingDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = Math.max(0, totalDays - daysUsed)
      
      if (daysRemaining > 0) {
        const dailyRate = currentPack.price / totalDays
        refundAmount = Math.floor(dailyRate * daysRemaining)
        creditAmount = refundAmount
        
        if (!cancelImmediately) {
          accessUntil = nextBillingDate.toISOString()
        }
        
        console.log(`💰 Calcul remboursement:`)
        console.log(`- Jours restants: ${daysRemaining}/${totalDays}`)
        console.log(`- Montant: ${refundAmount} XOF`)
      }
    }

    // 3. Annuler l'abonnement Stripe si existant
    // Note: stripe_subscription_id n'existe pas dans user_packs, logique à implémenter via metadata
    console.log(`\n🔄 Annulation abonnement Stripe (à implémenter)`)
    
    if (!cancelImmediately) {
      // Calculer la date de fin de période
      const startDate = new Date(currentUserPack.started_at)
      const nextBillingDate = new Date(startDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      accessUntil = nextBillingDate.toISOString()
      
      console.log(`✅ Abonnement programmé pour annulation`)
      console.log(`📅 Accès jusqu'au: ${new Date(accessUntil).toLocaleDateString()}`)
    }

    // 4. Mettre à jour le statut dans la base de données
    const updateData: any = {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseClient
      .from('user_packs')
      .update(updateData)
      .eq('id', currentUserPack.id)

    if (updateError) {
      console.error(`❌ Erreur mise à jour user_pack:`, updateError)
    } else {
      console.log(`✅ Statut mis à jour: ${updateData.status}`)
    }

    // 5. Enregistrer le crédit si applicable
    if (creditAmount > 0) {
      const { error: creditError } = await supabaseClient
        .from('user_credits')
        .insert({
          user_id: user.id,
          amount: creditAmount,
          type: 'subscription_cancellation',
          description: `Crédit pour annulation de ${currentPack.name}`,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Expire dans 1 an
        })

      if (creditError) {
        console.error(`⚠️ Erreur enregistrement crédit:`, creditError)
      } else {
        console.log(`💰 Crédit de ${creditAmount} XOF enregistré`)
      }
    }

    // 6. Enregistrer le feedback si fourni
    let feedbackRecorded = false
    if (provideFeedback && feedbackText) {
      const { error: feedbackError } = await supabaseClient
        .from('cancellation_feedback')
        .insert({
          user_id: user.id,
          pack_id: currentPack.id,
          reason: reason || 'Non spécifiée',
          feedback: feedbackText,
          created_at: new Date().toISOString(),
          metadata: {
            pack_name: currentPack.name,
            pack_price: currentPack.price,
            subscription_duration_days: currentUserPack.started_at 
              ? Math.ceil((new Date().getTime() - new Date(currentUserPack.started_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0
          }
        })

      if (feedbackError) {
        console.error(`⚠️ Erreur enregistrement feedback:`, feedbackError)
      } else {
        feedbackRecorded = true
        console.log(`📝 Feedback enregistré`)
      }
    }

    // 7. Migrer vers pack gratuit si annulation immédiate
    if (cancelImmediately) {
      console.log(`\n🆓 Migration vers pack gratuit...`)
      
      // Trouver le pack gratuit
      const { data: freePack } = await supabaseClient
        .from('packs')
        .select('*')
        .eq('price', 0)
        .single()

      if (freePack) {
        console.log(`📦 Pack gratuit trouvé: ${freePack.name} (ID: ${freePack.id})`)
        
        const { error: freePackError } = await supabaseClient
          .from('user_packs')
          .insert({
            user_id: user.id,
            pack_id: freePack.id,
            status: 'active',
            started_at: new Date().toISOString()
          })

        if (freePackError) {
          console.error(`❌ Erreur lors de l'insertion du pack gratuit:`, freePackError)
          console.error(`Code erreur: ${freePackError.code}`)
          console.error(`Message: ${freePackError.message}`)
        } else {
          // Mettre à jour selected_pack
          const packSlug = freePack.name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          const { error: updateError } = await supabaseClient
            .from('users')
            .update({ selected_pack: packSlug })
            .eq('id', user.id)

          if (updateError) {
            console.error(`❌ Erreur mise à jour selected_pack:`, updateError)
          } else {
            console.log(`✅ Migré vers pack gratuit: ${freePack.name}`)
            console.log(`✅ selected_pack mis à jour: ${packSlug}`)
          }
        }
      } else {
        console.error(`❌ Aucun pack gratuit trouvé dans la base de données`)
      }
    }

    const result: CancelSubscriptionResult = {
      success: true,
      message: cancelImmediately 
        ? `Abonnement ${currentPack.name} annulé immédiatement`
        : `Abonnement ${currentPack.name} sera annulé à la fin de la période de facturation`,
      cancelledPack: currentPack,
      subscriptionId: undefined, // stripe_subscription_id n'existe pas dans user_packs
      refundAmount: refundAmount > 0 ? refundAmount : undefined,
      creditAmount: creditAmount > 0 ? creditAmount : undefined,
      effectiveDate: cancelImmediately ? new Date().toISOString() : (accessUntil || new Date().toISOString()),
      accessUntil,
      feedbackRecorded
    }

    console.log(`\n=== ✅ ANNULATION TERMINÉE ===`)
    console.log(`Statut: ${cancelImmediately ? 'Annulé immédiatement' : 'Programmé pour annulation'}`)
    console.log(`Crédit accordé: ${creditAmount} XOF`)
    console.log(`Accès jusqu'au: ${accessUntil ? new Date(accessUntil).toLocaleDateString() : 'Immédiat'}`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans cancel-subscription:', error)
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

// Fonction utilitaire pour calculer les jours d'utilisation
function _calculateUsageDays(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  return Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

// Fonction utilitaire pour calculer le remboursement proportionnel
function _calculateProportionalRefund(price: number, startDate: string): { refundAmount: number, daysRemaining: number } {
  const start = new Date(startDate)
  const now = new Date()
  const nextBilling = new Date(start)
  nextBilling.setMonth(nextBilling.getMonth() + 1)
  
  const totalDays = Math.ceil((nextBilling.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const daysUsed = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, totalDays - daysUsed)
  
  const dailyRate = price / totalDays
  const refundAmount = Math.floor(dailyRate * daysRemaining)
  
  return { refundAmount, daysRemaining }
}
