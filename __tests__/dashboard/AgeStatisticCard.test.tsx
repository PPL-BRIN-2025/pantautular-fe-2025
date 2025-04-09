import { render, screen, cleanup } from '@testing-library/react';
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
        columns: {
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

  // Helper function to verify common chart initialization
  const verifyChartInitialization = (data: { age: string; value: number; }[]) => {
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    expect(mockRoot.setThemes).toHaveBeenCalledTimes(1);
    expect(mockRoot.yAxes.push).toHaveBeenCalledTimes(1);
    expect(mockRoot.series.push).toHaveBeenCalledTimes(1);
    
    const mockXAxis = mockRoot.xAxes.push();
    const mockSeries = mockRoot.series.push();
    expect(mockXAxis.data.setAll).toHaveBeenCalledWith(data);
    expect(mockSeries.data.setAll).toHaveBeenCalledWith(data);
  };

  // Clear mocks after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it.each([
    ['default data', undefined, defaultTotalFormatted],
    ['custom data', customData, customTotalFormatted],
    ['empty data', [], '0']
  ])('should render component correctly with %s', (_, data, expectedTotal) => {
    render(<AgeStatisticCard data={data} />);

    // Check if title exists
    expect(screen.getByText('Usia')).toBeInTheDocument();
    
    // Check if total cases is displayed correctly formatted
    expect(screen.getByText(expectedTotal)).toBeInTheDocument();
    
    // Check if chart container exists
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    
    // Verify chart initialization with appropriate data
    verifyChartInitialization(data || defaultData);
  });

  it('should call the dispose function on unmount', () => {
    // Render and unmount the component
    const { unmount } = render(<AgeStatisticCard />);
    unmount();
    
    // Verify that the root's dispose function was called
    expect(mockDispose).toHaveBeenCalledTimes(1);
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

  it('should verify chart configurations and styling', () => {
    render(<AgeStatisticCard />);
    
    // Verify chart cursor config
    expect(am5xy.XYCursor.new).toHaveBeenCalledTimes(1);
    expect(mockCursor.lineY.set).toHaveBeenCalledWith("visible", false);
    
    // Check ColumnSeries config
    const seriesConfig = mockRoot.series.push.mock.calls[0][0];
    expect(seriesConfig).toHaveProperty('name', 'Series 1');
    expect(seriesConfig).toHaveProperty('valueYField', 'value');
    expect(seriesConfig).toHaveProperty('categoryXField', 'age');
    
    // Check axis styling
    expect(am5xy.AxisRendererX.new).toHaveBeenCalledWith(mockRoot, expect.objectContaining({
        minGridDistance: 30,
        minorGridEnabled: true
    }));
  });

  it('should update chart data when props change', () => {
    const { rerender } = render(<AgeStatisticCard data={defaultData} />);
    
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
});