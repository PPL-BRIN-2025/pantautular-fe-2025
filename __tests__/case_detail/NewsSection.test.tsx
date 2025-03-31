import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewsSection from '../../app/components/case_detail/NewsSection';
import { News } from '../../app/components/case_detail/types';

// Mock untuk react-icons
jest.mock("react-icons/fa", () => ({
  FaArrowCircleRight: () => <span>→</span>
}));

describe('NewsSection Component', () => {
  const mockNews: News[] = [
    {
      img_url: 'https://example.com/news1.jpg',
      url: 'https://example.com/news1',
      date: '2023-05-01',
      title: 'Berita Pertama',
      domain: 'news1.com',
      content: 'Konten berita pertama'
    },
    {
      img_url: 'https://example.com/news2.jpg',
      url: 'https://example.com/news2',
      date: '2023-05-02',
      title: 'Berita Kedua',
      domain: 'news2.com',
      content: 'Konten berita kedua'
    }
  ];

  it('renders nothing when news array is empty', () => {
    const { container } = render(<NewsSection news={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders first news item by default', () => {
    render(<NewsSection news={mockNews} />);
    
    // Verifikasi konten berita pertama
    expect(screen.getByText(mockNews[0].date)).toBeInTheDocument();
    
    // Gunakan regex untuk mencocokkan teks yang mungkin terpisah
    expect(screen.getByText(/Berita Pertama\s*\(news1\.com\)/)).toBeInTheDocument();
    
    // Verifikasi gambar
    const image = screen.getByAltText('Berita');
    expect(image).toHaveAttribute('src', mockNews[0].img_url);
  });

  it('navigates between news items correctly', () => {
    render(<NewsSection news={mockNews} />);
    
    // Verifikasi counter
    expect(screen.getByText('(1/2)')).toBeInTheDocument();
    
    // Klik next button
    const nextButton = screen.getAllByRole('button')[1]; // Button ▶
    fireEvent.click(nextButton);
    
    // Verifikasi konten berita kedua dengan regex
    expect(screen.getByText(/Berita Kedua\s*\(news2\.com\)/)).toBeInTheDocument();
    expect(screen.getByText('(2/2)')).toBeInTheDocument();
    
    // Klik prev button
    const prevButton = screen.getAllByRole('button')[0]; // Button ◀
    fireEvent.click(prevButton);
    
    // Verifikasi kembali ke berita pertama
    expect(screen.getByText(/Berita Pertama\s*\(news1\.com\)/)).toBeInTheDocument();
    expect(screen.getByText('(1/2)')).toBeInTheDocument();
  });

  it('disables prev button on first item and next button on last item', () => {
    render(<NewsSection news={mockNews} />);
    
    // Pada item pertama
    const prevButton = screen.getAllByRole('button')[0];
    const nextButton = screen.getAllByRole('button')[1];
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
    
    // Pergi ke item terakhir
    fireEvent.click(nextButton);
    
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('renders article link correctly', () => {
    render(<NewsSection news={mockNews} />);
    const link = screen.getByRole('link', { name: /Lihat Artikel/i });
    expect(link).toHaveAttribute('href', mockNews[0].url);
  });


});