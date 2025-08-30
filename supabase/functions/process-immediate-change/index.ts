import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

interface ImmediateChangeRequest {
  newPackId: string
  reason?: string
  cancelSubscription?: boolean
}

interface ImmediateChangeResult {
  success: boolean
  message: string
  newPack: any
  previousPack?: any
  subscriptionCancelled?: boolean
  creditApplied?: number
  effectiveDate: string
  nextBillingDate?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier si c'est un appel avec service key et x-user-id header
    const userIdHeader = req.headers.get('x-user-id')
    const authHeader = req.headers.get('Authorization')
    const isServiceKeyCall = authHeader?.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
    
    let userId: string
    let supabaseClient: any
    
    if (isServiceKeyCall && userIdHeader) {
      // Mode service key avec user ID spécifié
      console.log('🔑 Mode service key détecté avec user ID:', userIdHeader)
      userId = userIdHeader
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
    } else {
      // Mode authentification utilisateur normal
      supabaseClient = createClient(
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
      
      userId = user.id
    }

    const { newPackId, reason, cancelSubscription }: ImmediateChangeRequest = await req.json()

    if (!newPackId) {
      throw new Error('Nouveau pack ID requis')
    }

    console.log(`\n=== ⚡ CHANGEMENT IMMÉDIAT DE PACK ===`)
    console.log(`Utilisateur: ${userId}`)
    console.log(`Nouveau pack: ${newPackId}`)
    console.log(`Raison: ${reason || 'Non spécifiée'}`)
    console.log(`Annuler abonnement: ${cancelSubscription || false}`)

    // 1. Récupérer le nouveau pack
    const { data: newPack, error: newPackError } = await supabaseClient
      .from('packs')
      .select('*')
      .eq('id', newPackId)
      .single()

    if (newPackError || !newPack) {
      throw new Error('Nouveau pack non trouvé')
    }

    // 2. Récupérer le pack actuel de l'utilisateur
    const { data: currentUserPacks } = await supabaseClient
      .from('user_packs')
      .select(`
        *,
        packs!inner(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')

    let previousPack = null
    let subscriptionCancelled = false
    let creditApplied = 0

    // 3. Désactiver tous les packs actuels
    if (currentUserPacks && currentUserPacks.length > 0) {
      console.log(`\n📦 Désactivation de ${currentUserPacks.length} pack(s) actuel(s)`)
      
      for (const userPack of currentUserPacks) {
        previousPack = userPack.packs
        
        // Calculer le crédit si applicable
        if (userPack.started_at && userPack.packs.price > 0) {
          const startDate = new Date(userPack.started_at)
          const now = new Date()
          const nextBillingDate = new Date(startDate)
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
          
          const totalDays = Math.ceil((nextBillingDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          const daysRemaining = Math.max(0, totalDays - daysUsed)
          
          if (daysRemaining > 0) {
            const dailyRate = userPack.packs.price / totalDays
            creditApplied = Math.floor(dailyRate * daysRemaining)
            console.log(`💰 Crédit calculé: ${creditApplied} XOF pour ${daysRemaining} jours restants`)
          }
        }
        
        // Désactiver le pack
        const { error: deactivateError } = await supabaseClient
          .from('user_packs')
          .update({ 
            status: 'inactive',
            ended_at: new Date().toISOString()
          })
          .eq('id', userPack.id)

        if (deactivateError) {
          console.error(`❌ Erreur désactivation pack ${userPack.id}:`, deactivateError)
        } else {
          console.log(`✅ Pack ${userPack.packs.name} désactivé`)
        }

        // Note: Logique d'annulation Stripe à implémenter si nécessaire
        // La colonne stripe_subscription_id n'existe pas dans user_packs
        if (cancelSubscription) {
          console.log(`ℹ️ Annulation d'abonnement demandée mais pas implémentée`)
        }
      }
    }

    // 4. Activer le nouveau pack
    console.log(`\n🎯 Activation du nouveau pack: ${newPack.name}`)
    console.log(`User ID: ${userId}`)
    console.log(`Pack ID: ${newPack.id}`)
    
    const insertData = {
      user_id: userId,
      pack_id: newPack.id,
      status: 'active',
      started_at: new Date().toISOString()
      // Note: metadata n'existe pas dans user_packs, les infos sont loggées
    }
    
    console.log('Données à insérer/mettre à jour:', JSON.stringify(insertData, null, 2))
    
    // Utiliser upsert pour éviter les erreurs de contrainte unique
    const { data: newUserPack, error: activateError } = await supabaseClient
      .from('user_packs')
      .upsert(insertData, {
        onConflict: 'user_id,pack_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (activateError) {
      console.error('❌ Erreur détaillée activation:', activateError)
      throw new Error(`Erreur activation nouveau pack: ${activateError.message}`)
    }
    
    console.log('✅ Nouveau pack activé:', newUserPack.id)

    // 5. Mettre à jour le selected_pack de l'utilisateur
    const packSlug = newPack.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const { error: updateUserError } = await supabaseClient
      .from('users')
      .update({ selected_pack: packSlug })
      .eq('id', userId)

    if (updateUserError) {
      console.error(`⚠️ Erreur mise à jour selected_pack:`, updateUserError)
    } else {
      console.log(`✅ selected_pack mis à jour: ${packSlug}`)
    }

    // 6. Enregistrer le crédit si applicable
    if (creditApplied > 0) {
      console.log(`\n💰 Enregistrement crédit: ${creditApplied} XOF`)
      
      const creditData = {
        user_id: userId,
        amount: creditApplied,
        type: 'pack_downgrade',
        description: `Crédit pour changement de ${previousPack?.name} vers ${newPack.name}`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Expire dans 1 an
      }
      
      console.log('Données crédit:', JSON.stringify(creditData, null, 2))
      
      const { error: creditError } = await supabaseClient
        .from('user_credits')
        .insert(creditData)

      if (creditError) {
        console.error(`❌ Erreur détaillée crédit:`, creditError)
        // Ne pas faire échouer la transaction pour un problème de crédit
      } else {
        console.log(`✅ Crédit de ${creditApplied} XOF enregistré`)
      }
    } else {
      console.log('\n💰 Aucun crédit à appliquer')
    }

    const result: ImmediateChangeResult = {
      success: true,
      message: `Pack changé avec succès vers ${newPack.name}`,
      newPack,
      previousPack,
      subscriptionCancelled,
      creditApplied: creditApplied > 0 ? creditApplied : undefined,
      effectiveDate: new Date().toISOString(),
      nextBillingDate: newPack.price > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
    }

    console.log(`\n=== ✅ CHANGEMENT TERMINÉ ===`)
    console.log(`Nouveau pack: ${newPack.name}`)
    console.log(`Crédit appliqué: ${creditApplied} XOF`)
    console.log(`Abonnement annulé: ${subscriptionCancelled}`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans process-immediate-change:', error)
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

// Fonction utilitaire pour créer une table user_credits si elle n'existe pas
async function ensureUserCreditsTable(supabaseClient: any) {
  try {
    const { data, error } = await supabaseClient
      .from('user_credits')
      .select('id')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('📋 Table user_credits n\'existe pas, création recommandée')
      // La table n'existe pas, mais on ne peut pas la créer depuis une fonction
      // Il faudra la créer manuellement ou via une migration
    }
  } catch (e) {
    console.log('⚠️ Impossible de vérifier la table user_credits')
  }
}