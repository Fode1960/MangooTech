import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionChangeRequest {
  newPackId: string
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  paymentBehavior?: 'default_incomplete' | 'pending_if_incomplete' | 'error_if_incomplete'
}

interface SubscriptionChangeResult {
  success: boolean
  checkoutUrl?: string
  subscriptionId?: string
  message: string
  priceDifference: number
  prorationAmount?: number
  newPack: any
  currentPack?: any
  paymentRequired: boolean
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
      newPackId, 
      prorationBehavior = 'create_prorations',
      paymentBehavior = 'default_incomplete'
    }: SubscriptionChangeRequest = await req.json()

    if (!newPackId) {
      throw new Error('Nouveau pack ID requis')
    }

    console.log(`\n=== 💳 CHANGEMENT D'ABONNEMENT STRIPE ===`)
    console.log(`Utilisateur: ${user.id}`)
    console.log(`Nouveau pack: ${newPackId}`)
    console.log(`Proration: ${prorationBehavior}`)
    console.log(`Comportement paiement: ${paymentBehavior}`)

    // 1. Récupérer les informations utilisateur
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('Utilisateur non trouvé')
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

    // 3. Récupérer le pack actuel
    const { data: currentUserPack } = await supabaseClient
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    let currentPack = null
    let hasActiveSubscription = false
    let stripeCustomerId = null
    let stripeSubscriptionId = null

    if (currentUserPack) {
      currentPack = currentUserPack.packs
      hasActiveSubscription = !!currentUserPack.stripe_subscription_id
      stripeSubscriptionId = currentUserPack.stripe_subscription_id
      stripeCustomerId = currentUserPack.stripe_customer_id
    }

    const priceDifference = newPack.price - (currentPack?.price || 0)

    console.log(`\n📊 ANALYSE DU CHANGEMENT:`)
    console.log(`Pack actuel: ${currentPack?.name || 'Aucun'} (${currentPack?.price || 0} XOF)`)
    console.log(`Nouveau pack: ${newPack.name} (${newPack.price} XOF)`)
    console.log(`Différence: ${priceDifference} XOF`)
    console.log(`Abonnement actif: ${hasActiveSubscription}`)
    console.log(`Subscription ID: ${stripeSubscriptionId || 'Aucun'}`)

    // 4. Gérer selon le scénario
    let result: SubscriptionChangeResult

    if (!hasActiveSubscription) {
      // Cas 1: Pas d'abonnement actuel - créer un nouveau checkout
      result = await createNewCheckoutSession(
        supabaseClient,
        user.id,
        userData.email,
        newPack,
        currentPack,
        priceDifference
      )
    } else {
      // Cas 2: Abonnement existant - modifier l'abonnement
      result = await modifyExistingSubscription(
        supabaseClient,
        user.id,
        stripeSubscriptionId!,
        stripeCustomerId,
        newPack,
        currentPack,
        priceDifference,
        prorationBehavior,
        paymentBehavior
      )
    }

    console.log(`\n=== ✅ RÉSULTAT ===`)
    console.log(`Succès: ${result.success}`)
    console.log(`Paiement requis: ${result.paymentRequired}`)
    console.log(`URL checkout: ${result.checkoutUrl || 'N/A'}`)
    console.log(`Message: ${result.message}`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans handle-subscription-change:', error)
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

// Créer une nouvelle session de checkout Stripe
async function createNewCheckoutSession(
  supabaseClient: any,
  userId: string,
  userEmail: string,
  newPack: any,
  currentPack: any,
  priceDifference: number
): Promise<SubscriptionChangeResult> {
  console.log(`\n🆕 Création nouvelle session checkout`)

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    throw new Error('Clé secrète Stripe manquante')
  }

  // Créer la session Stripe avec sérialisation correcte

  // Sérialiser correctement les données pour Stripe
  const formData = new URLSearchParams()
  formData.append('customer_email', userEmail)
  formData.append('mode', 'subscription')
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'
  const basePath = frontendUrl.includes('github.io') ? '/MangooTech' : ''
  formData.append('success_url', `${frontendUrl}${basePath}/dashboard?payment=success&pack=${newPack.id}`)
  formData.append('cancel_url', `${frontendUrl}${basePath}/dashboard?payment=cancelled`)
  
  // Line items
  formData.append('line_items[0][price_data][currency]', 'xof')
  formData.append('line_items[0][price_data][product_data][name]', newPack.name)
  formData.append('line_items[0][price_data][product_data][description]', newPack.description || `Abonnement ${newPack.name}`)
  formData.append('line_items[0][price_data][unit_amount]', newPack.price.toString())
  formData.append('line_items[0][price_data][recurring][interval]', 'month')
  formData.append('line_items[0][quantity]', '1')
  
  // Metadata
  formData.append('metadata[user_id]', userId)
  formData.append('metadata[pack_id]', newPack.id)
  formData.append('metadata[change_type]', 'upgrade')
  formData.append('metadata[previous_pack_id]', currentPack?.id || '')
  formData.append('metadata[price_difference]', priceDifference.toString())
  
  // Subscription metadata
  formData.append('subscription_data[metadata][user_id]', userId)
  formData.append('subscription_data[metadata][pack_id]', newPack.id)
  formData.append('subscription_data[metadata][change_type]', 'upgrade')

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  })

  if (!stripeResponse.ok) {
    const errorText = await stripeResponse.text()
    throw new Error(`Erreur Stripe: ${errorText}`)
  }

  const session = await stripeResponse.json()

  return {
    success: true,
    checkoutUrl: session.url,
    message: `Session de paiement créée pour ${newPack.name}`,
    priceDifference,
    newPack,
    currentPack,
    paymentRequired: true
  }
}

// Modifier un abonnement Stripe existant
async function modifyExistingSubscription(
  supabaseClient: any,
  userId: string,
  subscriptionId: string,
  customerId: string | null,
  newPack: any,
  currentPack: any,
  priceDifference: number,
  prorationBehavior: string,
  paymentBehavior: string
): Promise<SubscriptionChangeResult> {
  console.log(`\n🔄 Modification abonnement existant: ${subscriptionId}`)

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    throw new Error('Clé secrète Stripe manquante')
  }

  try {
    // 1. Récupérer l'abonnement actuel
    const subscriptionResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`
      }
    })

    if (!subscriptionResponse.ok) {
      throw new Error('Abonnement Stripe non trouvé')
    }

    const subscription = await subscriptionResponse.json()
    const currentItemId = subscription.items.data[0].id

    // 2. Créer un nouveau prix pour le nouveau pack
    const priceData = {
      currency: 'xof',
      unit_amount: newPack.price,
      recurring: { interval: 'month' },
      product_data: {
        name: newPack.name,
        description: newPack.description || `Abonnement ${newPack.name}`
      }
    }

    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(priceData as any).toString()
    })

    if (!priceResponse.ok) {
      throw new Error('Erreur création prix Stripe')
    }

    const newPrice = await priceResponse.json()

    // 3. Modifier l'abonnement
    const updateData = {
      items: [{
        id: currentItemId,
        price: newPrice.id
      }],
      proration_behavior: prorationBehavior,
      payment_behavior: paymentBehavior,
      metadata: {
        user_id: userId,
        pack_id: newPack.id,
        change_type: priceDifference > 0 ? 'upgrade' : 'downgrade',
        previous_pack_id: currentPack.id,
        price_difference: priceDifference.toString()
      }
    }

    const updateResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(updateData as any).toString()
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      throw new Error(`Erreur modification abonnement: ${errorText}`)
    }

    const updatedSubscription = await updateResponse.json()

    // 4. Calculer le montant de proration
    let prorationAmount = 0
    if (updatedSubscription.latest_invoice) {
      const invoiceResponse = await fetch(`https://api.stripe.com/v1/invoices/${updatedSubscription.latest_invoice}`, {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`
        }
      })

      if (invoiceResponse.ok) {
        const invoice = await invoiceResponse.json()
        prorationAmount = invoice.amount_due / 100 // Convertir en unité principale
      }
    }

    // 5. Mettre à jour la base de données
    await updateUserPackInDatabase(supabaseClient, userId, newPack, subscriptionId)

    return {
      success: true,
      subscriptionId: updatedSubscription.id,
      message: `Abonnement modifié vers ${newPack.name}`,
      priceDifference,
      prorationAmount,
      newPack,
      currentPack,
      paymentRequired: prorationAmount > 0
    }

  } catch (error) {
    console.error('❌ Erreur modification abonnement:', error)
    throw error
  }
}

// Mettre à jour le pack utilisateur dans la base de données
async function updateUserPackInDatabase(
  supabaseClient: any,
  userId: string,
  newPack: any,
  subscriptionId: string
) {
  console.log(`\n💾 Mise à jour base de données`)

  // 1. Désactiver les packs actuels
  await supabaseClient
    .from('user_packs')
    .update({ 
      status: 'inactive',
      ended_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('status', 'active')

  // 2. Créer le nouveau pack
  await supabaseClient
    .from('user_packs')
    .insert({
      user_id: userId,
      pack_id: newPack.id,
      status: 'active',
      started_at: new Date().toISOString(),
      stripe_subscription_id: subscriptionId,
      metadata: {
        change_type: 'subscription_modification',
        modified_at: new Date().toISOString()
      }
    })

  // 3. Mettre à jour selected_pack
  const packSlug = newPack.name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  await supabaseClient
    .from('users')
    .update({ selected_pack: packSlug })
    .eq('id', userId)

  console.log(`✅ Base de données mise à jour`)
}