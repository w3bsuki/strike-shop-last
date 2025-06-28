#!/usr/bin/env node

const axios = require('axios');

const BACKEND_URL = 'http://localhost:9000';
const PUBLISHABLE_KEY = 'pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae';

async function loginAdmin() {
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/user/emailpass`, {
      email: 'admin@medusa-test.com',
      password: 'supersecret'
    });
    return response.headers['set-cookie'];
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createProduct(cookies) {
  const products = [
    {
      title: "STRIKE™ OVERSIZED HOODIE",
      description: "Premium heavyweight hoodie crafted from 100% organic cotton. Features dropped shoulders, kangaroo pocket, and our iconic STRIKE™ branding.",
      handle: "strike-oversized-hoodie",
      status: "published",
      images: [
        { url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800" }
      ],
      categories: [{ id: "cat_men" }],
      variants: [
        {
          title: "S / Black",
          sku: "STRIKE-HOODIE-S-BLK",
          manage_inventory: true,
          inventory_quantity: 50,
          prices: [
            { amount: 12900, currency_code: "EUR" },
            { amount: 14900, currency_code: "USD" },
            { amount: 10900, currency_code: "GBP" }
          ]
        },
        {
          title: "M / Black",
          sku: "STRIKE-HOODIE-M-BLK",
          manage_inventory: true,
          inventory_quantity: 75,
          prices: [
            { amount: 12900, currency_code: "EUR" },
            { amount: 14900, currency_code: "USD" },
            { amount: 10900, currency_code: "GBP" }
          ]
        },
        {
          title: "L / Black",
          sku: "STRIKE-HOODIE-L-BLK",
          manage_inventory: true,
          inventory_quantity: 60,
          prices: [
            { amount: 12900, currency_code: "EUR" },
            { amount: 14900, currency_code: "USD" },
            { amount: 10900, currency_code: "GBP" }
          ]
        }
      ],
      options: [
        {
          title: "Size",
          values: ["S", "M", "L", "XL"]
        },
        {
          title: "Color",
          values: ["Black", "White", "Grey"]
        }
      ]
    },
    {
      title: "MINIMAL TECH CARGO PANTS",
      description: "Technical cargo pants with adjustable straps and multiple pockets. Water-resistant fabric with tapered fit.",
      handle: "minimal-tech-cargo-pants",
      status: "published",
      images: [
        { url: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800" }
      ],
      variants: [
        {
          title: "M / Black",
          sku: "CARGO-PANTS-M-BLK",
          manage_inventory: true,
          inventory_quantity: 40,
          prices: [
            { amount: 18900, currency_code: "EUR" },
            { amount: 21900, currency_code: "USD" },
            { amount: 16900, currency_code: "GBP" }
          ]
        }
      ]
    },
    {
      title: "STRIKE™ PREMIUM TEE",
      description: "Essential tee in premium cotton with subtle branding. Perfect fit, pre-shrunk.",
      handle: "strike-premium-tee",
      status: "published",
      images: [
        { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800" }
      ],
      variants: [
        {
          title: "M / White",
          sku: "STRIKE-TEE-M-WHT",
          manage_inventory: true,
          inventory_quantity: 100,
          prices: [
            { amount: 4900, currency_code: "EUR" },
            { amount: 5900, currency_code: "USD" },
            { amount: 4500, currency_code: "GBP" }
          ]
        }
      ]
    }
  ];

  for (const product of products) {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/admin/products`,
        product,
        {
          headers: {
            'Cookie': cookies.join('; '),
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Created product: ${product.title}`);
    } catch (error) {
      console.error(`❌ Failed to create ${product.title}:`, error.response?.data || error.message);
    }
  }
}

async function main() {
  try {
    console.log('🔐 Logging in as admin...');
    const cookies = await loginAdmin();
    console.log('✅ Logged in successfully');
    
    console.log('\n📦 Creating products...');
    await createProduct(cookies);
    
    console.log('\n✨ Done! Check your products at http://localhost:4000');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  main();
} catch(e) {
  console.log('Installing axios...');
  require('child_process').execSync('npm install axios', { stdio: 'inherit' });
  console.log('Please run the script again.');
}