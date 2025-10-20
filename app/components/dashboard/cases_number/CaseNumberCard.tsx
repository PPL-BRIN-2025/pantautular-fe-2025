import React, { useRef } from 'react';
import StatsItem from './StatsItem';
import PeopleIcon from "../../icons/PeopleIcon";
import DownloadButton from "../DownloadButton";

interface CaseNumbersProps {
    jumlah_kasus: number,
    jumlah_kasus_kematian: number,
    jumlah_kasus_terjangkit: number,
    jumlah_kasus_sembuh: number
  }
  
const CaseNumberCard:  React.FC<CaseNumbersProps> = ({ jumlah_kasus, jumlah_kasus_kematian, jumlah_kasus_terjangkit, jumlah_kasus_sembuh }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasData =
    Number(jumlah_kasus) > 0 ||
    Number(jumlah_kasus_kematian) > 0 ||
    Number(jumlah_kasus_terjangkit) > 0 ||
    Number(jumlah_kasus_sembuh) > 0;
  return (
    <div ref={containerRef} className="w-full mx-auto bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-xl font-semibold text-[#0069CF]">Jumlah Kasus</h3>
        <div className="flex items-center gap-3">
          <DownloadButton
            filename="jumlah-kasus"
            getTarget={() => containerRef.current}
            canDownload={() => hasData}
          />
          <div className="flex items-center text-[#0069CF] text-xl font-bold">
            <PeopleIcon className="w-6 h-6 mr-2" />
            {jumlah_kasus}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-6">
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
