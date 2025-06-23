import { MedusaContainer } from "@medusajs/framework/types"

export default async function createAdmin(container: MedusaContainer) {
  const inviteService = container.resolve("inviteService")
  const userService = container.resolve("userService")
  
  try {
    // Create an invite
    const invite = await inviteService.create({
      user_email: "admin@medusa-test.com",
      role: "admin"
    })
    
    console.log("Invite created:", invite.token)
    
    // Accept the invite to create the user
    const user = await inviteService.accept(invite.token, {
      user: {
        first_name: "Admin",
        last_name: "User",
        password: "supersecret"
      }
    })
    
    console.log("Admin user created successfully!")
    console.log("Email: admin@medusa-test.com")
    console.log("Password: supersecret")
    
  } catch (error) {
    console.error("Error creating admin:", error)
  }
}