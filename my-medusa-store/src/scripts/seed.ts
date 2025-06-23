import { loadEnv, Modules } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const seedAdminUser = async () => {
  try {
    const medusaFramework = await import("@medusajs/framework");
    const app = await (medusaFramework as any).default({ directory: process.cwd() });
    
    const userModuleService = app.modules[Modules.USER];
    const authModuleService = app.modules[Modules.AUTH];
    
    // Create user
    const user = await userModuleService.createUsers({
      email: "admin@medusa-test.com",
      first_name: "Admin",
      last_name: "User",
    });
    
    console.log("User created:", user);
    
    // Create auth identity
    const authIdentity = await authModuleService.createAuthIdentities({
      provider_id: "emailpass",
      entity_id: user.id,
      provider_metadata: {
        email: "admin@medusa-test.com",
        password: "supersecret"
      }
    });
    
    console.log("Auth identity created:", authIdentity);
    console.log("Admin user setup complete!");
    console.log("Email: admin@medusa-test.com");
    console.log("Password: supersecret");
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

export default seedAdminUser;