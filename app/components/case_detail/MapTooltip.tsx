import React from "react";
import { CaseDetailProps } from "./types";
import CaseDetailHeader from "./CaseDetailHeader";
import CaseInfo from "./CaseInfo";
import AlertLevel from "./AlertLevel";
import RelatedSearch from "./RelatedSearch";
import NewsSection from "./NewsSection";
import HealthProtocols from "./HealthProtocols";


// Komponen Utama
const CaseDetailTooltip: React.FC<CaseDetailProps> = ({ data, onClose }) => (
  <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm relative border max-h-[500px] overflow-y-auto">
    <CaseDetailHeader onClose={onClose} />
    <CaseInfo data={data} />
    <AlertLevel level={data.level_of_alertness} />
    <RelatedSearch searchUrl={data.related_search} />
    <NewsSection news={data.news} />
    <HealthProtocols protocols={data.health_protocols} />
  </div>
);

export default CaseDetailTooltip;
