import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DetailDistribution from "../../app/components/dashboard/DetailDistribution";
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

describe("DetailDistribution Component", () => {
  describe("Rendering and basic functionality", () => {
    it("renders when isShowModal is true", () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Menggunakan getByRole untuk mencari heading yang berisi "Detail Test Distribution"
      expect(screen.getByRole("heading", { name: /detail test distribution/i })).toBeInTheDocument();
    });

    it("does not render when isShowModal is false", () => {
      const { container } = render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={false}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders table with correct data", () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Verifikasi header tabel
      expect(screen.getByText("No")).toBeInTheDocument();
      expect(screen.getByText("Sumber Berita")).toBeInTheDocument();
      expect(screen.getByText("Total Postingan Artikel")).toBeInTheDocument();
      expect(screen.getByText("Total Rangkuman Penyakit")).toBeInTheDocument();

      // Verifikasi data dalam tabel menggunakan getAllByRole
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; // Skip header row
      expect(firstRow).toHaveTextContent('Portal A');
      expect(firstRow).toHaveTextContent('10');
      expect(firstRow).toHaveTextContent('5');
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

  describe("Pagination", () => {
    it("handles pagination correctly", () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Verifikasi tombol pagination
      const prevButton = screen.getByTestId("previous-page-button");
      const nextButton = screen.getByTestId("next-page-button");

      // Tombol previous harus disabled di halaman pertama
      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();

      // Klik next button
      fireEvent.click(nextButton);
      
      // Tombol previous seharusnya tidak disabled lagi
      expect(prevButton).not.toBeDisabled();
    });
  });

  describe("Empty Data", () => {
    it("renders correctly with empty data", () => {
      render(
        <DetailDistribution
          data={mockDataEmpty}
          title="Empty Data Test"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Verifikasi pesan "Tidak ada data tersedia"
      expect(screen.getByText("Tidak ada data tersedia")).toBeInTheDocument();
      expect(screen.getByText("Data sumber berita belum tersedia saat ini")).toBeInTheDocument();
    });
  });

  describe("Sorting", () => {
    it("handles sorting correctly", () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );

      // Klik kolom untuk sorting
      const portalHeader = screen.getByText("Sumber Berita");
      fireEvent.click(portalHeader);

      // Verifikasi data terurut menggunakan getAllByRole
      const rows = screen.getAllByRole('row');
      const firstRow = rows[1]; // Skip header row
      expect(firstRow).toHaveTextContent('Portal A');
    });

    it('sorts by news_count when that header is clicked', () => {
      render(
        <DetailDistribution
          data={mockData}
          title="Test Distribution"
          isShowModal={true}
          setIsShowModal={mockSetIsShowModal}
        />
      );
      
      // Click on news_count header to sort
      fireEvent.click(screen.getByText(/Total Postingan Artikel/));
      
      // Get all rows and verify the first data row
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      
      // Verify the row contains the portal with lowest news_count
      expect(firstDataRow).toHaveTextContent('Portal C');
      expect(firstDataRow).toHaveTextContent('5');
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
      
      // Get all rows and verify the first data row
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1];
      
      // Verify the row contains the portal with lowest disease_count
      expect(firstDataRow).toHaveTextContent('Portal I');
      expect(firstDataRow).toHaveTextContent('2');
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
      
      // Menggunakan getByRole untuk mencari heading yang berisi "Detail Empty Distribution"
      expect(screen.getByRole("heading", { name: /detail empty distribution/i })).toBeInTheDocument();
      
      // Verifikasi pesan empty state
      expect(screen.getByText("Tidak ada data tersedia")).toBeInTheDocument();
      expect(screen.getByText("Data sumber berita belum tersedia saat ini")).toBeInTheDocument();
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
      fireEvent.click(nextButton);
      
      // Sort by portal
      fireEvent.click(screen.getByText(/Sumber Berita/));
      
      // Should be back on first page, showing Portal A
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal A');
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
      let rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Portal A');
      
      // Go to last page
      const nextButton = screen.getByTestId('next-page-button');
      fireEvent.click(nextButton);
      
      // Get fresh rows after state change
      rows = screen.getAllByRole('row');
      expect(rows[rows.length - 1]).toHaveTextContent('Portal I');
      
      // Try to go beyond last page
      fireEvent.click(nextButton);
      
      // Get fresh rows after state change
      rows = screen.getAllByRole('row');
      expect(rows[rows.length - 1]).toHaveTextContent('Portal I');
    });
  });
});