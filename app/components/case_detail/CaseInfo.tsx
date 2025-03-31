import React from 'react';
import { CaseDetailData } from './types';

interface CaseInfoProps {
  data: CaseDetailData;
}

const CaseInfo: React.FC<CaseInfoProps> = ({ data }) => (
  <>
    <div className="flex justify-between text-sm font-semibold mt-3 px-2">
      <div>
        <div className="text-base font-bold">ID Kasus</div>
        <div className="text-gray-600 font-normal">{data.id}</div>
      </div>
      <div>
        <div className="text-base font-bold">Lokasi</div>
        <div className="text-gray-600 font-normal">{data.location}</div>
      </div>
    </div>
    <hr className="my-3" />

    {/* Ringkasan */}
    <div className="px-2 mb-3">
      <div className="text-base font-bold">Ringkasan</div>
      <p className="text-sm text-gray-600 mt-1 text-justify">
        {data.news[0]?.content || "Tidak ada ringkasan tersedia"}
      </p>
    </div>
    <div className="flex justify-between text-sm px-2">
      <div>
        <div className="text-base font-bold">Jenis Kelamin</div>
        <div className="text-gray-600">{data.gender}</div>
      </div>
      <div>
        <div className="text-base font-bold">Usia</div>
        <div className="text-gray-600">{data.age} Tahun</div>
      </div>
    </div>
    <hr className="my-3" />
  </>
);

export default CaseInfo; 