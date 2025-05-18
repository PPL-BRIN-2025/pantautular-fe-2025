// StatsItem.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsItem from '../../../app/components/dashboard/cases_number/StatsItem';

describe('StatsItem', () => {
    test('renders Kasus Kematian correctly with positive numbers', () => {
      render(<StatsItem type="kasus_kematian" count={13000} percentage={6.36} />);
      expect(screen.getByText('Kasus Kematian')).toBeInTheDocument();
      expect(screen.getByAltText('Kasus Kematian')).toBeInTheDocument();
      expect(screen.getByText('13,000 (6.36%)')).toBeInTheDocument();

      const container = screen.getByTestId('stats-item-kasus_kematian');
      expect(container).toHaveClass('bg-red-100');
      expect(container).toHaveClass('text-red-800');
    });
  
    test('renders Kasus Terjangkit correctly with positive numbers', () => {
      render(<StatsItem type="kasus_terjangkit" count={190000} percentage={92.93} />);
      expect(screen.getByText('Kasus Terjangkit')).toBeInTheDocument();
      expect(screen.getByText('190,000 (92.93%)')).toBeInTheDocument();
  
      const container = screen.getByTestId('stats-item-kasus_terjangkit');
      expect(container).toHaveClass('bg-yellow-100');
      expect(container).toHaveClass('text-yellow-800');
    });
  
    test('renders Kasus Sembuh correctly with positive numbers', () => {
      render(<StatsItem type="kasus_sembuh" count={1455} percentage={0.71} />);
      expect(screen.getByText('Kasus Sembuh')).toBeInTheDocument();
      expect(screen.getByText('1,455 (0.71%)')).toBeInTheDocument();
  
      const container = screen.getByTestId('stats-item-kasus_sembuh');
      expect(container).toHaveClass('bg-green-100');
      expect(container).toHaveClass('text-green-800');
    });
  
    test('handles zero values correctly', () => {
      render(<StatsItem type="kasus_kematian" count={0} percentage={0} />);
      expect(screen.getByText('Kasus Kematian')).toBeInTheDocument();
      expect(screen.getByText('0 (0%)')).toBeInTheDocument();
    });
  
    test('handles negative values correctly', () => {
      render(<StatsItem type="kasus_terjangkit" count={-100} percentage={-10} />);
      expect(screen.getByText('Kasus Terjangkit')).toBeInTheDocument();
      expect(screen.getByText('-100 (-10%)')).toBeInTheDocument();
    });
  
    test('handles default case when an invalid type is passed', () => {
      // Forcing an invalid type with a type assertion
      render(<StatsItem type={"invalid" as any} count={100} percentage={50} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('100 (50%)')).toBeInTheDocument();

      const container = screen.getByTestId('stats-item-invalid');
      expect(container).toHaveClass('bg-gray-100');
      expect(container).toHaveClass('text-gray-800');
    });
  });
