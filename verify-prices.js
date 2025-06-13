export default async function ({ container }) {
  const query = container.resolve("query")
  
  try {
    console.log("🔍 Verifying prices were added correctly...\n")
    
    // Get all products with their prices
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id", 
        "title", 
        "handle",
        "variants.id",
        "variants.title", 
        "variants.prices.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.prices.region_id"
      ],
    })
    
    // Get regions
    const { data: regions } = await query.graph({
      entity: "region", 
      fields: ["id", "name", "currency_code"],
    })
    
    console.log("💰 PRICE VERIFICATION:")
    for (const product of products) {
      console.log(`\n📦 ${product.title}:`)
      
      for (const variant of product.variants) {
        const prices = variant.prices || []
        
        if (prices.length > 0) {
          for (const price of prices) {
            const region = regions.find(r => r.id === price.region_id)
            const amount = price.amount / 100
            console.log(`   ✅ ${variant.title}: ${price.currency_code.toUpperCase()} £${amount.toFixed(2)} (${region?.name || 'Unknown region'})`)
          }
        } else {
          console.log(`   ❌ ${variant.title}: NO PRICES`)
        }
      }
    }
    
    // Check regions
    console.log("\n🌍 Available regions:")
    for (const region of regions) {
      console.log(`   ${region.name}: ${region.currency_code.toUpperCase()} (ID: ${region.id})`)
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}