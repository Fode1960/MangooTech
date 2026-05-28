// Script rapide pour vérifier l'état du serveur après redémarrage
// 📋 À COPIER DANS LA CONSOLE DU NAVIGATEUR (F12)

console.log('🔄 VÉRIFICATION APRÈS REDÉMARRAGE');
console.log('');

// Vérifier que le serveur est accessible
async function verifierServeur() {
    try {
        // Test 1: Vérifier Supabase
        console.log('🔍 Test 1: Vérification de Supabase...');
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase non défini');
            return;
        }
        console.log('✅ Supabase est défini');
        
        // Test 2: Vérifier la connexion
        console.log('');
        console.log('🔍 Test 2: Vérification de la connexion...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('❌ Erreur connexion:', error.message);
            return;
        }
        
        if (!user) {
            console.log('⚠️  Aucun utilisateur connecté');
            console.log('💡 Connectez-vous avec testeur2025@example.com / Test12345!');
            return;
        }
        
        console.log('✅ Utilisateur connecté:', user.email);
        
        // Test 3: Vérifier les boutiques
        console.log('');
        console.log('🔍 Test 3: Vérification des boutiques...');
        const { data: shops, error: shopsError } = await supabase
            .from('shops')
            .select('*')
            .eq('user_id', user.id);
        
        if (shopsError) {
            console.error('❌ Erreur boutiques:', shopsError.message);
            return;
        }
        
        console.log('✅ Boutiques récupérées:', shops.length);
        
        if (shops.length > 0) {
            shops.forEach((shop, index) => {
                console.log(`   ${index + 1}. "${shop.name}" (${shop.status})`);
            });
            
            const approved = shops.find(s => s.status === 'approved');
            if (approved) {
                console.log('🎯 Boutique approuvée:', approved.name);
                
                if (approved.name === 'Boutique Testeur 2025') {
                    console.log('🎉 SUCCÈS! Le système fonctionne après redémarrage');
                    console.log('✅ Le problème "Fodé boutique" semble résolu!');
                } else {
                    console.log('⚠️  Nom de boutique inattendu:', approved.name);
                }
            }
        }
        
        // Test 4: Vérifier l'interface
        console.log('');
        console.log('🔍 Test 4: Vérification de l\'interface...');
        
        // Chercher le bouton de navigation
        const buttons = document.querySelectorAll('button, a');
        let boutiqueButton = null;
        
        for (const btn of buttons) {
            const text = btn.textContent || btn.innerText;
            if (text && text.includes('Boutique')) {
                boutiqueButton = btn;
                break;
            }
        }
        
        if (boutiqueButton) {
            console.log('✅ Bouton boutique trouvé:', boutiqueButton.textContent || boutiqueButton.innerText);
        } else {
            console.log('⚠️  Bouton boutique non trouvé');
        }
        
        console.log('');
        console.log('📋 RÉSUMÉ:');
        console.log('━━━━━━━━━━━━━━━━━━━');
        console.log('Serveur:', '✅ OK');
        console.log('Supabase:', '✅ OK');
        console.log('Utilisateur:', user.email);
        console.log('Boutiques:', shops.length);
        console.log('Interface:', boutiqueButton ? '✅ OK' : '⚠️ À vérifier');
        console.log('━━━━━━━━━━━━━━━━━━━');
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

// Exécuter la vérification
verifierServeur();