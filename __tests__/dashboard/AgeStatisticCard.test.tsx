import { render, screen, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import AgeStatisticCard from '../../app/components/dashboard/age_statistic/AgeStatisticCard';

const mockDispose = jest.fn();
const mockSetAll = jest.fn();
const mockRule = jest.fn(() => ({ setAll: mockSetAll }));
const mockDataSetAll = jest.fn();
const mockSeriesAppear = jest.fn();
const mockChartAppear = jest.fn();
const mockLegendEventOn = jest.fn();

const mockAxisObject = {
    data: { setAll: jest.fn() },
    set: jest.fn(),
    get: jest.fn(),
    labels: { template: { setAll: jest.fn() } },
    grid: { template: { set: jest.fn() } },
  };
const mockPush = jest.fn().mockReturnValue(mockAxisObject);

const mockRoot = {
  container: {
    children: {
      push: jest.fn(() => mockChart)
    }
  },
  xAxes: {
    push: jest.fn().mockReturnValue({ // Mock Axis object
      data: { setAll: jest.fn() },
      set: jest.fn(),
      get: jest.fn(),
      labels: { template: { setAll: jest.fn() } },
      grid: { template: { set: jest.fn() } },
    }),
  },
  set: jest.fn(),
  yAxes: {
    push: jest.fn().mockReturnValue({ // Mock Axis object
      set: jest.fn(),
      get: jest.fn(),
      labels: { template: { setAll: jest.fn() } },
    }),
  },
  series: {
    push: jest.fn().mockReturnValue({ // Mock Series object
      data: { setAll: jest.fn() },
      set: jest.fn(),
      get: jest.fn(),
      columns: { template: { setAll: jest.fn() } },
      appear: jest.fn(),
    }),
  },
  appear: jest.fn(),
  setThemes: jest.fn(),
  dispose: mockDispose,
  verticalLayout: {}
};

const mockCursor = {
  lineY: { set: jest.fn() }
};

const mockLabelsTemplate = {
    setAll: jest.fn()
  };
  
  const mockGridTemplate = {
    set: jest.fn()
  };
  
  const mockXRenderer = {
    labels: {
      template: mockLabelsTemplate
    },
    grid: {
      template: mockGridTemplate
    }
  };
  
  const mockYRenderer = {
    labels: {
      template: mockLabelsTemplate
    },
    strokeOpacity: 0.1
  };

// Update mockChart with event handling capabilities
const mockChart = {
    xAxes: { push: mockPush },
    yAxes: { push: mockPush },
    series: { 
      push: jest.fn(() => ({
        data: { setAll: mockDataSetAll },
        appear: mockSeriesAppear,
        columns: {  // Add this property
          template: {
            setAll: jest.fn()
          }
        },
        strokes: {
          template: {
            setAll: jest.fn()
          }
        },
        get: jest.fn(() => 'mockedFill')
      })),
      values: [],
      each: jest.fn(cb => {
        // Simulate calling the callback with a mock series
        cb({
          strokes: {
            template: {
              setAll: jest.fn()
            }
          },
          get: jest.fn(() => 'mockedFill')
        });
      })
    },
    set: jest.fn(() => mockCursor),
    appear: mockChartAppear,
    rightAxesContainer: {
      children: {
        push: jest.fn(() => ({
          data: { setAll: jest.fn() },
          itemContainers: {
            template: {
              events: { 
                on: mockLegendEventOn
              },
              set: jest.fn()
            }
          },
          valueLabels: {
            template: { setAll: jest.fn() }
          }
        }))
      }
    }
  };

jest.mock('@amcharts/amcharts5', () => ({
  Root: {
    new: jest.fn(() => mockRoot)
  },
  Theme: {
    new: jest.fn(() => ({
      rule: mockRule
    }))
  },
  color: jest.fn(() => 'mockedColor'),
  percent: jest.fn(),
  p50: {},
  p100: {},
  Scrollbar: {
    new: jest.fn()
  },
  Tooltip: {
    new: jest.fn()
  },
  Legend: {
    new: jest.fn()
  },
}));

jest.mock('@amcharts/amcharts5/xy', () => ({
    XYChart: {
      new: jest.fn()
    },
    DateAxis: { 
      new: jest.fn() 
    },
    ValueAxis: { 
      new: jest.fn() 
    },
    LineSeries: { 
      new: jest.fn()
    },
    AxisRendererX: { 
      new: jest.fn(() => mockXRenderer) 
    },
    AxisRendererY: { 
      new: jest.fn(() => mockYRenderer) 
    },
    XYCursor: { 
      new: jest.fn(() => mockCursor)
    },
    CategoryAxis: {
      new: jest.fn()
    },
    ColumnSeries: {
      new: jest.fn()
    }
  }));

jest.mock('@amcharts/amcharts5/themes/Animated', () => ({
  new: jest.fn(),
  __esModule: true,
  default: { new: jest.fn() }
}));

const am5 = require('@amcharts/amcharts5');
const am5xy = require('@amcharts/amcharts5/xy');

// --- Test Suite ---

describe('AgeStatisticCard Component', () => {
  // Default data used in the component
  const defaultData = [
    { age: "<12 Tahun", value: 1900 },
    { age: "12-25 Tahun", value: 1882 },
    { age: "26-45 Tahun", value: 1809 },
    { age: ">45 Tahun", value: 1322 }
  ];
  const defaultTotal = 1900 + 1882 + 1809 + 1322; // 6913
  const defaultTotalFormatted = "6.913";

  // Custom data for testing props
  const customData = [
      { age: "Anak", value: 50 },
      { age: "Remaja", value: 150 },
      { age: "Dewasa", value: 100 },
  ];
  const customTotal = 50 + 150 + 100; // 300
  const customTotalFormatted = "300";

  // Clear mocks after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('should render the component with title and default data', () => {
    render(<AgeStatisticCard />);

    // Check if title exists
    expect(screen.getByText('Usia')).toBeInTheDocument();

    // Check if total cases with default data is displayed correctly formatted
    expect(screen.getByText(defaultTotalFormatted)).toBeInTheDocument();

    // Check if the chart container div exists
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('should render the component with title and custom data', () => {
    render(<AgeStatisticCard data={customData} />);

    // Check if title exists
    expect(screen.getByText('Usia')).toBeInTheDocument();

    // Check if total cases with custom data is displayed correctly formatted
    expect(screen.getByText(customTotalFormatted)).toBeInTheDocument();

    // Check if the chart container div exists
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('should attempt to initialize amCharts with default data', () => {
    render(<AgeStatisticCard />);

    // Verify amCharts Root was created
    expect(am5.Root.new).toHaveBeenCalledTimes(1);

    // Verify themes were set
    expect(mockRoot.setThemes).toHaveBeenCalledTimes(1);

    // Verify chart type was created (e.g., XYChart)
    expect(am5xy.XYChart.new).toHaveBeenCalledTimes(1);

    // Verify axes and series were pushed
    // expect(mockRoot.xAxes.push).toHaveBeenCalledTimes(1);
    expect(mockRoot.yAxes.push).toHaveBeenCalledTimes(1);
    expect(mockRoot.series.push).toHaveBeenCalledTimes(1);

    // Verify data was set on axis and series using default data
    const mockXAxis = mockRoot.xAxes.push(); // Get the mock return value
    const mockSeries = mockRoot.series.push(); // Get the mock return value
    expect(mockXAxis.data.setAll).toHaveBeenCalledWith(defaultData);
    expect(mockSeries.data.setAll).toHaveBeenCalledWith(defaultData);

    // Verify appear animations were called
    expect(mockSeries.appear).toHaveBeenCalledTimes(1);
    expect(mockRoot.appear).toHaveBeenCalledTimes(1); // Called on the chart instance
  });

   it('should attempt to initialize amCharts with custom data', () => {
    render(<AgeStatisticCard data={customData} />);

    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    // expect(mockRoot.xAxes.push).toHaveBeenCalledTimes(1);
    expect(mockRoot.series.push).toHaveBeenCalledTimes(1);

    // Verify data was set on axis and series using CUSTOM data
    const mockXAxis = mockRoot.xAxes.push();
    const mockSeries = mockRoot.series.push();
    expect(mockXAxis.data.setAll).toHaveBeenCalledWith(customData);
    expect(mockSeries.data.setAll).toHaveBeenCalledWith(customData);
  });

  it('should call the dispose function on unmount', () => {
    // Render the component
    const { unmount } = render(<AgeStatisticCard />);

    // Ensure dispose has not been called yet
    expect(mockDispose).not.toHaveBeenCalled();

    // Unmount the component
    unmount();

    // Verify that the root's dispose function was called exactly once
    expect(mockDispose).toHaveBeenCalledTimes(1);
  });


    it('should handle empty data array properly', () => {
    const emptyData: { age: string; value: number }[] = [];
    render(<AgeStatisticCard data={emptyData} />);
    
    // Total should be 0, and formatted as "0"
    expect(screen.getByText("0")).toBeInTheDocument();
    
    // Chart container should still be rendered
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    
    // amCharts should still initialize
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    });

    it('should correctly format large numbers with thousand separators', () => {
    const largeNumbersData = [
        { age: "Group 1", value: 10000 },
        { age: "Group 2", value: 20000 },
        { age: "Group 3", value: 30000 },
    ];
    // Total should be 60000, formatted as "60.000"
    
    render(<AgeStatisticCard data={largeNumbersData} />);
    expect(screen.getByText("60.000")).toBeInTheDocument();
    });

    it('should verify chart config parameters are correctly set', () => {
    render(<AgeStatisticCard />);
    
    // Verify chart cursor is created and configured
    expect(am5xy.XYCursor.new).toHaveBeenCalledTimes(1);
    expect(mockCursor.lineY.set).toHaveBeenCalledWith("visible", false);
    
    // Check that ColumnSeries was created with correct config
    // expect(mockRoot.series.push).toHaveBeenCalled();
    const seriesConfig = mockRoot.series.push.mock.calls[0][0];
    expect(seriesConfig).toHaveProperty('name', 'Series 1');
    expect(seriesConfig).toHaveProperty('valueYField', 'value');
    expect(seriesConfig).toHaveProperty('categoryXField', 'age');
    });

    it('should update chart data when props change', () => {
    const { rerender } = render(<AgeStatisticCard data={defaultData} />);
    
    // Initial render should set up chart with default data
    // expect(mockRoot.xAxes.push().data.setAll).toHaveBeenCalledWith(defaultData);
    
    // Clear mock counts to check next render
    jest.clearAllMocks();
    
    // Re-render with new data
    rerender(<AgeStatisticCard data={customData} />);
    
    // New Root should be created due to useLayoutEffect cleanup and re-execution
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    
    // Chart should be set up with new data
    expect(mockRoot.xAxes.push().data.setAll).toHaveBeenCalledWith(customData);
    expect(mockRoot.series.push().data.setAll).toHaveBeenCalledWith(customData);
    
    // New total should be displayed
    expect(screen.getByText(customTotalFormatted)).toBeInTheDocument();
    });

    it('should apply correct styling to chart elements', () => {
    render(<AgeStatisticCard />);
    
    // Check axis styling
    expect(am5xy.AxisRendererX.new).toHaveBeenCalledWith(mockRoot, expect.objectContaining({
        minGridDistance: 30,
        minorGridEnabled: true
    }));
});
});