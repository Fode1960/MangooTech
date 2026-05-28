import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugFodeShop() {
  console.log('🔍 Recherche de Fodé Boutique...')
  
  // Rechercher toutes les boutiques contenant "Fodé"
  const { data: fodeShops, error: fodeError } = await supabase
    .from('shops')
    .select('id, name, user_id, status, created_at')
    .ilike('name', '%Fodé%')
  
  console.log('🔍 Résultat recherche Fodé:', { fodeShops, fodeError })
  
  // Rechercher toutes les boutiques en attente
  const { data: pendingShops, error: pendingError } = await supabase
    .from('shops')
    .select('id, name, user_id, status, created_at')
    .eq('status', 'pending')
  
  console.log('🔍 Toutes les boutiques en attente:', { pendingShops, pendingError })
  
  // Rechercher toutes les boutiques (limité à 10)
  const { data: allShops, error: allError } = await supabase
    .from('shops')
    .select('id, name, user_id, status, created_at')
    .limit(10)
  
  console.log('🔍 Toutes les boutiques (10 premières):', { allShops, allError })
  
  // Si on trouve Fodé Boutique, chercher l'utilisateur
  if (fodeShops && fodeShops.length > 0) {
    const shop = fodeShops[0]
    console.log(`🔍 Fodé Boutique trouvée:`, shop)
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', shop.user_id)
      .single()
    
    console.log('🔍 Propriétaire de Fodé Boutique:', { user, userError })
  }
  
  process.exit(0)
}

debugFodeShop().catch(console.error)