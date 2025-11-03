
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
            ) : !isExpert ? (
              <AccessDeniedNotice />
            ) : (
              <div>
                <CsvUpload
                  effectiveUser={effectiveUser}
                  onSuccessAction={(m: string) => { /* show inline feedback */ alert(m); }}
                  onErrorAction={(e: string) => { /* show inline feedback */ alert(e); }}
                />
                <div className="text-xs text-gray-500 mt-2">Catatan: format CSV harus sesuai ketentuan backend.</div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}