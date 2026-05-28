// Test après redémarrage - Vérification complète du système
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12)

console.log('🎉 TEST APRÈS REDÉMARRAGE ET CORRECTION');
console.log('🧪 Vérification que la bonne version ShopDashboard est utilisée');
console.log('');

async function testCompletApresCorrection() {
    try {
        console.log('🔍 1. Vérification de la connexion...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.log('❌ Problème de connexion');
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        console.log('📋 User ID:', user.id);
        console.log('');
        
        console.log('🔍 2. Vérification des boutiques dans Supabase...');
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);
        
        if (shopsError) {
            console.error('❌ Erreur boutiques:', shopsError.message);
            return;
        }
        
        console.log('✅ Boutiques trouvées:', shops.length);
        shops.forEach((shop, index) => {
            const emoji = shop.status === 'approved' ? '✅' : 
                         shop.status === 'pending' ? '⏳' : '❌';
            console.log(`   ${index + 1}. ${emoji} "${shop.name}" (${shop.status})`);
        });
        
        const approvedShop = shops.find(shop => shop.status === 'approved');
        if (approvedShop) {
            console.log('');
            console.log('🎯 BOUTIQUE APPROUVÉE:', approvedShop.name);
            console.log('📊 Statut:', approvedShop.status);
            console.log('🔗 Slug:', approvedShop.slug);
            
            if (approvedShop.name === 'Boutique Testeur 2025') {
                console.log('🎉 NOM CORRECT! Pas de contamination "Fodé boutique"');
            } else {
                console.log('❌ NOM INCORRECT! Attendu: "Boutique Testeur 2025"');
                console.log('   Trouvé:', approvedShop.name);
            }
        }
        
        console.log('');
        console.log('🔍 3. Vérification du routing actuel...');
        console.log('URL actuelle:', window.location.href);
        console.log('Path:', window.location.pathname);
        
        // Vérifier si on est sur la bonne page
        if (window.location.pathname.includes('/seller/dashboard')) {
            console.log('✅ Sur la page /seller/dashboard');
            
            // Vérifier le contenu de la page
            const pageContent = document.body.textContent || document.body.innerText;
            console.log('');
            console.log('🔍 4. Analyse du contenu de la page...');
            
            if (approvedShop) {
                if (pageContent.includes(approvedShop.name)) {
                    console.log('🎉 SUCCÈS! La boutique approuvée est affichée:', approvedShop.name);
                } else if (pageContent.includes('Fodé boutique')) {
                    console.log('❌ ÉCHEC! "Fodé boutique" est encore affiché');
                    console.log('⚠️  Le changement de route n\'a pas fonctionné');
                } else {
                    console.log('⚠️  Ni "Fodé boutique" ni la boutique approuvée trouvée');
                    console.log('🔍 Contenu trouvé (aperçu):', pageContent.slice(0, 300) + '...');
                }
            }
            
            // Vérifier la contamination
            if (pageContent.includes('Fodé boutique')) {
                console.log('❌ CONTAMINATION DÉTECTÉE: "Fodé boutique" trouvé dans la page');
            } else {
                console.log('✅ AUCUNE CONTAMINATION: "Fodé boutique" non trouvé');
            }
            
        } else {
            console.log('ℹ️  Pas sur /seller/dashboard - navigation nécessaire');
            console.log('🧭 Naviguez vers /seller/dashboard pour tester');
        }
        
        console.log('');
        console.log('🔍 5. Vérification du bouton de navigation...');
        const buttons = document.querySelectorAll('button, a');
        const boutiqueBtn = Array.from(buttons).find(btn => 
            btn.textContent?.includes('Ma Boutique') || btn.textContent?.includes('Créer ma boutique')
        );
        
        if (boutiqueBtn) {
            console.log('✅ Bouton boutique trouvé:', boutiqueBtn.textContent);
            if (boutiqueBtn.textContent.includes('Ma Boutique')) {
                console.log('🎉 Le bouton affiche bien "Ma Boutique"');
            } else if (boutiqueBtn.textContent.includes('Créer')) {
                console.log('⚠️  Le bouton affiche "Créer ma boutique"');
            }
        } else {
            console.log('❌ Bouton boutique non trouvé');
        }
        
        console.log('');
        console.log('🔍 6. Vérification du localStorage...');
        let contaminationLocalStorage = false;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('shop')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.name && data.name.includes('Fodé')) {
                        contaminationLocalStorage = true;
                        console.log('❌ CONTAMINATION localStorage:', key, '->', data.name);
                    }
                } catch (e) {
                    // Ignorer
                }
            }
        }
        
        if (!contaminationLocalStorage) {
            console.log('✅ AUCUNE CONTAMINATION dans localStorage');
        }
        
        // Nettoyer le localStorage global contaminé
        console.log('');
        console.log('🧹 Nettoyage du localStorage global...');
        const globalKey = 'mangoo-offline-shop';
        const globalData = localStorage.getItem(globalKey);
        if (globalData) {
            try {
                const parsed = JSON.parse(globalData);
                console.log('Données globales trouvées:', parsed.name || 'sans nom');
                if (parsed.name && parsed.name.includes('Fodé')) {
                    console.log('🗑️  Suppression des données globales "Fodé boutique"');
                    localStorage.removeItem(globalKey);
                    console.log('✅ Données globales supprimées');
                }
            } catch (e) {
                console.log('❌ Erreur lors de la lecture des données globales');
            }
        } else {
            console.log('✅ Aucune donnée globale trouvée');
        }
        
        // RÉSUMÉ FINAL
        console.log('');
        console.log('📋 RÉSUMÉ FINAL:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Utilisateur:', user.email);
        console.log('Boutique approuvée:', approvedShop ? approvedShop.name : 'Aucune');
        console.log('Page actuelle:', window.location.pathname);
        console.log('Bouton navigation:', boutiqueBtn ? boutiqueBtn.textContent : 'Non trouvé');
        console.log('Contamination page:', pageContent.includes('Fodé boutique') ? '❌ OUI' : '✅ NON');
        console.log('Contamination localStorage:', contaminationLocalStorage ? '❌ OUI' : '✅ NON');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // CONCLUSION
        const success = approvedShop && 
                       approvedShop.name === 'Boutique Testeur 2025' && 
                       !pageContent.includes('Fodé boutique') && 
                       !contaminationLocalStorage &&
                       boutiqueBtn && 
                       boutiqueBtn.textContent.includes('Ma Boutique');
        
        if (success) {
            console.log('');
            console.log('🎉🎉🎉 SUCCÈS TOTAL! 🎉🎉🎉');
            console.log('✅ Le problème "Fodé boutique" est RÉSOLU!');
            console.log('✅ Le système fonctionne parfaitement');
            console.log('✅ Chaque utilisateur voit sa propre boutique');
            console.log('✅ La correction de route a fonctionné!');
        } else {
            console.log('');
            console.log('⚠️  PROBLÈMES DÉTECTÉS - Analyse nécessaire');
            if (!approvedShop) console.log('   - Aucune boutique approuvée trouvée');
            if (approvedShop && approvedShop.name !== 'Boutique Testeur 2025') console.log('   - Nom incorrect:', approvedShop.name);
            if (pageContent.includes('Fodé boutique')) console.log('   - Contamination persistante');
            if (!boutiqueBtn || !boutiqueBtn.textContent.includes('Ma Boutique')) console.log('   - Bouton incorrect');
        }
        
        // Stocker les résultats pour analyse
        window.testFinalResults = {
            user: user,
            shops: shops,
            approvedShop: approvedShop,
            boutiqueButton: boutiqueBtn,
            contaminationPage: pageContent.includes('Fodé boutique'),
            contaminationLocalStorage: contaminationLocalStorage,
            success: success,
            route: window.location.pathname
        };
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

// Exécuter le test
setTimeout(testCompletApresCorrection, 2000);