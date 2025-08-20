import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPackStatus() {
  try {
    // Récupérer l'utilisateur actuel (remplacez par votre email)
    const userEmail = 'votre-email@example.com'; // REMPLACEZ PAR VOTRE EMAIL
    
    console.log('=== DIAGNOSTIC PACK STATUS ===')
    console.log('Email recherché:', userEmail)
    
    // Trouver l'utilisateur
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
    
    if (userError) {
      console.error('Erreur recherche utilisateur:', userError)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('Aucun utilisateur trouvé avec cet email')
      return
    }
    
    const user = users[0]
    console.log('Utilisateur trouvé:', user.id, user.email)
    
    // Récupérer tous les packs de l'utilisateur
    const { data: userPacks, error: packsError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs:pack_id (
          id,
          name,
          price,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (packsError) {
      console.error('Erreur récupération packs:', packsError)
      return
    }
    
    console.log('\n=== PACKS DE L\'UTILISATEUR ===')
    console.log('Nombre total de packs:', userPacks?.length || 0)
    
    userPacks?.forEach((pack, index) => {
      console.log(`\nPack ${index + 1}:`)
      console.log('  ID:', pack.id)
      console.log('  Pack ID:', pack.pack_id)
      console.log('  Nom:', pack.packs?.name)
      console.log('  Prix:', pack.packs?.price, 'FCFA')
      console.log('  Status:', pack.status)
      console.log('  Créé le:', pack.created_at)
      console.log('  Mis à jour le:', pack.updated_at)
      console.log('  Stripe Session ID:', pack.stripe_session_id)
      console.log('  Stripe Subscription ID:', pack.stripe_subscription_id)
    })
    
    // Récupérer le pack actif
    const activePacks = userPacks?.filter(pack => pack.status === 'active') || []
    console.log('\n=== PACK ACTIF ===')
    console.log('Nombre de packs actifs:', activePacks.length)
    
    if (activePacks.length > 0) {
      const activePack = activePacks[0]
      console.log('Pack actif:', activePack.packs?.name)
      console.log('Prix:', activePack.packs?.price, 'FCFA')
    } else {
      console.log('Aucun pack actif trouvé')
    }
    
  } catch (error) {
    console.error('Erreur:', error)
  }
}

debugPackStatus();