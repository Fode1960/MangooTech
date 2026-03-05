import { Router } from 'express';
import { supabase } from '../config/supabase.ts';

const router = Router();

// Test des permissions sur la table shops
router.get('/test-shops-permissions', async (req, res) => {
  try {
    console.log('🧪 Test des permissions sur la table shops...');
    
    // Test 1: Vérifier la structure de la table
    const { data: tableStructure, error: structureError } = await supabase
      .from('shops')
      .select('*')
      .limit(0);

    if (structureError) {
      console.error('❌ Erreur de structure:', structureError);
      return res.status(400).json({
        error: 'Erreur de structure',
        details: structureError.message,
        code: structureError.code
      });
    }

    // Test 2: Essayer une insertion simple
    const testShopData = {
      name: 'Test Shop',
      slug: 'test-shop-' + Date.now(),
      description: 'Boutique de test',
      address: { street: '123 Test St', city: 'Test City', country: 'Test Country' },
      contact_phone: '+1234567890',
      contact_email: 'test@example.com',
      website_url: 'https://test.com',
      category: 'general',
      status: 'pending',
      is_verified: false
    };

    console.log('📊 Données de test:', testShopData);

    const { data: insertedShop, error: insertError } = await supabase
      .from('shops')
      .insert([testShopData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur d\'insertion:', insertError);
      
      // Si c'est une erreur de permission, essayer de voir les permissions actuelles
      const { data: permissions } = await supabase
        .rpc('get_permissions', { table_name: 'shops' })
        .catch(() => ({ data: null }));

      return res.status(400).json({
        error: 'Erreur d\'insertion',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        testData: testShopData,
        permissions: permissions
      });
    }

    // Si l'insertion a réussi, supprimer la boutique de test
    const { error: deleteError } = await supabase
      .from('shops')
      .delete()
      .eq('id', insertedShop.id);

    if (deleteError) {
      console.warn('⚠️ Impossible de supprimer la boutique de test:', deleteError);
    }

    console.log('✅ Permissions vérifiées avec succès!');
    res.json({
      success: true,
      message: 'Permissions OK - Test d\'insertion réussi',
      insertedShop: insertedShop,
      testDataUsed: testShopData
    });

  } catch (error) {
    console.error('💥 Erreur inattendue:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Obtenir la structure complète de la table shops
router.get('/shops-structure', async (req, res) => {
  try {
    const { data, error } = await supabase
      .rpc('get_table_structure', { table_name: 'shops' })
      .catch(() => {
        // Fallback: utiliser une requête simple pour voir la structure
        return { data: null, error: { message: 'Fonction get_table_structure non disponible' } };
      });

    if (error) {
      // Essayer une autre approche
      const { data: sampleData } = await supabase
        .from('shops')
        .select('*')
        .limit(1);

      const columns = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

      return res.json({
        structureMethod: 'sample_data',
        columns: columns,
        sampleData: sampleData?.[0]
      });
    }

    res.json({
      structureMethod: 'rpc_function',
      structure: data
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération de la structure',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;