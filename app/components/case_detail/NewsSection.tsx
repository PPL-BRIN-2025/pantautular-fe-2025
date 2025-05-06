import React, { useState } from 'react';
import { FaArrowCircleRight } from "react-icons/fa";
import { News } from './types';

interface NewsSectionProps {
  news: News[];
}

const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
  const [newsIndex, setNewsIndex] = useState(0);

  const nextNews = () => {
    /* istanbul ignore next */
    if (newsIndex < news.length - 1) setNewsIndex(newsIndex + 1);
  };

  const prevNews = () => {
    /* istanbul ignore next */
    if (newsIndex > 0) setNewsIndex(newsIndex - 1);
  };

  return news.length > 0 ? (
    <div className="px-2">
      <div className="flex justify-between items-center">
        <div className="font-bold text-lg">Sumber</div>
        <div className="flex items-center text-gray-600">
          <button onClick={prevNews} disabled={newsIndex === 0} className={`p-1 ${newsIndex === 0 ? "text-gray-300" : "text-gray-600"}`}>◀</button>
          <span className="text-sm font-semibold">({newsIndex + 1}/{news.length})</span>
          <button onClick={nextNews} disabled={newsIndex === news.length - 1} className={`p-1 ${newsIndex === news.length - 1 ? "text-gray-300" : "text-gray-600"}`}>▶</button>
        </div>
      </div>
      <div className="text-gray-600 text-sm font-semibold">{news[newsIndex].date}</div>
      <div className="text-sm text-justify">{news[newsIndex].title} ({news[newsIndex].domain})</div>
      {news[newsIndex].img_url && (
        <img 
          src={news[newsIndex].img_url} 
          alt="Berita" 
          className="mt-2 rounded-lg w-full h-40 object-cover" 
        />
      )}
      <a href={news[newsIndex].url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
        Lihat Artikel <FaArrowCircleRight className="ml-1 text-sm" />
      </a>
      <hr className="my-3" />
    </div>
  ) : null;
};

export default NewsSection; 