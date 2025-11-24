import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocationButton from "../../../app/components/floating_buttons/LocationButton";

describe("LocationButton", () => {
  test("calls onClick handler when pressed", () => {
    const onClick = jest.fn();
    render(<LocationButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: /Location/i });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("shows helper tooltip on hover", () => {
    render(<LocationButton />);
    const button = screen.getByRole("button", { name: /Location/i });
    fireEvent.mouseEnter(button);
    expect(screen.getByText(/Temukan Lokasi Saya/i)).toBeInTheDocument();
    fireEvent.mouseLeave(button);
    expect(screen.queryByText(/Temukan Lokasi Saya/i)).not.toBeInTheDocument();
  });

  test("respects size, variant, and disabled props", () => {
    const { container } = render(
      <LocationButton size="lg" variant="outline" disabled className="custom" />
    );
    const button = screen.getByRole("button", { name: /Location/i });
    expect(button).toHaveClass("w-16 h-16");
    expect(button).toHaveClass("border border-gray-300");
    expect(button).toHaveClass("custom");
    expect(button).toBeDisabled();

    // icon should match size selection
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("w-8 h-8");
  });

  test("supports small and default sizes", () => {
    const { rerender } = render(<LocationButton size="sm" variant="default" />);
    let button = screen.getByRole("button", { name: /Location/i });
    expect(button).toHaveClass("w-8 h-8");
    let icon = button.querySelector("svg");
    expect(icon).toHaveClass("w-4 h-4");

    rerender(<LocationButton size="md" />);
    button = screen.getByRole("button", { name: /Location/i });
    icon = button.querySelector("svg");
    expect(button).toHaveClass("w-10 h-10");
    expect(icon).toHaveClass("w-6 h-6");
  });
});
