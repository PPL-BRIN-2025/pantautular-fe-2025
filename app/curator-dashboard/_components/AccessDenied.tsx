"use client";

import Link from "next/link";

const LOGIN_URL = "/login?next=/curator-dashboard";

export default function AccessDeniedNotice() {
  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-sm font-semibold text-amber-700">Informasi Akses</div>
  <div className="mt-2 text-2xl font-semibold text-amber-900">Akses Ditolak</div>
      <p className="mt-2 text-sm text-amber-800">
        Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali atau masuk sebagai admin.
      </p>
      <p className="mt-2 text-xs text-amber-700/90">You do not have permission to perform this action.</p>
      <div className="mt-4 flex gap-2">
        <Link
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Kembali
        </Link>
        <Link
          href={LOGIN_URL}
          className="rounded-lg bg-[#0069CF] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
