import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PortalBarChart from "../../app/components/dashboard/sumberBerita/PortalBarChart";

describe("PortalBarChart", () => {
  it("does not render a download button", () => {
    const data = [
      { portal: "A", count: 3 },
      { portal: "B", count: 2 },
    ];
    render(<PortalBarChart title="Sumber" data={data as any} />);
    expect(screen.queryByRole("button", { name: /download/i })).not.toBeInTheDocument();
  });
});
