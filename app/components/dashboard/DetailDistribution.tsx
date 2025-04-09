"use client";
import { DistributionData } from "@/types";
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, CircleXIcon } from "lucide-react";
import { useState } from "react";

interface DetailDistributionProps {
  data: DistributionData[];
  title: string;
  isShowModal: boolean;
  setIsShowModal: (value: boolean) => void;
}

const DetailDistribution = ({ data, title, isShowModal, setIsShowModal }: DetailDistributionProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof DistributionData | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 8;
  
  const handleSort = (field: keyof DistributionData) => {
    if (sortField === field) {
      // Toggle sort direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting
    setCurrentPage(1);
  };

  // Sort the data
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // For numeric values
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = sortedData.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Helper to render sort indicator
  const renderSortIcon = (field: keyof DistributionData) => {
    if (sortField !== field) return <ArrowUpDown className="inline ml-1 w-4 h-4" />;
    return sortDirection === 'asc' ? 
      <ArrowUp className="inline ml-1 w-4 h-4" /> : 
      <ArrowDown className="inline ml-1 w-4 h-4" />;
  };

  // If the modal should not be shown, don't render anything
  if (!isShowModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg overflow-hidden w-full max-w-3xl shadow-lg z-10">
        <div className="bg-blue-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">{title}</h2>
          <CircleXIcon data-testid="close-modal-button" className="text-white w-4 h-4 cursor-pointer" onClick={() => setIsShowModal(false)} />
        </div>
        <div className="p-4">
          <table className="w-full border-collapse rounded-lg overflow-hidden border border-black">
            <thead>
                <tr className="bg-gray-800 text-white">
                <th className="p-2 text-center text-sm">No</th>
                <th 
                  className="p-2 text-center text-sm cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('portal')}
                >
                  Sumber Berita {renderSortIcon('portal')}
                </th>
                <th 
                  className="p-2 text-center text-sm cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('news_count')}
                >
                  Total Postingan Artikel {renderSortIcon('news_count')}
                </th>
                <th 
                  className="p-2 text-center text-sm cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('disease_count')}
                >
                  Total Rangkuman Penyakit {renderSortIcon('disease_count')}
                </th>
                </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => (
                <tr
                  key={startIndex + index}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-blue-100'}
                >
                  <td className="p-2 text-black text-center text-sm">{startIndex + index + 1}</td>
                  <td className="p-2 text-black text-center text-sm">{item.portal}</td>
                  <td className="p-2 text-black text-center text-sm">{item.news_count}</td>
                  <td className="p-2 text-black text-center text-sm">{item.disease_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4 space-x-7">
            <button
              data-testid="previous-page-button"
              aria-label="Previous Page"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`p-1 rounded-full transition-colors ${
            currentPage === 1 ? 'bg-blue-100' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <ChevronLeft className="text-white w-4 h-4" />
            </button>
            <button
              data-testid="next-page-button"
              aria-label="Next Page"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`p-1 rounded-full transition-colors ${
            currentPage === totalPages ? 'bg-blue-100' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <ChevronRight className="text-white w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailDistribution;