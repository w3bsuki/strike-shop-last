#!/usr/bin/env node

/**
 * Script to verify Medusa backend connection
 * Run this to test if your frontend can connect to the Medusa backend
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';
const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || '';

console.log('🔍 Checking Medusa Backend Connection...\n');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Publishable Key: ${PUBLISHABLE_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`Region ID: ${REGION_ID ? '✅ Set' : '❌ Not set'}`);
console.log('\n---\n');

async function checkConnection() {
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is reachable');
    } else {
      console.log(`❌ Backend returned status: ${healthResponse.status}`);
    }

    // Test 2: Store API
    console.log('\n2️⃣ Testing store API...');
    const storeResponse = await fetch(`${BACKEND_URL}/store/products?limit=1`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
    });

    if (!storeResponse.ok) {
      console.log(`❌ Store API returned status: ${storeResponse.status}`);
      const text = await storeResponse.text();
      console.log('Response:', text);
      return;
    }

    const data = await storeResponse.json();
    console.log('✅ Store API is accessible');
    console.log(`Found ${data.count || 0} products`);

    // Test 3: Check if mock data
    if (data.products && data.products.length > 0) {
      const firstProduct = data.products[0];
      if (firstProduct.title && firstProduct.title.includes('Mock')) {
        console.log('⚠️  WARNING: API is returning mock data!');
      } else {
        console.log('✅ API is returning real data');
        console.log(`Sample product: ${firstProduct.title}`);
      }
    }

    // Test 4: Categories
    console.log('\n3️⃣ Testing categories API...');
    const categoriesResponse = await fetch(`${BACKEND_URL}/store/product-categories`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
    });

    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`✅ Found ${categories.product_categories?.length || 0} categories`);
    } else {
      console.log(`❌ Categories API returned status: ${categoriesResponse.status}`);
    }

    // Test 5: Region check
    if (REGION_ID) {
      console.log('\n4️⃣ Testing region...');
      const regionResponse = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY,
        },
      });

      if (regionResponse.ok) {
        const regions = await regionResponse.json();
        const hasRegion = regions.regions?.some(r => r.id === REGION_ID);
        if (hasRegion) {
          console.log('✅ Region ID is valid');
        } else {
          console.log('❌ Region ID not found in backend');
          console.log('Available regions:', regions.regions?.map(r => r.id).join(', '));
        }
      }
    }

    console.log('\n✅ Connection check complete!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    console.log('\nPossible issues:');
    console.log('- Backend URL is incorrect');
    console.log('- Backend is not running');
    console.log('- Network/firewall issues');
    console.log('- CORS not configured');
  }
}

checkConnection();