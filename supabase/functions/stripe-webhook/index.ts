import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18',
})

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  // LOGS DE DEBUG DÉTAILLÉS
  console.log('\n=== DÉBUT WEBHOOK STRIPE ===')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))
  console.log('Signature présente:', !!signature)
  console.log('Body length:', body.length)
  console.log('Body preview:', body.substring(0, 200) + '...')
  
  // Vérification des variables d'environnement
  console.log('\n=== VARIABLES D\'ENVIRONNEMENT ===')
  console.log('STRIPE_SECRET_KEY présente:', !!Deno.env.get('STRIPE_SECRET_KEY'))
  console.log('STRIPE_WEBHOOK_SECRET présente:', !!Deno.env.get('STRIPE_WEBHOOK_SECRET'))
  console.log('SUPABASE_URL présente:', !!Deno.env.get('SUPABASE_URL'))
  console.log('SUPABASE_SERVICE_ROLE_KEY présente:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
  
  if (!signature) {
    console.log('\n❌ ERREUR: Signature manquante')
    return new Response('Signature manquante', { status: 400 })
  }

  try {
    console.log('\n=== CONSTRUCTION ÉVÉNEMENT STRIPE ===')
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log(`\n✅ ÉVÉNEMENT STRIPE CONSTRUIT AVEC SUCCÈS`)
    console.log('Event type:', event.type)
    console.log('Event ID:', event.id)
    console.log('Created:', new Date(event.created * 1000).toISOString())
    console.log('Livemode:', event.livemode)
    console.log('API version:', event.api_version)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        console.log('\n=== 🛒 SESSION CHECKOUT COMPLÉTÉE ===')
        console.log('Session ID:', session.id)
        console.log('Payment status:', session.payment_status)
        console.log('Payment intent:', session.payment_intent)
        console.log('Subscription:', session.subscription)
        console.log('Customer:', session.customer)
        console.log('Amount total:', session.amount_total)
        console.log('Currency:', session.currency)
        console.log('Mode:', session.mode)
        console.log('Status:', session.status)
        
        console.log('\n=== 📋 MÉTADONNÉES SESSION ===')
        console.log('Métadonnées complètes:', JSON.stringify(session.metadata, null, 2))
        
        const userId = session.metadata?.user_id
        const packId = session.metadata?.pack_id
        const changeType = session.metadata?.change_type
        const previousPackId = session.metadata?.previous_pack_id
        
        console.log('\n=== 🔍 EXTRACTION MÉTADONNÉES ===')
        console.log('User ID extraite:', userId, '(type:', typeof userId, ')')
        console.log('Pack ID extraite:', packId, '(type:', typeof packId, ')')
        console.log('Change type:', changeType)
        console.log('Previous Pack ID:', previousPackId)
        
        if (!userId || !packId) {
          console.error('\n❌ ERREUR CRITIQUE: Métadonnées manquantes')
          console.error('userId présent:', !!userId)
          console.error('packId présent:', !!packId)
          console.error('Toutes les métadonnées:', session.metadata)
          return new Response('Métadonnées manquantes', { status: 400 })
        }
    
        console.log('\n=== 🔄 DÉSACTIVATION DES PACKS ACTIFS ===')
        console.log('Recherche des packs actifs pour user_id:', userId)
        
        // D'abord, lister les packs actifs
        const { data: activePacks, error: listError } = await supabaseClient
          .from('user_packs')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
        
        if (listError) {
          console.error('❌ Erreur lors de la liste des packs actifs:', listError)
        } else {
          console.log('📦 Packs actifs trouvés:', activePacks?.length || 0)
          if (activePacks && activePacks.length > 0) {
            console.log('Détails des packs actifs:')
            activePacks.forEach((pack, index) => {
              console.log(`  Pack ${index + 1}:`, {
                id: pack.id,
                pack_id: pack.pack_id,
                status: pack.status,
                started_at: pack.started_at,
                stripe_session_id: pack.stripe_session_id
              })
            })
          }
        }
        
        // Désactiver TOUS les packs actifs de l'utilisateur
        const { error: deactivateError, data: deactivatedPacks } = await supabaseClient
          .from('user_packs')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('status', 'active')
          .select()
    
        if (deactivateError) {
          console.error('❌ ERREUR désactivation packs:', deactivateError)
          console.error('Code erreur:', deactivateError.code)
          console.error('Message:', deactivateError.message)
          console.error('Détails:', deactivateError.details)
        } else {
          console.log('✅ Packs désactivés avec succès:', deactivatedPacks?.length || 0)
          if (deactivatedPacks && deactivatedPacks.length > 0) {
            console.log('Détails packs désactivés:')
            deactivatedPacks.forEach((pack, index) => {
              console.log(`  Pack désactivé ${index + 1}:`, {
                id: pack.id,
                pack_id: pack.pack_id,
                status: pack.status,
                updated_at: pack.updated_at
              })
            })
          }
        }
    
        console.log('\n=== 🔍 VÉRIFICATION PACK EXISTANT ===')
        console.log('Recherche pack existant pour user_id:', userId, 'pack_id:', packId)
        
        // Vérifier si l'utilisateur a déjà ce pack (inactif)
        const { data: existingPack, error: checkError } = await supabaseClient
          .from('user_packs')
          .select('*')
          .eq('user_id', userId)
          .eq('pack_id', packId)
          .single()
    
        console.log('Pack existant trouvé:', !!existingPack)
        if (existingPack) {
          console.log('📦 Détails pack existant:', {
            id: existingPack.id,
            status: existingPack.status,
            started_at: existingPack.started_at,
            stripe_session_id: existingPack.stripe_session_id,
            created_at: existingPack.created_at,
            updated_at: existingPack.updated_at
          })
        }
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Erreur vérification pack existant:', checkError)
          console.error('Code erreur:', checkError.code)
          console.error('Message:', checkError.message)
        } else if (checkError && checkError.code === 'PGRST116') {
          console.log('ℹ️ Aucun pack existant trouvé (normal pour nouveau pack)')
        }
    
        if (existingPack) {
          console.log('\n=== 🔄 RÉACTIVATION PACK EXISTANT ===')
          console.log('Réactivation du pack ID:', existingPack.id)
          
          const updateData = {
            status: 'active',
            started_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_subscription_id: session.subscription || null,
            updated_at: new Date().toISOString()
          }
          
          console.log('Données de mise à jour:', updateData)
          
          // Réactiver le pack existant
          const { error: updateError, data: updatedPack } = await supabaseClient
            .from('user_packs')
            .update(updateData)
            .eq('id', existingPack.id)
            .select()
    
          if (updateError) {
            console.error('❌ ERREUR réactivation pack:', updateError)
            console.error('Code erreur:', updateError.code)
            console.error('Message:', updateError.message)
            console.error('Détails:', updateError.details)
            return new Response('Erreur réactivation pack', { status: 500 })
          } else {
            console.log('✅ Pack réactivé avec succès!')
            if (updatedPack && updatedPack.length > 0) {
              console.log('📦 Détails pack réactivé:', {
                id: updatedPack[0].id,
                user_id: updatedPack[0].user_id,
                pack_id: updatedPack[0].pack_id,
                status: updatedPack[0].status,
                started_at: updatedPack[0].started_at,
                stripe_session_id: updatedPack[0].stripe_session_id,
                updated_at: updatedPack[0].updated_at
              })
            }
          }
        } else {
          console.log('\n=== ➕ CRÉATION NOUVEAU PACK ===')
          
          const insertData = {
            user_id: userId,
            pack_id: packId,
            status: 'active',
            started_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_subscription_id: session.subscription || null,
          }
          
          console.log('Données d\'insertion:', insertData)
          
          // Créer un nouveau pack
          const { error: insertError, data: newPack } = await supabaseClient
            .from('user_packs')
            .insert(insertData)
            .select()
    
          if (insertError) {
            console.error('❌ ERREUR création nouveau pack:', insertError)
            console.error('Code erreur:', insertError.code)
            console.error('Message:', insertError.message)
            console.error('Détails:', insertError.details)
            return new Response('Erreur création pack', { status: 500 })
          } else {
            console.log('✅ Nouveau pack créé avec succès!')
            if (newPack && newPack.length > 0) {
              console.log('📦 Détails nouveau pack:', {
                id: newPack[0].id,
                user_id: newPack[0].user_id,
                pack_id: newPack[0].pack_id,
                status: newPack[0].status,
                started_at: newPack[0].started_at,
                stripe_session_id: newPack[0].stripe_session_id,
                created_at: newPack[0].created_at
              })
            }
          }
        }
        
        // Vérification finale
        console.log('\n=== ✅ VÉRIFICATION FINALE ===')
        const { data: finalCheck, error: finalError } = await supabaseClient
          .from('user_packs')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
        
        if (finalError) {
          console.error('❌ Erreur vérification finale:', finalError)
        } else {
          console.log('📊 Packs actifs après traitement:', finalCheck?.length || 0)
          if (finalCheck && finalCheck.length > 0) {
            finalCheck.forEach((pack, index) => {
              console.log(`  Pack actif ${index + 1}:`, {
                id: pack.id,
                pack_id: pack.pack_id,
                status: pack.status,
                stripe_session_id: pack.stripe_session_id
              })
            })
          }
        }
    
        console.log(`\n🎉 SUCCÈS: Pack ${packId} activé pour l'utilisateur ${userId}`)
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('\n=== 💰 PAIEMENT ABONNEMENT RÉUSSI ===')
        console.log('Invoice ID:', invoice.id)
        console.log('Subscription ID:', invoice.subscription)
        console.log('Amount paid:', invoice.amount_paid)
        console.log('Currency:', invoice.currency)
        
        // Mettre à jour la prochaine date de facturation
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          console.log('Subscription retrieved:', subscription.id)
          console.log('Current period end:', new Date(subscription.current_period_end * 1000).toISOString())
          
          const { error } = await supabaseClient
            .from('user_packs')
            .update({
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              status: 'active'
            })
            .eq('stripe_session_id', subscription.metadata?.session_id)
            
          if (error) {
            console.error('❌ Erreur mise à jour abonnement:', error)
          } else {
            console.log('✅ Abonnement mis à jour avec succès')
          }
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('\n=== ❌ ÉCHEC PAIEMENT ABONNEMENT ===')
        console.log('Invoice ID:', invoice.id)
        console.log('Subscription ID:', invoice.subscription)
        
        // Marquer l'abonnement comme suspendu
        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('user_packs')
            .update({ status: 'suspended' })
            .eq('stripe_session_id', invoice.subscription_details?.metadata?.session_id)
            
          if (error) {
            console.error('❌ Erreur suspension abonnement:', error)
          } else {
            console.log('✅ Abonnement suspendu avec succès')
          }
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('\n=== 🗑️ ABONNEMENT ANNULÉ ===')
        console.log('Subscription ID:', subscription.id)
        
        // Marquer l'abonnement comme annulé
        const { error } = await supabaseClient
          .from('user_packs')
          .update({ status: 'cancelled' })
          .eq('stripe_session_id', subscription.metadata?.session_id)
          
        if (error) {
          console.error('❌ Erreur annulation abonnement:', error)
        } else {
          console.log('✅ Abonnement annulé avec succès')
        }
        break
      }
      
      default:
        console.log(`\n⚠️ Type d'événement non géré: ${event.type}`)
        break
    }

    console.log('\n=== ✅ WEBHOOK TRAITÉ AVEC SUCCÈS ===')
    console.log('Réponse envoyée à Stripe: 200 OK')
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('\n❌ ERREUR WEBHOOK CRITIQUE:', error)
    console.error('Type d\'erreur:', error.constructor.name)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    return new Response(`Erreur webhook: ${error.message}`, { status: 400 })
  }
})