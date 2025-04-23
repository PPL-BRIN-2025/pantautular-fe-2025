import Image from 'next/image';

export default function LoginPage() {
    return (
      <div className="flex flex-col md:flex-row items-center justify-center bg-white px-4 sm:mx-6 my-8 sm:my-12">
        <div className="w-full md:w-1/2 lg:w-2/5 mb-6 md:mb-0 md:mr-8 lg:mr-16 flex justify-center">
          <Image 
            src="/login_page.png"
            alt="Login"
            width={300}
            height={150}
            className="w-full max-w-[250px] md:max-w-[400px] h-auto"
            priority
          />
        </div>
        <div className="w-full md:w-1/2 lg:w-3/5 max-w-md sm:max-w-lg md:max-w-2xl mx-4 sm:mx-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0D2B5E] mb-4 sm:mb-8 text-center md:text-left">
            Sudah siap menjelajahi PantauTular?
          </h1>
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 font-medium">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Masukkan email terdaftar"
                className="w-full border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base"
              />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 font-medium">Kata Sandi</label>
              <input
                id="password"
                type="password"
                placeholder="Masukkan kata sandi"
                className="w-full border border-gray-300 rounded-md px-3 sm:px-4 py-2 text-sm sm:text-base"
              />
            </div>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 space-y-2 sm:space-y-0'>
              <p className="text-xs sm:text-sm">
                Belum memiliki akun? <a href="#" className="text-[#0D2B5E] font-semibold">Daftar</a>
              </p>
              <p className="text-xs sm:text-sm">
                <a href="#" className="text-[#0D2B5E] font-semibold">Lupa Kata Sandi?</a>
              </p>
            </div>
            <button
              type="submit"
              className="w-full bg-[#0062E3] text-white font-semibold py-2 rounded-md mt-4 text-sm sm:text-base hover:bg-blue-700 transition-colors"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }