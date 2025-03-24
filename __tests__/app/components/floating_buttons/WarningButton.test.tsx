import { render, fireEvent } from "@testing-library/react";
import WarningButton from "../../../../app/components/floating_buttons/WarningButton";

describe("WarningButton", () => {
  it("renders without crashing with default props", () => {
    const { getByRole } = render(<WarningButton />);
    expect(getByRole("button")).toBeInTheDocument();
  });

  it("applies size classes correctly", () => {
    const { getByRole, rerender } = render(<WarningButton size="sm" />);
    expect(getByRole("button")).toHaveClass("w-8 h-8");

    rerender(<WarningButton size="md" />);
    expect(getByRole("button")).toHaveClass("w-10 h-10");

    rerender(<WarningButton size="lg" />);
    expect(getByRole("button")).toHaveClass("w-16 h-16");
  });

  it("applies variant classes correctly", () => {
    const { getByRole, rerender } = render(<WarningButton variant="filled" />);
    expect(getByRole("button")).toHaveClass("bg-red-500 text-white hover:bg-red-600");

    rerender(<WarningButton variant="outline" />);
    expect(getByRole("button")).toHaveClass("bg-white text-red-500 border-2 border-red-500 hover:bg-red-50");
  });

  it("shows and hides warning message on hover", () => {
    const { getByRole, queryByText } = render(<WarningButton />);
    const button = getByRole("button");

    expect(queryByText("Terdapat kasus penyakit menular di sekitarmu.")).not.toBeInTheDocument();
    fireEvent.mouseEnter(button);
    expect(queryByText("Terdapat kasus penyakit menular di sekitarmu.")).toBeInTheDocument();
    fireEvent.mouseLeave(button);
    expect(queryByText("Terdapat kasus penyakit menular di sekitarmu.")).not.toBeInTheDocument();
  });

  it("sets correct aria-label", () => {
    const { getByRole } = render(<WarningButton label="Custom Warning" />);
    expect(getByRole("button")).toHaveAttribute("aria-label", "Custom Warning");
  });

  it("applies additional class names", () => {
    const { getByRole } = render(<WarningButton className="custom-class" />);
    expect(getByRole("button")).toHaveClass("custom-class");
  });

  it("renders an AlertTriangle icon", () => {
    const { container } = render(<WarningButton />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});