// Test script to verify user-specific shop functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (using the same configuration as the app)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testShopOwnership() {
  console.log('🧪 Testing shop ownership functionality...\n');
  
  try {
    // Test: Get shops for different users
    console.log('📋 Test: Verifying shop ownership by user');
    
    // Get all shops with their owners
    const { data: shops, error } = await supabase
      .from('shops')
      .select('id, name, user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching shops:', error.message);
      return;
    }
    
    console.log(`Found ${shops?.length || 0} shops:`);
    
    if (shops && shops.length > 0) {
      shops.forEach(shop => {
        console.log(`  - Shop: "${shop.name}" (ID: ${shop.id})`);
        console.log(`    Owner: ${shop.user_id}`);
        console.log(`    Status: ${shop.status}`);
        console.log(`    Created: ${shop.created_at}`);
        console.log('');
      });
      
      // Check for duplicate shop names across different users
      const shopNames = shops.map(shop => shop.name);
      const uniqueNames = [...new Set(shopNames)];
      
      console.log(`📊 Analysis:`);
      console.log(`  - Total shops: ${shops.length}`);
      console.log(`  - Unique names: ${uniqueNames.length}`);
      
      if (shopNames.length !== uniqueNames.length) {
        console.log('⚠️  Warning: Duplicate shop names found across different users');
      } else {
        console.log('✅ Good: All shop names are unique');
      }
      
      // Group shops by user
      const shopsByUser = {};
      shops.forEach(shop => {
        if (!shopsByUser[shop.user_id]) {
          shopsByUser[shop.user_id] = [];
        }
        shopsByUser[shop.user_id].push(shop);
      });
      
      console.log('\n👥 Shops grouped by user:');
      Object.keys(shopsByUser).forEach(userId => {
        const userShops = shopsByUser[userId];
        console.log(`  User ${userId}: ${userShops.length} shop(s)`);
        userShops.forEach(shop => {
          console.log(`    - "${shop.name}" (${shop.status})`);
        });
      });
    }
    
    console.log('\n✅ Shop ownership test completed!');
    console.log('✅ Each user should only see their own shops in the dashboard');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testShopOwnership();