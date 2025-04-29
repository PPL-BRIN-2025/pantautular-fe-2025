// app/auth/strategies/jwt.ts
import { authService } from "@/services/authService";
import { AuthStrategy } from "./base"
import { TokenPayload, User } from "@/types";

export class JWTStrategy implements AuthStrategy {
  private token: string | null = null;
  private tokenPayload: TokenPayload | null = null;
  
  // Helper method to decode JWT token
  private decodeToken(token: string): TokenPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token', error);
      throw new Error('Invalid token format');
    }
  }
  
  async login(credentials: { email: string; password: string }) {
    try {
      const data = await authService.login(credentials);
      this.token = data.access_token;

      // Decode and store the token payload
      if (this.token) {
        this.tokenPayload = this.decodeToken(this.token);
      }
      const user:User = {
        id: this.tokenPayload!.user_id,
        email: this.tokenPayload!.email,
        name: this.tokenPayload!.name,
        role: this.tokenPayload!.role,
      }
      localStorage.setItem("token", this.token!);
      localStorage.setItem("user", JSON.stringify(user));
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  isTokenExpired(): boolean {
    if (!this.tokenPayload) return true;
    
    // Check if token is expired (exp is in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= this.tokenPayload.exp;
  };

  async getUser() {
    return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
  }

  async logout() {
    // hapus token dari localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // setuser menjadi null
    this.token = null;
    this.tokenPayload = null;
    // redirect ke login
    return;
  }
}