// Fix for Medusa Admin API Key
const axios = require('axios');

const BACKEND_URL = 'http://localhost:9000';
const PUBLISHABLE_KEY =
  'pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae';

// Configure axios defaults
axios.defaults.headers.common['x-publishable-api-key'] = PUBLISHABLE_KEY;

async function testLogin() {
  try {
    const response = await axios.post(`${BACKEND_URL}/admin/auth`, {
      email: 'admin@example.com',
      password: 'password123',
    });
    console.log('✅ Login successful:', response.data);
  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }
}

testLogin();
