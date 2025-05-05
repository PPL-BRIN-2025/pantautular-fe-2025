import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlossaryItem from '../../../app/components/help/GlossaryItem';

describe('GlossaryItem Component', () => {
  test('renders with number, title and items', () => {
    const items = [
      'This is item one',
      'This is item two'
    ];
    
    render(
      <GlossaryItem 
        number="1" 
        title="Test Title" 
        items={items} 
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('This is item one')).toBeInTheDocument();
    expect(screen.getByText('This is item two')).toBeInTheDocument();
  });

  test('renders with title and items but no number', () => {
    const items = ['First item', 'Second item'];
    
    render(
      <GlossaryItem 
        title="Without Number" 
        items={items} 
      />
    );
    
    expect(screen.queryByTestId('glossary-item-number')).not.toBeInTheDocument();
    expect(screen.getByText('Without Number')).toBeInTheDocument();
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
  });

  test('renders with description instead of items', () => {
    render(
      <GlossaryItem
        number="3"
        title="With Description"
        description="This is a full description paragraph instead of items"
      />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('With Description')).toBeInTheDocument();
    expect(screen.getByText('This is a full description paragraph instead of items')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  test('renders with title only', () => {
    render(
      <GlossaryItem title="Only Title" />
    );
    
    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByTestId('glossary-item-description')).not.toBeInTheDocument();
  });
});