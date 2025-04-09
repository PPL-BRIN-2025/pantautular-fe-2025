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
  const mockLabelsTemplate = createTemplatedMock();
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

// Test data definitions
const testData = {
  default: [
    { age: "<12 Tahun", value: 1900 },
    { age: "12-25 Tahun", value: 1882 },
    { age: "26-45 Tahun", value: 1809 },
    { age: ">45 Tahun", value: 1322 }
  ],
  custom: [
    { age: "Anak", value: 50 },
    { age: "Remaja", value: 150 },
    { age: "Dewasa", value: 100 },
  ],
  large: [
    { age: "Group 1", value: 10000 },
    { age: "Group 2", value: 20000 },
    { age: "Group 3", value: 30000 },
  ],
  empty: []
};

// Calculate totals
const totals = {
  default: testData.default.reduce((sum, item) => sum + item.value, 0), // 6913
  custom: testData.custom.reduce((sum, item) => sum + item.value, 0), // 300
  large: testData.large.reduce((sum, item) => sum + item.value, 0), // 60000
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
  const verifyChartInitialization = (data: { age: string; value: number; }[] | { age: string; value: number; }[]) => {
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    expect(mocks.mockRoot.setThemes).toHaveBeenCalledTimes(1);
    expect(mocks.mockRoot.yAxes.push).toHaveBeenCalledTimes(1);
    expect(mocks.mockRoot.series.push).toHaveBeenCalledTimes(1);
    
    const mockXAxis = mocks.mockRoot.xAxes.push();
    const mockSeries = mocks.mockRoot.series.push();
    expect(mockXAxis.data.setAll).toHaveBeenCalledWith(data);
    expect(mockSeries.data.setAll).toHaveBeenCalledWith(data);
  };

  // Clear mocks after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it.each([
    ['default data', undefined, formattedTotals.default, testData.default],
    ['custom data', testData.custom, formattedTotals.custom, testData.custom],
    ['empty data', testData.empty, formattedTotals.empty, testData.empty]
  ])('should render component correctly with %s', (_, data, expectedTotal, expectedDataUsed) => {
    render(<AgeStatisticCard data={data} />);

    // Basic UI checks
    expect(screen.getByText('Usia')).toBeInTheDocument();
    expect(screen.getByText(expectedTotal)).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    
    // Chart initialization check
    verifyChartInitialization(expectedDataUsed);
  });

  it('should call the dispose function on unmount', () => {
    const { unmount } = render(<AgeStatisticCard />);
    unmount();
    expect(mocks.mockDispose).toHaveBeenCalledTimes(1);
  });

  it('should correctly format large numbers with thousand separators', () => {
    render(<AgeStatisticCard data={testData.large} />);
    expect(screen.getByText(formattedTotals.large)).toBeInTheDocument();
  });

  it('should verify chart configurations and styling', () => {
    render(<AgeStatisticCard />);
    
    // Chart cursor config
    expect(am5xy.XYCursor.new).toHaveBeenCalledTimes(1);
    expect(mocks.mockCursor.lineY.set).toHaveBeenCalledWith("visible", false);
    
    // Series config
    const seriesConfig = mocks.mockRoot.series.push.mock.calls[0][0];
    expect(seriesConfig).toHaveProperty('name', 'Series 1');
    expect(seriesConfig).toHaveProperty('valueYField', 'value');
    expect(seriesConfig).toHaveProperty('categoryXField', 'age');
    
    // Axis styling
    expect(am5xy.AxisRendererX.new).toHaveBeenCalledWith(mocks.mockRoot, expect.objectContaining({
      minGridDistance: 30,
      minorGridEnabled: true
    }));
  });

  it('should update chart data when props change', () => {
    const { rerender } = render(<AgeStatisticCard data={testData.default} />);
    
    // Clear mocks before re-render
    jest.clearAllMocks();
    
    rerender(<AgeStatisticCard data={testData.custom} />);
    
    // Check for proper reinitialization
    expect(am5.Root.new).toHaveBeenCalledTimes(1);
    expect(mocks.mockRoot.xAxes.push().data.setAll).toHaveBeenCalledWith(testData.custom);
    expect(mocks.mockRoot.series.push().data.setAll).toHaveBeenCalledWith(testData.custom);
    expect(screen.getByText(formattedTotals.custom)).toBeInTheDocument();
  });
});