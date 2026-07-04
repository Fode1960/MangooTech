import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

// Configuration CORS optimisée
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // Cache preflight pendant 24h
}

// Cache simple pour les données de packs (5 minutes)
const packCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Fonction utilitaire pour la gestion d'erreurs
function createErrorResponse(message: string, status = 400) {
  console.error(`Error: ${message}`)
  return new Response(
    JSON.stringify({ error: message }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  )
}

// Fonction pour récupérer un pack avec cache
async function getCachedPack(supabaseClient: any, packId: string) {
  const cacheKey = `pack_${packId}`
  const cached = packCache.get(cacheKey)
  
  // Vérifier si le cache est valide
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Récupérer depuis la base de données
  const { data: pack, error: packError } = await supabaseClient
    .from('packs')
    .select('*')
    .eq('id', packId)
    .single()
  
  if (packError || !pack) {
    throw new Error('Pack non trouvé')
  }
  
  // Mettre en cache
  packCache.set(cacheKey, {
    data: pack,
    timestamp: Date.now()
  })
  
  return pack
}

serve(async (req) => {
  // Gestion optimisée des requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return createErrorResponse('Méthode non autorisée', 405)
  }

  const startTime = Date.now()
  
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

    // Récupérer les informations du pack avec cache
    const pack = await getCachedPack(supabaseClient, packId)

    // Initialiser Stripe avec configuration optimisée
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
      timeout: 10000, // Timeout de 10 secondes
      maxNetworkRetries: 2, // Retry automatique
    })

    // CrÃ©er la session de paiement
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
            unit_amount: pack.price, // XOF n'utilise pas de centimes
          },
          quantity: 1,
        },
      ],
      mode: pack.is_recurring ? 'subscription' : 'payment',
      success_url: successUrl || (() => {
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3001'
        return `${frontendUrl}/dashboard?payment=success&pack=${packId}`
      })(),
      cancel_url: cancelUrl || (() => {
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:3001'
        return `${frontendUrl}/dashboard?payment=cancelled&pack=${packId}`
      })(),
      metadata: {
        user_id: user.id,
        pack_id: packId,
      },
    })

    // Log des performances
    const duration = Date.now() - startTime
    console.log(`Session créée en ${duration}ms pour le pack ${packId}`)
    
    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        performance: { duration }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Erreur après ${duration}ms:`, error.message)
    
    // Gestion d'erreurs spécifiques
    if (error.message.includes('Non autorisé')) {
      return createErrorResponse('Authentification requise', 401)
    }
    if (error.message.includes('Pack non trouvé')) {
      return createErrorResponse('Pack introuvable', 404)
    }
    if (error.message.includes('Stripe')) {
      return createErrorResponse('Erreur de paiement', 502)
    }
    
    return createErrorResponse(error.message, 500)
  }
})
