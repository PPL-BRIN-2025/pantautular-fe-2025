import { render, screen } from "@testing-library/react";
import TooltipContent from "../../app/expert-dashboard/components/TooltipContent";
import { expertDashboardFlags } from "../../app/expert-dashboard/tooltip";

describe("TooltipContent", () => {
  afterEach(() => {
    expertDashboardFlags.showReferenceDelta = true;
  });

  it("renders value, reference and change with percentage", () => {
    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 120, reference: 100 }}
      />
    );

    expect(screen.getByTestId("tooltip-label")).toHaveTextContent("Kasus");
    expect(screen.getByTestId("tooltip-value")).toHaveTextContent(
      "Value: 120"
    );
    expect(
      screen.getByTestId("tooltip-reference")
    ).toHaveTextContent("Reference: 100");
    expect(screen.getByTestId("tooltip-change")).toHaveTextContent(
      "Change: +20 (+20%)"
    );
  });

  it("renders change without percentage when reference is zero", () => {
    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 45, reference: 0 }}
      />
    );

    expect(screen.getByTestId("tooltip-change")).toHaveTextContent(
      "Change: +45"
    );
  });

  it("renders only value when reference absent", () => {
    render(<TooltipContent datum={{ label: "Kasus", value: 75 }} />);

    expect(screen.queryByTestId("tooltip-reference")).toBeNull();
    expect(screen.queryByTestId("tooltip-change")).toBeNull();
    expect(screen.getByTestId("tooltip-value")).toHaveTextContent(
      "Value: 75"
    );
  });

  it("hides change when feature flag disabled", () => {
    expertDashboardFlags.showReferenceDelta = false;

    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 80, reference: 60 }}
      />
    );

    expect(screen.queryByTestId("tooltip-change")).toBeNull();
  });

  it("formats negative deltas with minus signs", () => {
    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 50, reference: 80 }}
      />
    );

    expect(screen.getByTestId("tooltip-change")).toHaveTextContent(
      "Change: -30 (-37,5%)"
    );
  });

  it("renders neutral delta when value equals reference", () => {
    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 30, reference: 30 }}
      />
    );

    expect(screen.getByTestId("tooltip-change")).toHaveTextContent(
      "Change: 0 (0%)"
    );
  });

  it("omits label when not provided", () => {
    render(<TooltipContent datum={{ value: 10 }} />);
    expect(screen.queryByTestId("tooltip-label")).toBeNull();
  });

  it("renders timestamp metadata when supplied", () => {
    render(
      <TooltipContent
        datum={{ label: "Kasus", value: 10, reference: 5, timestamp: "2025-01-01" }}
      />
    );
    expect(screen.getByTestId("tooltip-timestamp")).toHaveTextContent("2025-01-01");
  });

  it("omits reference block when reference is null", () => {
    render(<TooltipContent datum={{ label: "Kasus", value: 15, reference: null }} />);
    expect(screen.queryByTestId("tooltip-reference")).toBeNull();
    expect(screen.queryByTestId("tooltip-change")).toBeNull();
  });
});
