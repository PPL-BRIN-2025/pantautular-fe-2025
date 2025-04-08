import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InformationSection from "../../app/components/dashboard/InformationSection";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/dashboard",
}));

// Mock child components
jest.mock("../../app/components/dashboard/GeneralInformation", () => () => (
  <div>General Information Content</div>
));

jest.mock("../../app/components/dashboard/CasesOrder", () => () => (
  <div>Cases Order Content</div>
));

jest.mock("../../app/components/floating_buttons/DashboardButton", () => () => (
  <button>Dashboard</button>
));

jest.mock("../../app/components/floating_buttons/MapButton", () => ({
  MapButton: () => <button>Map</button>,
}));

describe("InformationSection", () => {
  it("renders with correct initial layout", () => {
    render(<InformationSection />);
    
    // Check main container
    const container = document.querySelector('.flex.flex-col.h-full');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-transparent');
    expect(container).toHaveClass('text-white');
    expect(container).toHaveClass('text-xl');
    expect(container).toHaveClass('p-4');
    expect(container).toHaveClass('pt-8');
    expect(container).toHaveClass('pl-8');

    // Check header wrapper
    const headerWrapper = document.querySelector('.fixed.flex.justify-between.z-50');
    expect(headerWrapper).toBeInTheDocument();
    expect(headerWrapper).toHaveClass('bg-[#ebf3f5]');
    expect(headerWrapper).toHaveClass('w-full');
    expect(headerWrapper).toHaveClass('h-24');

    // Check tab buttons container
    const tabButtonsContainer = document.querySelector('.fixed.flex.gap-4.bg-white');
    expect(tabButtonsContainer).toBeInTheDocument();
    expect(tabButtonsContainer).toHaveClass('p-2');
    expect(tabButtonsContainer).toHaveClass('shadow-md');
    expect(tabButtonsContainer).toHaveClass('rounded-t-lg');
    expect(tabButtonsContainer).toHaveClass('w-5/12');

    // Check content area
    const contentArea = document.querySelector('.flex-grow.mt-24');
    expect(contentArea).toBeInTheDocument();
  });

  it("renders GeneralInformation by default", () => {
    render(<InformationSection />);
    expect(screen.getByText("General Information Content")).toBeInTheDocument();
    expect(screen.queryByText("Cases Order Content")).not.toBeInTheDocument();
  });

  it("switches to CasesOrder when 'Urutan Kasus' is clicked", () => {
    render(<InformationSection />);
    const casesOrderButton = screen.getByRole("button", { name: /Urutan Kasus/i });
    fireEvent.click(casesOrderButton);

    expect(screen.getByText("Cases Order Content")).toBeInTheDocument();
    expect(screen.queryByText("General Information Content")).not.toBeInTheDocument();
  });

  it("switches back to GeneralInformation when 'Informasi Umum' is clicked", () => {
    render(<InformationSection />);
    // Switch to CasesOrder first
    const casesOrderButton = screen.getByRole("button", { name: /Urutan Kasus/i });
    fireEvent.click(casesOrderButton);
    expect(screen.getByText("Cases Order Content")).toBeInTheDocument();

    // Then switch back to GeneralInformation
    const generalInfoButton = screen.getByRole("button", { name: /Informasi Umum/i });
    fireEvent.click(generalInfoButton);
    expect(screen.getByText("General Information Content")).toBeInTheDocument();
    expect(screen.queryByText("Cases Order Content")).not.toBeInTheDocument();
  });

  it("updates button styles when switching tabs", () => {
    render(<InformationSection />);
    const generalInfoButton = screen.getByRole("button", { name: /Informasi Umum/i });
    const casesOrderButton = screen.getByRole("button", { name: /Urutan Kasus/i });

    // Initial state
    expect(generalInfoButton).toHaveClass("border-blue-500");
    expect(generalInfoButton).toHaveClass("text-black");
    expect(casesOrderButton).toHaveClass("border-transparent");
    expect(casesOrderButton).toHaveClass("text-gray-500");

    // After switching
    fireEvent.click(casesOrderButton);
    expect(generalInfoButton).toHaveClass("border-transparent");
    expect(generalInfoButton).toHaveClass("text-gray-500");
    expect(casesOrderButton).toHaveClass("border-blue-500");
    expect(casesOrderButton).toHaveClass("text-black");
  });

  it("renders floating buttons in correct position", () => {
    render(<InformationSection />);
    const buttonsContainer = document.querySelector('.fixed.right-5.z-20.flex.gap-2');
    expect(buttonsContainer).toBeInTheDocument();
  });
});
