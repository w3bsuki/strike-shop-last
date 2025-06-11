"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth-store"

export default function TestAuth() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("password123")
  const [result, setResult] = useState("")
  const { login, isLoading, user } = useAuthStore()

  const handleLogin = async () => {
    try {
      setResult("Attempting login...")
      const success = await login(email, password)
      if (success) {
        setResult("Login successful! User: " + JSON.stringify(user))
      } else {
        setResult("Login failed")
      }
    } catch (error: any) {
      setResult("Error: " + error.message)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Authentication</h1>
      <div className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full"
        />
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isLoading ? "Loading..." : "Test Login"}
        </button>
        <div className="mt-4 p-4 bg-gray-100">
          <pre>{result}</pre>
        </div>
      </div>
    </div>
  )
}