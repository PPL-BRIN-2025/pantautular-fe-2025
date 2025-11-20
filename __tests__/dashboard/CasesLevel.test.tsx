import { render, screen, waitFor } from '@testing-library/react';
import AmChartTingkatanKasus from '../../app/components/dashboard/CasesLevel';
import React from "react";

const downloadedProps: any[] = [];
jest.mock("../../app/components/dashboard/DownloadButton", () => ({
  __esModule: true,
  default: (props: any) => {
    downloadedProps.push(props);
    return <button aria-label="download img" onClick={() => props.canDownload?.()} />;
  },
}));

// Create a more functional mock of amcharts that allows testing the actual logic
const mockDispose = jest.fn();
const mockSetAll = jest.fn();
const mockPush = jest.fn();
const mockRule = jest.fn(() => ({ setAll: mockSetAll }));
const mockDataSetAll = jest.fn();
const mockSeriesAppear = jest.fn();
const mockChartAppear = jest.fn();

const mockRoot = {
  container: {
    children: {
      push: jest.fn(() => mockChart)
    }
  },
  setThemes: jest.fn(),
  dispose: mockDispose,
  verticalLayout: {}
};

const mockCursor = {
  lineY: { set: jest.fn() }
};

// Mock event handlers
const mockLegendEventOn = jest.fn();

// Update mockChart with event handling capabilities
const mockChart = {
  xAxes: { push: mockPush },
  yAxes: { push: mockPush },
  series: { 
    push: jest.fn(() => ({
      data: { setAll: mockDataSetAll },
      appear: mockSeriesAppear,
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
  Scrollbar: {
    new: jest.fn()
  },
  Tooltip: {
    new: jest.fn()
  },
  Legend: {
    new: jest.fn()
  },
  p100: {}
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
    new: jest.fn() 
  },
  AxisRendererY: { 
    new: jest.fn() 
  },
  XYCursor: { 
    new: jest.fn(() => mockCursor)
  }
}));

jest.mock('@amcharts/amcharts5/themes/Animated', () => ({
  new: jest.fn(),
  __esModule: true,
  default: { new: jest.fn() }
}));

describe('AmChartKasus Component', () => {
  const mockJsonData = {
    data: {
      mild: [
        { date: '2023-10-01', count: 10 },
        { date: '2023-10-02', count: 15 },
      ],
      severe: [
        { date: '2023-10-01', count: 5 },
        { date: '2023-10-02', count: 8 },
      ],
    },
  };

  beforeEach(() => {
    // Reset all mocks between tests
    jest.clearAllMocks();
    downloadedProps.length = 0;
    
    // Set up a mock for document.getElementById
    document.getElementById = jest.fn().mockImplementation(() => ({
      innerHTML: ''
    }));
  });

  // Test for theme initialization (line 33-36)
  it('sets up chart theme with proper configurations', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      expect(mockRule).toHaveBeenCalledWith('AxisLabel', ['minor']);
      expect(mockRule).toHaveBeenCalledWith('Grid', ['x']);
      expect(mockRule).toHaveBeenCalledWith('Grid', ['x', 'minor']);
      expect(mockSetAll).toHaveBeenCalledTimes(3);
    });
  });

  // Test for data formatting (line 47-54)
  it('formats the data correctly from the input JSON', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    // The chart should be created with 2 series (mild and severe)
    await waitFor(() => {
      // Check if series creation was called twice (once for each severity level)
      expect(mockChart.series.push).toHaveBeenCalledTimes(2);
      
      // Check if data was set for each series
      expect(mockDataSetAll).toHaveBeenCalledTimes(2);
    });
  });

  // Test for chart cursor initialization (line 95-99)
  it('initializes the chart cursor with proper settings', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      expect(mockChart.set).toHaveBeenCalledWith('cursor', expect.anything());
      expect(mockCursor.lineY.set).toHaveBeenCalledWith('visible', false);
    });
  });

  // Test for chart cleanup (line 157)
  it('cleans up chart resources on unmount', async () => {
    const { unmount } = render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    unmount();
    
    await waitFor(() => {
      expect(mockDispose).toHaveBeenCalled();
    });
  });

  // Test for chart animation (line 155)
  it('animates the chart appearance', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      expect(mockChartAppear).toHaveBeenCalledWith(1000, 100);
    });
  });

  // Test for data count calculation (line 140-152)
  it('calculates and displays the total number of data points', async () => {
    // Create a mock element that we'll return from getElementById
    const mockDataCountElement = document.createElement('div');
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'dataCount') {
        return mockDataCountElement;
      }
      return null;
    });

    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
  expect(document.getElementById).toHaveBeenCalledWith('dataCount');
  expect(mockDataCountElement.innerHTML).toContain('38 Kasus');
    });
  });

  // Edge case - Data with dates that need conversion
  it('handles date conversion correctly', async () => {
    const dataWithSpecialDates = {
      data: {
        mild: [
          { date: '2023-10-01T12:00:00Z', count: 10 },
          { date: 'Invalid Date', count: 15 },
        ]
      }
    };
    
    render(<AmChartTingkatanKasus jsonData={dataWithSpecialDates} />);
    
    // Component should not crash with invalid dates
    await waitFor(() => {
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });

  it('exposes download helpers that respect data availability', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    await waitFor(() => expect(downloadedProps[0]).toBeDefined());
    expect(downloadedProps[0].canDownload()).toBe(true);
    expect(downloadedProps[0].getTarget()).toBeInstanceOf(HTMLElement);

    downloadedProps.length = 0;
    const zeroData = { data: { none: [{ date: "2024-01-01", count: 0 }] } };
    render(<AmChartTingkatanKasus jsonData={zeroData as any} />);
    await waitFor(() => expect(downloadedProps[0]).toBeDefined());
    expect(downloadedProps[0].canDownload()).toBe(false);
  });

  // Test legend hover events (lines 112-119)
  it('sets up legend item pointerover event', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      expect(mockLegendEventOn).toHaveBeenCalledWith('pointerover', expect.any(Function));
      
      // Find the call to 'on' with 'pointerover'
      const pointerOverCall = mockLegendEventOn.mock.calls.find(
        call => call[0] === 'pointerover'
      );
      
      // Get the handler function
      const handler = pointerOverCall[1];
      
      // Simulate calling the handler with a mock event
      handler({
        target: {
          dataItem: {
            dataContext: 'mockSeries'
          }
        }
      });
      
      // Verify the series.each was called (line 114)
      expect(mockChart.series.each).toHaveBeenCalled();
    });
  });

  // NEW TEST: Test the early return branch when series is undefined (line 111)
  it('handles undefined series in pointerover event', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      // Find the call to 'on' with 'pointerover'
      const pointerOverCall = mockLegendEventOn.mock.calls.find(
        call => call[0] === 'pointerover'
      );
      
      if (!pointerOverCall) {
        throw new Error('pointerover event handler was not registered');
      }
      
      // Get the handler function
      const handler = pointerOverCall[1];
      
      // Reset the mock to verify it's not called after early return
      mockChart.series.each.mockClear();
      
      // Call handler with undefined dataContext (should trigger early return)
      handler({
        target: {
          dataItem: {
            dataContext: undefined // This should trigger the "if (!series) return;" branch
          }
        }
      });
      
      // series.each should not be called because of early return
      expect(mockChart.series.each).not.toHaveBeenCalled();
      
      // Also test with null dataItem
      handler({
        target: {
          dataItem: null // This should also trigger the early return
        }
      });
      
      // series.each should still not be called
      expect(mockChart.series.each).not.toHaveBeenCalled();
    });
  });

  // Test legend pointerout event (lines 125-126)
  it('sets up legend item pointerout event', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      expect(mockLegendEventOn).toHaveBeenCalledWith('pointerout', expect.any(Function));
      
      // Find the call to 'on' with 'pointerout'
      const pointerOutCall = mockLegendEventOn.mock.calls.find(
        call => call[0] === 'pointerout'
      );
      
      // Get the handler function
      const handler = pointerOutCall[1];
      
      // Simulate calling the handler
      handler();
      
      // Verify the series.each was called (line 126)
      expect(mockChart.series.each).toHaveBeenCalled();
    });
  });

  // Test DOM element creation/access (lines 159-161)
  it('renders DOM elements correctly', () => {
    // Mock the document structure more completely
    const originalGetElementById = document.getElementById;
    const mockDataCountElement = document.createElement('div');
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'dataCount') {
        return mockDataCountElement;
      }
      return null;
    });

    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);

    // Check if the title and data count elements exist
    expect(screen.getByText('Tingkatan Kasus')).toBeInTheDocument();
    
    // Verify the innerHTML of the dataCount element includes the correct values
    expect(mockDataCountElement.innerHTML).toContain('Kasus');
    expect(mockDataCountElement.innerHTML).toContain('svg');

    // Restore original function
    document.getElementById = originalGetElementById;
  });

  // Test with missing DOM elements (line 159-161 edge case)
  it('handles missing DOM elements gracefully', () => {
    // Mock getElementById to return null
    document.getElementById = jest.fn().mockReturnValue(null);

    // Component should render without errors even if DOM element isn't found
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    expect(document.getElementById).toHaveBeenCalledWith('dataCount');
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  // Original tests remain below
  // Happy Case - Component renders with valid data
  it('renders the component with valid data (Happy Case)', () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    expect(screen.getByText('Tingkatan Kasus')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download img/i })).toBeInTheDocument();
  });

  // Unhappy Case - Component handles null data
  it('handles null jsonData gracefully (Unhappy Case)', () => {
  render(<AmChartTingkatanKasus jsonData={null as any} />);
    
    expect(screen.getByText('Tingkatan Kasus')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  // Edge Case - Component handles empty data object
  it('handles empty data object gracefully (Edge Case)', () => {
    const emptyData = { data: {} };
    render(<AmChartTingkatanKasus jsonData={emptyData} />);
    
    expect(screen.getByText('Tingkatan Kasus')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  // Edge Case - Component handles data with single entry
  it('handles data with single entry (Edge Case)', () => {
    const singleEntryData = {
      data: {
        mild: [{ date: '2023-10-01', count: 10 }]
      }
    };
    
    render(<AmChartTingkatanKasus jsonData={singleEntryData} />);
    expect(screen.getByText('Tingkatan Kasus')).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  // Test all branches in legend pointerover - testing the branch when series === target series (line 119)
  it('handles the case where series equals target series in pointerover event', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      const pointerOverCall = mockLegendEventOn.mock.calls.find(call => call[0] === 'pointerover');
      const handler = pointerOverCall[1];
      
      // Mock a specific series object
      const mockSpecificSeries = { 
        strokes: { template: { setAll: jest.fn() } }
      };
      
      // Override the each method for this specific test to handle both branches
      mockChart.series.each.mockImplementationOnce(cb => {
        // Call first with a different series (if (s !== series) branch)
        cb({
          strokes: { template: { setAll: jest.fn() } },
          get: jest.fn()
        });
        
        // Call again with the target series (else branch - the series === target)
        cb(mockSpecificSeries);
      });
      
      // Call the handler with our mocked series as dataContext
      handler({
        target: {
          dataItem: {
            dataContext: mockSpecificSeries
          }
        }
      });
      
      // We expect that the each was called and both branches were executed
      expect(mockChart.series.each).toHaveBeenCalled();
    });
  });
  
  // Test different branch paths for the dataCount element (lines 159-161)
  describe('Testing DOM element branches', () => {
    // Test both branches of the getElementById null check
    it('covers the branch where getElementById returns a valid element', () => {
      // Create an actual DOM element
      const mockElement = document.createElement('div');
      
      // Mock getElementById to return our element
      document.getElementById = jest.fn().mockReturnValue(mockElement);
      
      render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
      
      // Verify the element was found and modified
      expect(document.getElementById).toHaveBeenCalledWith('dataCount');
      expect(mockElement.innerHTML).not.toBe('');
    });
    
    it('covers the branch where getElementById returns null', () => {
      // Mock getElementById to return null (testing the implicit if-check branch)
      document.getElementById = jest.fn().mockReturnValue(null);
      
      render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
      
      // Verify getElementById was called but didn't cause an error
      expect(document.getElementById).toHaveBeenCalledWith('dataCount');
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });
  
  // Test the branches of series.each in pointerout handler (line 126)
  it('covers all branches in pointerout handler series.each', async () => {
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    await waitFor(() => {
      const pointerOutCall = mockLegendEventOn.mock.calls.find(call => call[0] === 'pointerout');
      const handler = pointerOutCall[1];
      
      // Mock different series with different fill values to test the s.get('fill') branch
      mockChart.series.each.mockImplementationOnce(cb => {
        // Call with a series returning null for get('fill')
        cb({
          strokes: { template: { setAll: jest.fn() } },
          get: jest.fn().mockReturnValue(null)
        });
        
        // Call with a series returning a valid fill
        cb({
          strokes: { template: { setAll: jest.fn() } },
          get: jest.fn().mockReturnValue('#FF0000')
        });
      });
      
      handler();
      
      // Verify all branches were exercised
      expect(mockChart.series.each).toHaveBeenCalled();
    });
  });

  // Test empty data object with null check branch (line 46-47)
  it('handles empty data object branches properly', () => {
    // Test with data object that exists but has no keys
    const emptyKeysData = { data: {} };
    render(<AmChartTingkatanKasus jsonData={emptyKeysData} />);
    
    // This ensures the first branch (jsonData.data exists but is empty) is covered
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  // Test for branch coverage in updateTotalDataCount function (lines 161-163)
  describe('updateTotalDataCount function branch coverage', () => {
    // Test for the different branch paths in the length calculation
    it('handles severity levels with empty arrays correctly', () => {
      // Create data with some empty arrays
      const dataWithEmptyArrays = {
        data: {
          mild: [], // Empty array should contribute 0 to total
          severe: [{ date: '2023-10-01', count: 5 }],
          critical: [] // Another empty array
        }
      };
      
      // Mock getElementById to capture HTML updates
      const mockElement = document.createElement('div');
      document.getElementById = jest.fn().mockReturnValue(mockElement);
      
      render(<AmChartTingkatanKasus jsonData={dataWithEmptyArrays} />);
      
  // We expect 5 total cases (from severe)
  expect(mockElement.innerHTML).toContain('5 Kasus');
    });
    
    // Test specific edge case where all arrays are empty
    it('handles all empty arrays correctly in the calculation', () => {
      const allEmptyData = {
        data: {
          mild: [],
          severe: [],
          critical: []
        }
      };
      
      const mockElement = document.createElement('div');
      document.getElementById = jest.fn().mockReturnValue(mockElement);
      
      render(<AmChartTingkatanKasus jsonData={allEmptyData} />);
      
      // We expect 0 data points
      expect(mockElement.innerHTML).toContain('0 Kasus');
    });
    
    // Test for branch coverage in forEach iteration behavior
    it('correctly iterates and sums different length arrays', () => {
      const mixedLengthData = {
        data: {
          mild: [{ date: '2023-10-01', count: 5 }],
          severe: [
            { date: '2023-10-01', count: 10 }, 
            { date: '2023-10-02', count: 15 }
          ],
          critical: [
            { date: '2023-10-01', count: 20 }, 
            { date: '2023-10-02', count: 25 },
            { date: '2023-10-03', count: 30 }
          ]
        }
      };
      
      const mockElement = document.createElement('div');
      document.getElementById = jest.fn().mockReturnValue(mockElement);
      
      render(<AmChartTingkatanKasus jsonData={mixedLengthData} />);
      
  // We expect 5 + 25 + 75 = 105 cases
  expect(mockElement.innerHTML).toContain('105 Kasus');
    });
  });

  // Test for all possible branch paths in the jsonData validation
  describe('jsonData validation branches', () => {
    // Test with undefined data field
    it('handles jsonData with undefined data field', () => {
      const badData = {} as any; // Missing data field
      
      // Should not throw an error
      render(<AmChartTingkatanKasus jsonData={badData} />);
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });

    // Test with null data field
    it('handles jsonData with null data field', () => {
    const nullDataField = { data: null } as any;

    // Should not throw an error
    render(<AmChartTingkatanKasus jsonData={nullDataField} />);
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
    
    // Test with undefined jsonData
    it('handles undefined jsonData', () => {
  const undefinedData = undefined as any;

  // Should not throw an error
  render(<AmChartTingkatanKasus jsonData={undefinedData} />);
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });

  // Comprehensive test for the try-catch block
  it('catches and handles errors properly in chart initialization', () => {
    // Mock console.error to prevent test output noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Force an error by making Root.new throw
    const errorMock = new Error('Forced error for testing');
    const amchartsMock = jest.requireMock('@amcharts/amcharts5');
    const originalRootNew = amchartsMock.Root.new;
    
    amchartsMock.Root.new = jest.fn(() => {
      throw errorMock;
    });
    
    // Component should not crash
    render(<AmChartTingkatanKasus jsonData={mockJsonData} />);
    
    // Error should be logged
    expect(console.error).toHaveBeenCalledWith(
      'Error initializing AmCharts:', 
      expect.any(Error)
    );
    
    // Restore original function and console
    amchartsMock.Root.new = originalRootNew;
    jest.restoreAllMocks();
  });
});
