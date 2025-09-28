// StatsItem.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsItem from '../../../app/components/dashboard/cases_number/StatsItem';

const normalize = (text: string | null | undefined) => (text ?? '').replace(/\s+/g, ' ').trim();

const expectFormattedValue = (testId: string, count: number, percentage: number) => {
  const container = screen.getByTestId(testId);
  const valueNode = container.querySelector('span.font-semibold');
  const expected = `${count.toLocaleString()} (${percentage}%)`;
  expect(normalize(valueNode?.textContent)).toBe(normalize(expected));
};

describe('StatsItem', () => {
  test('renders Kasus Kematian correctly with positive numbers', () => {
    render(<StatsItem type="kasus_kematian" count={13000} percentage={6.36} />);
    expect(screen.getByText('Kasus Kematian')).toBeInTheDocument();
    expect(screen.getByAltText('Kasus Kematian')).toBeInTheDocument();
    expectFormattedValue('stats-item-kasus_kematian', 13000, 6.36);

    const container = screen.getByTestId('stats-item-kasus_kematian');
    expect(container).toHaveClass('bg-red-100');
    expect(container).toHaveClass('text-red-800');
  });

  test('renders Kasus Terjangkit correctly with positive numbers', () => {
    render(<StatsItem type="kasus_terjangkit" count={190000} percentage={92.93} />);
    expect(screen.getByText('Kasus Terjangkit')).toBeInTheDocument();
    expectFormattedValue('stats-item-kasus_terjangkit', 190000, 92.93);

    const container = screen.getByTestId('stats-item-kasus_terjangkit');
    expect(container).toHaveClass('bg-yellow-100');
    expect(container).toHaveClass('text-yellow-800');
  });

  test('renders Kasus Sembuh correctly with positive numbers', () => {
    render(<StatsItem type="kasus_sembuh" count={1455} percentage={0.71} />);
    expect(screen.getByText('Kasus Sembuh')).toBeInTheDocument();
    expectFormattedValue('stats-item-kasus_sembuh', 1455, 0.71);

    const container = screen.getByTestId('stats-item-kasus_sembuh');
    expect(container).toHaveClass('bg-green-100');
    expect(container).toHaveClass('text-green-800');
  });

  test('handles zero values correctly', () => {
    render(<StatsItem type="kasus_kematian" count={0} percentage={0} />);
    expect(screen.getByText('Kasus Kematian')).toBeInTheDocument();
    expectFormattedValue('stats-item-kasus_kematian', 0, 0);
  });

  test('handles negative values correctly', () => {
    render(<StatsItem type="kasus_terjangkit" count={-100} percentage={-10} />);
    expect(screen.getByText('Kasus Terjangkit')).toBeInTheDocument();
    expectFormattedValue('stats-item-kasus_terjangkit', -100, -10);
  });

  test('handles default case when an invalid type is passed', () => {
    render(<StatsItem type={"invalid" as any} count={100} percentage={50} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expectFormattedValue('stats-item-invalid', 100, 50);

    const container = screen.getByTestId('stats-item-invalid');
    expect(container).toHaveClass('bg-gray-100');
    expect(container).toHaveClass('text-gray-800');
  });
});
