import { render, screen, fireEvent } from "@testing-library/react";
import ForgotPasswordPage from "../../../app/forgot-password/page";

describe("ForgotPasswordPage Component", () => {
    test("renders the page with all key elements", () => {
      render(<ForgotPasswordPage />);
      
      // Check for heading
      expect(screen.getByRole("heading", { name: /lupa kata sandi/i })).toBeInTheDocument();
      
      // Check for logo and illustration
      expect(screen.getByText(/pantau penyebaran, cegah penularan/i)).toBeInTheDocument();
      
      // Check for form elements
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/masukkan email terdaftar/i)).toBeInTheDocument();
      expect(screen.getByText(/isi dengan email yang sudah terdaftar sebelumnya/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /kirim/i })).toBeInTheDocument();
    });
  
    test("allows typing in email input field", () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
      
      expect(emailInput).toHaveValue("user@example.com");
    });
  });