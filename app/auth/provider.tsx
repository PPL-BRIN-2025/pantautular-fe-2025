"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthContext } from "./context"
import { JWTStrategy } from "./strategies/jwt"
import { LoginRequestBody, User } from "../../types"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const strategy = new JWTStrategy()

  useEffect(() => {
    strategy.getUser().then(setUser)
  }, [])

  const login = async (credentials: LoginRequestBody) => {
    const res = await strategy.login(credentials)
    const userData:User = await strategy.getUser()
    setUser(userData)
    return res
  }
  
  const logout = async () => {
    await strategy.logout()
    setUser(null)
  }

  const value = useMemo(() => ({
    login,
    logout,
    user,
    strategy
  }), [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}