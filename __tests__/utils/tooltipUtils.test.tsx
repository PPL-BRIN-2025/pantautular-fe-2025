// __tests__/utils/tooltipUtils.test.tsx
import { getTooltip } from '../../utils/tooltipUtils';
import { mapApi } from '../../services/api';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Mock mapApi
jest.mock('../../services/api', () => ({
  mapApi: {
    getCaseDetail: jest.fn()
  }
}));

// Mock ReactDOMServer
jest.mock('react-dom/server', () => ({
  renderToString: jest.fn()
}));

// Mock React.createElement
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn()
}));

describe('getTooltip', () => {
  const mockData = {
    id: '1'
  };

  const mockCaseDetail = {
    id: '1',
    name: 'Test Case',
    details: 'Test Details'
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should fetch case detail and render tooltip component', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockResolvedValue(mockCaseDetail);
    (ReactDOMServer.renderToString as jest.Mock).mockReturnValueOnce('<div>mocked tooltip</div>');

    const result = await getTooltip(mockData);

    expect(mapApi.getCaseDetail).toHaveBeenCalledWith(mockData.id);
    expect(ReactDOMServer.renderToString).toHaveBeenCalled();
    expect(result).toBe('<div>mocked tooltip</div>');
  });

  it('should handle API errors and return error message', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await getTooltip(mockData);

    expect(result).toBe('<div class="bg-white p-4">Error loading data</div>');
  });

  it('should include the onClose handler in tooltip props', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockResolvedValue(mockCaseDetail);
    const consoleSpy = jest.spyOn(console, 'log');
    
    await getTooltip(mockData);

    // Check that the CaseDetailTooltip component was created with the correct props
    expect(React.createElement).toHaveBeenCalled();
    const createElementCalls = (React.createElement as jest.Mock).mock.calls;
    const tooltipProps = createElementCalls.length > 0 ? createElementCalls[0][1] : null;
    
    expect(tooltipProps).toHaveProperty('onClose');
    
    // Simulate calling the onClose handler
    tooltipProps?.onClose?.();
    expect(consoleSpy).toHaveBeenCalledWith('Close requested for tooltip:', mockData.id);
  });
});