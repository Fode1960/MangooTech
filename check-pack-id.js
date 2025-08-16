import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackId() {
  try {
    console.log('Vérification de l\'ID du Pack Découverte...');
    
    // Récupérer le pack "Pack Découverte"
    const { data: pack, error } = await supabase
      .from('packs')
      .select('id, name, description, price')
      .eq('name', 'Pack Découverte')
      .single();
    
    if (error) {
      console.error('Erreur lors de la récupération du pack:', error);
      return;
    }
    
    if (pack) {
      console.log('Pack trouvé:');
      console.log('ID:', pack.id);
      console.log('Nom:', pack.name);
      console.log('Description:', pack.description);
      console.log('Prix:', pack.price);
      
      // Vérifier si l'ID correspond à celui utilisé dans le code
      const expectedId = '0a85e74a-4aec-480a-8af1-7b57391a80d2';
      if (pack.id === expectedId) {
        console.log('✅ L\'ID correspond à celui utilisé dans le code');
      } else {
        console.log('❌ L\'ID ne correspond PAS à celui utilisé dans le code');
        console.log('ID attendu:', expectedId);
        console.log('ID réel:', pack.id);
      }
    } else {
      console.log('❌ Aucun pack "Pack Découverte" trouvé');
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkPackId();