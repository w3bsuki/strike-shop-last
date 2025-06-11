#!/usr/bin/env node

/**
 * Seed Script for Sanity CMS
 * 
 * This script populates your Sanity dataset with sample products and categories
 * Run: node scripts/seed-sanity.js
 */

const { createClient } = require('@sanity/client')
const { faker } = require('@faker-js/faker')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Sanity client configuration
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-06-11',
  token: process.env.SANITY_API_TOKEN, // You'll need a write token
  useCdn: false,
})

// Sample categories
const categories = [
  { name: 'Sneakers', slug: 'sneakers', description: 'Premium athletic and lifestyle sneakers' },
  { name: 'Menswear', slug: 'menswear', description: 'Contemporary men\'s clothing collection' },
  { name: 'Womenswear', slug: 'womenswear', description: 'Modern women\'s fashion essentials' },
  { name: 'Kids', slug: 'kids', description: 'Stylish clothing for children' },
  { name: 'Accessories', slug: 'accessories', description: 'Bags, hats, and more' },
]

// Sample product templates
const productTemplates = {
  sneakers: [
    { name: 'Out Of Office Sneaker', basePrice: 629, sizes: ['39', '40', '41', '42', '43', '44', '45'], colors: ['White/Black', 'Black/White', 'Navy/Red', 'Grey/Blue', 'All Black'] },
    { name: 'Vulcanized Low Top', basePrice: 510, sizes: ['39', '40', '41', '42', '43', '44'], colors: ['White', 'Black', 'Red'] },
    { name: 'ODSY-1000 Sneaker', basePrice: 750, sizes: ['40', '41', '42', '43', '44'], colors: ['Multi', 'Black/White'] },
    { name: 'Arrow Runner 2.0', basePrice: 590, sizes: ['39', '40', '41', '42', '43', '44', '45'], colors: ['White/Grey', 'Black/Red', 'Navy', 'Beige'] },
    { name: 'Court Classic', basePrice: 420, sizes: ['40', '41', '42', '43', '44'], colors: ['White/Green', 'White/Navy'] },
  ],
  menswear: [
    { name: 'Diagonal Stripe Overshirt', basePrice: 845, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy'] },
    { name: 'Jacquard Check Shirt', basePrice: 624, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Blue/White', 'Black/Grey'] },
    { name: 'Industrial Cargo Pants', basePrice: 1200, sizes: ['28', '30', '32', '34', '36'], colors: ['Black', 'Olive', 'Beige'] },
    { name: 'Logo Print Hoodie', basePrice: 780, sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Grey', 'White'] },
    { name: 'Slim Fit Denim', basePrice: 520, sizes: ['28', '30', '32', '34'], colors: ['Indigo', 'Black'] },
  ],
  womenswear: [
    { name: 'Oversized Blazer', basePrice: 1250, sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Beige', 'Grey'] },
    { name: 'Ribbed Knit Dress', basePrice: 680, sizes: ['XS', 'S', 'M', 'L', 'XL'], colors: ['Black', 'Cream', 'Navy'] },
    { name: 'Wide Leg Trousers', basePrice: 590, sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Camel', 'Navy'] },
    { name: 'Cropped Logo Tee', basePrice: 320, sizes: ['XS', 'S', 'M', 'L'], colors: ['White', 'Black', 'Pink'] },
    { name: 'Midi Pleated Skirt', basePrice: 720, sizes: ['XS', 'S', 'M', 'L'], colors: ['Black', 'Burgundy'] },
  ],
  kids: [
    { name: 'Kids Logo Print T-Shirt', basePrice: 209, sizes: ['4Y', '6Y', '8Y', '10Y', '12Y'], colors: ['White', 'Black', 'Red'] },
    { name: 'Kids Diag Stripe Cap', basePrice: 139, sizes: ['One Size'], colors: ['Black/White', 'Navy/Red'] },
    { name: 'Kids Mini Backpack', basePrice: 220, sizes: ['One Size'], colors: ['Black', 'Pink', 'Blue'] },
    { name: 'Kids Arrow Slides', basePrice: 150, sizes: ['28', '30', '32', '34'], colors: ['Black', 'White'] },
    { name: 'Kids Denim Jacket', basePrice: 380, sizes: ['4Y', '6Y', '8Y', '10Y'], colors: ['Blue', 'Black'] },
  ],
  accessories: [
    { name: 'Signature Arrow Tote Bag', basePrice: 585, sizes: ['One Size'], colors: ['Black', 'Beige', 'Navy'] },
    { name: 'Logo Baseball Cap', basePrice: 220, sizes: ['One Size'], colors: ['Black', 'White', 'Red', 'Navy'] },
    { name: 'Leather Card Holder', basePrice: 280, sizes: ['One Size'], colors: ['Black', 'Brown', 'Burgundy'] },
    { name: 'Canvas Belt', basePrice: 195, sizes: ['S/M', 'L/XL'], colors: ['Black/Silver', 'Brown/Gold'] },
    { name: 'Logo Scarf', basePrice: 420, sizes: ['One Size'], colors: ['Black/White', 'Grey/Black'] },
  ],
}

// Generate product description
function generateDescription(productName, category) {
  const descriptions = {
    sneakers: `Experience ultimate comfort and style with our ${productName}. Crafted with premium materials and innovative design, these sneakers seamlessly blend athletic performance with streetwear aesthetics. Features cushioned sole technology and breathable upper construction.`,
    menswear: `Elevate your wardrobe with our ${productName}. This piece embodies contemporary masculinity through expert tailoring and attention to detail. Made from high-quality fabrics for lasting comfort and sophisticated style.`,
    womenswear: `Discover effortless elegance with our ${productName}. Designed for the modern woman, this piece combines timeless sophistication with contemporary flair. Versatile styling options make it perfect for any occasion.`,
    kids: `Let your little ones express their style with our ${productName}. Designed with both comfort and durability in mind, this piece features playful details and kid-friendly construction for all-day wear.`,
    accessories: `Complete your look with our ${productName}. This carefully crafted accessory adds the perfect finishing touch to any outfit. Premium materials ensure both style and functionality.`,
  }
  return descriptions[category] || faker.commerce.productDescription()
}

// Generate short description
function generateShortDescription(productName) {
  const templates = [
    `Premium ${productName} with signature design details`,
    `Contemporary ${productName} for the modern wardrobe`,
    `Iconic ${productName} reimagined for today`,
    `Essential ${productName} with elevated craftsmanship`,
    `Timeless ${productName} with modern updates`,
  ]
  return templates[Math.floor(Math.random() * templates.length)]
}

// Generate product details
function generateDetails(category) {
  const baseDetails = [
    { title: 'Materials', content: 'Premium quality materials selected for durability and comfort' },
    { title: 'Care Instructions', content: 'Professional cleaning recommended. Store in dust bag when not in use.' },
    { title: 'Shipping', content: 'Free express shipping on orders over £500. 2-3 business days delivery.' },
  ]
  
  const categorySpecific = {
    sneakers: { title: 'Technology', content: 'Advanced cushioning system with responsive foam midsole' },
    menswear: { title: 'Fit Guide', content: 'Regular fit. Size up for a relaxed fit, size down for a slimmer silhouette.' },
    womenswear: { title: 'Styling', content: 'Versatile piece that transitions from day to evening wear' },
    kids: { title: 'Safety', content: 'Made with child-safe materials and secure fastenings' },
    accessories: { title: 'Features', content: 'Multiple compartments for organization and functionality' },
  }
  
  return [...baseDetails, categorySpecific[category] || baseDetails[0]]
}

async function seedDatabase() {
  console.log('🌱 Starting Sanity seed process...\n')
  
  try {
    // Step 1: Create categories
    console.log('📁 Creating categories...')
    const categoryDocs = []
    
    for (const cat of categories) {
      const doc = {
        _type: 'category',
        _id: `category-${cat.slug}`,
        name: cat.name,
        slug: { current: cat.slug },
        description: cat.description,
      }
      categoryDocs.push(doc)
    }
    
    // Create all categories
    for (const doc of categoryDocs) {
      await client.createOrReplace(doc)
      console.log(`  ✓ Created category: ${doc.name}`)
    }
    
    console.log('\n📦 Creating products...')
    
    // Step 2: Create products for each category
    let totalProducts = 0
    
    for (const [categorySlug, products] of Object.entries(productTemplates)) {
      const categoryRef = `category-${categorySlug}`
      console.log(`\n  Category: ${categorySlug}`)
      
      for (const product of products) {
        // Determine if product should be on sale, new, or featured
        const isOnSale = Math.random() > 0.7 // 30% chance
        const isNewArrival = Math.random() > 0.8 // 20% chance
        const isFeatured = Math.random() > 0.85 // 15% chance
        
        const productDoc = {
          _type: 'product',
          name: product.name,
          slug: { current: product.name.toLowerCase().replace(/\s+/g, '-') },
          description: generateDescription(product.name, categorySlug),
          shortDescription: generateShortDescription(product.name),
          price: product.basePrice,
          originalPrice: isOnSale ? Math.round(product.basePrice * 1.35) : undefined,
          sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}`,
          category: { _ref: categoryRef },
          sizes: product.sizes,
          colors: product.colors,
          stock: faker.number.int({ min: 0, max: 100 }),
          isNewArrival,
          isFeatured,
          isOnSale,
          details: generateDetails(categorySlug),
          // Note: In a real scenario, you'd upload actual images to Sanity
          // For now, we'll use placeholder references
          images: Array(3).fill(null).map((_, i) => ({
            _type: 'image',
            _key: faker.string.uuid(),
            asset: {
              _type: 'reference',
              _ref: 'image-placeholder', // You'd need to upload real images
            },
          })),
        }
        
        await client.create(productDoc)
        console.log(`    ✓ Created: ${product.name}`)
        totalProducts++
      }
    }
    
    console.log(`\n✅ Seed complete! Created ${categories.length} categories and ${totalProducts} products.`)
    console.log('\n📝 Next steps:')
    console.log('1. Upload product images in Sanity Studio (/studio)')
    console.log('2. Run the Medusa sync script to create matching products in Medusa')
    console.log('3. Set up inventory levels in Medusa admin\n')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
  console.log('💡 Create a .env.local file with your Sanity configuration')
  process.exit(1)
}

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ Missing SANITY_API_TOKEN environment variable')
  console.log('💡 You need a write token from sanity.io/manage to seed data')
  console.log('   Add SANITY_API_TOKEN=your-token to .env.local')
  process.exit(1)
}

// Run the seed
seedDatabase()