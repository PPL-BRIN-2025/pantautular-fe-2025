import React from "react";

interface PrevalenceCardProps {
  prevalenceRate: number;
  populationYear: number;
  populationCount: number | string;
}

const PrevalenceCard: React.FC<PrevalenceCardProps> = ({
  prevalenceRate,
  populationYear,
  populationCount,
}) => {
  // Format the population number with commas
  let formattedPopulation = null
  if (typeof populationCount !== 'string') {
    formattedPopulation = populationCount.toLocaleString();
  }
  else {
    formattedPopulation = populationCount;
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow content-center">
      <h2 className="text-xl font-semibold text-blue-600 mb-4 text-center">Estimasi Prevalensi</h2>
      
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="flex items-center justify-center">
          <div className="text-rose-400 mr-2">
            {/* Heart rate icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5,12.5H15a1,1,0,0,0-.71.29L13,14.1l-3.29-3.3a1,1,0,0,0-1.42,0l-3,3a1,1,0,0,0,1.42,1.4L9,12.88l3.29,3.3a1,1,0,0,0,1.42,0l1.29-1.3h.79a3.5,3.5,0,1,0-1-6.88,3.5,3.5,0,0,0-6.5-2.62A3.5,3.5,0,1,0,15.5,12.5Z" />
            </svg>
          </div>
          <span className="text-5xl font-bold">
            {prevalenceRate}
            <span className="text-blue-600">%</span>
          </span>
        </div>
      </div>

      <p className="text-xs text-rose-500 text-center">
        *Jumlah kasus dibandingkan dengan populasi masyarakat Indonesia pada tahun {populationYear} ({formattedPopulation} 
        {typeof populationCount !== 'string' && " jiwa"})
      </p>

    </div>
  );
};

export default PrevalenceCard;