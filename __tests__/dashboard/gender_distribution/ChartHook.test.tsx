import React, { useRef } from "react";
import { render, cleanup} from "@testing-library/react";
import "@testing-library/jest-dom";
import useDonutChart from '../../../app/components/dashboard/gender_distribution/ChartHook';
import { Root } from "@amcharts/amcharts5";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

// Mock the main amCharts module.
jest.mock("@amcharts/amcharts5", () => ({
  Root: {
    new: jest.fn().mockImplementation((div: HTMLDivElement) => {
      return {
        setThemes: jest.fn(),
        dispose: jest.fn(),
        container: {
          children: {
            push: jest.fn().mockImplementation((child) => child),
          },
        },
        verticalLayout: {},
      };
    }),
  },
  Legend: {
    new: jest.fn().mockImplementation((root, options) => {
      return {
        data: {
          setAll: jest.fn(),
        },
        labels: {
          template: {
            setAll: jest.fn(),
          },
        },
        valueLabels: {
          template: {
            setAll: jest.fn(),
          },
        },
      };
    }),
  },
  percent: jest.fn().mockImplementation((value: number) => `${value}%`),
  color: jest.fn().mockImplementation((color: number) => color),
}));

// Mock the am5percent module.
jest.mock("@amcharts/amcharts5/percent", () => ({
  PieChart: {
    new: jest.fn().mockImplementation((root, config) => {
      return {
        series: {
          push: jest.fn().mockImplementation((series) => series),
        },
        children: {
          push: jest.fn().mockImplementation((child) => child),
        },
      };
    }),
  },
  PieSeries: {
    new: jest.fn().mockImplementation((root, config) => {
      return {
        data: {
          setAll: jest.fn(),
        },
        labels: {
          template: {
            setAll: jest.fn(),
          },
        },
        ticks: {
          template: {
            setAll: jest.fn(),
          },
        },
        appear: jest.fn(),
        // Provide a dummy dataItems property for legend.
        dataItems: "dummyDataItems",
      };
    }),
  },
  percent: (value: number) => `${value}%`,
}));

// Mock the Animated theme.
jest.mock("@amcharts/amcharts5/themes/Animated", () => ({
  new: jest.fn().mockImplementation((root) => ({})),
}));

afterEach(cleanup);

describe("useDonutChart hook", () => {
  it("does nothing if chartRef.current is null", () => {
    // Dummy component that passes a ref with current=null.
    const DummyComponent = () => {
      const chartRef = { current: null };
      useDonutChart(chartRef, 5, 15);
      return <div />;
    };

    render(<DummyComponent />);
    // Expect no call to am5.Root.new when there is no element.
    expect(am5.Root.new).not.toHaveBeenCalled();
  });

  it("creates chart correctly and disposes on unmount", () => {
    // Create a component that uses our hook.
    const TestComponent = ({
      priaValue,
      wanitaValue,
    }: {
      priaValue: number;
      wanitaValue: number;
    }) => {
      const chartRef = useRef<HTMLDivElement>(null);
      // Attach ref to a div so that chartRef.current is not null.
      return <div ref={chartRef}>{useDonutChart(chartRef, priaValue, wanitaValue)}</div>;
    };

    const { unmount } = render(<TestComponent priaValue={30} wanitaValue={70} />);

    // Verify that the chart container was created.
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    const rootInstance = (am5.Root.new as jest.Mock).mock.results[0].value;

    // Check that the theme is set (Animated theme).
    expect(rootInstance.setThemes).toHaveBeenCalledWith([expect.any(Object)]);

    // Verify that the PieChart is created with the correct innerRadius and layout.
    expect(am5percent.PieChart.new).toHaveBeenCalledWith(rootInstance, {
      layout: rootInstance.verticalLayout,
      innerRadius: "50%",
    });

    // Verify that the PieSeries is created with the proper configuration.
    expect(am5percent.PieSeries.new).toHaveBeenCalledWith(rootInstance, {
      valueField: "value",
      categoryField: "category",
      fillField: "color",
    });

    // Retrieve the PieSeries instance from the mock.
    const seriesInstance = (am5percent.PieSeries.new as jest.Mock).mock.results[0].value;

    // Verify that series.data.setAll is called with the correct data.
    expect(seriesInstance.data.setAll).toHaveBeenCalledWith([
      {
        category: "Pria",
        value: 30,
        color: am5.color(0x3b82f6),
      },
      {
        category: "Wanita",
        value: 70,
        color: am5.color(0xf472b6),
      },
    ]);

    // Ensure that labels and ticks are forced hidden.
    expect(seriesInstance.labels.template.setAll).toHaveBeenCalledWith({ forceHidden: true });
    expect(seriesInstance.ticks.template.setAll).toHaveBeenCalledWith({ forceHidden: true });

    // Verify that the series appear animation is triggered.
    expect(seriesInstance.appear).toHaveBeenCalledWith(1000, 100);

    // Verify that a Legend is created.
    expect(am5.Legend.new).toHaveBeenCalledTimes(1);
    const legendInstance = (am5.Legend.new as jest.Mock).mock.results[0].value;
    // Check that the legend data is set to series.dataItems.
    expect(legendInstance.data.setAll).toHaveBeenCalledWith(seriesInstance.dataItems);
    // Verify legend label configurations.
    expect(legendInstance.labels.template.setAll).toHaveBeenCalledWith({ fontSize: 12 });
    expect(legendInstance.valueLabels.template.setAll).toHaveBeenCalledWith({ fontSize: 12 });

    // Unmount the component and check that the cleanup function calls dispose.
    unmount();
    expect(rootInstance.dispose).toHaveBeenCalled();
  });
});
