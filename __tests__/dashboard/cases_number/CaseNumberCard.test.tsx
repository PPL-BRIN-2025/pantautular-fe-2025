// CaseNumberCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CaseNumberCard from '../../../app/components/dashboard/cases_number/CaseNumberCard';

describe('CaseNumberCard', () => {
  test('renders correctly with positive numbers', () => {
    const props = {
      jumlah_kasus: 100,
      jumlah_kasus_kematian: 10,
      jumlah_kasus_terjangkit: 80,
      jumlah_kasus_sembuh: 10,
    };

    render(<CaseNumberCard {...props} />);

    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    const kematian = screen.getByTestId('stats-item-kasus_kematian');
    expect(kematian).toHaveTextContent('Kasus Kematian');
    expect(kematian).toHaveTextContent('10 (10%)');

    const terjangkit = screen.getByTestId('stats-item-kasus_terjangkit');
    expect(terjangkit).toHaveTextContent('Kasus Terjangkit');
    expect(terjangkit).toHaveTextContent('80 (80%)');

    const sembuh = screen.getByTestId('stats-item-kasus_sembuh');
    expect(sembuh).toHaveTextContent('Kasus Sembuh');
    expect(sembuh).toHaveTextContent('10 (10%)');
  });

  test('handles zero total cases correctly', () => {
    const props = {
      jumlah_kasus: 0,
      jumlah_kasus_kematian: 0,
      jumlah_kasus_terjangkit: 0,
      jumlah_kasus_sembuh: 0,
    };

    render(<CaseNumberCard {...props} />);

    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();


    const kematian = screen.getByTestId('stats-item-kasus_kematian');
    expect(kematian).toHaveTextContent('Kasus Kematian');
    expect(kematian).toHaveTextContent('0 (NaN%)');

    const terjangkit = screen.getByTestId('stats-item-kasus_terjangkit');
    expect(terjangkit).toHaveTextContent('Kasus Terjangkit');
    expect(terjangkit).toHaveTextContent('0 (NaN%)');

    const sembuh = screen.getByTestId('stats-item-kasus_sembuh');
    expect(sembuh).toHaveTextContent('Kasus Sembuh');
    expect(sembuh).toHaveTextContent('0 (NaN%)');
  });

  test('handles negative values correctly', () => {
    const props = {
      jumlah_kasus: -100,
      jumlah_kasus_kematian: -10,
      jumlah_kasus_terjangkit: -80,
      jumlah_kasus_sembuh: -10,
    };

    render(<CaseNumberCard {...props} />);

    expect(screen.getByText('Jumlah Kasus')).toBeInTheDocument();
    expect(screen.getByText('-100')).toBeInTheDocument();

    const kematian = screen.getByTestId('stats-item-kasus_kematian');
    expect(kematian).toHaveTextContent('Kasus Kematian');
    expect(kematian).toHaveTextContent('10 (10%)');

    const terjangkit = screen.getByTestId('stats-item-kasus_terjangkit');
    expect(terjangkit).toHaveTextContent('Kasus Terjangkit');
    expect(terjangkit).toHaveTextContent('80 (80%)');

    const sembuh = screen.getByTestId('stats-item-kasus_sembuh');
    expect(sembuh).toHaveTextContent('Kasus Sembuh');
    expect(sembuh).toHaveTextContent('10 (10%)');
  });
});
