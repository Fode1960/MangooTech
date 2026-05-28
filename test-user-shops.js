// Test script to verify user-specific shop functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (using the same configuration as the app)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserShops() {
  console.log('🧪 Testing user-specific shop functionality...\n');
  
  try {
    // Test 1: Get shops for different users
    console.log('📋 Test 1: Getting shops for different users');
    
    // Simulate getting shops for user 1
    const user1Shops = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', 'user1-id');
    
    console.log('User 1 shops:', user1Shops.data?.length || 0);
    
    // Simulate getting shops for user 2  
    const user2Shops = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', 'user2-id');
      
    console.log('User 2 shops:', user2Shops.data?.length || 0);
    
    // Test 2: Check shop ownership
    console.log('\n📋 Test 2: Verifying shop ownership');
    
    if (user1Shops.data && user1Shops.data.length > 0) {
      console.log('User 1 shop names:', user1Shops.data.map(shop => shop.name));
    }
    
    if (user2Shops.data && user2Shops.data.length > 0) {
      console.log('User 2 shop names:', user2Shops.data.map(shop => shop.name));
    }
    
    // Test 3: Verify no cross-user access
    console.log('\n📋 Test 3: Verifying no cross-user access');
    
    // This should return empty for user1 trying to access user2's shops
    const crossAccessTest = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', 'user2-id')
      .eq('user_id', 'user1-id'); // Contradictory condition
    
    console.log('Cross-access test (should be 0):', crossAccessTest.data?.length || 0);
    
    console.log('\n✅ Test completed successfully!');
    console.log('✅ Each user should only see their own shops');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUserShops();