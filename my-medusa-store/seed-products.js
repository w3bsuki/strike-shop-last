const axios = require('axios');

const BACKEND_URL = 'http://172.30.205.219:9000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// You'll need to get this token from the admin login
console.log('Make sure to set ADMIN_TOKEN environment variable');
console.log('You can get it by logging in and checking localStorage.getItem("medusa_admin_token")');

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function seedData() {
  try {
    console.log('Starting seed process...');

    // 1. Create Collections
    console.log('\n1. Creating collections...');
    const collections = [
      { title: 'New Arrivals', handle: 'new-arrivals' },
      { title: 'Best Sellers', handle: 'best-sellers' },
      { title: 'Summer Collection', handle: 'summer-collection' },
      { title: 'Winter Collection', handle: 'winter-collection' }
    ];

    const createdCollections = [];
    for (const collection of collections) {
      try {
        const { data } = await api.post('/admin/collections', collection);
        createdCollections.push(data.collection);
        console.log(`✓ Created collection: ${collection.title}`);
      } catch (error) {
        console.log(`! Collection ${collection.title} might already exist`);
      }
    }

    // 2. Create Categories
    console.log('\n2. Creating categories...');
    const categories = [
      { name: 'Men', handle: 'men', is_active: true },
      { name: 'Women', handle: 'women', is_active: true },
      { name: 'Kids', handle: 'kids', is_active: true },
      { name: 'Accessories', handle: 'accessories', is_active: true }
    ];

    const createdCategories = [];
    for (const category of categories) {
      try {
        const { data } = await api.post('/admin/product-categories', category);
        createdCategories.push(data.product_category);
        console.log(`✓ Created category: ${category.name}`);
      } catch (error) {
        console.log(`! Category ${category.name} might already exist`);
      }
    }

    // 3. Create Product Types
    console.log('\n3. Creating product types...');
    const types = [
      { value: 'clothing' },
      { value: 'footwear' },
      { value: 'accessories' }
    ];

    for (const type of types) {
      try {
        await api.post('/admin/product-types', type);
        console.log(`✓ Created type: ${type.value}`);
      } catch (error) {
        console.log(`! Type ${type.value} might already exist`);
      }
    }

    // 4. Create Products
    console.log('\n4. Creating products...');
    const products = [
      {
        title: 'Strike™ Essential Tee',
        handle: 'strike-essential-tee',
        description: 'Premium cotton essential t-shirt with minimal Strike branding',
        type: { value: 'clothing' },
        collection_id: createdCollections[0]?.id,
        categories: createdCategories.length > 0 ? [{ id: createdCategories[0].id }] : [],
        status: 'published',
        options: [
          { title: 'Size', values: ['S', 'M', 'L', 'XL'] },
          { title: 'Color', values: ['Black', 'White', 'Gray'] }
        ],
        variants: [
          { title: 'S / Black', sku: 'STRIKE-TEE-S-BLK', prices: [{ amount: 2500, currency_code: 'usd' }, { amount: 2000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 100 },
          { title: 'M / Black', sku: 'STRIKE-TEE-M-BLK', prices: [{ amount: 2500, currency_code: 'usd' }, { amount: 2000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 150 },
          { title: 'L / Black', sku: 'STRIKE-TEE-L-BLK', prices: [{ amount: 2500, currency_code: 'usd' }, { amount: 2000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 120 },
          { title: 'XL / Black', sku: 'STRIKE-TEE-XL-BLK', prices: [{ amount: 2500, currency_code: 'usd' }, { amount: 2000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 80 },
        ],
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
        thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
      },
      {
        title: 'Strike™ Performance Hoodie',
        handle: 'strike-performance-hoodie',
        description: 'Technical performance hoodie with moisture-wicking fabric',
        type: { value: 'clothing' },
        collection_id: createdCollections[1]?.id,
        categories: createdCategories.length > 0 ? [{ id: createdCategories[0].id }] : [],
        status: 'published',
        options: [
          { title: 'Size', values: ['S', 'M', 'L', 'XL'] },
          { title: 'Color', values: ['Black', 'Navy', 'Gray'] }
        ],
        variants: [
          { title: 'S / Black', sku: 'STRIKE-HOOD-S-BLK', prices: [{ amount: 7500, currency_code: 'usd' }, { amount: 6500, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 50 },
          { title: 'M / Black', sku: 'STRIKE-HOOD-M-BLK', prices: [{ amount: 7500, currency_code: 'usd' }, { amount: 6500, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 75 },
          { title: 'L / Black', sku: 'STRIKE-HOOD-L-BLK', prices: [{ amount: 7500, currency_code: 'usd' }, { amount: 6500, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 60 },
          { title: 'XL / Black', sku: 'STRIKE-HOOD-XL-BLK', prices: [{ amount: 7500, currency_code: 'usd' }, { amount: 6500, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 40 },
        ],
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
        thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'
      },
      {
        title: 'Strike™ Running Shoes',
        handle: 'strike-running-shoes',
        description: 'Lightweight performance running shoes with responsive cushioning',
        type: { value: 'footwear' },
        collection_id: createdCollections[0]?.id,
        categories: createdCategories.length > 1 ? [{ id: createdCategories[1].id }] : [],
        status: 'published',
        options: [
          { title: 'Size', values: ['7', '8', '9', '10', '11'] },
          { title: 'Color', values: ['Black/White', 'White/Gray'] }
        ],
        variants: [
          { title: '8 / Black/White', sku: 'STRIKE-RUN-8-BW', prices: [{ amount: 12000, currency_code: 'usd' }, { amount: 10000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 30 },
          { title: '9 / Black/White', sku: 'STRIKE-RUN-9-BW', prices: [{ amount: 12000, currency_code: 'usd' }, { amount: 10000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 40 },
          { title: '10 / Black/White', sku: 'STRIKE-RUN-10-BW', prices: [{ amount: 12000, currency_code: 'usd' }, { amount: 10000, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 35 },
        ],
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
        thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'
      },
      {
        title: 'Strike™ Cap',
        handle: 'strike-cap',
        description: 'Classic 6-panel cap with embroidered Strike logo',
        type: { value: 'accessories' },
        collection_id: createdCollections[2]?.id,
        categories: createdCategories.length > 3 ? [{ id: createdCategories[3].id }] : [],
        status: 'published',
        options: [
          { title: 'Color', values: ['Black', 'White', 'Navy'] }
        ],
        variants: [
          { title: 'Black', sku: 'STRIKE-CAP-BLK', prices: [{ amount: 2000, currency_code: 'usd' }, { amount: 1800, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 200 },
          { title: 'White', sku: 'STRIKE-CAP-WHT', prices: [{ amount: 2000, currency_code: 'usd' }, { amount: 1800, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 150 },
          { title: 'Navy', sku: 'STRIKE-CAP-NVY', prices: [{ amount: 2000, currency_code: 'usd' }, { amount: 1800, currency_code: 'eur' }], manage_inventory: true, inventory_quantity: 100 },
        ],
        images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'],
        thumbnail: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'
      }
    ];

    for (const product of products) {
      try {
        const { data } = await api.post('/admin/products', product);
        console.log(`✓ Created product: ${product.title}`);
        
        // Publish the product
        await api.post(`/admin/products/${data.product.id}/publish`);
        console.log(`  ✓ Published: ${product.title}`);
      } catch (error) {
        console.log(`✗ Error creating ${product.title}:`, error.response?.data?.message || error.message);
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log('\nYou can now:');
    console.log('1. View products in admin panel: http://172.30.205.219:9000/app/products');
    console.log('2. Update your frontend to fetch from Medusa API');

  } catch (error) {
    console.error('Seeding error:', error.response?.data || error.message);
  }
}

// Run the seed
seedData();