"use client"

import { useState, useEffect, useMemo } from "react"
import { AuthContext } from "./context"
import { JWTStrategy } from "./strategies/jwt"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ username: string } | null>(null)
  const strategy = new JWTStrategy()

  useEffect(() => {
    strategy.getUser().then(setUser)
  }, [])

  const login = async (credentials: any) => {
    const res = await strategy.login(credentials)
    setUser(res.user)
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