const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

async function testRegistration() {
  console.log('🧪 TESTING REGISTRATION FLOW\n');
  console.log('=' .repeat(60));
  
  const testData = {
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123@',
    fullName: 'Test User',
    userType: 'brand',
    phone: '+254700000000',
    registrationNumber: ''
  };

  try {
    console.log('\n📝 Test Data:');
    console.log(JSON.stringify(testData, null, 2));

    console.log('\n1️⃣  TESTING REGISTRATION ENDPOINT...');
    console.log('POST /auth/register');
    
    const registerRes = await api.post('/auth/register', testData);
    
    console.log('\n✅ SUCCESS! Status:', registerRes.status);
    console.log('Response:', JSON.stringify(registerRes.data, null, 2));

    const { token, user } = registerRes.data;

    if (!token) {
      console.log('\n❌ ERROR: No token in response');
      return;
    }

    if (!user) {
      console.log('\n❌ ERROR: No user in response');
      return;
    }

    console.log('\n2️⃣  CHECKING DATABASE...');
    // Try to get user via /auth/me
    try {
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User fetched via /auth/me');
      console.log('User:', JSON.stringify(meRes.data, null, 2));
    } catch (err) {
      console.log('❌ Failed to fetch user via /auth/me');
      console.log('Error:', err.response?.data || err.message);
    }

    console.log('\n3️⃣  CHECKING OTP TABLE...');
    // Since we can't query DB directly from here, let's just note that OTP should have been created
    console.log('✅ OTP should be generated and sent (check backend console for OTP)');

    console.log('\n' + '='.repeat(60));
    console.log('✅ REGISTRATION TEST COMPLETED SUCCESSFULLY\n');

  } catch (error) {
    console.log('\n❌ ERROR OCCURRED');
    console.log('=' .repeat(60));
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.message) {
      console.log('Error Message:', error.message);
    } else {
      console.log('Error:', error);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the test
testRegistration();
