import React from 'react';
import { render, screen } from '@testing-library/react';
import RelatedSearch from '../../app/components/case_detail/RelatedSearch';

describe('RelatedSearch Component', () => {
  it('renders correctly with search query', () => {
    const testUrl = 'https://example.com/search?q=covid+jakarta+2023';
    render(<RelatedSearch searchUrl={testUrl} />);
    
    // Verifikasi teks label
    expect(screen.getByText('Pencarian Terkait:')).toBeInTheDocument();
    expect(screen.getByText('Pencarian Terkait:')).toHaveClass('text-xs');
    expect(screen.getByText('Pencarian Terkait:')).toHaveClass('font-bold');
    expect(screen.getByText('Pencarian Terkait:')).toHaveClass('text-blue-600');
    
    // Verifikasi link dan teks yang di-decode
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', testUrl);
    expect(link).toHaveTextContent('covid jakarta 2023?');
    expect(link).toHaveClass('text-blue-600');
    expect(link).toHaveClass('underline');
    expect(link).toHaveClass('italic');
    
    // Verifikasi horizontal rule
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders default text when no query parameter', () => {
    const testUrl = 'https://example.com/search';
    render(<RelatedSearch searchUrl={testUrl} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('Pencarian?');
  });

  it('handles special characters in query', () => {
    const testUrl = 'https://example.com/search?q=COVID-19+%26+Flu+Season';
    render(<RelatedSearch searchUrl={testUrl} />);
    
    expect(screen.getByRole('link')).toHaveTextContent('COVID-19 & Flu Season?');
  });

  it('matches snapshot with query', () => {
    const testUrl = 'https://example.com/search?q=test+query';
    const { asFragment } = render(<RelatedSearch searchUrl={testUrl} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot without query', () => {
    const testUrl = 'https://example.com/search';
    const { asFragment } = render(<RelatedSearch searchUrl={testUrl} />);
    expect(asFragment()).toMatchSnapshot();
  });
});