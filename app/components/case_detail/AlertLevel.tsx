import React from 'react';
import { FaStar, FaRegStar } from "react-icons/fa";

interface AlertLevelProps {
  level: number;
}

const AlertLevel: React.FC<AlertLevelProps> = ({ level }) => (
  <div className="px-2">
    <div className="grid grid-cols-2 items-center">
      <div className="text-base font-bold">
        <div>Tingkat</div>
        <div>Kewaspadaan</div>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex justify-end">
          {[...Array(5)].map((_, index) =>
            index < level ? (
              <FaStar 
                key={`filled-star-${index + 1}`} 
                className="text-yellow-400 mr-1 text-lg" 
              />
            ) : (
              <FaRegStar 
                key={`empty-star-${index + 1}`} 
                className="text-red-400 mr-1 text-lg" 
              />
            )
          )}
        </div>
        <div className="text-[10px] text-gray-600 self-end">Waspada</div>
      </div>
    </div>
  </div>
);

export default AlertLevel; 