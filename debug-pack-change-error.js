import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPackChange() {
  try {
    console.log('=== Test de changement de pack ===');
    
    // 1. Utiliser un email d'utilisateur connu
    const testEmail = 'mdansoko@mangoo.tech';
    console.log('Utilisateur de test:', testEmail);
    
    // 2. Générer un token d'accès pour cet utilisateur
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });
    
    if (tokenError || !tokenData?.properties?.access_token) {
      console.error('Erreur lors de la génération du token:', tokenError);
      return;
    }
    
    const accessToken = tokenData.properties.access_token;
    console.log('Token généré avec succès');
    
    // 3. Obtenir les packs disponibles
    const { data: packs, error: packsError } = await supabase
      .from('packs')
      .select('id, name, price')
      .order('price', { ascending: true });
    
    if (packsError || !packs || packs.length < 2) {
      console.error('Erreur lors de la récupération des packs:', packsError);
      return;
    }
    
    console.log('Packs disponibles:', packs.map(p => `${p.name} (${p.price} FCFA)`));
    
    // 4. Tester le changement vers le deuxième pack (Pack Visibilité)
    const targetPack = packs.find(p => p.name === 'Pack Visibilité') || packs[1];
    console.log(`\n=== Test changement vers ${targetPack.name} ===`);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packId: targetPack.id
      })
    });
    
    console.log('Status de la réponse:', response.status);
    console.log('Headers de la réponse:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Réponse brute:', responseText);
    
    if (!response.ok) {
      console.error(`\n❌ ERREUR: Edge Function returned status ${response.status}`);
      console.error('Détails de l\'erreur:', responseText);
      
      // Essayer de parser comme JSON pour plus de détails
      try {
        const errorData = JSON.parse(responseText);
        console.error('Erreur parsée:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.error('Impossible de parser la réponse comme JSON');
      }
    } else {
      console.log('✅ Succès!');
      try {
        const successData = JSON.parse(responseText);
        console.log('Données de succès:', JSON.stringify(successData, null, 2));
      } catch (parseError) {
        console.log('Réponse de succès (texte brut):', responseText);
      }
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testPackChange().then(() => {
  console.log('\n=== Test terminé ===');
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});