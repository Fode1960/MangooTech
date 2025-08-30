const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPackDbId() {
  console.log('🔍 Debug des dbId des packs dans Dashboard.jsx\n');
  
  // Les packs définis dans Dashboard.jsx
  const allPacks = [
    {
      id: 0,
      dbId: '0a85e74a-4aec-480a-8af1-7b57391a80d2',
      name: "Pack Découverte"
    },
    {
      id: 1,
      dbId: '209a0b0e-7888-41a3-9cd1-45907705261a',
      name: "Pack Visibilité"
    },
    {
      id: 2,
      dbId: 'e444b213-6a11-4793-b30d-e55a8fbf3403',
      name: "Pack Professionnel"
    },
    {
      id: 3,
      dbId: '9e026c33-1c2a-49aa-8cc2-e2c9d392c303',
      name: "Pack Premium"
    }
  ];
  
  console.log('📋 Packs définis dans Dashboard.jsx:');
  allPacks.forEach(pack => {
    console.log(`- ${pack.name}: dbId = ${pack.dbId} (type: ${typeof pack.dbId})`);
  });
  
  console.log('\n🔍 Vérification des packs dans la base de données:');
  const { data: dbPacks, error } = await supabase
    .from('packs')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error('❌ Erreur lors de la récupération des packs:', error);
    return;
  }
  
  console.log('📊 Packs dans la base de données:');
  dbPacks.forEach(pack => {
    console.log(`- ${pack.name}: id = ${pack.id} (type: ${typeof pack.id})`);
  });
  
  console.log('\n🔄 Correspondance entre Dashboard et DB:');
  allPacks.forEach(dashboardPack => {
    const dbPack = dbPacks.find(p => p.id === dashboardPack.dbId);
    if (dbPack) {
      console.log(`✅ ${dashboardPack.name}: Dashboard dbId (${dashboardPack.dbId}) trouvé dans DB`);
    } else {
      console.log(`❌ ${dashboardPack.name}: Dashboard dbId (${dashboardPack.dbId}) NOT FOUND dans DB`);
    }
  });
  
  console.log('\n🧪 Test d\'appel smart-pack-change avec chaque dbId:');
  for (const pack of allPacks) {
    console.log(`\n🔄 Test avec ${pack.name} (dbId: ${pack.dbId})...`);
    
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/smart-pack-change`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packId: pack.dbId,
          successUrl: 'http://localhost:3001/dashboard?success=true',
          cancelUrl: 'http://localhost:3001/dashboard?canceled=true'
        })
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Erreur: ${errorText}`);
      } else {
        const data = await response.json();
        console.log(`   ✅ Succès: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

debugPackDbId().catch(console.error);