export default async function ({ container }) {
  const query = container.resolve("query")
  
  try {
    // Get all regions
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code"],
    })
    
    console.log("🌍 Available regions:")
    for (const region of regions) {
      console.log(`   ${region.name}: ${region.currency_code.toUpperCase()} (ID: ${region.id})`)
    }
    
    const gbpRegion = regions.find(r => r.currency_code === "gbp")
    if (gbpRegion) {
      console.log(`\n✅ GBP Region ID: ${gbpRegion.id}`)
      console.log(`\nAdd this to your .env.local:`)
      console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID=${gbpRegion.id}`)
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}