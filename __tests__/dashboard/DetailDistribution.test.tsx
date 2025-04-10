import { render, screen, fireEvent } from '@testing-library/react';
import DetailDistribution from '../../app/components/dashboard/DetailDistribution';
import { DistributionData } from '@/types';

// Mock data
const mockData: DistributionData[] = [
  { portal: 'Portal A', news_count: 10, disease_count: 5 },
  { portal: 'Portal B', news_count: 15, disease_count: 8 },
  { portal: 'Portal C', news_count: 5, disease_count: 3 },
  { portal: 'Portal D', news_count: 20, disease_count: 12 },
  { portal: 'Portal E', news_count: 8, disease_count: 4 },
  { portal: 'Portal F', news_count: 25, disease_count: 15 },
  { portal: 'Portal G', news_count: 12, disease_count: 6 },
  { portal: 'Portal H', news_count: 18, disease_count: 9 },
  { portal: 'Portal I', news_count: 7, disease_count: 2 },
];

const mockDataEmpty: DistributionData[] = [];

const mockSetIsShowModal = jest.fn();

describe('DetailDistribution Component', () => {
  // Happy path tests
  describe('Rendering and basic functionality', () => {
    it('renders when isShowModal is true', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      expect(screen.getByText('Test Distribution')).toBeInTheDocument();
    });

    it('does not render when isShowModal is false', () => {
      const { container } = render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={false}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('closes modal when close icon is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      fireEvent.click(screen.getByTestId('close-modal-button'));
      expect(mockSetIsShowModal).toHaveBeenCalledWith(false);
    });

    it('renders the correct number of items per page', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Should display 8 items per page
      const rows = screen.getAllByRole('row');
      // +1 because of the header row
      expect(rows.length).toBe(8 + 1);
    });
  });

  // Pagination tests
  describe('Pagination functionality', () => {
    it('shows the first page initially', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // First item should be Portal A
      expect(screen.getByText('Portal A')).toBeInTheDocument();
    });

    it('navigates to the next page when next button is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      fireEvent.click(screen.getByTestId('next-page-button'));
      
      // Portal I should be visible on the second page
      expect(screen.getByText('Portal I')).toBeInTheDocument();
    });

    it('navigates back to the previous page when previous button is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Go to second page
      fireEvent.click(screen.getByTestId('next-page-button'));
      
      // Go back to first page
      fireEvent.click(screen.getByTestId('previous-page-button'));
      
      // Portal A should be visible again
      expect(screen.getByText('Portal A')).toBeInTheDocument();
    });

    it('disables previous button on first page', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      const prevButton = screen.getByTestId('previous-page-button');
      expect(prevButton).toHaveClass('bg-blue-100');
    });

    it('disables next button on last page', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Go to second page (which is the last page for our mock data)
      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton as HTMLElement);
      
      // Next button should now be disabled
      expect(nextButton).toHaveClass('bg-blue-100');
    });
  });

  // Sorting tests
  describe('Sorting functionality', () => {
    it('sorts by portal name ascending when header is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Click on portal header to sort
      fireEvent.click(screen.getByText(/Sumber Berita/));
      
      // Check that rows are sorted alphabetically (A should be first)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal A');
    });

    it('toggles sort direction when clicking the same header twice', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Click on news_count header to sort ascending
      fireEvent.click(screen.getByText(/Total Postingan Artikel/));
      
      // Click again to sort descending
      fireEvent.click(screen.getByText(/Total Postingan Artikel/));
      
      // First row should now have the highest news_count (Portal F with 25)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal F');
      expect(rows[1]).toHaveTextContent('25');
    });

    it('sorts by disease_count when that header is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Click on disease_count header to sort
      fireEvent.click(screen.getByText(/Total Rangkuman Penyakit/));
      
      // First row should have the lowest disease_count (Portal I with 2)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal I');
      expect(rows[1]).toHaveTextContent('2');
    });

    it('handles equal values correctly when sorting', () => {
      // Create data with duplicate values
      const dataWithDuplicates: DistributionData[] = [
        { portal: 'Portal A', news_count: 10, disease_count: 5 },
        { portal: 'Portal B', news_count: 10, disease_count: 8 }, // Same news_count as Portal A
        { portal: 'Portal C', news_count: 15, disease_count: 8 }  // Same disease_count as Portal B
      ];
      
      render(
        <DetailDistribution
          data={dataWithDuplicates}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Sort by news_count
      fireEvent.click(screen.getByText(/Total Postingan Artikel/));
      
      // Verify both Portal A and Portal B are displayed (they have equal news_count)
      expect(screen.getByText('Portal A')).toBeInTheDocument();
      expect(screen.getByText('Portal B')).toBeInTheDocument();
      
      // Sort by disease_count
      fireEvent.click(screen.getByText(/Total Rangkuman Penyakit/));
      
      // Verify both Portal B and Portal C are displayed (they have equal disease_count)
      expect(screen.getByText('Portal B')).toBeInTheDocument();
      expect(screen.getByText('Portal C')).toBeInTheDocument();
    });

    it('sets new sort field when sorting by a different column', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // First sort by portal name
      fireEvent.click(screen.getByText(/Sumber Berita/));
      
      // Then switch to disease count
      fireEvent.click(screen.getByText(/Total Rangkuman Penyakit/));
      
      // Check that rows are sorted by disease count (Portal I with lowest count)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal I');
      expect(rows[1]).toHaveTextContent('2');
    });

    it('displays data in original order when no sort field is selected', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Initially data should be in the original order
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal A');
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('handles empty data array', () => {
      render(
        <DetailDistribution
          data={[]}
          title="Empty Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Should render the table but with no rows
      expect(screen.getByText('Empty Distribution')).toBeInTheDocument();
      expect(screen.getAllByRole('row').length).toBe(1); // Just the header row
    });

    it('resets to first page when sorting changes', () => {
      // Create more mock data to ensure multiple pages
      const largeData: DistributionData[] = Array(20)
        .fill(null)
        .map((_, i) => ({
          portal: `Portal ${String.fromCharCode(65 + i)}`,
          news_count: 20 - i,
          disease_count: 10 - i,
        }));

      render(
        <DetailDistribution
          data={largeData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Go to second page
      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton as HTMLElement);
      
      // Sort by portal
      fireEvent.click(screen.getByText(/Sumber Berita/));
      
      // Should be back on first page, showing Portal A
      expect(screen.getByText('Portal A')).toBeInTheDocument();
    });

    it('does not change page when trying to go beyond limits', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Try to go to previous page when already on first page
      const prevButton = screen.getByTestId('previous-page-button');
      fireEvent.click(prevButton);
      
      // Should still be on first page
      expect(screen.getByText('Portal A')).toBeInTheDocument();
      
      // Go to last page
      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton);
      
      // Try to go beyond last page
      fireEvent.click(nextButton);
      
      // Should still be on last page
      expect(screen.getByText('Portal I')).toBeInTheDocument();
    });
  });

  // Empty Data tests
  describe('Empty Data', () => {
    it('renders correctly with empty data', () => {
      render(
        <DetailDistribution
          data={mockDataEmpty}
          title="Empty Data Test"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      expect(screen.getByText('Empty Data Test')).toBeInTheDocument();
    });
  });
});