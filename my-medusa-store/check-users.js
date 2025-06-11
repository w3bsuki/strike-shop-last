export default async function ({ container }) {
  const userService = container.resolve("userService")
  
  try {
    const users = await userService.list()
    console.log("Existing users:")
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}`)
    })
    
    if (users.length === 0) {
      console.log("No users found. Creating admin user...")
      const newUser = await userService.create({
        email: "admin@example.com",
        password: "password123"
      })
      console.log(`Created user: ${newUser.email}`)
    }
  } catch (error) {
    console.error("Error:", error.message)
  }
}