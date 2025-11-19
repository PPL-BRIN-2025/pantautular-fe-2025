import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

jest.mock("../../app/expert-dashboard/ExpertDashboardPage", () => ({
  __esModule: true,
  default: () => <div data-testid="expert-route">Expert Dashboard</div>,
}));

import ExpertDashboardRoute from "../../app/expert-dashboard/page";

test("ExpertDashboardRoute delegates to main page component", () => {
  render(<ExpertDashboardRoute />);
  expect(screen.getByTestId("expert-route")).toBeInTheDocument();
});
