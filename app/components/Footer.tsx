const Footer: React.FC = () => {
    return (
      <footer className="bg-blue-500 text-white py-3 px-5 fixed bottom-0 w-full flex justify-start z-50">
        <div className="w-full max-w-5xl mx-0 ml-5">
          <h2 className="text-sm font-semibold mb-0.5">Saluran Bantuan</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_1.8fr_1.4fr] gap-x-12 text-left items-start">
            <div className="min-w-[260px]">
              <p className="font-medium text-xs leading-tight">Kementerian Kesehatan RI (Kemenkes RI)</p>
              <a href="tel:1500567" className="text-xs text-white underline">Hotline: 1500-567</a>
            </div>
            <div className="min-w-[260px]">
              <p className="font-medium text-xs leading-tight">Layanan Masyarakat Sehat (LMS)</p>
              <a href="tel:081212123119" className="text-xs text-white underline">Hotline: 0812-1212-3119</a>
            </div>
            <div className="min-w-[340px]">
              <p className="font-medium text-xs leading-tight">Rumah Sakit Penyakit Infeksi Prof. Dr. Sulianti Saroso</p>
              <a href="tel:0216506559" className="text-xs text-white underline">Hotline: (021) 6506559 atau (021) 6507024</a>
            </div>
            <div className="min-w-[260px]">
              <p className="font-medium text-xs leading-tight">Pusat Informasi Kesehatan Terpadu (PIKT)</p>
              <a href="tel:081376905598" className="text-xs text-white underline">Hotline: 0813-7690-5598</a>
            </div>
          </div>
  
          <div className="flex justify-end mt-1">
            <p className="text-xs text-white opacity-80 absolute right-5 bottom-2">
            © {new Date().getFullYear()} PantauTular. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  