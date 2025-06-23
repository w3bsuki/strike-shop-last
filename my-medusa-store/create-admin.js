const axios = require('axios');

async function createAdminUser() {
  try {
    // First create an admin invite
    const inviteResponse = await axios.post('http://localhost:9000/admin/invites', {
      user_email: 'admin@medusa-test.com',
      role: 'admin'
    });
    
    console.log('Invite created:', inviteResponse.data);
    
    // Accept the invite to create admin user
    const acceptResponse = await axios.post(`http://localhost:9000/admin/invites/${inviteResponse.data.invite.token}/accept`, {
      user: {
        first_name: 'Admin',
        last_name: 'User',
        password: 'supersecret'
      }
    });
    
    console.log('Admin user created:', acceptResponse.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

createAdminUser();