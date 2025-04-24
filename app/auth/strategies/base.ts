// app/auth/strategies/base.ts
export interface AuthStrategy {
    login(credentials: any): Promise<any>
    logout(): Promise<void>
    getUser(): Promise<any>
  }