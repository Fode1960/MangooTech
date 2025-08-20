import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkzMjQ5MiwiZXhwIjoyMDcwNTA4NDkyfQ.SvXeHO8Q9weim6yzjowjC5d0EhDey1uvu8P8aDTW0oY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPackMigration() {
  console.log('🔍 Diagnostic de la migration de pack...');
  
  try {
    // 1. Vérifier l'état actuel des packs utilisateurs
    console.log('\n📊 État actuel des packs utilisateurs:');
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        users(email),
        packs(name, price)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (userPacksError) {
      console.error('❌ Erreur récupération user_packs:', userPacksError);
    } else {
      console.log(`Total: ${userPacks?.length || 0} entrées récentes`);
      userPacks?.forEach(up => {
        console.log(`- ${up.users?.email}: ${up.packs?.name} (${up.status}) - Session: ${up.stripe_session_id || 'Aucune'}`);
      });
    }
    
    // 2. Vérifier les sessions Stripe récentes
    console.log('\n💳 Sessions Stripe récentes:');
    const { data: stripeSessions } = await supabase
      .from('user_packs')
      .select('stripe_session_id, created_at, status, users(email)')
      .not('stripe_session_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);
    
    stripeSessions?.forEach(session => {
      console.log(`- ${session.users?.email}: ${session.stripe_session_id} (${session.status}) - ${new Date(session.created_at).toLocaleString()}`);
    });
    
    // 3. Vérifier tous les utilisateurs avec Pack Découverte
    console.log('\n🆓 Utilisateurs avec Pack Découverte:');
    const { data: discoveryPacks } = await supabase
      .from('user_packs')
      .select(`
        *,
        users(email),
        packs(name, price)
      `)
      .eq('packs.name', 'Pack Découverte')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    discoveryPacks?.forEach(pack => {
      console.log(`- ${pack.users?.email}: ${pack.packs?.name} - Créé: ${new Date(pack.created_at).toLocaleString()}`);
    });
    
    // 4. Vérifier les packs payants récents
    console.log('\n💰 Packs payants récents:');
    const { data: paidPacks } = await supabase
      .from('user_packs')
      .select(`
        *,
        users(email),
        packs(name, price)
      `)
      .gt('packs.price', 0)
      .order('created_at', { ascending: false })
      .limit(5);
    
    paidPacks?.forEach(pack => {
      console.log(`- ${pack.users?.email}: ${pack.packs?.name} (${pack.packs?.price} FCFA) - ${pack.status} - ${new Date(pack.created_at).toLocaleString()}`);
    });
    
    // 5. Configuration webhook
    console.log('\n🔧 Configuration webhook:');
    console.log('URL webhook attendue:', `${supabaseUrl}/functions/v1/stripe-webhook`);
    console.log('Clé secrète configurée: whsec_qoXcuzvuzbXtUi68XSQAgI5OBPVYrT5t');
    
    // 6. Vérifier les packs disponibles
    console.log('\n📦 Packs disponibles:');
    const { data: allPacks } = await supabase
      .from('packs')
      .select('*')
      .order('price');
    
    allPacks?.forEach(pack => {
      console.log(`- ${pack.name}: ${pack.price} FCFA (ID: ${pack.id})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

debugPackMigration();