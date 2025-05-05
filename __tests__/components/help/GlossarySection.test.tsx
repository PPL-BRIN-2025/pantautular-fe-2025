import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlossarySection from '../../../app/components/help/GlossarySection';

describe('GlossarySection Component', () => {
  test('renders with title and children', () => {
    render(
      <GlossarySection title="Test Section Title">
        <p data-testid="test-child">Test Child Content</p>
      </GlossarySection>
    );
    
    expect(screen.getByText('Test Section Title')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });
  
  test('applies correct styling', () => {
    render(
      <GlossarySection title="Styled Section">
        <p>Content</p>
      </GlossarySection>
    );
    
    const section = screen.getByRole('region');
    const title = screen.getByText('Styled Section');
    
    expect(section).toHaveClass('mt-12');
    expect(title).toHaveClass('text-2xl');
    expect(title).toHaveClass('font-bold');
    expect(title).toHaveClass('text-blue-900');
  });
  
  test('renders without children', () => {
    render(<GlossarySection title="Empty Section"><></></GlossarySection>);
    
    expect(screen.getByText('Empty Section')).toBeInTheDocument();
    const section = screen.getByRole('region');
    expect(section).toBeInTheDocument();
    expect(section.children.length).toBe(1); // Only contains the title
  });
  
  test('renders with multiple children', () => {
    render(
      <GlossarySection title="Multiple Children">
        <p data-testid="first-child">First Child</p>
        <div data-testid="second-child">Second Child</div>
        <span data-testid="third-child">Third Child</span>
      </GlossarySection>
    );
    
    expect(screen.getByTestId('first-child')).toBeInTheDocument();
    expect(screen.getByTestId('second-child')).toBeInTheDocument();
    expect(screen.getByTestId('third-child')).toBeInTheDocument();
  });
});