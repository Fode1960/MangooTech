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

    // Vérifier l'authentification
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Non autorisé')
    }

    const { packId, successUrl, cancelUrl } = await req.json()

    if (!packId) {
      throw new Error('Pack ID requis')
    }

    // Récupérer les informations du pack
    const { data: pack, error: packError } = await supabaseClient
      .from('packs')
      .select('*')
      .eq('id', packId)
      .single()

    if (packError || !pack) {
      throw new Error('Pack non trouvé')
    }

    // Initialiser Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'xof', // Franc CFA
            product_data: {
              name: pack.name,
              description: pack.description,
            },
            unit_amount: pack.price * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: pack.is_recurring ? 'subscription' : 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/dashboard?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        pack_id: packId,
      },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})