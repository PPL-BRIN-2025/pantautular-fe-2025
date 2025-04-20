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
  
    test("email input has correct type attribute", () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });
  
    test("submit button has correct type and styling", () => {
      render(<ForgotPasswordPage />);
      
      const submitButton = screen.getByRole("button", { name: /kirim/i });
      expect(submitButton).toHaveAttribute("type", "submit");
      expect(submitButton).toHaveClass("bg-[#0066CC]");
      expect(submitButton).toHaveClass("text-white");
    });
  
    test("form layout renders correctly", () => {
      render(<ForgotPasswordPage />);
      
      // Check for the two-column layout
      const flexContainer = document.querySelector(".flex.min-h-screen.flex-col.md\\:flex-row");
      expect(flexContainer).toBeInTheDocument();
      
      // Check for left and right sides
      const leftSide = document.querySelector(".md\\:w-1\\/2");
      expect(leftSide).toBeInTheDocument();
      
      const rightSide = document.querySelector(".flex.flex-col.justify-center");
      expect(rightSide).toBeInTheDocument();
    });
  
    test("allows form submission", () => {
      render(<ForgotPasswordPage />);
      
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
      
      const form = emailInput.closest("form");
      const submitButton = screen.getByRole("button", { name: /kirim/i });

      expect(() => fireEvent.click(submitButton)).not.toThrow();
    });
  });