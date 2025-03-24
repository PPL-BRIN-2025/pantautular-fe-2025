import React from 'react';
import { render, screen } from '@testing-library/react';
import HealthProtocols from '../../app/components/case_detail/HealthProtocols';
import { HealthProtocol } from '../../app/components/case_detail/types';

describe('HealthProtocols Component', () => {
  const mockProtocols: HealthProtocol[] = [
    {
      title: 'Pakai Masker',
      url: 'https://example.com/mask'
    },
    {
      title: 'Cuci Tangan',
      url: 'https://example.com/handwash'
    }
  ];

  it('renders nothing when protocols array is empty', () => {
    const { container } = render(<HealthProtocols protocols={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correct title when protocols exist', () => {
    render(<HealthProtocols protocols={mockProtocols} />);
    expect(screen.getByText('Protokol Kesehatan')).toBeInTheDocument();
    expect(screen.getByText('Protokol Kesehatan')).toHaveClass('font-bold');
    expect(screen.getByText('Protokol Kesehatan')).toHaveClass('text-lg');
  });

  it('renders all protocol items correctly', () => {
    render(<HealthProtocols protocols={mockProtocols} />);
    
    // Check all protocol titles are rendered
    mockProtocols.forEach(protocol => {
      expect(screen.getByText(protocol.title)).toBeInTheDocument();
    });
    
    // Check all links have correct attributes
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(mockProtocols.length);
    
    links.forEach((link, index) => {
      expect(link).toHaveAttribute('href', mockProtocols[index].url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveClass('text-sm');
      expect(link).toHaveClass('italic');
      expect(link).toHaveClass('underline');
      expect(link).toHaveClass('text-gray-800');
    });
  });

  it('renders arrow icons for each protocol', () => {
    render(<HealthProtocols protocols={mockProtocols} />);
    
    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBe(mockProtocols.length);
    
    arrows.forEach(arrow => {
      expect(arrow).toHaveClass('text-gray-600');
      expect(arrow.parentElement).toHaveClass('bg-gray-200');
      expect(arrow.parentElement).toHaveClass('rounded-full');
    });
  });

  it('has correct layout structure', () => {
    const { container } = render(<HealthProtocols protocols={mockProtocols} />);
    
    // Check list structure
    const list = container.querySelector('ul');
    expect(list).toHaveClass('space-y-2');
    
    // Check list item structure
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(mockProtocols.length);
    listItems.forEach(item => {
      expect(item).toHaveClass('flex');
      expect(item).toHaveClass('items-center');
      expect(item).toHaveClass('space-x-2');
    });
  });

  it('matches snapshot with protocols', () => {
    const { asFragment } = render(<HealthProtocols protocols={mockProtocols} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot with empty protocols', () => {
    const { asFragment } = render(<HealthProtocols protocols={[]} />);
    expect(asFragment()).toMatchSnapshot();
  });
});