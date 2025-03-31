import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import GeneralInformation from "../../app/components/dashboard/GeneralInformation"

describe("GeneralInformation Component", () => {
    it("renders correctly with the expected text", () => {
      render(<GeneralInformation />);
  
      // Check if the component contains the expected text
      const textElement = screen.getByText(/Informasi Kasus Penyakit Menular/i);
      expect(textElement).toBeInTheDocument();
    });
  
    it("applies the correct CSS classes", () => {
      render(<GeneralInformation />);
      
      const divElement = screen.getByText(/Informasi Kasus Penyakit Menular/i).parentElement;
      expect(divElement).toHaveClass("flex", "items-center", "justify-center", "bg-transparent", "text-black", "text-lg", "p-6", "rounded-lg", "shadow-md", "border");
    });
  });