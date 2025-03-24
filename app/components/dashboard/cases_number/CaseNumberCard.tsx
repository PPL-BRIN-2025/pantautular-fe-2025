import React from 'react';
import StatsItem from './StatsItem';

interface CaseNumbersProps {
    jumlah_kasus: number,
    jumlah_kasus_kematian: number,
    jumlah_kasus_terjangkit: number,
    jumlah_kasus_sembuh: number
  }
  
const CaseNumberCard:  React.FC<CaseNumbersProps> = ({ jumlah_kasus, jumlah_kasus_kematian, jumlah_kasus_terjangkit, jumlah_kasus_sembuh }) => {
  return (
    <div className="w-full mx-auto bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Jumlah Kasus</h2>
        <div className="flex items-center text-blue-600 text-xl font-bold">
          <svg 
            className="w-6 h-6 mr-2" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M17 20h5v-2a3 3 0 00-3-3h-4m-6 
                 5H3v-2a3 3 0 013-3h4m0 0V5a3 
                 3 0 016 0v7m-6 0h6" 
            />
          </svg>
          {jumlah_kasus}
        </div>
      </div>

      <div className="mt-4 space-y-2">
      <StatsItem
          type="kasus_kematian"
          count={jumlah_kasus_kematian}
          percentage={Number((jumlah_kasus_kematian / jumlah_kasus * 100).toFixed(2))}
        />
        <StatsItem
          type="kasus_terjangkit"
          count={jumlah_kasus_terjangkit}
          percentage={Number((jumlah_kasus_terjangkit / jumlah_kasus * 100).toFixed(2))}
        />
        <StatsItem
          type="kasus_sembuh"
          count={jumlah_kasus_sembuh}
          percentage={Number((jumlah_kasus_sembuh / jumlah_kasus * 100).toFixed(2))}
        />
      </div>
    </div>
  );
}
export default CaseNumberCard;