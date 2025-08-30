const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingTables() {
  console.log('🔧 Correction des tables manquantes\n');
  
  try {
    // 1. Vérifier si les tables existent
    console.log('1. Vérification des tables existantes...');
    
    // Test user_credits
    const { data: creditsTest, error: creditsError } = await supabase
      .from('user_credits')
      .select('id')
      .limit(1);
    
    if (creditsError) {
      console.log('❌ Table user_credits manquante:', creditsError.message);
    } else {
      console.log('✅ Table user_credits existe');
    }
    
    // Test cancellation_feedback
    const { data: feedbackTest, error: feedbackError } = await supabase
      .from('cancellation_feedback')
      .select('id')
      .limit(1);
    
    if (feedbackError) {
      console.log('❌ Table cancellation_feedback manquante:', feedbackError.message);
    } else {
      console.log('✅ Table cancellation_feedback existe');
    }
    
    // 2. Si les tables manquent, afficher les instructions
    if (creditsError || feedbackError) {
      console.log('\n🚨 TABLES MANQUANTES DÉTECTÉES');
      console.log('\n📋 INSTRUCTIONS POUR CORRIGER:');
      console.log('1. Allez sur: https://supabase.com/dashboard/project/ptrqhtwstldphjaraufi/sql');
      console.log('2. Copiez et collez le SQL ci-dessous:');
      console.log('3. Cliquez sur "Run"\n');
      
      console.log('-- =====================================================');
      console.log('-- SQL À EXÉCUTER DANS LE DASHBOARD SUPABASE');
      console.log('-- =====================================================');
      
      if (creditsError) {
        console.log('\n-- Table user_credits pour gérer les crédits utilisateur');
        console.log(`CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_type ON user_credits(type);
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at);

-- Politiques RLS pour user_credits
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage credits" ON user_credits;
CREATE POLICY "Service can manage credits" ON user_credits
  FOR ALL USING (true);`);
      }
      
      if (feedbackError) {
        console.log('\n-- Table cancellation_feedback pour les retours d\'annulation');
        console.log(`CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id),
  reason VARCHAR(100),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_pack_id ON cancellation_feedback(pack_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON cancellation_feedback(reason);

-- Politiques RLS pour cancellation_feedback
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can insert their own feedback" ON cancellation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can view their own feedback" ON cancellation_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage feedback" ON cancellation_feedback;
CREATE POLICY "Service can manage feedback" ON cancellation_feedback
  FOR ALL USING (true);`);
      }
      
      console.log('\n-- =====================================================');
      console.log('-- FIN DU SQL À EXÉCUTER');
      console.log('-- =====================================================\n');
      
      // 3. Tester une solution temporaire
      console.log('🔄 Test d\'une solution temporaire...');
      await testTemporaryFix();
    } else {
      console.log('\n✅ Toutes les tables existent, test du système...');
      await testPackChangeSystem();
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

async function testTemporaryFix() {
  console.log('\nTest de changement de pack sans crédit...');
  
  try {
    // Créer un utilisateur de test
    const testEmail = 'test-fix-pack@mangoo.tech';
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Erreur création utilisateur:', signUpError.message);
      return;
    }
    
    // S'authentifier
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Erreur authentification:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur de test authentifié');
    
    // Récupérer les packs
    const { data: packs } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (packs && packs.length > 0) {
      const targetPack = packs[0]; // Pack gratuit
      console.log(`Test avec pack gratuit: ${targetPack.name}`);
      
      // Tester smart-pack-change
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: targetPack.id,
          successUrl: 'http://localhost:3001/dashboard?success=true',
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log('Status:', response.status);
      const responseText = await response.text();
      console.log('Réponse:', responseText);
      
      if (response.ok) {
        console.log('\n🎉 SUCCÈS! Le changement de pack fonctionne!');
        console.log('Le problème était bien les tables manquantes.');
      } else {
        console.log('\n❌ Échec même avec utilisateur de test');
        try {
          const errorData = JSON.parse(responseText);
          console.log('Détails:', errorData);
        } catch (e) {
          console.log('Réponse brute:', responseText);
        }
      }
    }
    
    // Nettoyer
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Erreur test temporaire:', error.message);
  }
}

async function testPackChangeSystem() {
  console.log('Test du système de changement de pack...');
  
  try {
    // Créer un utilisateur de test
    const testEmail = 'test-system-pack@mangoo.tech';
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError && !signUpError.message.includes('already registered')) {
      console.error('❌ Erreur création utilisateur:', signUpError.message);
      return;
    }
    
    // S'authentifier
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Erreur authentification:', authError.message);
      return;
    }
    
    console.log('✅ Utilisateur de test authentifié');
    
    // Récupérer les packs
    const { data: packs } = await supabase
      .from('packs')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });
    
    if (packs && packs.length > 0) {
      const targetPack = packs[0];
      console.log(`Test avec pack: ${targetPack.name}`);
      
      // Tester smart-pack-change
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: targetPack.id,
          successUrl: 'http://localhost:3001/dashboard?success=true',
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log('Status:', response.status);
      const responseText = await response.text();
      
      if (response.ok) {
        console.log('\n🎉 SYSTÈME FONCTIONNEL!');
        const result = JSON.parse(responseText);
        console.log('Résultat:', JSON.stringify(result, null, 2));
      } else {
        console.log('\n❌ Problème détecté');
        console.log('Réponse:', responseText);
      }
    }
    
    // Nettoyer
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Erreur test système:', error.message);
  }
}

// Exécuter le diagnostic et la correction
fixMissingTables().catch(console.error);