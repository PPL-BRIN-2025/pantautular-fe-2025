import React from 'react';
import { render, screen } from '@testing-library/react';
import CaseInfo from '../../app/components/case_detail/CaseInfo';
import { CaseDetailData } from '../../app/components/case_detail/types';

describe('CaseInfo Component', () => {
  const mockData: CaseDetailData = {
    id: 'CASE-001',
    location: 'Jakarta Pusat',
    gender: 'Laki-laki',
    age: 35,
    level_of_alertness: 3,
    related_search: 'https://example.com',
    news: [
      {
        img_url: 'https://example.com/image.jpg',
        url: 'https://example.com/news',
        date: '2023-05-15',
        title: 'Kasus Baru Ditemukan di Jakarta',
        domain: 'example.com',
        content: 'Ini adalah ringkasan berita tentang kasus yang ditemukan.'
      }
    ],
    health_protocols: [
      {
        title: 'Pakai Masker',
        url: 'https://example.com/protocol'
      }
    ]
  };

  const emptyNewsData: CaseDetailData = {
    ...mockData,
    news: []
  };

  it('renders case ID and location correctly', () => {
    render(<CaseInfo data={mockData} />);
    
    expect(screen.getByText('ID Kasus')).toBeInTheDocument();
    expect(screen.getByText(mockData.id)).toBeInTheDocument();
    expect(screen.getByText('Lokasi')).toBeInTheDocument();
    expect(screen.getByText(mockData.location)).toBeInTheDocument();
  });

  it('displays news summary when news exists', () => {
    render(<CaseInfo data={mockData} />);
    
    expect(screen.getByText('Ringkasan')).toBeInTheDocument();
    expect(screen.getByText(mockData.news[0].content)).toBeInTheDocument();
  });

  it('shows default text when no news exists', () => {
    render(<CaseInfo data={emptyNewsData} />);
    
    expect(screen.getByText('Ringkasan')).toBeInTheDocument();
    expect(screen.getByText('Tidak ada ringkasan tersedia')).toBeInTheDocument();
  });

  it('renders gender and age information correctly', () => {
    render(<CaseInfo data={mockData} />);
    
    expect(screen.getByText('Jenis Kelamin')).toBeInTheDocument();
    expect(screen.getByText(mockData.gender)).toBeInTheDocument();
    expect(screen.getByText('Usia')).toBeInTheDocument();
    expect(screen.getByText(`${mockData.age} Tahun`)).toBeInTheDocument();
  });

  it('has correct styling for section titles', () => {
    render(<CaseInfo data={mockData} />);
    
    // Get all section title elements by their text content
    const sectionTitles = [
      'ID Kasus',
      'Lokasi',
      'Ringkasan',
      'Jenis Kelamin',
      'Usia'
    ].map(title => screen.getByText(title));
    
    // Verify each title has correct styling classes
    sectionTitles.forEach(title => {
      expect(title).toHaveClass('text-base');
      expect(title).toHaveClass('font-bold');
    });
  });

  it('has correct styling for content text', () => {
    render(<CaseInfo data={mockData} />);
    
    // Get all content text elements
    const contentTexts = [
      mockData.id,
      mockData.location,
      mockData.news[0].content,
      mockData.gender,
      `${mockData.age} Tahun`
    ].map(text => screen.getByText(text));
    
    // Verify each content text has correct styling
    contentTexts.forEach(text => {
      expect(text).toHaveClass('text-gray-600');
    });
  });

  it('matches snapshot', () => {
    const { asFragment } = render(<CaseInfo data={mockData} />);
    expect(asFragment()).toMatchSnapshot();
  });
});