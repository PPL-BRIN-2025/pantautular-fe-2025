import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocationButton from "../../app/components/floating_buttons/LocationButton";

describe("LocationButton", () => {
  test("renders with tooltip on hover and respects size/variant", () => {
    const onClick = jest.fn();
    render(<LocationButton size="lg" variant="outline" onClick={onClick} />);

    const btn = screen.getByRole("button", { name: /location/i });
    expect(btn).toHaveClass("w-16");

    fireEvent.mouseEnter(btn);
    expect(screen.getByText(/Temukan Lokasi Saya/)).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalled();
  });

  test("applies disabled styles", () => {
    render(<LocationButton disabled />);
    const btn = screen.getByRole("button", { name: /location/i });
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/opacity-50/);
  });
});
