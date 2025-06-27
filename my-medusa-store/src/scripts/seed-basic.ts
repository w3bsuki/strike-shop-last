import { execSync } from 'child_process';

async function seedBasic() {
  console.log("🚀 Running basic Medusa setup...");
  
  try {
    console.log("📦 Running database migrations...");
    execSync('npm run build', { stdio: 'inherit' });
    execSync('medusa migrations run', { stdio: 'inherit' });
    
    console.log("✅ Basic setup completed!");
    console.log("📋 Next steps:");
    console.log("   1. Start Medusa: npm run dev");
    console.log("   2. Create admin user: medusa user --email admin@example.com --password password");
    console.log("   3. Access admin: http://localhost:9000/app");
    console.log("   4. Create store configuration manually through the admin panel");
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedBasic()
    .then(() => {
      console.log("✅ Setup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}

export default seedBasic;