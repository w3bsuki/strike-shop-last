const { execSync } = require('child_process');

async function setupStore() {
  console.log('🚀 Setting up store configuration...');
  
  try {
    // Create a store using Medusa CLI exec
    console.log('📋 Creating store and regions...');
    
    const setupScript = `
const { MedusaModule } = require("@medusajs/framework");

async function createStoreData() {
  try {
    console.log("Starting store setup...");
    
    const storeModule = MedusaModule.resolve("store");
    const regionModule = MedusaModule.resolve("region");
    const apiKeyModule = MedusaModule.resolve("api_key");
    
    // Create store
    const stores = await storeModule.listStores();
    let store;
    
    if (stores.length === 0) {
      console.log("Creating store...");
      store = await storeModule.createStores({
        name: "Strike Shop",
        supported_currencies: ["usd", "eur", "gbp"],
        default_currency_code: "usd"
      });
    } else {
      store = stores[0];
      console.log("Store already exists:", store.name);
    }
    
    // Create regions
    const regions = await regionModule.listRegions();
    
    if (regions.length === 0) {
      console.log("Creating regions...");
      
      const usRegion = await regionModule.createRegions({
        name: "United States",
        currency_code: "usd",
        countries: ["us"],
        payment_providers: ["stripe"]
      });
      
      console.log("Created US region:", usRegion.id);
    }
    
    // Create publishable API key
    console.log("Creating publishable API key...");
    
    const publishableKey = await apiKeyModule.createApiKeys({
      title: "Development Store Key",
      type: "publishable",
      sales_channels: []
    });
    
    console.log("\\n✅ Store setup complete!");
    console.log("🔑 Publishable Key:", publishableKey.token);
    console.log("\\nAdd this to your .env.local:");
    console.log(\`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=\${publishableKey.token}\`);
    
    // Get the first region ID
    const allRegions = await regionModule.listRegions();
    if (allRegions.length > 0) {
      console.log(\`NEXT_PUBLIC_MEDUSA_REGION_ID=\${allRegions[0].id}\`);
    }
    
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  }
}

createStoreData();
`;

    // Write the script to a temporary file
    require('fs').writeFileSync('/tmp/medusa-setup.js', setupScript);
    
    // Execute the script
    execSync('cd /home/w3bsuki/MATRIX/projects/current/strike-shop-1-main/my-medusa-store && node /tmp/medusa-setup.js', { 
      stdio: 'inherit' 
    });
    
    console.log('\\n✅ Store setup completed!');
    console.log('📝 Please update your .env.local with the new keys shown above');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    console.log('\\n🔧 Manual setup required:');
    console.log('1. Open http://localhost:9000/app');
    console.log('2. Login with admin@strike-shop.com / password123');
    console.log('3. Go to Settings → Store → Regions and create a region');
    console.log('4. Go to Settings → Store → API Keys and create a publishable key');
    console.log('5. Update .env.local with the new keys');
  }
}

setupStore();