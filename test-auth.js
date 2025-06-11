// Quick test script to verify auth endpoints work
const fetch = require('node-fetch')

const baseUrl = 'http://localhost:9000'
const publishableKey = 'pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae'

async function testAuth() {
  console.log('Testing Medusa authentication endpoints...')
  
  // Test customer registration
  try {
    const registerResponse = await fetch(`${baseUrl}/auth/customer/emailpass/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    const registerResult = await registerResponse.text()
    console.log('Register response:', registerResult)
    
    // Test customer login 
    const loginResponse = await fetch(`${baseUrl}/auth/customer/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    })
    
    const loginResult = await loginResponse.text()
    console.log('Login response:', loginResult)
    
  } catch (error) {
    console.error('Test error:', error.message)
  }
}

testAuth()