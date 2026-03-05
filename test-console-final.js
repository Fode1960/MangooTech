// Script console pour tester la connexion et vérifier l'affichage
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12) sur http://localhost:3002

console.log('🧪 TEST DE CONNEXION - Compte Testeur 2025');
console.log('📧 Email: testeur2025@example.com');
console.log('🔑 Mot de passe: Test12345!');
console.log('🏪 Boutique attendue: Boutique Testeur 2025');
console.log('');

// Fonction principale de test
async function testComplet() {
    try {
        // 1. Vérifier l'état actuel
        console.log('🔍 Étape 1: Vérification de l\'état actuel...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            console.log('⚠️  Aucun utilisateur connecté');
            console.log('💡 Connectez-vous avec testeur2025@example.com / Test12345!');
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        console.log('📋 User ID:', user.id);
        
        // 2. Vérifier les boutiques dans Supabase
        console.log('');
        console.log('🔍 Étape 2: Vérification des boutiques dans Supabase...');
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);
        
        if (shopsError) {
            console.error('❌ Erreur récupération boutiques:', shopsError.message);
            return;
        }
        
        if (shops.length === 0) {
            console.log('⚠️  Aucune boutique trouvée');
            return;
        }
        
        console.log('✅ Boutiques trouvées:', shops.length);
        shops.forEach((shop, index) => {
            const statusEmoji = shop.status === 'approved' ? '✅' : 
                               shop.status === 'pending' ? '⏳' : '❌';
            console.log(`   ${index + 1}. ${statusEmoji} "${shop.name}" (Status: ${shop.status})`);
        });
        
        // 3. Vérifier la boutique approuvée
        const approvedShop = shops.find(shop => shop.status === 'approved');
        if (approvedShop) {
            console.log('');
            console.log('🎯 BOUTIQUE APPROUVÉE:');
            console.log('   Nom:', approvedShop.name);
            console.log('   ID:', approvedShop.id);
            
            if (approvedShop.name === 'Boutique Testeur 2025') {
                console.log('✅ NOM CORRECT! Pas de "Fodé boutique"');
            } else {
                console.log('❌ NOM INCORRECT! Attendu: "Boutique Testeur 2025"');
                console.log('   Trouvé:', approvedShop.name);
            }
        }
        
        // 4. Vérifier l'interface utilisateur
        console.log('');
        console.log('🔍 Étape 3: Vérification de l\'interface...');
        
        // Vérifier le bouton de navigation
        const navButton = document.querySelector('a[href*="shop"]') || 
                         document.querySelector('button:contains("Boutique")') ||
                         document.querySelector('[href*="shop"]') ||
                         document.querySelector('*:contains("Ma Boutique")');
        
        if (navButton) {
            console.log('✅ Bouton boutique trouvé dans la navigation');
            console.log('   Texte:', navButton.textContent || navButton.innerText || navButton.href);
        } else {
            console.log('⚠️  Bouton boutique non trouvé dans la navigation');
        }
        
        // 5. Vérifier le localStorage
        console.log('');
        console.log('🔍 Étape 4: Vérification du localStorage...');
        let contaminationFound = false;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('shop')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.name) {
                        console.log(`   📦 ${key}: "${data.name}"`);
                        if (data.name.includes('Fodé')) {
                            contaminationFound = true;
                            console.log('   ❌ CONTAMINATION DÉTECTÉE!');
                        }
                    }
                } catch (e) {
                    // Ignorer
                }
            }
        }
        
        if (!contaminationFound) {
            console.log('✅ Aucune contamination "Fodé boutique" dans localStorage');
        }
        
        // 6. Conclusion
        console.log('');
        console.log('📋 RÉSUMÉ DU TEST:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Utilisateur:', user.email);
        console.log('Boutiques:', shops.length);
        console.log('Boutique approuvée:', approvedShop ? approvedShop.name : 'Aucune');
        console.log('Contamination:', contaminationFound ? '❌ OUI' : '✅ NON');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (approvedShop && approvedShop.name === 'Boutique Testeur 2025' && !contaminationFound) {
            console.log('🎉 SUCCÈS! Le système fonctionne correctement');
        } else {
            console.log('⚠️  PROBLÈME DÉTECTÉ - Analyse nécessaire');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter le test
testComplet();