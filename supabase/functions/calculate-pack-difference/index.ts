import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PackComparisonRequest {
  currentPackId?: string
  newPackId: string
}

interface PackComparisonResult {
  changeType: 'upgrade' | 'downgrade' | 'same_price' | 'first_pack'
  priceDifference: number
  requiresPayment: boolean
  actionDescription: string
  recommendedAction: string
  currentPack?: any
  newPack: any
  canChangeImmediately: boolean
  estimatedSavings?: number
  prorationInfo?: {
    daysRemaining: number
    refundAmount: number
    creditAmount: number
  }
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

    const { currentPackId, newPackId }: PackComparisonRequest = await req.json()

    if (!newPackId) {
      throw new Error('Nouveau pack ID requis')
    }

    console.log(`\n=== 🧮 CALCUL DIFFÉRENCE DE PACK ===`)
    console.log(`Utilisateur: ${user.id}`)
    console.log(`Pack actuel: ${currentPackId || 'Aucun'}`)
    console.log(`Nouveau pack: ${newPackId}`)

    // 1. Récupérer le pack actuel si spécifié
    let currentPack = null
    let currentUserPack = null
    
    if (currentPackId) {
      const { data: currentPackData } = await supabaseClient
        .from('packs')
        .select('*')
        .eq('id', currentPackId)
        .single()
      
      currentPack = currentPackData
      
      // Récupérer aussi les infos de l'abonnement utilisateur
      const { data: userPackData } = await supabaseClient
        .from('user_packs')
        .select('*')
        .eq('user_id', user.id)
        .eq('pack_id', currentPackId)
        .eq('status', 'active')
        .single()
      
      currentUserPack = userPackData
    } else {
      // Essayer de trouver le pack actuel automatiquement
      const { data: activeUserPack } = await supabaseClient
        .from('user_packs')
        .select(`
          *,
          packs!inner(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      if (activeUserPack) {
        currentPack = activeUserPack.packs
        currentUserPack = activeUserPack
      }
    }

    // 2. Récupérer le nouveau pack
    const { data: newPack, error: newPackError } = await supabaseClient
      .from('packs')
      .select('*')
      .eq('id', newPackId)
      .single()

    if (newPackError || !newPack) {
      throw new Error('Nouveau pack non trouvé')
    }

    // 3. Calculer les différences et déterminer les actions
    const result = calculatePackDifference(currentPack, newPack, currentUserPack)

    console.log(`\n=== 📊 RÉSULTAT CALCUL ===`)
    console.log(`Type de changement: ${result.changeType}`)
    console.log(`Différence de prix: ${result.priceDifference} XOF`)
    console.log(`Paiement requis: ${result.requiresPayment}`)
    console.log(`Changement immédiat possible: ${result.canChangeImmediately}`)
    console.log(`Action recommandée: ${result.recommendedAction}`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans calculate-pack-difference:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function calculatePackDifference(
  currentPack: any,
  newPack: any,
  currentUserPack: any = null
): PackComparisonResult {
  const currentPrice = currentPack?.price || 0
  const newPrice = newPack.price
  const priceDifference = newPrice - currentPrice

  let changeType: 'upgrade' | 'downgrade' | 'same_price' | 'first_pack'
  let requiresPayment = false
  let actionDescription = ''
  let recommendedAction = ''
  let canChangeImmediately = false
  let estimatedSavings: number | undefined
  let prorationInfo: any

  // Déterminer le type de changement
  if (!currentPack) {
    changeType = 'first_pack'
  } else if (priceDifference > 0) {
    changeType = 'upgrade'
  } else if (priceDifference < 0) {
    changeType = 'downgrade'
  } else {
    changeType = 'same_price'
  }

  // Calculer la proration si applicable
  if (currentUserPack && currentUserPack.started_at) {
    const startDate = new Date(currentUserPack.started_at)
    const now = new Date()
    const nextBillingDate = new Date(startDate)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
    
    const totalDays = Math.ceil((nextBillingDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, totalDays - daysUsed)
    
    const dailyRate = currentPrice / totalDays
    const refundAmount = Math.floor(dailyRate * daysRemaining)
    const creditAmount = refundAmount
    
    prorationInfo = {
      daysRemaining,
      refundAmount,
      creditAmount
    }
  }

  // Déterminer les actions selon le type de changement
  switch (changeType) {
    case 'first_pack':
      requiresPayment = newPrice > 0
      canChangeImmediately = newPrice === 0
      actionDescription = newPrice > 0 
        ? `Activation de votre premier pack payant (${newPrice} XOF/mois)`
        : 'Activation gratuite de votre premier pack'
      recommendedAction = newPrice > 0 
        ? 'Procéder au paiement pour activer le pack'
        : 'Activer immédiatement le pack gratuit'
      break

    case 'upgrade':
      requiresPayment = true
      canChangeImmediately = false
      actionDescription = `Upgrade vers ${newPack.name} (+${priceDifference} XOF/mois)`
      recommendedAction = `Payer ${priceDifference} XOF pour l'upgrade`
      if (prorationInfo) {
        recommendedAction += ` (crédit de ${prorationInfo.creditAmount} XOF appliqué)`
      }
      break

    case 'downgrade':
      requiresPayment = false
      canChangeImmediately = true
      estimatedSavings = Math.abs(priceDifference)
      
      if (newPrice === 0) {
        actionDescription = `Downgrade vers pack gratuit (économie: ${estimatedSavings} XOF/mois)`
        recommendedAction = 'Annuler l\'abonnement et migrer vers le pack gratuit'
      } else {
        actionDescription = `Downgrade vers ${newPack.name} (économie: ${estimatedSavings} XOF/mois)`
        recommendedAction = 'Migration immédiate vers le pack moins cher'
        if (prorationInfo && prorationInfo.creditAmount > 0) {
          recommendedAction += ` avec crédit de ${prorationInfo.creditAmount} XOF`
        }
      }
      break

    case 'same_price':
      requiresPayment = false
      canChangeImmediately = true
      actionDescription = `Changement vers ${newPack.name} (même prix: ${newPrice} XOF/mois)`
      recommendedAction = 'Migration immédiate sans frais supplémentaires'
      break
  }

  return {
    changeType,
    priceDifference,
    requiresPayment,
    actionDescription,
    recommendedAction,
    currentPack,
    newPack,
    canChangeImmediately,
    estimatedSavings,
    prorationInfo
  }
}

// Fonction utilitaire pour calculer les économies annuelles
function calculateAnnualSavings(monthlyDifference: number): number {
  return Math.abs(monthlyDifference) * 12
}

// Fonction utilitaire pour formater les prix
function formatPrice(amount: number, currency: string = 'XOF'): string {
  return `${amount.toLocaleString()} ${currency}`
}

// Fonction utilitaire pour calculer le pourcentage d'économie
function calculateSavingsPercentage(currentPrice: number, newPrice: number): number {
  if (currentPrice === 0) return 0
  return Math.round(((currentPrice - newPrice) / currentPrice) * 100)
}