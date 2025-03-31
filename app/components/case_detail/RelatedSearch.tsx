import React from 'react';

interface RelatedSearchProps {
  searchUrl: string;
}

const RelatedSearch: React.FC<RelatedSearchProps> = ({ searchUrl }) => (
  <div className="px-2 mt-2">
    <span className="text-xs font-bold text-blue-600">Pencarian Terkait:</span>{" "}
    <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline italic text-xs">
      {decodeURIComponent(searchUrl.split("q=")[1]?.replace(/\+/g, " ") || "Pencarian") + "?"}
    </a>
    <hr className="my-3" />
  </div>
);

export default RelatedSearch; 