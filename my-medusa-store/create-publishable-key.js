export default async function handler({ container }) {
  try {
    const apiKeyService = container.resolve('api_key');
    console.log("✅ Found api_key service");
    console.log("Service methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(apiKeyService)));
    
    // Try to list existing API keys first
    try {
      const existingKeys = await apiKeyService.list({ type: "publishable" });
      console.log("📋 Existing publishable keys:", existingKeys);
      
      if (existingKeys.length > 0) {
        const firstKey = existingKeys[0];
        console.log(`\n✅ Found existing publishable key: ${firstKey.id}`);
        console.log(`Add to .env.local: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${firstKey.id}`);
        return firstKey;
      }
    } catch (listError) {
      console.log("List attempt error:", listError.message);
    }
    
    // Try to create new key
    try {
      const newKey = await apiKeyService.create({
        title: "Default Frontend Key",
        type: "publishable"
      });
      console.log("✅ Created new publishable key:", newKey);
      console.log(`\nAdd to .env.local: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${newKey.id}`);
      return newKey;
    } catch (createError) {
      console.log("Create attempt error:", createError.message);
    }
    
    // Try alternative method names
    const methods = ['createApiKey', 'createApiKeys', 'listApiKeys'];
    for (const method of methods) {
      if (typeof apiKeyService[method] === 'function') {
        console.log(`🔧 Trying method: ${method}`);
        try {
          if (method.includes('create')) {
            const result = await apiKeyService[method]({
              title: "Default Frontend Key",
              type: "publishable"
            });
            console.log(`✅ Success with ${method}:`, result);
            return result;
          } else if (method.includes('list')) {
            const result = await apiKeyService[method]();
            console.log(`📋 Keys from ${method}:`, result);
          }
        } catch (methodError) {
          console.log(`❌ ${method} failed:`, methodError.message);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error with api_key service:", error.message);
  }
  
  console.log("\n💡 Fallback: Use a dummy key for testing or create via admin dashboard");
  console.log("For testing, add to .env.local: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_test_dummy");
}