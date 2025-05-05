import { JWTStrategy } from "../../app/auth/strategies/jwt"

describe("JWTStrategy", () => {
  const jwt = new JWTStrategy()

  it("logs in successfully", async () => {
    const res = await jwt.login({ username: "x", password: "x" }) // NOSONAR – test data
    expect(res.token).toBe("mock-jwt-token")
    expect(res.user.username).toBe("testUser")
  })

  it("fetches user correctly", async () => {
    const user = await jwt.getUser()
    expect(user.username).toBe("testUser")
  })

  it("logs out without error", async () => {
    await expect(jwt.logout()).resolves.toBeUndefined()
  })
})

// app/auth/strategies/base.ts
export interface AuthStrategy {
    login(credentials: any): Promise<any>
    logout(): Promise<void>
    getUser(): Promise<any>
  }
  

