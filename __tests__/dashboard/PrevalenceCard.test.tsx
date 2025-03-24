import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrevalenceCard from '../../app/components/dashboard/PrevalenceCard';

describe('PrevalenceCard', () => {
  const defaultProps = {
    prevalenceRate: 0.07315,
    populationYear: 2024,
    populationCount: 279390258,
  };

  test('renders the prevalence card with correct title', () => {
    render(<PrevalenceCard {...defaultProps} />);
    expect(screen.getByText('Estimasi Prevalensi')).toBeInTheDocument();
  });

  test('renders the heart icon', () => {
    render(<PrevalenceCard {...defaultProps} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});