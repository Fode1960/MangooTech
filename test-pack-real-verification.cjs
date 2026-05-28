require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// Configuration Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Configuration Supabase:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NON DÉFINIE'}`);
console.log(`   Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NON DÉFINIE'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!');
  console.log('   Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Test de Vérification Réelle du Pack Découverte');
console.log('=' .repeat(60));

async function testPackPersistence() {
    try {
        console.log('\n1. Vérification de la connexion Supabase...');
        
        // Test de connexion
        const { data: testData, error: testError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.log('❌ Erreur de connexion Supabase:', testError.message);
            return;
        }
        
        console.log('✅ Connexion Supabase OK');
        
        console.log('\n2. Recherche d\'utilisateurs avec pack découverte...');
        
        // Chercher les utilisateurs avec pack découverte
        const { data: usersWithDiscovery, error: usersError } = await supabase
            .from('users')
            .select('*')
            .eq('selected_pack', 'découverte')
            .limit(10);
            
        if (usersError) {
            console.log('❌ Erreur lors de la recherche:', usersError.message);
            return;
        }
        
        console.log(`📊 Trouvé ${usersWithDiscovery?.length || 0} utilisateur(s) avec pack découverte`);
        
        if (usersWithDiscovery && usersWithDiscovery.length > 0) {
            console.log('\n⚠️  PROBLÈME CONFIRMÉ: Des utilisateurs ont encore le pack découverte!');
            
            usersWithDiscovery.forEach((user, index) => {
                console.log(`\nUtilisateur ${index + 1}:`);
                console.log(`  - ID: ${user.id}`);
                console.log(`  - Email: ${user.email || 'N/A'}`);
                console.log(`  - Pack: ${user.selected_pack}`);
                console.log(`  - Créé: ${user.created_at}`);
                console.log(`  - Mis à jour: ${user.updated_at}`);
            });
            
            console.log('\n3. Application de la correction automatique...');
            await applyPackCorrection(usersWithDiscovery);
            
        } else {
            console.log('\n✅ Aucun utilisateur avec pack découverte trouvé');
            console.log('Le problème semble résolu!');
        }
        
        console.log('\n4. Vérification des packs disponibles...');
        await checkAvailablePacks();
        
        console.log('\n5. Vérification finale...');
        await finalVerification();
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        console.error('Stack:', error.stack);
    }
}

async function applyPackCorrection(users) {
    console.log('\n🔧 Application de la correction pour les utilisateurs affectés...');
    
    for (const user of users) {
        try {
            console.log(`\nCorrection pour utilisateur ${user.id}...`);
            
            // Mettre à jour le pack vers "premium" par défaut
            const { data: updateData, error: updateError } = await supabase
                .from('users')
                .update({ 
                    selected_pack: 'premium',
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .select();
                
            if (updateError) {
                console.log(`❌ Erreur lors de la mise à jour de ${user.id}:`, updateError.message);
            } else {
                console.log(`✅ Pack mis à jour pour ${user.id}: découverte → premium`);
            }
            
        } catch (error) {
            console.log(`❌ Erreur lors de la correction de ${user.id}:`, error.message);
        }
    }
}

async function checkAvailablePacks() {
    try {
        // Vérifier tous les packs uniques dans la base
        const { data: packsData, error: packsError } = await supabase
            .from('users')
            .select('selected_pack')
            .not('selected_pack', 'is', null);
            
        if (packsError) {
            console.log('❌ Erreur lors de la vérification des packs:', packsError.message);
            return;
        }
        
        const uniquePacks = [...new Set(packsData?.map(u => u.selected_pack) || [])];
        console.log('📦 Packs actuellement utilisés:', uniquePacks);
        
        // Compter chaque pack
        for (const pack of uniquePacks) {
            const { data: countData, error: countError } = await supabase
                .from('users')
                .select('id', { count: 'exact' })
                .eq('selected_pack', pack);
                
            if (!countError) {
                console.log(`  - ${pack}: ${countData?.length || 0} utilisateur(s)`);
            }
        }
        
    } catch (error) {
        console.log('❌ Erreur lors de la vérification des packs:', error.message);
    }
}

async function finalVerification() {
    try {
        // Vérification finale pour s'assurer qu'il n'y a plus de pack découverte
        const { data: remainingDiscovery, error: finalError } = await supabase
            .from('users')
            .select('*')
            .eq('selected_pack', 'découverte');
            
        if (finalError) {
            console.log('❌ Erreur lors de la vérification finale:', finalError.message);
            return;
        }
        
        const count = remainingDiscovery?.length || 0;
        
        if (count === 0) {
            console.log('\n🎉 SUCCÈS: Aucun pack découverte restant!');
            console.log('✅ Le problème a été résolu avec succès.');
        } else {
            console.log(`\n⚠️  ATTENTION: ${count} utilisateur(s) ont encore le pack découverte`);
            console.log('❌ Le problème persiste - intervention manuelle requise.');
            
            // Afficher les détails des utilisateurs problématiques
            remainingDiscovery.forEach((user, index) => {
                console.log(`\nUtilisateur problématique ${index + 1}:`);
                console.log(`  - ID: ${user.id}`);
                console.log(`  - Email: ${user.email || 'N/A'}`);
                console.log(`  - Pack: ${user.selected_pack}`);
                console.log(`  - Créé: ${user.created_at}`);
                console.log(`  - Mis à jour: ${user.updated_at}`);
            });
        }
        
    } catch (error) {
        console.log('❌ Erreur lors de la vérification finale:', error.message);
    }
}

// Fonction pour tester avec un utilisateur spécifique
async function testSpecificUser(userId) {
    console.log(`\n🔍 Test spécifique pour l'utilisateur: ${userId}`);
    
    try {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.log('❌ Utilisateur non trouvé:', userError.message);
            return;
        }
        
        console.log('📋 Données utilisateur:');
        console.log(`  - ID: ${userData.id}`);
        console.log(`  - Email: ${userData.email || 'N/A'}`);
        console.log(`  - Pack: ${userData.selected_pack}`);
        console.log(`  - Créé: ${userData.created_at}`);
        console.log(`  - Mis à jour: ${userData.updated_at}`);
        
        if (userData.selected_pack === 'découverte') {
            console.log('\n⚠️  Cet utilisateur a encore le pack découverte!');
            console.log('Application de la correction...');
            
            const { error: updateError } = await supabase
                .from('users')
                .update({ 
                    selected_pack: 'premium',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
                
            if (updateError) {
                console.log('❌ Erreur lors de la correction:', updateError.message);
            } else {
                console.log('✅ Pack corrigé avec succès!');
            }
        } else {
            console.log('✅ Cet utilisateur n\'a pas le pack découverte.');
        }
        
    } catch (error) {
        console.log('❌ Erreur lors du test spécifique:', error.message);
    }
}

// Exécution du test
if (require.main === module) {
    console.log('🚀 Démarrage du test de vérification...');
    
    // Vérifier si un ID utilisateur spécifique est fourni
    const specificUserId = process.argv[2];
    
    if (specificUserId) {
        testSpecificUser(specificUserId);
    } else {
        testPackPersistence();
    }
}

module.exports = {
    testPackPersistence,
    testSpecificUser,
    applyPackCorrection
};