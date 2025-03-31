import React from 'react';
import { render, screen } from '@testing-library/react';
import AlertLevel from '../../app/components/case_detail/AlertLevel';

// Simple mock for react-icons that distinguishes between filled and empty stars
jest.mock("react-icons/fa", () => ({
  FaStar: () => <span>FILLED_STAR</span>,
  FaRegStar: () => <span>EMPTY_STAR</span>,
}));

describe('AlertLevel Component', () => {
  const renderComponent = (level: number) => {
    return render(<AlertLevel level={level} />);
  };

  it('displays the correct header text', () => {
    renderComponent(3);
    expect(screen.getByText('Tingkat')).toBeInTheDocument();
    expect(screen.getByText('Kewaspadaan')).toBeInTheDocument();
  });

  it('shows the correct number of filled and empty stars', () => {
    // Test level 3
    const { rerender } = renderComponent(3);
    expect(screen.getAllByText('FILLED_STAR').length).toBe(3);
    expect(screen.getAllByText('EMPTY_STAR').length).toBe(2);

    // Test level 0
    rerender(<AlertLevel level={0} />);
    expect(screen.queryAllByText('FILLED_STAR').length).toBe(0);
    expect(screen.getAllByText('EMPTY_STAR').length).toBe(5);

    // Test level 5
    rerender(<AlertLevel level={5} />);
    expect(screen.getAllByText('FILLED_STAR').length).toBe(5);
    expect(screen.queryAllByText('EMPTY_STAR').length).toBe(0);
  });

  it('displays the "Waspada" label', () => {
    renderComponent(2);
    expect(screen.getByText('Waspada')).toBeInTheDocument();
  });

  it('renders stars and label in the correct order', () => {
    renderComponent(1);
    const starsContainer = screen.getByText('FILLED_STAR').parentElement;
    const label = screen.getByText('Waspada');
    
    // Verify label comes after stars in the DOM
    expect(starsContainer?.nextSibling).toContainElement(label);
  });

  it('matches snapshot for different levels', () => {
    // Level 3
    const { asFragment: fragment3 } = renderComponent(3);
    expect(fragment3()).toMatchSnapshot();

    // Level 0
    const { asFragment: fragment0 } = renderComponent(0);
    expect(fragment0()).toMatchSnapshot();

    // Level 5
    const { asFragment: fragment5 } = renderComponent(5);
    expect(fragment5()).toMatchSnapshot();
  });
});