import { render, fireEvent, screen } from "@testing-library/react";
import GearToggleButton from "../../../../app/components/floating_buttons/SeverityButton";

describe("GearToggleButton", () => {
  it("renders without crashing with default props", () => {
    const { getByRole } = render(<GearToggleButton />);
    expect(getByRole("button")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { getByRole, rerender } = render(<GearToggleButton size="sm" />);
    expect(getByRole("button")).toHaveClass("h-10 w-10");

    rerender(<GearToggleButton size="md" />);
    expect(getByRole("button")).toHaveClass("h-12 w-12");

    rerender(<GearToggleButton size="lg" />);
    expect(getByRole("button")).toHaveClass("h-16 w-16");
  });

  it("toggles isActive state and applies correct styles on click", () => {
    const { getByRole } = render(<GearToggleButton />);
    const button = getByRole("button");

    expect(button).toHaveClass("bg-white border border-gray-200");
    fireEvent.click(button);
    expect(button).toHaveClass("bg-red-500");
  });

  it("calls onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    const { getByRole } = render(<GearToggleButton onClick={mockOnClick} />);
    fireEvent.click(getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("applies additional class names", () => {
    const { getByRole } = render(<GearToggleButton className="custom-class" />);
    expect(getByRole("button")).toHaveClass("custom-class");
  });

  it("sets correct aria-label", () => {
    const { getByRole } = render(<GearToggleButton ariaLabel="Custom Label" />);
    expect(getByRole("button")).toHaveAttribute("aria-label", "Custom Label");
  });

  test('shows and hides tooltip on hover', () => {
    render(<GearToggleButton />);
    const button = screen.getByRole('button');

    // Tooltip belum muncul
    expect(screen.queryByText(/Peta Tematik: Keparahan/i)).not.toBeInTheDocument();

    // Hover: tooltip muncul
    fireEvent.mouseEnter(button);
    expect(screen.getByText(/Peta Tematik: Keparahan/i)).toBeInTheDocument();

    // Unhover: tooltip hilang
    fireEvent.mouseLeave(button);
    expect(screen.queryByText(/Peta Tematik: Keparahan/i)).not.toBeInTheDocument();
  });
});