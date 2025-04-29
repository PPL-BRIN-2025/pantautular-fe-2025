// app/auth/context.ts
import { createContext } from "react"
import { AuthStrategy } from "./strategies/base"
import { LoginRequestBody, User } from "@/types"

export const AuthContext = createContext<{
  login: (cred: LoginRequestBody) => Promise<any>
  logout: () => Promise<void>
  user: User | null
  strategy: AuthStrategy
} | null>(null)