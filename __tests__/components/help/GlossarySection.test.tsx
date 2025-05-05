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
  
  it('applies correct styling', () => {
    render(
      <GlossarySection title="Styled Section">
        <p>Content</p>
      </GlossarySection>
    );
    
    const title = screen.getByText('Styled Section');
    const content = screen.getByText('Content');
    
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('text-xl', 'font-bold', 'text-green-600', 'mb-4');
    expect(content).toBeInTheDocument();
  });
  
  it('renders without children', () => {
    render(
      <GlossarySection title="Empty Section">
        {null}
      </GlossarySection>
    );
    
    expect(screen.getByText('Empty Section')).toBeInTheDocument();
    const container = screen.getByText('Empty Section').closest('div');
    expect(container).toHaveClass('mb-12');
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