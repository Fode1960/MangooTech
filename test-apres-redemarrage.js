// Script de test après redémarrage du serveur
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12) après connexion

console.log('🧪 TEST APRÈS REDÉMARRAGE - Compte Testeur 2025');
console.log('📧 Email: testeur2025@example.com');
console.log('🔑 Mot de passe: Test12345!');
console.log('🏪 Boutique attendue: Boutique Testeur 2025');
console.log('');

// Fonction principale de test
async function testApresRedemarrage() {
    try {
        console.log('🔍 Étape 1: Vérification de l\'état de connexion...');
        
        // Vérifier si on est connecté
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
        
        // Attendre un peu que la page se charge complètement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Vérifier le bouton de navigation
        const navElements = [
            'a[href*="shop"]',
            'button:contains("Boutique")',
            '[href*="shop"]',
            '*:contains("Ma Boutique")',
            'button:contains("Ma Boutique")'
        ];
        
        let navButton = null;
        for (const selector of navElements) {
            try {
                if (selector.includes(':contains')) {
                    // Pour les sélecteurs avec :contains, chercher différemment
                    const buttons = document.querySelectorAll('button, a');
                    for (const btn of buttons) {
                        if (btn.textContent && btn.textContent.includes('Boutique')) {
                            navButton = btn;
                            break;
                        }
                    }
                } else {
                    navButton = document.querySelector(selector);
                }
                if (navButton) break;
            } catch (e) {
                continue;
            }
        }
        
        if (navButton) {
            console.log('✅ Bouton boutique trouvé dans la navigation');
            console.log('   Texte:', navButton.textContent || navButton.innerText || navButton.href);
            
            // Vérifier si c'est "Ma Boutique" ou "Créer ma boutique"
            const buttonText = navButton.textContent || navButton.innerText;
            if (buttonText.includes('Ma Boutique')) {
                console.log('✅ BOUTON CORRECT: "Ma Boutique" trouvé');
            } else if (buttonText.includes('Créer')) {
                console.log('⚠️  BOUTON INCORRECT: "Créer ma boutique" au lieu de "Ma Boutique"');
            }
        } else {
            console.log('⚠️  Bouton boutique non trouvé dans la navigation');
            console.log('📋 Boutons disponibles:');
            const buttons = document.querySelectorAll('button, a');
            buttons.forEach((btn, i) => {
                if (i < 10) { // Limiter à 10 boutons
                    console.log(`   ${i + 1}. "${btn.textContent || btn.innerText}"`);
                }
            });
        }
        
        // 5. Vérifier le localStorage
        console.log('');
        console.log('🔍 Étape 4: Vérification du localStorage...');
        let contaminationFound = false;
        let shopDataFound = false;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('shop')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.name) {
                        shopDataFound = true;
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
        
        if (!shopDataFound) {
            console.log('✅ Aucune donnée shop dans localStorage (normal après redémarrage)');
        } else if (!contaminationFound) {
            console.log('✅ Aucune contamination "Fodé boutique" dans localStorage');
        }
        
        // 6. Conclusion
        console.log('');
        console.log('📋 RÉSUMÉ DU TEST APRÈS REDÉMARRAGE:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Utilisateur:', user.email);
        console.log('Boutiques:', shops.length);
        console.log('Boutique approuvée:', approvedShop ? approvedShop.name : 'Aucune');
        console.log('Contamination localStorage:', contaminationFound ? '❌ OUI' : '✅ NON');
        console.log('Bouton navigation:', navButton ? (navButton.textContent || navButton.innerText) : 'Non trouvé');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (approvedShop && approvedShop.name === 'Boutique Testeur 2025' && !contaminationFound) {
            console.log('🎉 SUCCÈS! Le système fonctionne correctement après redémarrage');
            console.log('✅ Le problème "Fodé boutique" semble être RÉSOLU!');
        } else {
            console.log('⚠️  PROBLÈME DÉTECTÉ - Analyse supplémentaire nécessaire');
        }
        
        // Stocker les données pour référence
        window.testRedemarrageData = {
            user: user,
            shops: shops,
            approvedShop: approvedShop,
            navButton: navButton,
            contaminationFound: contaminationFound
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter le test après un court délai pour permettre le chargement
setTimeout(() => {
    testApresRedemarrage();
}, 3000);