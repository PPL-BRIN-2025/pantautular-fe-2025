import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortalBarChart from '../../app/components/dashboard/sumberBerita/PortalBarChart';

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

// Mock AM5 libraries with more complete implementations
const mockAxisRendererY = {
  labels: { template: { setAll: jest.fn() } },
  grid: { template: { set: jest.fn() } }
};

const mockAxisRendererX = {
  labels: { template: { setAll: jest.fn() } },
  grid: { template: { set: jest.fn() } }
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
  data: { setAll: jest.fn() }
};

const mockXAxis = {
  get: jest.fn().mockImplementation(prop => {
    if (prop === "renderer") {
      return { 
        labels: { template: { setAll: jest.fn() } },
        grid: { template: { set: jest.fn() } }
      };
    }
    return {};
  })
};

// Create tooltip mock that can be referenced and tested later
const mockTooltipLabel = { setAll: jest.fn() };
const mockTooltip = {
  label: mockTooltipLabel,
  get: jest.fn().mockReturnValue({
    setAll: jest.fn()
  })
};

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

const mockChart = {
  yAxes: { push: jest.fn().mockReturnValue(mockYAxis) },
  xAxes: { push: jest.fn().mockReturnValue(mockXAxis) },
  series: { push: jest.fn().mockReturnValue(mockSeries) },
  appear: jest.fn()
};

const mockRoot = {
  setThemes: jest.fn(),
  container: {
    children: {
      push: jest.fn().mockReturnValue(mockChart)
    }
  },
  dispose: jest.fn()
};

// Create more complete mocks
const mockAm5 = {
  Root: {
    new: jest.fn().mockReturnValue(mockRoot)
  },
  color: jest.fn(value => `mocked-color-${value}`),
  p50: 0.5,
  Tooltip: {
    new: jest.fn().mockReturnValue({
      label: { setAll: jest.fn() }
    })
  },
  Bullet: {
    new: jest.fn()
  },
  percent: jest.fn(value => value)
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
    new: jest.fn().mockReturnValue(mockAxisRendererY)
  },
  AxisRendererX: {
    new: jest.fn().mockReturnValue(mockAxisRendererX)
  }
};

const mockAm5themes_Animated = {
  new: jest.fn().mockReturnValue({})
};

describe('PortalBarChart Component', () => {
  beforeEach(() => {
    // Setup window object with mocked amcharts
    Object.defineProperty(window, 'am5', {
      value: mockAm5,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'am5xy', {
      value: mockAm5xy,
      writable: true,
      configurable: true
    });
    Object.defineProperty(window, 'am5themes_Animated', {
      value: mockAm5themes_Animated,
      writable: true,
      configurable: true
    });

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
  });

  // Test rendering
  test('renders chart with correct title and button', () => {
    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 },
      { portal: 'Test Portal 2', count: 10 }
    ];

    render(<PortalBarChart title={title} data={data} />);

    // Check title and button are rendered
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('Lihat Detail')).toBeInTheDocument();
    
    // Verify the chart container exists
    const chartContainer = document.querySelector('div[class="w-full h-[250px]"]');
    expect(chartContainer).toBeInTheDocument();
  });

  // Test button click
  test('handles button click correctly', () => {
    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    // Clear previous calls
    (console.log as jest.Mock).mockClear();

    render(<PortalBarChart title={title} data={data} />);

    // Find the button by its role and text content
    const button = screen.getByRole('button', { name: /Lihat Detail/i });
    expect(button).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(button);
    
    // Verify console.log was called with the expected message
    expect(console.log).toHaveBeenCalledWith(`View details for ${title}`);
  });

  // Test chart initialization
  test('initializes chart with correct data', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 },
      { portal: 'Test Portal 2', count: 10 }
    ];

    render(<PortalBarChart title={title} data={data} index={0} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Verify chart initialization
    expect(mockAm5.Root.new).toHaveBeenCalled();
    expect(mockRoot.setThemes).toHaveBeenCalled();
    expect(mockRoot.container.children.push).toHaveBeenCalled();
    
    // Verify axes creation
    expect(mockChart.yAxes.push).toHaveBeenCalled();
    expect(mockChart.xAxes.push).toHaveBeenCalled();
    
    // Verify series creation
    expect(mockChart.series.push).toHaveBeenCalled();
    
    // Verify data was set
    expect(mockYAxis.data.setAll).toHaveBeenCalled();
    expect(mockSeries.data.setAll).toHaveBeenCalled();
    
    // Restore timers
    jest.useRealTimers();
  });

  // Test with custom index
  test('uses custom index for chart ID and delay', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];
    const customIndex = 2;

    render(<PortalBarChart title={title} data={data} index={customIndex} />);

    // Verify setTimeout was called with the correct delay
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), customIndex * 100);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Restore timers
    jest.useRealTimers();
    setTimeoutSpy.mockRestore();
  });

  // Test cleanup
  test('cleans up resources on unmount', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();
    
    // Mock Promise.then to directly call the callback with mockRoot
    const mockPromiseThen = jest.fn().mockImplementation(cb => {
      cb(mockRoot);
      return { catch: jest.fn() };
    });
    
    // Mock Promise
    const mockPromise = {
      then: mockPromiseThen
    };
    
    // Mock async/await
    jest.spyOn(global, 'Promise').mockImplementation(() => mockPromise as any);

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    const { unmount } = render(<PortalBarChart title={title} data={data} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Unmount component to trigger the cleanup function
    unmount();

    // Fast-forward any remaining timers
    act(() => {
      jest.runAllTimers();
    });

    // Restore timers
    jest.useRealTimers();
  });

  // Test cleanup with root being null
  test('cleanup handles null root gracefully', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();
    
    // Mock Promise.then to directly call the callback with null
    const mockPromiseThen = jest.fn().mockImplementation(cb => {
      cb(null); // Pass null instead of mockRoot
      return { catch: jest.fn() };
    });
    
    // Mock Promise
    const mockPromise = {
      then: mockPromiseThen
    };
    
    // Mock async/await
    jest.spyOn(global, 'Promise').mockImplementation(() => mockPromise as any);

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    const { unmount } = render(<PortalBarChart title={title} data={data} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Unmount component to trigger the cleanup function
    unmount();

    // Fast-forward any remaining timers
    act(() => {
      jest.runAllTimers();
    });

    // Verify root.dispose was not called since root is null
    expect(mockRoot.dispose).not.toHaveBeenCalled();
    
    // Restore timers
    jest.useRealTimers();
  });

  // Test data changes
  test('updates chart when data changes', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    const title = 'Test Chart';
    const initialData = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    const { rerender } = render(<PortalBarChart title={title} data={initialData} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Clear mocks
    setTimeoutSpy.mockClear();

    // Update with new data
    const newData = [
      { portal: 'Test Portal 1', count: 5 },
      { portal: 'Test Portal 2', count: 10 }
    ];

    rerender(<PortalBarChart title={title} data={newData} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Since dependencies include data, the effect should run again
    expect(setTimeoutSpy).toHaveBeenCalled();
    
    // Restore timers
    jest.useRealTimers();
    setTimeoutSpy.mockRestore();
  });

  // Test with empty data
  test('handles empty data array', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();

    const title = 'Test Chart';
    const emptyData: { portal: string; count: number }[] = [];

    const { container } = render(<PortalBarChart title={title} data={emptyData} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Verify that chart initialization does NOT occur (chart should not be rendered)
    expect(mockAm5.Root.new).not.toHaveBeenCalled();
    
    // Instead, verify that the "no data" message is displayed
    expect(screen.getByText('Tidak ada data yang sesuai')).toBeInTheDocument();
    
    // Verify that the chart container is still there, but with the "no data" message
    const noDataContainer = container.querySelector('.text-gray-500.bg-gray-50');
    expect(noDataContainer).toBeInTheDocument();
    
    // Restore timers
    jest.useRealTimers();
  });

  // Test when amcharts libraries are not available
  test('handles missing amcharts libraries', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();
    
    // Save original values
    const originalAm5 = window.am5;
    const originalAm5xy = window.am5xy;
    const originalAm5themes_Animated = window.am5themes_Animated;
    
    // Remove amcharts from window
    delete (window as any).am5;
    delete (window as any).am5xy;
    delete (window as any).am5themes_Animated;
    
    // Clear Root.new mock calls from previous tests
    mockAm5.Root.new.mockClear();

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    render(<PortalBarChart title={title} data={data} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // No errors should be thrown, function should exit early
    // Since the libraries are missing, Root.new should not be called at all
    expect(mockAm5.Root.new).not.toHaveBeenCalled();
    
    // Restore original values
    (window as any).am5 = originalAm5;
    (window as any).am5xy = originalAm5xy;
    (window as any).am5themes_Animated = originalAm5themes_Animated;
    
    // Restore timers
    jest.useRealTimers();
  });

  // Test tooltip customization - specifically covering lines 177-178 in the component
  test('customizes tooltip with custom color', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();

    // Reset mockTooltipLabel.setAll to track new calls
    mockTooltipLabel.setAll.mockClear();

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    render(<PortalBarChart title={title} data={data} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Verify tooltip customization
    expect(mockSeries.get).toHaveBeenCalledWith("tooltip");
    
    // Specifically check that setAll was called with the expected parameters
    // This tests lines 177-178 in the component
    expect(mockTooltipLabel.setAll).toHaveBeenCalledWith({
      fontSize: 9,
      fontWeight: "400",
      fill: "mocked-color-#333333" // This matches our mockAm5.color implementation
    });

    // Restore timers
    jest.useRealTimers();
  });

  // Test when tooltip doesn't exist
  test('handles case when tooltip does not exist', async () => {
    // Mock implementation of setTimeout
    jest.useFakeTimers();

    // Override mockSeries.get to return null for this test only
    const originalGet = mockSeries.get;
    mockSeries.get = jest.fn().mockReturnValue(null);

    const title = 'Test Chart';
    const data = [
      { portal: 'Test Portal 1', count: 5 }
    ];

    render(<PortalBarChart title={title} data={data} />);

    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });

    // Verify series.get was called but no error occurs
    expect(mockSeries.get).toHaveBeenCalledWith("tooltip");
    
    // Restore original mockSeries.get
    mockSeries.get = originalGet;
    
    // Restore timers
    jest.useRealTimers();
  });
});