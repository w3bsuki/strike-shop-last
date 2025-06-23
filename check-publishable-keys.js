const axios = require('axios');

async function checkPublishableKeys() {
  try {
    console.log('Checking for publishable keys...');
    
    // Try to login first (if authentication is required)
    try {
      const loginResponse = await axios.post('http://localhost:9000/admin/auth', {
        email: 'admin@test.com',
        password: 'supersecret'
      });
      console.log('Admin login successful');
      
      const token = loginResponse.data.token;
      
      // Check for publishable keys
      const keysResponse = await axios.get('http://localhost:9000/admin/publishable-api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Publishable keys found:', keysResponse.data);
      
      if (keysResponse.data.publishable_api_keys && keysResponse.data.publishable_api_keys.length > 0) {
        const key = keysResponse.data.publishable_api_keys[0];
        console.log(`\nFirst publishable key: ${key.id}`);
        console.log(`Add this to your .env.local:`);
        console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key.id}`);
      } else {
        console.log('No publishable keys found. Creating one...');
        
        // Create a publishable key
        const createKeyResponse = await axios.post('http://localhost:9000/admin/publishable-api-keys', {
          title: 'Default Store Key'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const newKey = createKeyResponse.data.publishable_api_key;
        console.log(`\nNew publishable key created: ${newKey.id}`);
        console.log(`Add this to your .env.local:`);
        console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${newKey.id}`);
      }
      
    } catch (loginError) {
      console.log('No authentication required or login failed:', loginError.response?.data || loginError.message);
      
      // Try without authentication
      try {
        const response = await axios.get('http://localhost:9000/admin/publishable-api-keys');
        console.log('Keys without auth:', response.data);
      } catch (noAuthError) {
        console.log('Cannot access keys without auth:', noAuthError.response?.data || noAuthError.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking publishable keys:', error.response?.data || error.message);
  }
}

checkPublishableKeys();