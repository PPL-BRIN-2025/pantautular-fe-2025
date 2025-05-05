import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlossaryItem from '../../../app/components/help/GlossaryItem';

describe('GlossaryItem Component', () => {
  it('renders with items', () => {
    render(
      <GlossaryItem
        number="1"
        title="Test Title"
        items={['This is item one', 'This is item two']}
      />
    );
    
    const titleElement = screen.getByText(/Test Title/);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.parentElement).toHaveTextContent('1.');
    expect(screen.getByText('This is item one')).toBeInTheDocument();
    expect(screen.getByText('This is item two')).toBeInTheDocument();
  });

  it('renders with description instead of items', () => {
    render(
      <GlossaryItem
        number="3"
        title="With Description"
        description="This is a full description paragraph instead of items"
      />
    );
    
    const titleElement = screen.getByText(/With Description/);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.parentElement).toHaveTextContent('3.');
    expect(screen.getByText('This is a full description paragraph instead of items')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});