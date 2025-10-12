import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PortalBarChart from "../../app/components/dashboard/sumberBerita/PortalBarChart";

describe("PortalBarChart download controls", () => {
  it("renders a download button for exporting chart data", () => {
    const data = [
      { portal: "A", count: 3 },
      { portal: "B", count: 2 },
    ];
    render(<PortalBarChart title="Sumber" data={data as any} />);
    expect(screen.getByRole("button", { name: /unduh gambar/i })).toBeInTheDocument();
  });
});
