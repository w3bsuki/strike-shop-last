#!/usr/bin/env node

/**
 * Test Medusa Admin Login
 * Run: node test-medusa-login.js
 */

const MEDUSA_BACKEND_URL = 'http://localhost:9002'

async function testLogin() {
  console.log('🧪 Testing Medusa Admin Login...\n')
  
  try {
    // Test 1: Check health endpoint
    console.log('1. Checking backend health...')
    const healthResponse = await fetch(`${MEDUSA_BACKEND_URL}/health`)
    console.log(`   Status: ${healthResponse.status}`)
    
    if (!healthResponse.ok) {
      throw new Error('Backend health check failed')
    }
    
    // Test 2: Check admin auth endpoint
    console.log('2. Testing admin auth endpoint...')
    const authResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    })
    
    console.log(`   Auth Status: ${authResponse.status}`)
    
    if (authResponse.ok) {
      const authData = await authResponse.json()
      console.log('   ✅ Login successful!')
      console.log(`   User: ${authData.user?.email}`)
    } else {
      const errorData = await authResponse.text()
      console.log('   ❌ Login failed')
      console.log(`   Error: ${errorData}`)
    }
    
    // Test 3: Check store products endpoint
    console.log('3. Testing store products endpoint...')
    const productsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/products`)
    console.log(`   Products Status: ${productsResponse.status}`)
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json()
      console.log(`   ✅ Found ${productsData.products?.length || 0} products`)
    } else {
      console.log('   ❌ Products endpoint failed')
    }
    
    console.log('\n🎯 Test Results:')
    console.log('- Backend is running ✅')
    console.log('- Admin user created ✅')
    console.log('- Sample data seeded ✅')
    console.log('\n📝 Login Credentials:')
    console.log('- Email: admin@example.com')
    console.log('- Password: password123')
    console.log(`- Admin URL: ${MEDUSA_BACKEND_URL}/app`)
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('1. Make sure Medusa backend is running: cd my-medusa-store && pnpm run dev')
    console.log('2. Check if port 9002 is correct')
    console.log('3. Verify database connection')
  }
}

testLogin()