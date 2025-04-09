import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalBarChart, { 
  gridStrokeAdapter
} from '../../app/components/dashboard/sumberBerita/PortalBarChart';

// Extend Window interface to include amcharts properties
declare global {
  interface Window {
    am5: any;
    am5xy: any;
    am5themes_Animated: any;
  }
}

// Mock console.log directly
const originalConsoleLog = console.log;
console.log = jest.fn();

// Create shared mock objects
const createMocks = () => {
  // Mock adapter functions to test
  const labelVisibilityAdapter = jest.fn((visible, target) => {
    const value = target.dataItem?.get("value") ?? 0;
    return visible && Math.abs(value - Math.round(value)) < 0.01;
  });

  const gridVisibilityAdapter = jest.fn((visible, target) => {
    const value = target.dataItem?.get("value") ?? 0;
    if (Math.abs(value) < 0.01) return true;
    return visible && Math.abs(value - Math.round(value)) < 0.01;
  });

  const gridStrokeAdapter = jest.fn((strokeDasharray, target) => {
    if (!target.dataItem) return [2, 2];
    const value = target.dataItem?.get("value") ?? 0;
  
    if (Math.abs(value) < 0.01) {
      return [];
    }
  
    return [2, 2];
  });

  // Create mock grid template with adapters
  const gridTemplate = {
    set: jest.fn(),
    setAll: jest.fn(),
    adapters: {
      add: jest.fn()
        .mockImplementation((name, callback) => {
          if (name === 'visible') return gridVisibilityAdapter;
          if (name === 'strokeDasharray') return gridStrokeAdapter;
          return undefined;
        })
    }
  };

  // Create mock labels template with adapters
  const labelsTemplate = {
    setAll: jest.fn(),
    adapters: {
      add: jest.fn()
        .mockImplementation((name, callback) => {
          if (name === 'visible') return labelVisibilityAdapter;
          return undefined;
        })
    }
  };

  const renderer = {
    labels: { template: labelsTemplate },
    grid: { template: gridTemplate }
  };

  // Mock X-axis that returns our mock renderer
  const mockXAxis = {
    get: jest.fn().mockReturnValue(renderer),
    set: jest.fn()
  };

  const mockAxisRendererX = {
    labels: { template: labelsTemplate },
    grid: { template: gridTemplate }
  };

  const mockAxisRendererY = {
    labels: { template: { setAll: jest.fn() } },
    grid: {
      template: {
        set: jest.fn(),
        setAll: jest.fn(),
        adapters: { add: jest.fn() }
      }
    }
  };

  const mockYAxis = {
    get: jest.fn().mockImplementation(prop => {
      if (prop === "renderer") {
        return {
          labels: { template: { setAll: jest.fn() } },
          grid: { template: { set: jest.fn() } }
        };
      }
      return {};
    }),
    data: { setAll: jest.fn() },
    set: jest.fn()
  };

  // Mock tooltip
  const mockTooltipLabel = { setAll: jest.fn() };
  const mockTooltip = {
    label: mockTooltipLabel,
    get: jest.fn().mockReturnValue({
      setAll: jest.fn()
    })
  };

  // Mock series
  const mockSeries = {
    bullets: { push: jest.fn() },
    columns: { template: { setAll: jest.fn() } },
    data: { setAll: jest.fn() },
    appear: jest.fn(),
    get: jest.fn().mockImplementation(prop => {
      if (prop === "tooltip") {
        return mockTooltip;
      }
      return null;
    }),
    set: jest.fn()
  };

  // Mock chart with correct axis setup
  const mockChart = {
    yAxes: { push: jest.fn().mockReturnValue(mockYAxis) },
    xAxes: { push: jest.fn().mockReturnValue(mockXAxis) },
    series: {
      push: jest.fn().mockReturnValue(mockSeries)
    },
    appear: jest.fn()
  };

  // Mock root with container and chart
  const mockRoot = {
    setThemes: jest.fn(),
    container: {
      children: {
        push: jest.fn().mockReturnValue(mockChart)
      }
    },
    dispose: jest.fn()
  };

  const mockAm5 = {
    Root: {
      new: jest.fn().mockReturnValue(mockRoot)
    },
    color: jest.fn(value => `mocked-color-${value}`),
    p50: 0.5,
    percent: jest.fn(value => value),
    Tooltip: {
      new: jest.fn().mockReturnValue({
        label: { setAll: jest.fn() }
      })
    },
    Bullet: {
      new: jest.fn()
    }
  };

  const mockAm5xy = {
    XYChart: {
      new: jest.fn().mockReturnValue({})
    },
    CategoryAxis: {
      new: jest.fn().mockReturnValue({})
    },
    ValueAxis: {
      new: jest.fn().mockReturnValue({})
    },
    ColumnSeries: {
      new: jest.fn().mockReturnValue({})
    },
    AxisRendererY: {
      new: jest.fn().mockReturnValue({})
    },
    AxisRendererX: {
      new: jest.fn().mockReturnValue(mockAxisRendererX)
    }
  };

  const mockAm5themes_Animated = {
    new: jest.fn().mockReturnValue({})
  };

  return {
    mockAm5,
    mockAm5xy,
    mockAm5themes_Animated,
    mockAxisRendererY,
    mockAxisRendererX,
    mockYAxis,
    mockXAxis,
    mockTooltip,
    mockTooltipLabel,
    mockSeries,
    mockChart,
    mockRoot,
    renderer,
    gridTemplate,
    labelsTemplate,
    labelVisibilityAdapter,
    gridVisibilityAdapter,
    gridStrokeAdapter
  };
};

describe('PortalBarChart Component', () => {
  // Sample data for tests
  const testData = [
    { portal: 'Test Portal 1', count: 5 },
    { portal: 'Test Portal 2', count: 10 }
  ];
  
  const testTitle = 'Test Chart';
  
  // Create mocks before running tests
  const mocks = createMocks();

  // Create a safe window mock for tests that need to simulate SSR
  let originalWindow: any;
  
  beforeAll(() => {
    // Save the original window object if it exists
    originalWindow = typeof window !== 'undefined' ? window : undefined;
    
    // Create a global window object if it doesn't exist (for Node.js environment)
    if (typeof window === 'undefined') {
      // @ts-ignore - intentionally creating window
      global.window = {
        am5: undefined,
        am5xy: undefined,
        am5themes_Animated: undefined
      };
    }
  });
  
  beforeEach(() => {
    // Setup window object with mocked amcharts - safely
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'am5', {
        value: mocks.mockAm5,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'am5xy', {
        value: mocks.mockAm5xy,
        writable: true,
        configurable: true
      });
      Object.defineProperty(window, 'am5themes_Animated', {
        value: mocks.mockAm5themes_Animated,
        writable: true,
        configurable: true
      });
    }

    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock ref implementation
    jest.spyOn(React, 'useRef').mockImplementation(() => ({
      current: document.createElement('div')
    }));
  });

  afterEach(() => {
    // Cleanup
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    
    // Restore original window if we modified it
    if (originalWindow) {
      // @ts-ignore - restoring window
      global.window = originalWindow;
    } else if (typeof window !== 'undefined') {
      // Clean up properties if we're in a browser environment
      delete (window as any).am5;
      delete (window as any).am5xy;
      delete (window as any).am5themes_Animated;
    }
  });

  // Helper function to render component and run timers
  const renderWithTimers = (props = {}) => {
    jest.useFakeTimers();
    const result = render(
      <PortalBarChart 
        title={testTitle} 
        data={testData}
        {...props}
      />
    );
    
    act(() => {
      jest.runAllTimers();
    });
    
    return result;
  };

  // Helper for cleanup tests
  const testCleanup = (mockReturnValue: any) => {
    jest.useFakeTimers();
    
    // Mock Promise.then
    const mockPromiseThen = jest.fn().mockImplementation(cb => {
      cb(mockReturnValue);
      return { catch: jest.fn() };
    });
    
    // Mock Promise
    const mockPromise = { then: mockPromiseThen };
    
    // Mock async/await
    jest.spyOn(global, 'Promise').mockImplementation(() => mockPromise as any);

    const { unmount } = render(<PortalBarChart title={testTitle} data={testData} />);

    act(() => {
      jest.runAllTimers();
    });

    unmount();

    act(() => {
      jest.runAllTimers();
    });

    jest.useRealTimers();
    
    return { mockPromiseThen };
  };

  // Test basic rendering
  test('renders chart with correct title and button', () => {
    render(<PortalBarChart title={testTitle} data={testData} />);
    expect(screen.getByText(testTitle)).toBeInTheDocument();
    expect(screen.getByText('Lihat Detail')).toBeInTheDocument();
    expect(document.querySelector('div[class="w-full"]')).toBeInTheDocument();
  });

  // Test button click
  test('handles button click correctly', () => {
    (console.log as jest.Mock).mockClear();
    render(<PortalBarChart title={testTitle} data={testData} />);
    
    const button = screen.getByRole('button', { name: /Lihat Detail/i });
    fireEvent.click(button);
    
    expect(console.log).toHaveBeenCalledWith(`View details for ${testTitle}`);
  });

  // Test chart initialization
  test('initializes chart with correct data', () => {
    renderWithTimers();

    // Verify chart initialization
    expect(mocks.mockAm5.Root.new).toHaveBeenCalled();
    expect(mocks.mockRoot.setThemes).toHaveBeenCalled();
    expect(mocks.mockRoot.container.children.push).toHaveBeenCalled();
    
    // Verify axes creation
    expect(mocks.mockChart.yAxes.push).toHaveBeenCalled();
    expect(mocks.mockChart.xAxes.push).toHaveBeenCalled();
    
    // Verify data was set
    expect(mocks.mockYAxis.data.setAll).toHaveBeenCalled();
    expect(mocks.mockSeries.data.setAll).toHaveBeenCalled();
    
    // Verify X-axis integer formatting
    expect(mocks.mockXAxis.set).toHaveBeenCalledWith("numberFormat", "#");
  });

  // Test with custom index for delayed initialization
  test('uses custom index for chart initialization delay', () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const customIndex = 2;

    render(<PortalBarChart title={testTitle} data={testData} index={customIndex} />);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), customIndex * 100);
    
    jest.useRealTimers();
    setTimeoutSpy.mockRestore();
  });

  // Test cleanup with null root
  test('cleanup handles null root gracefully', () => {
    testCleanup(null);
    expect(mocks.mockRoot.dispose).not.toHaveBeenCalled();
  });

  // Test data changes
  test('updates chart when data changes', () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const initialData = [{ portal: 'Test Portal 1', count: 5 }];
    const newData = [...testData, { portal: 'Test Portal 3', count: 15 }];

    const { rerender } = render(<PortalBarChart title={testTitle} data={initialData} />);
    
    act(() => {
      jest.runAllTimers();
    });

    setTimeoutSpy.mockClear();
    rerender(<PortalBarChart title={testTitle} data={newData} />);
    
    act(() => {
      jest.runAllTimers();
    });

    expect(setTimeoutSpy).toHaveBeenCalled();
    
    jest.useRealTimers();
    setTimeoutSpy.mockRestore();
  });

  // Test with empty data
  test('handles empty data array correctly', () => {
    const emptyData: { portal: string; count: number }[] = [];
    const { container } = render(<PortalBarChart title={testTitle} data={emptyData} />);
    
    expect(screen.getByText('Tidak ada data yang sesuai')).toBeInTheDocument();
    expect(container.querySelector('.text-gray-500.bg-gray-50')).toBeInTheDocument();
    expect(mocks.mockAm5.Root.new).not.toHaveBeenCalled();
  });

  // Test missing amcharts libraries
  test('handles missing amcharts libraries gracefully', () => {
    // Save original values
    const originalAm5 = window.am5;
    const originalAm5xy = window.am5xy;
    const originalAm5themes_Animated = window.am5themes_Animated;
    
    // Remove amcharts from window
    delete (window as any).am5;
    delete (window as any).am5xy;
    delete (window as any).am5themes_Animated;
    
    mocks.mockAm5.Root.new.mockClear();

    renderWithTimers();
    expect(mocks.mockAm5.Root.new).not.toHaveBeenCalled();
    
    // Restore original values
    (window as any).am5 = originalAm5;
    (window as any).am5xy = originalAm5xy;
    (window as any).am5themes_Animated = originalAm5themes_Animated;
  });

  // Test tooltip customization
  test('customizes tooltip correctly', () => {
    mocks.mockTooltipLabel.setAll.mockClear();
    renderWithTimers();
    
    expect(mocks.mockSeries.get).toHaveBeenCalledWith("tooltip");
    expect(mocks.mockTooltipLabel.setAll).toHaveBeenCalledWith(expect.objectContaining({
      fontSize: 12,
      fontWeight: "400",
      fill: expect.any(String)
    }));
  });

  // Test when tooltip doesn't exist
  test('handles missing tooltip gracefully', () => {
    const originalGet = mocks.mockSeries.get;
    mocks.mockSeries.get = jest.fn().mockReturnValue(null);
    
    renderWithTimers();
    expect(mocks.mockSeries.get).toHaveBeenCalledWith("tooltip");
    
    mocks.mockSeries.get = originalGet;
  });

  // Test bar height calculation for different data sizes
  test('adjusts bar height based on data size', () => {
    // Test with 2 items (small dataset)
    renderWithTimers({ data: [{ portal: 'Portal 1', count: 5 }, { portal: 'Portal 2', count: 10 }] });
    expect(mocks.mockSeries.columns.template.setAll).toHaveBeenCalledWith(
      expect.objectContaining({ height: expect.anything() })
    );
    
    // Test with larger dataset
    mocks.mockSeries.columns.template.setAll.mockClear();
    renderWithTimers({ 
      data: Array(6).fill(0).map((_, i) => ({ portal: `Portal ${i+1}`, count: i+1 }))
    });
    
    expect(mocks.mockSeries.columns.template.setAll).toHaveBeenCalledWith(
      expect.objectContaining({ height: expect.anything() })
    );
  });

  // Test chart height calculation
  test('calculates chart height based on data size', () => {
    // Small dataset
    const { container, rerender } = render(<PortalBarChart title={testTitle} data={testData} />);
    expect(container.querySelector('div[style]')?.getAttribute('style')).toContain('height: 250px');
    
    // Larger dataset
    const largeData = Array(10).fill(0).map((_, i) => ({ portal: `Portal ${i+1}`, count: i+1 }));
    rerender(<PortalBarChart title={testTitle} data={largeData} />);
    
    expect(container.querySelector('div[style]')?.getAttribute('style')).toContain('height: 500px');
  });

  // Test for X-axis label visibility adapter
  test('shows only integer labels on X-axis', () => {
    const { labelsTemplate } = mocks;
    renderWithTimers();

    // Verify adapter was added with correct name
    expect(labelsTemplate.adapters.add).toHaveBeenCalledWith('visible', expect.any(Function));

    // Get the adapter function that was added to labels template
    const adapterFn = labelsTemplate.adapters.add.mock.calls[0][1];

    // Test cases
    const testCases = [
      { value: 5, expected: true },
      { value: 5.5, expected: false },
      { value: 0, expected: true },
      { value: null, expected: true },
    ];

    testCases.forEach(({ value, expected }) => {
      const target = { dataItem: { get: jest.fn().mockReturnValue(value) } };
      const result = adapterFn(true, target);
      expect(result).toBe(expected);
      expect(target.dataItem.get).toHaveBeenCalledWith("value");
    });
  });

  // Test for grid line visibility adapter
  test('shows grid lines only at integer values and at zero', () => {
    const { gridTemplate } = mocks;
    renderWithTimers();

    // Verify adapter was added with correct name
    expect(gridTemplate.adapters.add).toHaveBeenCalledWith('visible', expect.any(Function));

    // Get the adapter function that was added to grid template
    const adapterFn = gridTemplate.adapters.add.mock.calls[0][1];

    // Test cases
    const testCases = [
      { value: 5, expected: true },
      { value: 5.5, expected: false },
      { value: 0, expected: true },
    ];

    testCases.forEach(({ value, expected }) => {
      const target = { dataItem: { get: jest.fn().mockReturnValue(value) } };
      const result = adapterFn(true, target);
      expect(result).toBe(expected);
      expect(target.dataItem.get).toHaveBeenCalledWith("value");
    });
  });

  // Test for grid line styling adapter
  test('styles grid lines differently based on position', () => {
    const { gridStrokeAdapter } = mocks;
    renderWithTimers();
  
    // Test cases
    const testCases = [
      { value: 0, expected: [] },      // solid line
      { value: 5, expected: [2, 2] },  // dashed line
    ];
  
    testCases.forEach(({ value, expected }) => {
      const target = { dataItem: { get: jest.fn().mockReturnValue(value) } };
      // Test the function directly
      const result = gridStrokeAdapter([], target);
      expect(result).toEqual(expected);
      expect(target.dataItem.get).toHaveBeenCalledWith("value");
    });
  });  

  // Test adapters are called for grid lines
  test('sets grid line style base properties', () => {
    const { gridTemplate } = mocks;
    renderWithTimers();

    // Verify base grid line properties
    expect(gridTemplate.setAll).toHaveBeenCalledWith(
      expect.objectContaining({
        visible: true,
        stroke: expect.any(String),
        strokeOpacity: 1,
        strokeWidth: 1
      })
    );
  });

  // Test for tooltip font size (line 206)
  test('sets correct tooltip font size', () => {
    mocks.mockTooltipLabel.setAll.mockClear();
    renderWithTimers();

    // Verify tooltip font size
    expect(mocks.mockTooltipLabel.setAll).toHaveBeenCalledWith(
      expect.objectContaining({
        fontSize: 12
      })
    );
  });

  // Test for dynamic chart height calculation (lines 247-248)
  test('calculates chart height dynamically based on data length', () => {
    // Test with different data sizes
    const testCases = [
      {
        dataLength: 1,
        expectedHeight: '250px'  // Minimum height applied
      },
      {
        dataLength: 5,
        expectedHeight: '250px'  // Minimum height applied since 5*50 = 250
      },
      {
        dataLength: 6,
        expectedHeight: '300px'  // 6*50 = 300, which is > min height
      },
      {
        dataLength: 10,
        expectedHeight: '500px'  // 10*50 = 500
      }
    ];

    // Test each case
    testCases.forEach(({ dataLength, expectedHeight }) => {
      const testData = Array(dataLength).fill(0).map((_, i) => ({
        portal: `Portal ${i + 1}`,
        count: i + 1
      }));

      const { container } = render(<PortalBarChart title={testTitle} data={testData} />);
      const chartDiv = container.querySelector('.w-full[style]');

      expect(chartDiv).toHaveStyle(`height: ${expectedHeight}`);
    });
  });

  // Test for bar height calculation with exactly 3 items (line 206)
  test('sets correct bar height percentage when data length is exactly 3', () => {
    if (typeof window === 'undefined') {
      console.log('Skipping test in non-browser environment');
      return;
    }
    
    const threeItemData = [
      { portal: 'Portal 1', count: 5 },
      { portal: 'Portal 2', count: 10 },
      { portal: 'Portal 3', count: 15 }
    ];

    renderWithTimers({ data: threeItemData });
    
    expect(mocks.mockSeries.columns.template.setAll).toHaveBeenCalled();
    expect(mocks.mockAm5.percent).toHaveBeenCalledWith(40);
  });

  // Test for bar height calculation with exactly 5 items (line 206)
  test('sets correct bar height percentage when data length is exactly 5', () => {
    if (typeof window === 'undefined') {
      console.log('Skipping test in non-browser environment');
      return;
    }
    
    const fiveItemData = Array(5).fill(0).map((_, i) => ({ 
      portal: `Portal ${i+1}`, 
      count: i+1 
    }));

    renderWithTimers({ data: fiveItemData });
    
    expect(mocks.mockSeries.columns.template.setAll).toHaveBeenCalled();
    expect(mocks.mockAm5.percent).toHaveBeenCalledWith(60);
  });

  // Test for grid stroke adapter implementation
  describe('gridStrokeAdapter function', () => {
    test('returns empty array for values close to zero', () => {
      const testCases = [
        { value: 0, expected: [] },
        { value: 0.001, expected: [] },
        { value: -0.001, expected: [] },
        { value: 0.009, expected: [] },
      ];
      
      testCases.forEach(({ value, expected }) => {
        const target = { dataItem: { get: jest.fn().mockReturnValue(value) } };
        const result = gridStrokeAdapter([], target);
        expect(result).toEqual(expected);
        expect(target.dataItem.get).toHaveBeenCalledWith("value");
      });
    });
    
    test('returns dashed line array for non-zero values', () => {
      const testCases = [
        { value: 1, expected: [2, 2] },
        { value: -1, expected: [2, 2] },
        { value: 5.5, expected: [2, 2] },
        { value: 100, expected: [2, 2] },
      ];
      
      testCases.forEach(({ value, expected }) => {
        const target = { dataItem: { get: jest.fn().mockReturnValue(value) } };
        const result = gridStrokeAdapter([], target);
        expect(result).toEqual(expected);
        expect(target.dataItem.get).toHaveBeenCalledWith("value");
      });
    });
        
    test('ignores input strokeDasharray parameter', () => {
      // The adapter should ignore the input strokeDasharray
      const inputDash = [1, 1];
      
      // Test with zero value (should return [])
      const zeroTarget = { dataItem: { get: jest.fn().mockReturnValue(0) } };
      expect(gridStrokeAdapter(inputDash, zeroTarget)).toEqual([]);
      
      // Test with non-zero value (should return [2, 2])
      const nonZeroTarget = { dataItem: { get: jest.fn().mockReturnValue(5) } };
      expect(gridStrokeAdapter(inputDash, nonZeroTarget)).toEqual([2, 2]);
    });
  });
});
