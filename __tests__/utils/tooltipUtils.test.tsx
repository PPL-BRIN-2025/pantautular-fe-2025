// __tests__/utils/tooltipUtils.test.tsx
import { getTooltip } from '../../utils/tooltipUtils';
import { mapApi } from '../../services/api';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Mock the API
jest.mock('../../services/api', () => ({
  mapApi: {
    getCaseDetail: jest.fn()
  }
}));

// Mock ReactDOMServer
jest.mock('react-dom/server', () => ({
  renderToString: jest.fn().mockReturnValue('<div>Mock Tooltip</div>')
}));

// Mock console.log
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('getTooltip', () => {
  const mockData = { id: '123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle API errors and return error message', async () => {
    // Mock API error
    (mapApi.getCaseDetail as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await getTooltip(mockData);

    expect(result).toBe('<div class="bg-white p-4">Error loading data</div>');
  });

  it('should include the onClose handler in tooltip props', async () => {
    // Mock successful API response
    const mockCaseDetail = { id: '123', title: 'Test Case' };
    (mapApi.getCaseDetail as jest.Mock).mockResolvedValue(mockCaseDetail);

    // Mock React.createElement
    const createElementSpy = jest.spyOn(React, 'createElement');
    
    await getTooltip(mockData);

    // Verify that createElement was called with the correct props
    expect(createElementSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: mockCaseDetail,
        onClose: expect.any(Function)
      })
    );

    // Get the onClose function from the props
    const props = createElementSpy.mock.calls[0][1] as { onClose: () => void };
    const onCloseArg = props.onClose;
    
    // Call the onClose function
    onCloseArg();
    
    // Verify console.log was called
    expect(consoleSpy).toHaveBeenCalledWith('Close requested for tooltip:', mockData.id);
  });
});