import React, { useRef } from "react";
import DownloadButton from "./DownloadButton";

interface PrevalenceCardProps {
  prevalenceRate: number | string;
  populationYear: number;
  populationCount: number | string;
}

const PrevalenceCard: React.FC<PrevalenceCardProps> = ({
  prevalenceRate,
  populationYear,
  populationCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasData =
    (typeof prevalenceRate === "number" && prevalenceRate > 0) ||
    (typeof populationCount === "number" && populationCount > 0);
  // Format the population number with commas
  let formattedPopulation = null
  /* istanbul ignore else */
  if (typeof populationCount !== 'string') {
    formattedPopulation = populationCount.toLocaleString();
  }
  else {
    /* istanbul ignore next */
    formattedPopulation = populationCount;
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg p-4 shadow content-center">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="text-xl font-semibold text-[#0069CF]">Estimasi Prevalensi</h2>
        <DownloadButton
          filename="estimasi-prevalensi"
          getTarget={() => containerRef.current}
          canDownload={() => hasData}
        />
      </div>
      
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
            {typeof prevalenceRate !== 'string' && <span className="text-[#0069CF]">%</span>}
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
