// TEST DE L'APPLICATION EN TEMPS RÉEL
// Script à exécuter dans la console du navigateur sur http://localhost:3001/

console.log('🚀 DÉBUT DES TESTS DE L\'APPLICATION PACK');
console.log('=' .repeat(50));

// Fonction utilitaire pour attendre
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Vérifier l'état actuel de l'utilisateur
async function testEtatActuelUtilisateur() {
    console.log('📋 Test 1: Vérification de l\'état actuel de l\'utilisateur');
    
    try {
        // Vérifier si l'utilisateur est connecté
        const user = await supabase.auth.getUser();
        if (user.data.user) {
            console.log('✅ Utilisateur connecté:', user.data.user.email);
            
            // Récupérer les données utilisateur
            const { data: userData, error } = await supabase
                .from('users')
                .select('id, email, selected_pack, updated_at')
                .eq('id', user.data.user.id)
                .single();
            
            if (error) {
                console.error('❌ Erreur récupération données:', error.message);
                return false;
            }
            
            console.log('📊 Données utilisateur actuelles:');
            console.log('   - Email:', userData.email);
            console.log('   - Pack actuel:', userData.selected_pack);
            console.log('   - Dernière mise à jour:', userData.updated_at);
            
            return userData;
        } else {
            console.log('❌ Aucun utilisateur connecté');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur test état utilisateur:', error.message);
        return false;
    }
}

// Test 2: Simuler un changement de pack
async function testChangementPack(nouveauPack = 'premium') {
    console.log(`📋 Test 2: Simulation changement de pack vers ${nouveauPack}`);
    
    try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {
            console.log('❌ Utilisateur non connecté');
            return false;
        }
        
        // Tentative de mise à jour directe
        const { data: updateResult, error: updateError } = await supabase
            .from('users')
            .update({ 
                selected_pack: nouveauPack,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.data.user.id)
            .select('id, email, selected_pack, updated_at');
        
        if (updateError) {
            console.log('❌ Mise à jour directe échouée:', updateError.message);
            
            // Essayer avec la fonction RPC si elle existe
            console.log('🔄 Tentative avec fonction RPC...');
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('update_user_pack', {
                    target_user_id: user.data.user.id,
                    new_pack_type: nouveauPack
                });
            
            if (rpcError) {
                console.log('❌ Fonction RPC échouée:', rpcError.message);
                return false;
            } else {
                console.log('✅ Mise à jour réussie via RPC');
                return true;
            }
        } else {
            console.log('✅ Mise à jour directe réussie:');
            console.log('   - Nouveau pack:', updateResult[0].selected_pack);
            console.log('   - Mise à jour:', updateResult[0].updated_at);
            return updateResult[0];
        }
    } catch (error) {
        console.error('❌ Erreur test changement pack:', error.message);
        return false;
    }
}

// Test 3: Vérifier l'affichage dans l'interface
function testAffichageInterface() {
    console.log('📋 Test 3: Vérification de l\'affichage dans l\'interface');
    
    // Chercher les éléments qui affichent le pack
    const packElements = [
        document.querySelector('[data-pack]'),
        document.querySelector('.pack-display'),
        document.querySelector('#current-pack'),
        ...document.querySelectorAll('*')
    ].filter(el => el && (el.textContent.includes('découverte') || 
                         el.textContent.includes('premium') || 
                         el.textContent.includes('pro')));
    
    if (packElements.length > 0) {
        console.log('✅ Éléments d\'affichage de pack trouvés:');
        packElements.forEach((el, index) => {
            console.log(`   ${index + 1}. ${el.tagName}: "${el.textContent.trim()}"`);
        });
        return true;
    } else {
        console.log('⚠️  Aucun élément d\'affichage de pack trouvé dans l\'interface');
        return false;
    }
}

// Test 4: Vérifier les mises à jour en temps réel
async function testMiseAJourTempsReel() {
    console.log('📋 Test 4: Test des mises à jour en temps réel');
    
    try {
        const user = await supabase.auth.getUser();
        if (!user.data.user) {return false;}
        
        // S'abonner aux changements
        const subscription = supabase
            .channel('user-changes')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${user.data.user.id}`
            }, (payload) => {
                console.log('🔄 Mise à jour détectée en temps réel:');
                console.log('   - Nouveau pack:', payload.new.selected_pack);
                console.log('   - Ancienne valeur:', payload.old.selected_pack);
            })
            .subscribe();
        
        console.log('✅ Abonnement aux mises à jour en temps réel activé');
        
        // Nettoyer après 30 secondes
        setTimeout(() => {
            subscription.unsubscribe();
            console.log('🔄 Abonnement temps réel désactivé');
        }, 30000);
        
        return true;
    } catch (error) {
        console.error('❌ Erreur test temps réel:', error.message);
        return false;
    }
}

// Fonction principale de test
async function executerTousLesTests() {
    console.log('🚀 EXÉCUTION DE TOUS LES TESTS');
    console.log('=' .repeat(40));
    
    const resultats = {
        etatUtilisateur: false,
        changementPack: false,
        affichageInterface: false,
        tempsReel: false
    };
    
    // Test 1
    resultats.etatUtilisateur = await testEtatActuelUtilisateur();
    await wait(1000);
    
    // Test 2
    if (resultats.etatUtilisateur) {
        resultats.changementPack = await testChangementPack('premium');
        await wait(2000);
    }
    
    // Test 3
    resultats.affichageInterface = testAffichageInterface();
    await wait(1000);
    
    // Test 4
    resultats.tempsReel = await testMiseAJourTempsReel();
    
    // Rapport final
    console.log('\n' + '=' .repeat(40));
    console.log('📊 RAPPORT FINAL DES TESTS');
    console.log('=' .repeat(40));
    
    const testsReussis = Object.values(resultats).filter(Boolean).length;
    const testsTotaux = Object.keys(resultats).length;
    
    console.log(`Tests réussis: ${testsReussis}/${testsTotaux}`);
    
    Object.entries(resultats).forEach(([test, resultat]) => {
        const status = resultat ? '✅' : '❌';
        console.log(`${status} ${test}: ${resultat ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
    });
    
    if (testsReussis === testsTotaux) {
        console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS!');
        console.log('La solution pack fonctionne correctement.');
    } else if (testsReussis >= 2) {
        console.log('\n⚠️  Tests partiellement réussis');
        console.log('La solution fonctionne mais nécessite des ajustements.');
    } else {
        console.log('\n❌ La plupart des tests ont échoué');
        console.log('Vérifiez les corrections SQL et la configuration.');
    }
    
    return resultats;
}

// Instructions d'utilisation
console.log('\n📋 INSTRUCTIONS D\'UTILISATION:');
console.log('1. Ouvrez http://localhost:3001/ dans votre navigateur');
console.log('2. Ouvrez la console développeur (F12)');
console.log('3. Copiez et collez ce script dans la console');
console.log('4. Exécutez: executerTousLesTests()');
console.log('5. Observez les résultats des tests');
console.log('\nTests individuels disponibles:');
console.log('- testEtatActuelUtilisateur()');
console.log('- testChangementPack("premium")');
console.log('- testAffichageInterface()');
console.log('- testMiseAJourTempsReel()');

// Auto-exécution si demandée
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('\n🔄 Auto-exécution des tests dans 3 secondes...');
    console.log('Tapez "stop" dans la console pour annuler');
    
    const autoTest = setTimeout(() => {
        executerTousLesTests();
    }, 3000);
    
    // Permettre l'annulation
    window.stop = () => {
        clearTimeout(autoTest);
        console.log('❌ Auto-exécution annulée');
    };
}