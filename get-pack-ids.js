// Script pour récupérer les IDs des packs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getPackIds() {
  try {
    console.log('=== IDS DES PACKS ===\n');
    
    const { data: packs, error } = await supabase
      .from('packs')
      .select('id, name, price')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }
    
    console.log('Packs disponibles:');
    packs.forEach(pack => {
      console.log(`- ${pack.name}: ${pack.id} (${pack.price} FCFA)`);
    });
    
    // Trouver spécifiquement le Pack Découverte
    const packDecouverte = packs.find(p => p.name === 'Pack Découverte');
    if (packDecouverte) {
      console.log(`\n✅ Pack Découverte ID: ${packDecouverte.id}`);
    } else {
      console.log('\n❌ Pack Découverte non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

getPackIds();