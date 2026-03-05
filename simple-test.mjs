import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

async function testPaymentSystem() {
  console.log('🚀 Testing payment system...');
  
  try {
    // Test basic server connectivity
    console.log('📡 Testing server connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server health:', healthResponse.data);
    
    // Test payment processing fees endpoint (public)
    console.log('💳 Testing payment processing fees...');
    const feesResponse = await axios.get(`${API_BASE_URL}/payments/processing-fees`);
    console.log('✅ Processing fees:', feesResponse.data);
    
    // Test mobile money endpoint (public)
    console.log('📱 Testing mobile money config...');
    const mobileMoneyResponse = await axios.get(`${API_BASE_URL}/mobile-money/config-check`);
    console.log('✅ Mobile money config:', mobileMoneyResponse.data);
    
    // Test analytics endpoint (public)
    console.log('📊 Testing analytics stats...');
    const analyticsResponse = await axios.get(`${API_BASE_URL}/analytics/stats`);
    console.log('✅ Analytics stats:', analyticsResponse.data);
    
    console.log('🎉 All public endpoints are working correctly!');
    console.log('💡 Admin endpoints require authentication and will be tested separately.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testPaymentSystem();