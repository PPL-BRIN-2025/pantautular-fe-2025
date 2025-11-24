// CaseNumberCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaseNumberCard from '../../../app/components/dashboard/cases_number/CaseNumberCard';

const downloadCalls: any[] = [];
jest.mock('../../../app/components/dashboard/DownloadButton', () => ({
  __esModule: true,
  default: (props: any) => {
    downloadCalls.push(props);
    return (
      <button type="button" aria-label="download img" onClick={props.onClick}>
        Download
      </button>
    );
  },
}));

// Helper function to assert StatsItem content
const assertStatsItem = (testId: string, expectedLabel: string, expectedCountPercentage: string) => {
  const item = screen.getByTestId(testId);
  expect(item).toHaveTextContent(expectedLabel);
  expect(item).toHaveTextContent(expectedCountPercentage);
};

describe('CaseNumberCard', () => {
  afterEach(() => {
    jest.clearAllMocks();
    downloadCalls.length = 0;
  });
  test('renders correctly with positive numbers', () => {
    const props = {
      jumlah_kasus: 100,
      jumlah_kasus_kematian: 10,
      jumlah_kasus_terjangkit: 80,
      jumlah_kasus_sembuh: 10,
    };
    render(<CaseNumberCard {...props} />);
    
    // Header assertions
    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download img/i })).toBeInTheDocument();

    // StatsItem assertions using the helper
    assertStatsItem('stats-item-kasus_kematian', 'Kasus Kematian', '10 (10%)');
    assertStatsItem('stats-item-kasus_terjangkit', 'Kasus Terjangkit', '80 (80%)');
    assertStatsItem('stats-item-kasus_sembuh', 'Kasus Sembuh', '10 (10%)');
  });

  test('handles zero total cases correctly', () => {
    const props = {
      jumlah_kasus: 0,
      jumlah_kasus_kematian: 0,
      jumlah_kasus_terjangkit: 0,
      jumlah_kasus_sembuh: 0,
    };
    render(<CaseNumberCard {...props} />);
    
    // Header assertions
    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    // Division by zero leads to NaN percentages
    assertStatsItem('stats-item-kasus_kematian', 'Kasus Kematian', '0 (NaN%)');
    assertStatsItem('stats-item-kasus_terjangkit', 'Kasus Terjangkit', '0 (NaN%)');
    assertStatsItem('stats-item-kasus_sembuh', 'Kasus Sembuh', '0 (NaN%)');
  });

  test('handles negative values correctly', () => {
    const props = {
      jumlah_kasus: -100,
      jumlah_kasus_kematian: -10,
      jumlah_kasus_terjangkit: -80,
      jumlah_kasus_sembuh: -10,
    };
    render(<CaseNumberCard {...props} />);
    
    // Header assertions
    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('-100')).toBeInTheDocument();

    // (-10 / -100)*100 === 10, etc.
    assertStatsItem('stats-item-kasus_kematian', 'Kasus Kematian', '10 (10%)');
    assertStatsItem('stats-item-kasus_terjangkit', 'Kasus Terjangkit', '80 (80%)');
    assertStatsItem('stats-item-kasus_sembuh', 'Kasus Sembuh', '10 (10%)');
  });

  test('Download button enables only when data available', () => {
    render(
      <CaseNumberCard
        jumlah_kasus={0}
        jumlah_kasus_kematian={0}
        jumlah_kasus_terjangkit={0}
        jumlah_kasus_sembuh={0}
      />
    );
    let props = downloadCalls[downloadCalls.length - 1];
    expect(props.canDownload()).toBe(false);

    downloadCalls.length = 0;
    render(
      <CaseNumberCard
        jumlah_kasus={5}
        jumlah_kasus_kematian={1}
        jumlah_kasus_terjangkit={3}
        jumlah_kasus_sembuh={1}
      />
    );
    props = downloadCalls[downloadCalls.length - 1];
    expect(props.canDownload()).toBe(true);
    expect(props.getTarget()).toBeInstanceOf(HTMLElement);
  });
});
