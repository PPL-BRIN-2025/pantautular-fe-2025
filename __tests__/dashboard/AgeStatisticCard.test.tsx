import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgeStatisticCard from '../../app/components/dashboard/age_statistic/AgeStatisticCard';

// Create a mock factory function instead of duplicating mock objects
const createTemplatedMock = (templateProps = {}) => ({
  template: { 
    setAll: jest.fn(),
    ...templateProps
  }
});

// Setup mocks
const setupMocks = () => {
  // Core mocks
  const mockDispose = jest.fn();
  const mockSetAll = jest.fn();
  const mockDataSetAll = jest.fn();
  const mockSeriesAppear = jest.fn();
  const mockChartAppear = jest.fn();
  const mockLegendEventOn = jest.fn();

  // Common mock objects
  const mockGridTemplate = { set: jest.fn() };
  
  const mockXRenderer = {
    labels: createTemplatedMock(),
    grid: { template: mockGridTemplate }
  };
  
  const mockYRenderer = {
    labels: createTemplatedMock(),
    strokeOpacity: 0.1
  };
  
  const mockAxisObject = {
    data: { setAll: jest.fn() },
    set: jest.fn(),
    get: jest.fn(),
    labels: createTemplatedMock(),
    grid: { template: { set: jest.fn() } },
  };
  
  const mockPush = jest.fn().mockReturnValue(mockAxisObject);
  
  const mockCursor = {
    lineY: { set: jest.fn() }
  };
  
  // Create chart mock with dependent references
  const mockChart = {
    xAxes: { push: mockPush },
    yAxes: { push: mockPush },
    series: { 
      push: jest.fn(() => ({
        data: { setAll: mockDataSetAll },
        appear: mockSeriesAppear,
        columns: createTemplatedMock(),
        strokes: createTemplatedMock(),
        get: jest.fn(() => 'mockedFill')
      })),
      values: [],
      each: jest.fn(cb => {
        cb({
          strokes: createTemplatedMock(),
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
          itemContainers: createTemplatedMock({
            events: { on: mockLegendEventOn },
            set: jest.fn()
          }),
          valueLabels: createTemplatedMock()
        }))
      }
    }
  };
  
  // Create root mock
  const mockRoot = {
    container: {
      children: {
        push: jest.fn(() => mockChart)
      }
    },
    xAxes: {
      push: jest.fn().mockReturnValue(mockAxisObject),
    },
    set: jest.fn(),
    yAxes: {
      push: jest.fn().mockReturnValue(mockAxisObject),
    },
    series: {
      push: jest.fn().mockReturnValue(mockAxisObject),
    },
    appear: jest.fn(),
    setThemes: jest.fn(),
    dispose: mockDispose,
    verticalLayout: {}
  };

  return {
    mockDispose,
    mockSetAll,
    mockDataSetAll,
    mockSeriesAppear,
    mockChartAppear,
    mockLegendEventOn,
    mockAxisObject,
    mockPush,
    mockRoot,
    mockCursor,
    mockXRenderer,
    mockYRenderer,
    mockChart
  };
};

// Setup mocks before tests
const mocks = setupMocks();

// Setup module mocks
jest.mock('@amcharts/amcharts5', () => ({
  Root: {
    new: jest.fn(() => mocks.mockRoot)
  },
  Theme: {
    new: jest.fn(() => ({
      rule: jest.fn(() => ({ setAll: mocks.mockSetAll }))
    }))
  },
  color: jest.fn(() => 'mockedColor'),
  percent: jest.fn(),
  p50: {},
  p100: {},
  Scrollbar: { new: jest.fn() },
  Tooltip: { new: jest.fn() },
  Legend: { new: jest.fn() },
}));

jest.mock('@amcharts/amcharts5/xy', () => ({
  XYChart: { new: jest.fn() },
  DateAxis: { new: jest.fn() },
  ValueAxis: { new: jest.fn() },
  LineSeries: { new: jest.fn() },
  AxisRendererX: { new: jest.fn(() => mocks.mockXRenderer) },
  AxisRendererY: { new: jest.fn(() => mocks.mockYRenderer) },
  XYCursor: { new: jest.fn(() => mocks.mockCursor) },
  CategoryAxis: { new: jest.fn() },
  ColumnSeries: { new: jest.fn() }
}));

jest.mock('@amcharts/amcharts5/themes/Animated', () => ({
  new: jest.fn(),
  __esModule: true,
  default: { new: jest.fn() }
}));

const am5 = require('@amcharts/amcharts5');
const am5xy = require('@amcharts/amcharts5/xy');

// Test data definitions using the AgeData interface structure
const testData = {
  default: {
    under_12: 1900,
    "12_25": 1882,
    "26_45": 1809,
    above_45: 1322
  },
  custom: {
    under_12: 50,
    "12_25": 150,
    "26_45": 100,
    above_45: 0
  },
  large: {
    under_12: 10000,
    "12_25": 20000,
    "26_45": 30000,
    above_45: 0
  },
  empty: {
    under_12: 0,
    "12_25": 0,
    "26_45": 0,
    above_45: 0
  }
};

// Calculate totals
const totals = {
  default: Object.values(testData.default).reduce((sum, value) => sum + value, 0), // 6913
  custom: Object.values(testData.custom).reduce((sum, value) => sum + value, 0), // 300
  large: Object.values(testData.large).reduce((sum, value) => sum + value, 0), // 60000
  empty: 0
};

// Formatted totals
const formattedTotals = {
  default: "6.913",
  custom: "300",
  large: "60.000",
  empty: "0"
};

describe('AgeStatisticCard Component', () => {
  // Helper function to verify common chart initialization
  const verifyChartInitialization = () => {
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    expect(mocks.mockRoot.setThemes).toHaveBeenCalledTimes(1);
  };

  // Clear mocks after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it.each([
    ['default data', testData.default, formattedTotals.default],
    ['custom data', testData.custom, formattedTotals.custom],
    ['empty data', testData.empty, formattedTotals.empty]
  ])('should render component correctly with %s', (_, data, expectedTotal) => {
    render(<AgeStatisticCard data={data} />);

    // Basic UI checks
    expect(screen.getByText('Usia')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download img/i })).toBeInTheDocument();
    
    // Check for total with a regex to handle formatting differences
    const totalRegex = new RegExp(expectedTotal.replace('.', '[,.]'));
    const totalElements = screen.getAllByText(totalRegex);
    expect(totalElements.length).toBeGreaterThan(0);
    
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    
    // Chart initialization check
    verifyChartInitialization();
  });

  it('should call the dispose function on unmount', () => {
    const { unmount } = render(<AgeStatisticCard data={testData.default} />);
    unmount();
    expect(mocks.mockDispose).toHaveBeenCalledTimes(1);
  });

  it('should correctly format large numbers with thousand separators', () => {
    render(<AgeStatisticCard data={testData.large} />);
    
    // Check for total with a regex to handle formatting differences
    const totalRegex = /60[,.]000/;
    const totalElements = screen.getAllByText(totalRegex);
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('should verify chart configurations and styling', () => {
    render(<AgeStatisticCard data={testData.default} />);
    
    // Chart cursor config
    expect(am5xy.XYCursor.new).toHaveBeenCalled();
    expect(mocks.mockCursor.lineY.set).toHaveBeenCalledWith("visible", false);
  });

  it('should update chart data when props change', () => {
    const { rerender } = render(<AgeStatisticCard data={testData.default} />);
    
    // Clear mocks before re-render
    jest.clearAllMocks();
    
    rerender(<AgeStatisticCard data={testData.custom} />);
    
    // Check for proper reinitialization
    expect(am5.Root.new).toHaveBeenCalled();
    
    // Check for total with a regex to handle formatting differences
    const totalRegex = /300/;
    const totalElements = screen.getAllByText(totalRegex);
    expect(totalElements.length).toBeGreaterThan(0);
  });
});
