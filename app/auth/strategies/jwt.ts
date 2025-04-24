// app/auth/strategies/jwt.ts
import { AuthStrategy } from "./base"

export class JWTStrategy implements AuthStrategy {
  async login(credentials: any) {
    // Simulate backend response
    return { token: "mock-jwt-token", user: { username: "testUser" } }
  }

  async logout() {
    return
  }

  async getUser() {
    return { username: "testUser" }
  }
}
