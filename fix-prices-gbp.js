export default async function ({ container }) {
  const query = container.resolve("query")
  
  try {
    console.log("🇬🇧 Setting up GBP pricing for Strike Shop...\n")
    
    // First, check if we have a GBP region
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
    })
    
    let gbpRegion = regions.find(r => r.currency_code === "gbp")
    
    if (!gbpRegion) {
      console.log("🆕 Creating GBP region...")
      
      // Create GBP region
      const { data: newRegion } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
        filters: {},
        create: {
          name: "United Kingdom",
          currency_code: "gbp",
          metadata: {}
        }
      })
      
      gbpRegion = newRegion
      console.log(`✅ Created GBP region: ${gbpRegion.name}`)
    } else {
      console.log(`✅ Using existing GBP region: ${gbpRegion.name}`)
    }
    
    // Get all products with variants and prices
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
        "variants.prices.currency_code"
      ],
    })
    
    // Define proper GBP prices (in pence)
    const priceMap = {
      "t-shirt": 2500,      // £25.00
      "sweatshirt": 4500,   // £45.00
      "sweatpants": 4000,   // £40.00
      "shorts": 2000,       // £20.00
      "tshirts": 3500,      // £35.00 (custom tshirt)
    }
    
    let pricesAdded = 0
    
    for (const product of products) {
      console.log(`\n📦 ${product.title}`)
      
      const basePrice = priceMap[product.handle] || 3000 // Default £30
      
      for (const variant of product.variants) {
        // Check if variant already has GBP price
        const gbpPrice = variant.prices?.find(p => p.currency_code === "gbp")
        
        if (gbpPrice) {
          console.log(`   💰 ${variant.title}: Already has GBP price £${(gbpPrice.amount/100).toFixed(2)}`)
          continue
        }
        
        try {
          // Add GBP price
          await query.graph({
            entity: "price",
            fields: ["id"],
            filters: {},
            create: {
              amount: basePrice,
              currency_code: "gbp",
              variant_id: variant.id,
              region_id: gbpRegion.id
            }
          })
          
          console.log(`   ✅ ${variant.title}: Added £${(basePrice/100).toFixed(2)}`)
          pricesAdded++
          
        } catch (error) {
          console.log(`   ❌ ${variant.title}: Error - ${error.message}`)
        }
      }
    }
    
    console.log(`\n🎉 Successfully added ${pricesAdded} GBP prices!`)
    
    // Now update frontend environment to use GBP region
    console.log(`\n🔧 Update your .env.local with:`)
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID=${gbpRegion.id}`)
    console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_29b82d9f59f0a63f3af01b371bbb4213c0f335610e50c3b9db479d3cea8247ae`)
    
  } catch (error) {
    console.error("❌ Error:", error.message)
    console.error(error.stack)
  }
}