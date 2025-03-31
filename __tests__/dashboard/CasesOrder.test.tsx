import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CasesOrder from "../../app/components/dashboard/CasesOrder"

describe("CasesOrder Component", () => {
    it("renders correctly with the expected text", () => {
      render(<CasesOrder />);
  
      const textElement = screen.getByText(/Urutan Kasus/i);
      expect(textElement).toBeInTheDocument();
    });
  
    it("applies the correct CSS classes", () => {
      render(<CasesOrder />);
      
      const divElement = screen.getByText(/Urutan Kasus/i).parentElement;
      expect(divElement).toHaveClass("flex", "items-center", "justify-center", "bg-transparent", "text-black", "text-lg", "p-6", "rounded-lg", "shadow-md", "border");
    });
  });