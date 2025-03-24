import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import FilterSection from "../../app/components/dashboard/FilterSection"

describe("FilterSection Component", () => {
  it("renders correctly with the expected text", () => {
    render(<FilterSection />);

    // Check if the text "Place Filter Here" is present in the document
    const textElement = screen.getByText(/Place Filter Here/i);
    expect(textElement).toBeInTheDocument();
  });

  it("applies the correct CSS classes", () => {
    render(<FilterSection />);
    
    const divElement = screen.getByText(/Place Filter Here/i);
    expect(divElement).toHaveClass("flex", "items-center", "justify-center", "bg-transparent", "text-xl", "p-4", "rounded-lg", "pt-10", "text-black");
  });
});
