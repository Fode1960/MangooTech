import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserPack() {
  try {
    console.log('=== DEBUG USER PACK ===');
    
    // 1. Vérifier tous les packs disponibles
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true);
    
    if (packsError) {
      console.error('Erreur lors de la récupération des packs:', packsError);
    } else {
      console.log('Packs disponibles:', packs);
    }
    
    // 2. Vérifier tous les user_packs
    const { data: userPacks, error: userPacksError } = await supabase
      .from('user_packs')
      .select(`
        *,
        packs(
          id,
          name,
          description,
          price,
          currency,
          billing_period
        )
      `);
    
    if (userPacksError) {
      console.error('Erreur lors de la récupération des user_packs:', userPacksError);
    } else {
      console.log('User packs trouvés:', userPacks);
    }
    
    // 3. Vérifier les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at');
    
    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      console.log('Code d\'erreur:', usersError.code);
      console.log('Message d\'erreur:', usersError.message);
    } else {
      console.log('Utilisateurs trouvés:', users);
    }
    
    // 3.1 Vérifier les utilisateurs auth de Supabase
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('Impossible de récupérer les utilisateurs auth (normal avec clé anon):', authError.message);
    } else {
      console.log('Utilisateurs auth trouvés:', authUsers);
    }
    
    // 4. Pour chaque utilisateur, vérifier son pack actif
    if (users && users.length > 0) {
      for (const user of users) {
        console.log(`\n--- Vérification pour l'utilisateur ${user.email} (${user.id}) ---`);
        
        const { data: activePack, error: activePackError } = await supabase
          .from('user_packs')
          .select(`
            *,
            packs(
              id,
              name,
              description,
              price,
              currency,
              billing_period
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (activePackError) {
          if (activePackError.code === 'PGRST116') {
            console.log('Aucun pack actif trouvé pour cet utilisateur');
          } else {
            console.error('Erreur:', activePackError);
          }
        } else {
          console.log('Pack actif trouvé:', activePack);
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

debugUserPack();