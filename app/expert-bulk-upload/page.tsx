
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AccessDeniedNotice from '../components/AccessDenied';
import { useAuth } from '../auth/hooks/useAuth';
import CsvUpload from '../components/CsvUpload';

const normalizeRole = (role?: string | null) => (role ? role.trim().toUpperCase() : '');

export default function CuratorBulkUploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [effectiveUser, setEffectiveUser] = useState(user ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) setEffectiveUser(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    } else {
      setEffectiveUser(user ?? null);
    }
    setLoading(false);
  }, [user]);

  const role = normalizeRole(effectiveUser?.role);
  const isExpert = role === 'EXP_USER';
  // redirect unauthenticated users to login (when loading finished)
  useEffect(() => {
    if (!loading && !effectiveUser) {
      try {
        const next = encodeURIComponent(window.location.pathname || '/expert-bulk-upload');
        router.replace(`/login?next=${next}`);
      } catch (e) {
        try { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname || '/expert-bulk-upload')}`; } catch {}
      }
    }
  }, [loading, effectiveUser, router]);

  // If authenticated but not EXP_USER, show AccessDenied with site chrome (navbar/footer)
  if (!loading && effectiveUser && !isExpert) {
    return (
      <div className="min-h-screen bg-[#f0f6f8]">
        <Navbar />
        <AccessDeniedNotice />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f6f8]">
      <Navbar />
      <main className="pt-28 pb-36 flex justify-center">
        <div className="w-full max-w-4xl px-6">
          <div className="bg-white rounded-md shadow-md overflow-hidden border p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Unggah CSV (Bulk)</h1>
              <div>
                <button onClick={() => router.push('/curator-add-data')} className="px-3 py-2 border rounded-md bg-white">Kembali ke tambah satu-per-satu</button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">Halaman ini digunakan untuk mengunggah file CSV berisi banyak kasus sekaligus. Hanya pengguna dengan peran EXP_USER yang dapat melakukan unggahan.</p>

            {loading ? (
              <div className="text-sm text-gray-500">Memeriksa akses…</div>
            ) : (
              <div>
                <CsvUpload
                  effectiveUser={effectiveUser}
                  onSuccessAction={(m: string) => { /* show inline feedback */ alert(m); }}
                  onErrorAction={(e: string) => { /* show inline feedback */ alert(e); }}
                />
                <div className="mt-4 text-xs text-gray-600 space-y-2 border-t pt-3">
                <p className="font-medium text-gray-700">Format CSV yang didukung:</p>
                <p className="text-[11px] break-all">
                  disease, gender, age, city, status, severity, location_city, location_province, news_portal, news_title, news_type, news_content, news_url, news_author, news_date_published
                </p>

                <p className="text-gray-500">Contoh baris:</p>
                <pre className="bg-gray-50 border rounded p-2 text-[10px] leading-tight overflow-x-auto">
              Rabies,L,9,Denpasar,bahaya,insiden,Denpasar,Bali,Kompas,"Kasus Gigitan Anjing Dilaporkan","artikel","Dinas kesehatan mencatat peningkatan gigitan anjing","https://kompas.com/rabies1","Reporter Q",2024-05-01T08:00:00Z
                </pre>

                <p className="text-gray-500">Pastikan file dalam format <strong>.csv (UTF-8)</strong> dengan header yang sesuai.</p>

                <a
                  href="/templates/example_cases.csv"
                  download
                  className="inline-block text-blue-600 hover:underline mt-1"
                >
                  📥 Download contoh template CSV
                </a>
              </div>

              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}