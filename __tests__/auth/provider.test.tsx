import { render, waitFor, screen } from "@testing-library/react"
import { AuthProvider } from "../../app/auth/provider"
import { useAuth } from "../../app/auth/hooks/useAuth"
import React from "react"
import userEvent from "@testing-library/user-event"

const MockComponent = () => {
  const { user, login, logout } = useAuth()

  return (
    <div>
      <span data-testid="username">{user ? user.username : "Guest"}</span>
      <button onClick={() => login({})} data-testid="login-button">Login</button>
      <button onClick={logout} data-testid="logout-button">Logout</button>
    </div>
  )
}

describe("AuthProvider", () => {
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
