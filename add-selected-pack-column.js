import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSelectedPackColumn() {
  try {
    console.log('=== AJOUT DE LA COLONNE SELECTED_PACK ===');
    
    // Exécuter la requête SQL pour ajouter la colonne
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.users 
        ADD COLUMN IF NOT EXISTS selected_pack VARCHAR(50) DEFAULT 'free';
      `
    });
    
    if (error) {
      console.error('Erreur lors de l\'ajout de la colonne:', error);
    } else {
      console.log('Colonne selected_pack ajoutée avec succès');
    }
    
    // Vérifier la structure de la table
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'users')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('Erreur lors de la vérification de la table:', tableError);
    } else {
      console.log('Structure de la table users:', tableInfo);
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

addSelectedPackColumn();