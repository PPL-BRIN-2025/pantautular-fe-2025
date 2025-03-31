import React from 'react';
import { FaTimesCircle } from "react-icons/fa";

interface HeaderProps {
  onClose?: () => void;
}

const CaseDetailHeader: React.FC<HeaderProps> = ({ onClose }) => (
  <div className="bg-blue-600 text-white p-4 min-h-16 rounded-t-lg flex justify-between items-center">
    <span className="font-semibold">Detail Kasus Penyakit Menular</span>
    <button 
      onClick={onClose} 
      className="text-white hover:text-gray-200"
      data-tooltip-close="true"
    >
      <FaTimesCircle size={20} />
    </button>
  </div>
);

export default CaseDetailHeader; 