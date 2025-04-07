import React, { useRef } from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import useDonutChart from '../../../app/components/dashboard/gender_distribution/ChartHook';
import * as am5 from "@amcharts/amcharts5";


const disposeMock = jest.fn();
const setThemesMock = jest.fn();
const seriesDataSetAllMock = jest.fn();
const seriesLabelsSetAllMock = jest.fn();
const seriesTicksSetAllMock = jest.fn();
const seriesAppearMock = jest.fn();
const legendDataSetAllMock = jest.fn();
const legendLabelsSetAllMock = jest.fn();
const legendValueLabelsSetAllMock = jest.fn();


const seriesPushMock = jest.fn(() => ({
  data: { setAll: seriesDataSetAllMock },
  labels: { template: { setAll: seriesLabelsSetAllMock } },
  ticks: { template: { setAll: seriesTicksSetAllMock } },
  appear: seriesAppearMock,
}));
const pushLegendMock = jest.fn(() => ({
  data: { setAll: legendDataSetAllMock },
  labels: { template: { setAll: legendLabelsSetAllMock } },
  valueLabels: { template: { setAll: legendValueLabelsSetAllMock } },
}));

const pushChartMock = jest.fn(() => ({
  series: {
    push: seriesPushMock,
  },
  children: {
    push: pushLegendMock,
  },
}));

// Mock the amCharts modules
jest.mock("@amcharts/amcharts5", () => ({
  Root: {
    new: jest.fn(() => ({
      dispose: disposeMock,
      setThemes: setThemesMock,
      container: {
        children: {
          push: pushChartMock,
        },
      },
    })),
  },
  color: jest.fn((value) => value), 
}));

jest.mock("@amcharts/amcharts5/percent", () => ({
  PieChart: {
    new: jest.fn(),
  },
  PieSeries: {
    new: jest.fn(),
  },
}));

jest.mock("@amcharts/amcharts5/themes/Animated", () => ({
  new: jest.fn(() => "AnimatedTheme"),
}));


function TestComponent({ priaValue, wanitaValue }: { priaValue: number; wanitaValue: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  useDonutChart(ref, priaValue, wanitaValue);
  return <div ref={ref} data-testid="chart-container" />;
}


describe("useDonutChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls am5.Root.new with the container element", () => {
    const { getByTestId } = render(
      <TestComponent priaValue={100} wanitaValue={200} />
    );
    const container = getByTestId("chart-container");
    expect(am5.Root.new).toHaveBeenCalledWith(container);
  });

  it("sets themes correctly", () => {
    render(<TestComponent priaValue={100} wanitaValue={200} />);
    expect(setThemesMock).toHaveBeenCalledWith(["AnimatedTheme"]);
  });

  it("sets series data with correct values and custom colors", () => {
    const priaValue = 150;
    const wanitaValue = 250;
    render(<TestComponent priaValue={priaValue} wanitaValue={wanitaValue} />);
    
    expect(seriesDataSetAllMock).toHaveBeenCalledWith([
      {
        category: "Pria",
        value: priaValue,
        color: 0x3b82f6,
      },
      {
        category: "Wanita",
        value: wanitaValue,
        color: 0xf472b6, 
      },
    ]);
  });

  it("calls root.dispose on unmount", () => {
    const { unmount } = render(
      <TestComponent priaValue={100} wanitaValue={200} />
    );
    const rootInstance = (am5.Root.new as jest.Mock).mock.results[0].value;
    unmount();
    expect(rootInstance.dispose).toHaveBeenCalled();
  });
});
