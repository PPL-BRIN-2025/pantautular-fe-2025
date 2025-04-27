// app/auth/context.ts
import { createContext } from "react"
import { AuthStrategy } from "./strategies/base"

export const AuthContext = createContext<{
  login: (cred: any) => Promise<any>
  logout: () => Promise<void>
  user: any
  strategy: AuthStrategy
} | null>(null)