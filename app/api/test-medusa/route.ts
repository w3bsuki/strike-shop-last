import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = 'https://medusa-starter-default-production-3201.up.railway.app';
  
  // Try different approaches
  const tests = [];
  
  // Test 1: No key
  try {
    const response = await fetch(`${backendUrl}/store/products?limit=1`);
    const data = await response.text();
    tests.push({
      test: 'No key',
      status: response.status,
      response: data.substring(0, 200)
    });
  } catch (error: any) {
    tests.push({ test: 'No key', error: error.message });
  }
  
  // Test 2: With key from env
  try {
    const response = await fetch(`${backendUrl}/store/products?limit=1`, {
      headers: {
        'x-publishable-api-key': 'pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae'
      }
    });
    const data = await response.text();
    tests.push({
      test: 'With pk key',
      status: response.status,
      response: data.substring(0, 200)
    });
  } catch (error: any) {
    tests.push({ test: 'With pk key', error: error.message });
  }
  
  // Test 3: Health check
  try {
    const response = await fetch(`${backendUrl}/health`);
    const data = await response.text();
    tests.push({
      test: 'Health check',
      status: response.status,
      response: data
    });
  } catch (error: any) {
    tests.push({ test: 'Health check', error: error.message });
  }
  
  // Test 4: Admin check (to see if this is a v2 instance)
  try {
    const response = await fetch(`${backendUrl}/admin/auth`);
    const data = await response.text();
    tests.push({
      test: 'Admin auth check',
      status: response.status,
      response: data.substring(0, 200)
    });
  } catch (error: any) {
    tests.push({ test: 'Admin auth check', error: error.message });
  }
  
  return NextResponse.json({ 
    backendUrl,
    tests,
    envVars: {
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
      NEXT_PUBLIC_MEDUSA_REGION_ID: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
    }
  });
}