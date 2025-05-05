import { render, waitFor, screen } from "@testing-library/react"
import { AuthProvider } from "../../app/auth/provider"
import { useAuth } from "../../app/auth/hooks/useAuth"
import React from "react"
import userEvent from "@testing-library/user-event"
import { JWTStrategy } from "../../app/auth/strategies/jwt"

// Mock JWTStrategy
jest.mock("../../app/auth/strategies/jwt", () => ({
  JWTStrategy: jest.fn().mockImplementation(() => ({
    getUser: jest.fn().mockResolvedValue({
      id: '1',
      email: 'test@example.com',
      name: 'testUser',
      role: 'user'
    }),
    login: jest.fn().mockResolvedValue({
      access_token: 'mock-token'
    }),
    logout: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ access_token: 'mock-token' })
  })
);

const MockComponent = () => {
  const { user, login, logout } = useAuth()

  return (
    <div>
      <span data-testid="username">{user ? user.name : "Guest"}</span>
      <button onClick={() => login({ email: 'test@example.com', password: 'password' })} data-testid="login-button">Login</button>
      <button onClick={logout} data-testid="logout-button">Logout</button>
    </div>
  )
}

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initially fetches user", async () => {
    render(
      <AuthProvider>
        <MockComponent />
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("testUser")
    })
  })

  it("updates user after login", async () => {
    render(
      <AuthProvider>
        <MockComponent />
      </AuthProvider>
    )
    const loginButton = screen.getByTestId("login-button")
    await userEvent.click(loginButton)
    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("testUser")
    })
  })

  it("clears user after logout", async () => {
    render(
      <AuthProvider>
        <MockComponent />
      </AuthProvider>
    )
    const logoutButton = screen.getByTestId("logout-button")
    await userEvent.click(logoutButton)
    await waitFor(() => {
      expect(screen.getByTestId("username").textContent).toBe("Guest")
    })
  })
})
