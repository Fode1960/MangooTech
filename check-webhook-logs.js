/**
 * Script pour vérifier automatiquement les logs du webhook Stripe dans Supabase
 * 
 * Ce script aide à :
 * 1. Vérifier les logs récents du webhook
 * 2. Analyser les erreurs potentielles
 * 3. Confirmer le bon fonctionnement de la correction
 */

console.log('📋 === VÉRIFICATION DES LOGS WEBHOOK SUPABASE ===\n');

// Configuration pour les logs
const WEBHOOK_LOG_CONFIG = {
  FUNCTION_NAME: 'stripe-webhook',
  EXPECTED_LOG_PATTERNS: [
    '✅ selected_pack mis à jour avec slug',
    'Pack name:',
    'Generated slug:',
    'Webhook traité avec succès'
  ],
  ERROR_PATTERNS: [
    'Erreur lors de la mise à jour',
    'Failed to update',
    'Error in webhook',
    'Database error'
  ]
};

// Fonction principale pour vérifier les logs
function checkWebhookLogs() {
  console.log('🔍 Vérification des logs du webhook Stripe...');
  console.log('');
  
  console.log('📍 ÉTAPES POUR VÉRIFIER LES LOGS DANS SUPABASE:');
  console.log('');
  
  console.log('1️⃣ Accès à la console Supabase:');
  console.log('   • Allez sur https://supabase.com/dashboard');
  console.log('   • Sélectionnez votre projet');
  console.log('');
  
  console.log('2️⃣ Navigation vers les Edge Functions:');
  console.log('   • Cliquez sur "Edge Functions" dans le menu latéral');
  console.log('   • Sélectionnez la fonction "stripe-webhook"');
  console.log('');
  
  console.log('3️⃣ Consultation des logs:');
  console.log('   • Cliquez sur l\'onglet "Logs"');
  console.log('   • Vérifiez les logs des dernières minutes/heures');
  console.log('');
  
  console.log('4️⃣ Logs à rechercher (SUCCÈS):');
  WEBHOOK_LOG_CONFIG.EXPECTED_LOG_PATTERNS.forEach((pattern, index) => {
    console.log(`   ✅ ${index + 1}. "${pattern}"`);
  });
  console.log('');
  
  console.log('5️⃣ Logs d\'erreur à surveiller:');
  WEBHOOK_LOG_CONFIG.ERROR_PATTERNS.forEach((pattern, index) => {
    console.log(`   ❌ ${index + 1}. "${pattern}"`);
  });
  console.log('');
  
  console.log('6️⃣ Exemple de log de succès attendu:');
  console.log('   📝 "Pack name: Pack Découverte"');
  console.log('   📝 "Generated slug: pack-decouverte"');
  console.log('   📝 "✅ selected_pack mis à jour avec slug: pack-decouverte"');
  console.log('');
}

// Fonction pour analyser un log spécifique
function analyzeLogEntry(logText) {
  console.log('🔍 === ANALYSE D\'UN LOG SPÉCIFIQUE ===');
  console.log('');
  
  const analysis = {
    hasSuccess: false,
    hasError: false,
    packName: null,
    generatedSlug: null,
    issues: []
  };
  
  // Vérifier les patterns de succès
  WEBHOOK_LOG_CONFIG.EXPECTED_LOG_PATTERNS.forEach(pattern => {
    if (logText.includes(pattern)) {
      analysis.hasSuccess = true;
      console.log(`✅ Trouvé: "${pattern}"`);
    }
  });
  
  // Vérifier les patterns d'erreur
  WEBHOOK_LOG_CONFIG.ERROR_PATTERNS.forEach(pattern => {
    if (logText.includes(pattern)) {
      analysis.hasError = true;
      console.log(`❌ Erreur détectée: "${pattern}"`);
    }
  });
  
  // Extraire le nom du pack
  const packNameMatch = logText.match(/Pack name:\s*(.+)/i);
  if (packNameMatch) {
    analysis.packName = packNameMatch[1].trim();
    console.log(`📦 Pack détecté: "${analysis.packName}"`);
  }
  
  // Extraire le slug généré
  const slugMatch = logText.match(/Generated slug:\s*(.+)/i);
  if (slugMatch) {
    analysis.generatedSlug = slugMatch[1].trim();
    console.log(`🔗 Slug généré: "${analysis.generatedSlug}"`);
  }
  
  // Vérifier la cohérence slug/pack name
  if (analysis.packName && analysis.generatedSlug) {
    const expectedSlug = analysis.packName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (expectedSlug === analysis.generatedSlug) {
      console.log('✅ Slug cohérent avec le nom du pack');
    } else {
      console.log(`❌ Incohérence slug: attendu "${expectedSlug}", reçu "${analysis.generatedSlug}"`);
      analysis.issues.push('Slug incohérent');
    }
  }
  
  console.log('');
  console.log('📊 RÉSUMÉ DE L\'ANALYSE:');
  console.log(`   Succès détecté: ${analysis.hasSuccess ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Erreur détectée: ${analysis.hasError ? '❌ OUI' : '✅ NON'}`);
  console.log(`   Pack identifié: ${analysis.packName || 'Non trouvé'}`);
  console.log(`   Slug généré: ${analysis.generatedSlug || 'Non trouvé'}`);
  
  if (analysis.issues.length > 0) {
    console.log('⚠️  Problèmes détectés:');
    analysis.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return analysis;
}

// Fonction pour tester la génération de slug
function testSlugGeneration(packName) {
  console.log('🧪 === TEST DE GÉNÉRATION DE SLUG ===');
  console.log('');
  
  if (!packName) {
    console.log('❌ Nom de pack requis pour le test');
    return;
  }
  
  console.log(`📦 Pack à tester: "${packName}"`);
  
  const slug = packName.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  console.log(`🔗 Slug généré: "${slug}"`);
  console.log('');
  
  // Tester avec des exemples courants
  const testCases = [
    'Pack Découverte',
    'Pack Essentiel',
    'Pack Professionnel',
    'Pack Premium+',
    'Pack Starter (Basic)'
  ];
  
  console.log('📋 Tests avec exemples courants:');
  testCases.forEach(testPack => {
    const testSlug = testPack.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    console.log(`   "${testPack}" → "${testSlug}"`);
  });
  
  return slug;
}

// Fonction pour créer un checklist de vérification
function createVerificationChecklist() {
  console.log('📋 === CHECKLIST DE VÉRIFICATION WEBHOOK ===');
  console.log('');
  
  const checklist = [
    {
      item: 'Webhook reçu et traité',
      description: 'Vérifier qu\'il y a des logs récents dans stripe-webhook',
      status: '⏳ À vérifier'
    },
    {
      item: 'Pack name extrait correctement',
      description: 'Log contient "Pack name: [nom du pack]"',
      status: '⏳ À vérifier'
    },
    {
      item: 'Slug généré correctement',
      description: 'Log contient "Generated slug: [slug]"',
      status: '⏳ À vérifier'
    },
    {
      item: 'Base de données mise à jour',
      description: 'Log contient "✅ selected_pack mis à jour avec slug"',
      status: '⏳ À vérifier'
    },
    {
      item: 'Aucune erreur détectée',
      description: 'Pas de logs d\'erreur dans la même période',
      status: '⏳ À vérifier'
    }
  ];
  
  checklist.forEach((check, index) => {
    console.log(`${index + 1}. ${check.status} ${check.item}`);
    console.log(`   📝 ${check.description}`);
    console.log('');
  });
  
  console.log('💡 CONSEILS:');
  console.log('• Copiez un log complet et utilisez analyzeLogEntry(logText)');
  console.log('• Testez la génération de slug avec testSlugGeneration(packName)');
  console.log('• Vérifiez les logs dans les 5-10 minutes après un changement de pack');
  console.log('');
}

// Exporter les fonctions
window.checkWebhookLogs = checkWebhookLogs;
window.analyzeLogEntry = analyzeLogEntry;
window.testSlugGeneration = testSlugGeneration;
window.createVerificationChecklist = createVerificationChecklist;

// Afficher les instructions au chargement
checkWebhookLogs();
createVerificationChecklist();

console.log('🚀 FONCTIONS DISPONIBLES:');
console.log('• checkWebhookLogs() - Affiche les instructions de vérification');
console.log('• analyzeLogEntry(logText) - Analyse un log spécifique');
console.log('• testSlugGeneration(packName) - Teste la génération de slug');
console.log('• createVerificationChecklist() - Affiche la checklist de vérification');
console.log('');