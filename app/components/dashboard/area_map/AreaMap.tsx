import React, { useRef, useState } from 'react';
import Image from 'next/image';
import DownloadButton from "../DownloadButton";

const AreaMap: React.FC = () => {
  // State declarations
  const [activeIndex, setActiveIndex] = useState(0);
  
  const areas = [
    {
      id: 1,
      title: "Peta Geografis Ketinggian Wilayah",
      lastUpdated: "10 Mei 2025 00.25 WIB",
      imgUrl: "/dashboard/kondisi_wilayah/01_Ketinggian.png",
      width: 2900,
      height: 1460
    },
    {
      id: 2,
      title: "Peta Geografis Curah Hujan",
      lastUpdated: "10 Mei 2025 00.25 WIB",
      imgUrl: "/dashboard/kondisi_wilayah/02_CurahHujan.png",
      width: 2900,
      height: 1460
    },
    {
      id: 3,
      title: "Peta Kerentanan Penyakit Menular",
      lastUpdated: "10 Mei 2025 00.25 WIB",
      imgUrl: "/dashboard/kondisi_wilayah/03_KerentananPenyakit.png",
      width: 2900,
      height: 1460
    },
    {
      id: 4,
      title: "Peta Kepadatan Penduduk (orang per Km persegi)",
      lastUpdated: "10 Mei 2025 00.25 WIB",
      imgUrl: "/dashboard/kondisi_wilayah/04_KepadatanPenduduk.png",
      width: 2900,
      height: 1460
    }
  ];
  
  const nextSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % areas.length);
  };
  
  const prevSlide = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + areas.length) % areas.length);
  };
  
  const currentArea = areas[activeIndex];
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="area-map-container">
      <div>
        <div className="bg-[#ebf3f5] px-4 py-3 rounded-md">
          <span className="text-[#11234B] text-2xl font-semibold">
            Pemetaan Kondisi Wilayah
          </span>
        </div>
        <div className="area-display">
          <div className="navigation-controls" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <button 
              onClick={prevSlide}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3498db',
                color: 'black',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div ref={cardRef} className="area-display-container">
              <div className="area-display-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 auto' }}>
                  <h3 className="area-display-title" style={{ fontSize: '0.9rem', color: 'black', fontWeight: 'bold' }}>{currentArea.title}</h3>
                  <span className="area-display-updated" style={{ fontSize: '0.8rem', color: '#0069CF', fontWeight: 'bold' }}>
                    Last updated: {currentArea.lastUpdated}
                  </span>
                </div>
                <DownloadButton
                  filename={currentArea.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  getTarget={() => cardRef.current}
                  label="Unduh Informasi"
                  size="sm"
                  ignoreDuringCapture
                />
              </div>
              <div className="area-display-image" style={{
                width: '100%',
                backgroundColor: '#f0f0f0',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
                overflow: 'hidden'
              }}>
                <Image
                  src={currentArea.imgUrl}
                  alt={currentArea.title}
                  width={currentArea.width}
                  height={currentArea.height}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    console.error(`Image failed to load: ${e.currentTarget.src}`);
                    e.currentTarget.src = '/dashboard/placeholder.jpg';
                  }}
                />
              </div>
            </div>

            <button 
              onClick={nextSlide}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaMap;
