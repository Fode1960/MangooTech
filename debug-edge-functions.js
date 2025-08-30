import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugEdgeFunctions() {
    console.log('🔍 Début du debug des Edge Functions...');
    
    try {
        // 1. Connexion avec un utilisateur test
        console.log('\n1. 🔐 Tentative de connexion...');
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'mdansoko@mangoo.tech',
            password: 'Mangoo2024!'
        });
        
        if (authError) {
            console.error('❌ Erreur de connexion:', authError.message);
            return;
        }
        
        console.log('✅ Connexion réussie:', authData.user.email);
        const accessToken = authData.session.access_token;
        console.log('🔑 Token d\'accès obtenu:', accessToken.substring(0, 20) + '...');
        
        // 2. Récupération des packs disponibles
        console.log('\n2. 📦 Récupération des packs...');
        const { data: packs, error: packsError } = await supabase
            .from('packs')
            .select('id, name, price')
            .order('price', { ascending: true });
        
        if (packsError) {
            console.error('❌ Erreur lors de la récupération des packs:', packsError.message);
            return;
        }
        
        console.log('✅ Packs récupérés:');
        packs.forEach(pack => {
            console.log(`   - ${pack.name}: ${pack.price} FCFA (${pack.id})`);
        });
        
        // 3. Trouver le pack cible
        const targetPack = packs.find(p => p.name === 'Pack Visibilité');
        if (!targetPack) {
            console.error('❌ Pack Visibilité non trouvé');
            return;
        }
        
        console.log(`\n🎯 Pack cible: ${targetPack.name} (${targetPack.id})`);
        
        // 4. Test de calculate-pack-difference
        console.log('\n3. 🧮 Test de calculate-pack-difference...');
        
        const calcResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-pack-difference`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                newPackId: targetPack.id
            })
        });
        
        console.log(`📊 Status calculate-pack-difference: ${calcResponse.status}`);
        console.log(`📋 Headers:`, Object.fromEntries(calcResponse.headers.entries()));
        
        const calcResponseText = await calcResponse.text();
        console.log(`📄 Réponse brute:`, calcResponseText);
        
        if (!calcResponse.ok) {
            console.error(`❌ ERREUR calculate-pack-difference (${calcResponse.status})`);
            console.error(`Détails:`, calcResponseText);
            return;
        }
        
        let calcResult;
        try {
            calcResult = JSON.parse(calcResponseText);
            console.log('✅ calculate-pack-difference réussi:');
            console.log(`   - Type de changement: ${calcResult.changeType}`);
            console.log(`   - Paiement requis: ${calcResult.requiresPayment}`);
            console.log(`   - Changement immédiat: ${calcResult.canChangeImmediately}`);
        } catch (parseError) {
            console.error('❌ Erreur de parsing calculate-pack-difference:', parseError.message);
            return;
        }
        
        // 5. Test de smart-pack-change
        console.log('\n4. 🎯 Test de smart-pack-change...');
        
        const smartResponse = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                packId: targetPack.id
            })
        });
        
        console.log(`🎯 Status smart-pack-change: ${smartResponse.status}`);
        console.log(`📋 Headers:`, Object.fromEntries(smartResponse.headers.entries()));
        
        const smartResponseText = await smartResponse.text();
        console.log(`📄 Réponse brute:`, smartResponseText);
        
        if (!smartResponse.ok) {
            console.error(`❌ ERREUR: Edge Function returned a non-2xx status code (${smartResponse.status})`);
            console.error(`Détails:`, smartResponseText);
            
            // Essayer de parser comme JSON pour plus de détails
            try {
                const errorData = JSON.parse(smartResponseText);
                console.error('📋 Erreur parsée:', JSON.stringify(errorData, null, 2));
            } catch (parseError) {
                console.error('⚠️ Impossible de parser la réponse comme JSON');
            }
            
            return;
        }
        
        try {
            const smartResult = JSON.parse(smartResponseText);
            console.log('✅ smart-pack-change réussi!');
            console.log('📋 Résultat:', JSON.stringify(smartResult, null, 2));
        } catch (parseError) {
            console.log('✅ smart-pack-change réussi (réponse texte):', smartResponseText);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
        console.error('📋 Stack:', error.stack);
    }
}

// Exécution
debugEdgeFunctions().then(() => {
    console.log('\n🏁 Debug terminé');
    process.exit(0);
}).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});