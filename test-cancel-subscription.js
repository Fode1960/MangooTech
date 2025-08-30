import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCancelSubscription() {
  try {
    console.log('🧪 Test de la fonction cancel-subscription...');
    
    // 0. Vérifier l'authentification
    console.log('\n0. Vérification de l\'authentification...');
    const { data: userInfo, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userInfo.user) {
      console.error('❌ Utilisateur non authentifié:', authError?.message);
      console.log('ℹ️ Veuillez vous connecter d\'abord sur l\'application');
      return;
    }
    
    console.log('✅ Utilisateur authentifié:', userInfo.user.email);
    
    // 1. Vérifier si le pack gratuit existe
    console.log('\n1. Vérification du pack gratuit...');
    const { data: freePack, error: freePackError } = await supabase
      .from('packs')
      .select('*')
      .eq('price', 0)
      .single();
    
    if (freePackError) {
      console.error('❌ Erreur pack gratuit:', freePackError.message);
      return;
    }
    
    console.log('✅ Pack gratuit trouvé:', {
      id: freePack.id,
      name: freePack.name,
      price: freePack.price
    });
    
    // 1.5. Vérifier les packs actuels de l'utilisateur
    console.log('\n1.5. Vérification des packs actuels...');
    const { data: currentPacks, error: currentPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price
        )
      `)
      .eq('user_id', userInfo.user.id)
      .eq('status', 'active');
    
    if (currentPacksError) {
      console.error('❌ Erreur packs actuels:', currentPacksError.message);
      return;
    }
    
    if (!currentPacks || currentPacks.length === 0) {
      console.log('⚠️ Aucun pack actif trouvé pour cet utilisateur');
      console.log('ℹ️ Impossible de tester l\'annulation sans pack actif');
      return;
    }
    
    console.log('📦 Packs actuels:', currentPacks.map(p => ({
      name: p.packs?.name,
      price: p.packs?.price,
      status: p.status
    })));
    
    // 2. Tester l'appel de la fonction cancel-subscription
    console.log('\n2. Test de la fonction cancel-subscription...');
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        cancelImmediately: true,
        feedback: 'Test de migration vers pack gratuit'
      }
    });
    
    if (error) {
      console.error('❌ Erreur fonction:', error);
      console.log('ℹ️ Détails de l\'erreur:', error.context);
      return;
    }
    
    console.log('✅ Réponse de la fonction:', data);
    
    // 3. Vérifier si l'utilisateur a bien été migré vers le pack gratuit
    console.log('\n3. Vérification de la migration...');
    
    const { data: userPacksAfter, error: packsAfterError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          price
        )
      `)
      .eq('user_id', userInfo.user.id)
      .eq('status', 'active');
    
    if (packsAfterError) {
      console.error('❌ Erreur vérification packs:', packsAfterError.message);
    } else {
      console.log('📦 Packs actifs après annulation:', userPacksAfter);
      
      const hasFreePack = userPacksAfter?.some(up => up.packs?.price === 0);
      if (hasFreePack) {
        console.log('✅ Migration vers pack gratuit réussie!');
      } else {
        console.log('❌ Migration vers pack gratuit échouée!');
        console.log('ℹ️ Vérifiez les logs de la fonction pour plus de détails');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
  }
}

// Exécuter le test
testCancelSubscription();