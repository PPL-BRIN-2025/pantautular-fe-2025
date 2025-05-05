import { render } from "@testing-library/react"
import { useAuth } from "../../app/auth/hooks/useAuth"
import React from "react"

describe("useAuth", () => {
  it("throws error outside AuthProvider", () => {
    const ErrorComponent = () => {
      useAuth()
      return <div>Should fail</div>
    }

    expect(() => render(<ErrorComponent />)).toThrowError(
      "useAuth must be used within AuthProvider"
    )
  })
})
