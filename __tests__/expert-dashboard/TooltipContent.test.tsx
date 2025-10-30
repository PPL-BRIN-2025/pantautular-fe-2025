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
});
