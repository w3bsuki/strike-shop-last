import { MedusaModule } from "@medusajs/framework";

const storeModule = MedusaModule.resolve("store");
const regionModule = MedusaModule.resolve("region");
const apiKeyModule = MedusaModule.resolve("api_key");

// List existing regions and API keys
const regions = await regionModule.listRegions();
const apiKeys = await apiKeyModule.listApiKeys();

console.log("=== EXISTING REGIONS ===");
regions.forEach((region, index) => {
  console.log(`${index + 1}. ${region.name} (${region.id}) - ${region.currency_code}`);
});

console.log("\n=== EXISTING API KEYS ===");
apiKeys.forEach((key, index) => {
  console.log(`${index + 1}. ${key.title} (${key.type}): ${key.token}`);
});

// If no regions exist, create one
if (regions.length === 0) {
  console.log("\n=== CREATING DEFAULT REGION ===");
  const region = await regionModule.createRegions({
    name: "Default Region",
    currency_code: "usd",
    countries: ["us"]
  });
  console.log(`Created region: ${region.name} (${region.id})`);
}

// If no publishable keys exist, create one
const publishableKeys = apiKeys.filter(key => key.type === "publishable");
if (publishableKeys.length === 0) {
  console.log("\n=== CREATING PUBLISHABLE KEY ===");
  const key = await apiKeyModule.createApiKeys({
    title: "Default Store Key",
    type: "publishable"
  });
  console.log(`Created publishable key: ${key.token}`);
}

// Output the env vars
const finalRegions = regions.length > 0 ? regions : await regionModule.listRegions();
const finalKeys = publishableKeys.length > 0 ? publishableKeys : await apiKeyModule.listApiKeys({ type: "publishable" });

console.log("\n=== ENVIRONMENT VARIABLES ===");
if (finalRegions.length > 0) {
  console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID=${finalRegions[0].id}`);
}
if (finalKeys.length > 0) {
  console.log(`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${finalKeys[0].token}`);
}