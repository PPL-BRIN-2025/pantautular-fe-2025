import { render, fireEvent } from "@testing-library/react";
import TemperatureButton from "../../../../app/components/floating_buttons/TemperatureButton";

describe("TemperatureButton", () => {
  it("renders without crashing with default props", () => {
    const { getByRole } = render(<TemperatureButton />);
    expect(getByRole("button")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { getByRole, rerender } = render(<TemperatureButton size="sm" />);
    expect(getByRole("button")).toHaveClass("h-10 w-10");

    rerender(<TemperatureButton size="md" />);
    expect(getByRole("button")).toHaveClass("h-12 w-12");

    rerender(<TemperatureButton size="lg" />);
    expect(getByRole("button")).toHaveClass("h-16 w-16");
  });

  it("toggles isActive state and applies correct styles on click", () => {
    const { getByRole } = render(<TemperatureButton />);
    const button = getByRole("button");

    expect(button).toHaveClass("bg-white text-red-500 border border-gray-200");
    fireEvent.click(button);
    expect(button).toHaveClass("bg-red-500 text-white");
  });

  it("calls onClick handler when clicked", () => {
    const mockOnClick = jest.fn();
    const { getByRole } = render(<TemperatureButton onClick={mockOnClick} />);
    fireEvent.click(getByRole("button"));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("applies additional class names", () => {
    const { getByRole } = render(<TemperatureButton className="custom-class" />);
    expect(getByRole("button")).toHaveClass("custom-class");
  });

  it("toggles aria-pressed attribute correctly", () => {
    const { getByRole } = render(<TemperatureButton />);
    const button = getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
