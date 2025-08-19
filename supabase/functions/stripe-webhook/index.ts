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
  
  if (!signature) {
    return new Response('Signature manquante', { status: 400 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    )

    console.log(`Événement reçu: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        const userId = session.metadata?.user_id
        const packId = session.metadata?.pack_id
        const changeType = session.metadata?.change_type
        const previousPackId = session.metadata?.previous_pack_id
        
        if (!userId || !packId) {
          console.error('Métadonnées manquantes:', session.metadata)
          return new Response('Métadonnées manquantes', { status: 400 })
        }
    
        // Si c'est un changement de pack, désactiver l'ancien
        if (changeType && previousPackId) {
          await supabaseClient
            .from('user_packs')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('pack_id', previousPackId)
            .eq('status', 'active')
        }
    
        // Activer le nouveau pack
        const { error: updateError } = await supabaseClient
          .from('user_packs')
          .upsert({
            user_id: userId,
            pack_id: packId,
            status: 'active',
            started_at: new Date().toISOString(),
            stripe_session_id: session.id,
            stripe_subscription_id: session.subscription || null,
          }, {
            onConflict: 'user_id,pack_id'
          })

        if (updateError) {
          console.error('Erreur mise à jour pack:', updateError)
        }

        // Enregistrer la transaction
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            pack_id: packId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase() || 'XOF',
            status: 'completed',
            stripe_session_id: session.id,
            payment_method: 'stripe',
            metadata: {
              session_mode: session.mode,
              customer_email: session.customer_details?.email
            }
          })

        if (transactionError) {
          console.error('Erreur enregistrement transaction:', transactionError)
        } else {
          console.log(`Transaction enregistrée pour l'utilisateur ${userId}`)
        }
        
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Paiement d\'abonnement réussi:', invoice.id)
        
        // Mettre à jour la prochaine date de facturation
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          
          const { error } = await supabaseClient
            .from('user_packs')
            .update({
              next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
              status: 'active'
            })
            .eq('stripe_session_id', subscription.metadata?.session_id)
            
          if (error) {
            console.error('Erreur mise à jour abonnement:', error)
          }
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Échec de paiement d\'abonnement:', invoice.id)
        
        // Marquer l'abonnement comme suspendu
        if (invoice.subscription) {
          const { error } = await supabaseClient
            .from('user_packs')
            .update({ status: 'suspended' })
            .eq('stripe_session_id', invoice.subscription_details?.metadata?.session_id)
            
          if (error) {
            console.error('Erreur suspension abonnement:', error)
          }
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Abonnement annulé:', subscription.id)
        
        // Marquer l'abonnement comme annulé
        const { error } = await supabaseClient
          .from('user_packs')
          .update({ status: 'cancelled' })
          .eq('stripe_session_id', subscription.metadata?.session_id)
          
        if (error) {
          console.error('Erreur annulation abonnement:', error)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erreur webhook:', error)
    return new Response(`Erreur webhook: ${error.message}`, { status: 400 })
  }
})