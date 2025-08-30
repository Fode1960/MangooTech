// Script pour ajouter la mise à jour du selected_pack dans le webhook Stripe

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const WEBHOOK_PATH = 'supabase/functions/stripe-webhook/index.ts';

function fixStripeWebhook() {
  try {
    console.log('🔧 Correction du webhook Stripe pour mettre à jour selected_pack...');
    
    // Lire le fichier webhook actuel
    const webhookContent = readFileSync(WEBHOOK_PATH, 'utf8');
    
    // Vérifier si la correction est déjà appliquée
    if (webhookContent.includes('selected_pack')) {
      console.log('✅ Le webhook contient déjà la mise à jour de selected_pack');
      return;
    }
    
    // Trouver l'endroit où insérer le code
    const insertionPoint = 'console.log(`\\n🎉 SUCCÈS: Pack ${packId} activé pour l\'utilisateur ${userId}`)';
    
    if (!webhookContent.includes(insertionPoint)) {
      console.error('❌ Point d\'insertion non trouvé dans le webhook');
      return;
    }
    
    // Code à insérer avant le message de succès
    const codeToInsert = `
        // Mettre à jour le selected_pack dans la table users
        console.log('\\n=== 🔄 MISE À JOUR SELECTED_PACK ===');
        
        // Récupérer le nom du pack pour créer le slug
        const { data: packInfo, error: packInfoError } = await supabaseClient
          .from('packs')
          .select('name')
          .eq('id', packId)
          .single();
        
        if (packInfoError) {
          console.error('❌ Erreur récupération info pack:', packInfoError);
        } else if (packInfo) {
          // Convertir le nom du pack en slug
          const packSlug = packInfo.name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          console.log('Pack slug généré:', packSlug);
          
          // Mettre à jour le selected_pack de l'utilisateur
          const { error: updateSelectedPackError } = await supabaseClient
            .from('users')
            .update({ selected_pack: packSlug })
            .eq('id', userId);
          
          if (updateSelectedPackError) {
            console.error('❌ Erreur mise à jour selected_pack:', updateSelectedPackError);
          } else {
            console.log('✅ selected_pack mis à jour:', packSlug);
          }
        }
`;
    
    // Insérer le code
    const updatedContent = webhookContent.replace(
      insertionPoint,
      codeToInsert + '\n        ' + insertionPoint
    );
    
    // Écrire le fichier modifié
    writeFileSync(WEBHOOK_PATH, updatedContent, 'utf8');
    
    console.log('✅ Webhook Stripe mis à jour avec succès!');
    console.log('💡 Le webhook mettra maintenant à jour automatiquement le selected_pack');
    
    // Afficher un résumé des changements
    console.log('\n📋 CHANGEMENTS APPORTÉS:');
    console.log('   - Ajout de la récupération des informations du pack');
    console.log('   - Génération automatique du slug du pack');
    console.log('   - Mise à jour du champ selected_pack dans la table users');
    console.log('   - Logs détaillés pour le debugging');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction du webhook:', error.message);
  }
}

// Exécuter la correction
if (process.argv[1] && process.argv[1].endsWith('fix-stripe-webhook-selected-pack.js')) {
  fixStripeWebhook();
}

export { fixStripeWebhook };