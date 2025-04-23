import Image from 'next/image';

export default function RegisterPage() {
    return (
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-2xl">
          <h1 className="text-4xl font-bold text-[#0D2B5E] mb-8 text-center">
            Mari bergabung dengan PantauTular!
          </h1>
          <form className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="firstName" className="block mb-1 font-medium">Nama Depan</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Isi nama depan"
                  className="w-full border border-gray-300 rounded-md px-4 py-2"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="lastName" className="block mb-1 font-medium">Nama Belakang</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Isi nama belakang"
                  className="w-full border border-gray-300 rounded-md px-4 py-2"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Isi menggunakan domain institusi"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 font-medium">Kata Sandi</label>
              <input
                id="password"
                type="password"
                placeholder="Minimal 8 karakter"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block mb-1 font-medium">Konfirmasi Kata Sandi</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Pastikan konfirmasi kata sandi sesuai"
                className="w-full border border-gray-300 rounded-md px-4 py-2"
              />
            </div>
            <p className="text-sm mt-2">
              Sudah memiliki akun? <a href="#" className="text-[#0D2B5E] font-semibold">Masuk</a>
            </p>
            <button
              type="submit"
              className="w-full bg-[#0062E3] text-white font-semibold py-2 rounded-md mt-2"
            >
              Daftar
            </button>
          </form>
        </div>
        <div className="hidden md:block mt-12 md:mt-0 md:ml-16">
          <Image 
            src="/register.png" 
            alt="Register" 
            width={300}
            height={150}
            className="w-[400px] h-auto"
            priority
          />
        </div>
      </div>
    );
  }
  