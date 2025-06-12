export default async function ({ container }) {
  const query = container.resolve("query")
  
  try {
    console.log("🛒 Adding prices to all product variants...\n")
    
    // Get all products with variants
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
    
    // Get default region (should be GBP)
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
    })
    
    const defaultRegion = regions.find(r => r.currency_code === "gbp") || regions[0]
    console.log(`💰 Using region: ${defaultRegion.name} (${defaultRegion.currency_code.toUpperCase()})`)
    
    // Define price structure (amounts in pence)
    const priceMap = {
      "t-shirt": 2500,      // £25.00
      "sweatshirt": 4500,   // £45.00
      "sweatpants": 4000,   // £40.00
      "shorts": 2000,       // £20.00
      "tshirts": 3500,      // £35.00 (custom tshirt)
    }
    
    let updatedCount = 0
    
    for (const product of products) {
      console.log(`\n📦 Processing: ${product.title}`)
      
      const basePrice = priceMap[product.handle] || 3000 // Default £30
      
      for (const variant of product.variants) {
        // Check if variant already has prices
        const existingPrices = variant.prices || []
        const hasGBPPrice = existingPrices.some(p => p.currency_code === "gbp")
        
        if (hasGBPPrice) {
          console.log(`   ✅ ${variant.title} - Already has GBP price`)
          continue
        }
        
        try {
          // Add price to variant
          await query.graph({
            entity: "price",
            fields: ["id", "amount", "currency_code"],
            filters: {},
            create: {
              amount: basePrice,
              currency_code: "gbp",
              variant_id: variant.id,
              region_id: defaultRegion.id
            }
          })
          
          console.log(`   💰 ${variant.title} - Added £${(basePrice/100).toFixed(2)}`)
          updatedCount++
          
        } catch (error) {
          console.log(`   ❌ ${variant.title} - Error: ${error.message}`)
        }
      }
    }
    
    console.log(`\n🎉 Successfully added prices to ${updatedCount} variants!`)
    console.log("\n✅ Your store is now ready to accept orders!")
    
  } catch (error) {
    console.error("❌ Error adding prices:", error.message)
    console.error(error.stack)
  }
}