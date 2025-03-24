// __tests__/utils/tooltipUtils.test.tsx
import { getTooltip } from '../../utils/tooltipUtils';
import { mapApi } from '../../services/api';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// Mock the modules
jest.mock('../../services/api');
jest.mock('../../app/components/case_detail/MapTooltip', () => (props: any) => (
  <div data-testid="tooltip-mock">{JSON.stringify(props)}</div>
));

// Mock ReactDOMServer properly
jest.mock('react-dom/server', () => ({
  renderToString: jest.fn()
}));

describe('getTooltip', () => {
  const mockData = { id: '123' };
  const mockCaseDetail = {
    id: '123',
    title: 'Test Case',
    description: 'Test Description',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    (ReactDOMServer.renderToString as jest.Mock).mockImplementation(
      (element: React.ReactElement) => `<div>${JSON.stringify(element.props)}</div>`
    );
  });

  it('should fetch case detail and render tooltip component', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockResolvedValue(mockCaseDetail);
    (ReactDOMServer.renderToString as jest.Mock).mockReturnValueOnce('<div>mocked tooltip</div>');

    const result = await getTooltip(mockData);

    expect(mapApi.getCaseDetail).toHaveBeenCalledWith('123');
    expect(ReactDOMServer.renderToString).toHaveBeenCalled();
    expect(result).toBe('<div>mocked tooltip</div>');
  });

  it('should handle API errors and return error message', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockRejectedValue(new Error('API Error'));

    const result = await getTooltip(mockData);

    expect(mapApi.getCaseDetail).toHaveBeenCalledWith('123');
    expect(ReactDOMServer.renderToString).not.toHaveBeenCalled();
    expect(result).toBe('<div class="bg-white p-4">Error loading data</div>');
  });

  it('should include the onClose handler in tooltip props', async () => {
    (mapApi.getCaseDetail as jest.Mock).mockResolvedValue(mockCaseDetail);
    const consoleSpy = jest.spyOn(console, 'log');

    await getTooltip(mockData);

    // Verify renderToString was called with expected props
    expect(ReactDOMServer.renderToString).toHaveBeenCalled();
    
    const [renderedElement] = (ReactDOMServer.renderToString as jest.Mock).mock.calls[0];
    expect(typeof renderedElement.props.onClose).toBe('function');
    
    // Test the onClose behavior
    renderedElement.props.onClose();
    expect(consoleSpy).toHaveBeenCalledWith('Close requested for tooltip:', '123');
  });
});