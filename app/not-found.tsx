import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-[80vh] w-[100vw] flex justify-center items-center bg-white">
      <div className="text-center p-8 bg-white max-w-md">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">
          Maaf, halaman yang Anda cari tidak dapat ditemukan.
        </p>
        <Link 
          href="/"
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
} 