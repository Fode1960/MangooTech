import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { newPackId, changeType, successUrl, cancelUrl } = await req.json()

    if (!newPackId || !changeType) {
      throw new Error('Pack ID et type de changement requis')
    }

    // Récupérer le pack actuel de l'utilisateur
    const { data: currentUserPack } = await supabaseClient
      .from('user_packs')
      .select(`
        *,
        packs!inner(
          id,
          name,
          price,
          currency,
          billing_period
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Récupérer le nouveau pack
    const { data: newPack, error: newPackError } = await supabaseClient
      .from('packs')
      .select('*')
      .eq('id', newPackId)
      .single()

    if (newPackError || !newPack) {
      throw new Error('Nouveau pack non trouvé')
    }

    // Calculer la différence de prix pour les upgrades/downgrades
    const currentPrice = currentUserPack?.packs?.price || 0
    const newPrice = newPack.price
    const priceDifference = newPrice - currentPrice

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Gestion des downgrades vers gratuit
    if (changeType === 'downgrade' && newPack.price === 0) {
      // Annuler l'abonnement actuel si existant
      if (currentUserPack?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(currentUserPack.stripe_subscription_id)
      }
      
      // Migrer directement le pack
      const { error: cancelError } = await supabaseClient
        .from('user_packs')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!cancelError) {
        await supabaseClient
          .from('user_packs')
          .insert({
            user_id: user.id,
            pack_id: newPackId,
            status: 'active',
            started_at: new Date().toISOString(),
          })
      }

      return new Response(
        JSON.stringify({ success: true, direct_migration: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Configuration de session pour tous les paiements
    let sessionConfig: any = {
      customer_email: user.email,
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?success=true&pack=${newPackId}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        pack_id: newPackId,
        change_type: changeType,
        previous_pack_id: currentUserPack?.pack_id || null,
        price_difference: priceDifference.toString(),
      },
    }

    // Tous les packs payants utilisent le mode subscription
    if (newPack.price > 0) {
      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: 'xof',
            product_data: {
              name: newPack.name,
              description: newPack.description || `Abonnement ${newPack.name}`,
            },
            unit_amount: newPack.price, // SUPPRIMÉ: * 100
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
      }

      // Pour les upgrades/downgrades, ajouter des informations de proration
      if (changeType === 'upgrade' || changeType === 'downgrade') {
        sessionConfig.subscription_data = {
          metadata: {
            previous_pack_id: currentUserPack?.pack_id || null,
            change_type: changeType,
          }
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erreur dans change-pack-with-payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})