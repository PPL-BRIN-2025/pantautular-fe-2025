"use client";

import Link from "next/link";

const LOGIN_URL = "/login?next=/curator-dashboard";

export default function AccessDeniedNotice() {
  return (
    <div className="w-full">
      <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white/90 p-6 text-center shadow-md backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-amber-900">Akses Kontributor Ditolak</h2>
          <p className="mt-3 text-sm text-amber-800">
            Halaman ini hanya tersedia untuk kontributor. Silakan kembali atau masuk dengan akun yang memiliki akses.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-50"
            >
              Kembali
            </Link>
            <Link
              href={LOGIN_URL}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}