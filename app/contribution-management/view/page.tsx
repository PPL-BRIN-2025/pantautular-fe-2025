"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

type ContributionStatus = "APPROVED" | "REJECTED" | "WAITING FOR APPROVAL";

type ContributionDetail = {
  id: string;
  title: string;
  username: string;
  status: ContributionStatus;
  location: string;
  date: string;
  detail: string;
};

const DUMMY_DETAILS: ContributionDetail[] = [
  {
    id: "ID1",
    title: "Bla Bla Bla",
    username: "KontributorA",
    status: "APPROVED",
    location: "Jakarta",
    date: "2025-11-01",
    detail:
      "Laporan kasus penyakit menular di wilayah Jakarta dengan jumlah kasus yang meningkat dalam dua minggu terakhir.",
  },
  {
    id: "ID2",
    title: "Lorem Ipsum",
    username: "KontributorB",
    status: "REJECTED",
    location: "Bandung",
    date: "2025-10-21",
    detail:
      "Data tidak lengkap dan sumber berita tidak jelas, sehingga belum dapat digunakan sebagai basis analisis.",
  },
  {
    id: "ID3",
    title: "Dolor",
    username: "KontributorC",
    status: "WAITING FOR APPROVAL",
    location: "Surabaya",
    date: "2025-11-15",
    detail:
      "Ringkasan berita mengenai potensi kluster baru di Surabaya dengan status verifikasi masih dalam proses.",
  },
];

function statusColor(status: ContributionStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700 border border-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-700 border border-red-300";
    case "WAITING FOR APPROVAL":
    default:
      return "bg-yellow-100 text-yellow-700 border border-yellow-300";
  }
}

export default function ContributionViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  const initial = useMemo(
    () => DUMMY_DETAILS.find((d) => d.id === id) ?? null,
    [id]
  );

  const [status, setStatus] = useState<ContributionStatus>(
    initial?.status ?? "WAITING FOR APPROVAL"
  );
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  if (!initial) {
    return (
      <div className="min-h-screen bg-[#F3F7FB] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-gray-600 mb-3">
              Kontribusi dengan ID{" "}
              <span className="font-semibold">{id}</span> tidak ditemukan.
            </p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-[#2E8AF6] text-white rounded-lg text-sm hover:bg-[#256fd4]"
            >
              Kembali
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleApprove = () => {
    setStatus("APPROVED");
    setShowApproveModal(false);
    setFlash("Kontribusi berhasil disetujui.");
    setRejectReason("");
  };

  const handleReject = () => {
    setStatus("REJECTED");
    setShowRejectModal(false);
    setFlash(
      rejectReason
        ? `Kontribusi ditolak dengan catatan: "${rejectReason}".`
        : "Kontribusi ditolak."
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F7FB]">
      <Navbar />

      <main className="flex-1 w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-[#4A78E0] text-sm font-medium mb-4 hover:underline"
          >
            &lt; Kembali ke daftar kontribusi
          </button>

          
          <section className="bg-white rounded-3xl shadow-sm border border-[#B9C8F2] px-6 sm:px-10 py-6 sm:py-8">
            <div className="relative mb-4">
              <h1 className="text-2xl font-semibold text-[#1A2A6B] text-center">
                {initial.title}
              </h1>
              <button
                onClick={() => router.back()}
                className="absolute right-0 top-0 text-2xl leading-none text-[#1A2A6B] hover:text-red-500"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="h-px bg-[#CED7E0] mb-4" />

            <div className="mb-4 text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-2">
              <span>
                Dikirim oleh{" "}
                <span className="font-semibold text-gray-800">
                  {initial.username}
                </span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${statusColor(
                  status
                )}`}
              >
                Status: {status}
              </span>
            </div>

            <div className="bg-[#E5E5E5] rounded-2xl px-4 py-4 sm:px-5 sm:py-5">
              <div className="bg-white rounded-2xl p-4 sm:p-5 min-h-[220px]">
                <div className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                  {initial.location}, {initial.date}
                </div>
                <div className="text-[#1A2A6B] text-sm sm:text-base whitespace-pre-line">
                  {initial.detail}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-5 py-2 rounded-lg bg-[#E0463E] text-white text-sm font-medium hover:brightness-95"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-5 py-2 rounded-lg bg-[#3CA45A] text-white text-sm font-medium hover:brightness-95"
                >
                  Approve
                </button>
              </div>
            </div>
          </section>

          {/* Flash message */}
          {flash && (
            <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              {flash}
            </div>
          )}
        </div>
      </main>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold text-base text-gray-800">
                Reject Data Confirmation
              </h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-lg leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              Input reject message (opsional, tapi direkomendasikan).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full min-h-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E0463E]/70"
              placeholder="Tuliskan alasan penolakan di sini..."
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleReject}
                className="px-5 py-2 rounded-lg bg-[#E0463E] text-white text-sm font-medium hover:brightness-95"
              >
                Reject Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center">
            <div className="flex justify-end">
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-lg leading-none text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="mt-1 mb-4 text-sm text-gray-800 font-medium">
              Approve Data?
            </p>
            <button
              onClick={handleApprove}
              className="px-6 py-2 rounded-lg bg-[#3CA45A] text-white text-sm font-medium hover:brightness-95"
            >
              Yes
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
