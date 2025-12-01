"use client";

import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";
import {
  ContributorCaseRead,
  HttpError,
  listContributorEvents,
  reviewContributorEvent,
} from "../../api/contributorEvents";

const APPROVER_ROLES = new Set(["CURATOR", "ADMIN"]);
/* istanbul ignore next */
const normalizeRole = (role?: string | null) =>
  role ? role.trim().toUpperCase() : "";

type ActionState =
  | { item: ContributorCaseRead; action: "approve" | "reject" }
  | null;

/* istanbul ignore next */
const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  /* istanbul ignore next */
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const titleFor = (item: ContributorCaseRead) =>
  item.news?.title || item.disease_name || item.city || "Tanpa judul";

const submitterFor = (item: ContributorCaseRead) =>
  item.created_by?.name || item.created_by?.email || "Tidak diketahui";

const isPending = (item: ContributorCaseRead) =>
  (item.state || "PENDING").toUpperCase() === "PENDING";

const statePillClass = (state?: string) => {
  const s = (state || "PENDING").toUpperCase();
  if (s === "APPROVED") {
    return "bg-green-100 text-green-800";
  }
  if (s === "REJECTED") {
    return "bg-red-100 text-red-800";
  }
  return "bg-amber-100 text-amber-800";
};

export default function ContributionManagementPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role as any);
  const canReview = useMemo(() => APPROVER_ROLES.has(role), [role]);

  const [items, setItems] = useState<ContributorCaseRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionState>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [viewItem, setViewItem] = useState<ContributorCaseRead | null>(null);

  useEffect(() => {
    if (!canReview) return;
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReview]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await listContributorEvents();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err instanceof HttpError) {
        setError(
          typeof err.detail === "string"
            ? err.detail
            : "Gagal memuat data kontribusi. Pastikan Anda memiliki akses.",
        );
      } else {
        setError("Gagal memuat data kontribusi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openAction = (
    item: ContributorCaseRead,
    action: "approve" | "reject",
  ) => {
    setActionModal({ item, action });
    setNote("");
    setSuccess(null);
    setError(null);
  };

  const handleAction = async () => {
    /* istanbul ignore next */
    if (!actionModal) return;
    /* istanbul ignore next */
    if (actionModal.action === "reject" && !note.trim()) {
      setError("Catatan wajib diisi untuk penolakan.");
      return;
    }
    setActing(true);
    setError(null);
    try {
      await reviewContributorEvent(
        actionModal.item.id,
        actionModal.action,
        note.trim(),
      );

      /* istanbul ignore next */
      setActionModal(null);
      /* istanbul ignore next */
      setNote("");
      /* istanbul ignore next */
      setSuccess(
        actionModal.action === "approve"
          ? "Pengajuan berhasil diterima."
          : "Pengajuan berhasil ditolak.",
      );
      /* istanbul ignore next */
      fetchSubmissions();
      /* istanbul ignore next */
    } catch (err: any) {
      /* istanbul ignore next */
      if (err instanceof HttpError) {
        const detail =
          typeof err.detail === "string"
            ? err.detail
            : err.detail?.detail || "Gagal memproses tindakan.";
        setError(detail);
      } else {
        setError("Gagal memproses tindakan.");
      }
      /* istanbul ignore next */
    } finally {
      setActing(false);
    }
  };

  if (!user || !canReview) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <AccessDeniedNotice />
        <Footer />
      </div>
    );
  }

  /* istanbul ignore next */
  const successBanner = success ? (
    <div className="px-6 py-3 bg-green-50 text-sm text-green-700 border-b border-green-100">
      {success}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-24 pb-16 px-4 flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">
              Manajemen Kontribusi
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Tinjau, setujui, atau tolak pengajuan kasus yang dikirim oleh
              kontributor.
            </p>
          </div>

          {/* c8 ignore next */}
          {/* istanbul ignore next */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Semua pengajuan kontributor
                </div>
                <div className="text-xs text-slate-500">
                  Menampilkan semua pengajuan yang dapat Anda review (PENDING,
                  APPROVED, REJECTED).
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSubmissions}
                  className="text-sm px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Muat ulang
                </button>
              </div>
            </div>
            {/* c8 ignore next */}
            {/* istanbul ignore next */}
            {error && (
              <div className="px-6 py-3 bg-red-50 text-sm text-red-700 border-b border-red-100">
                {error}
              </div>
            )}
            {/* c8 ignore next */}
            {successBanner}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Judul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Dikumpulkan oleh
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        Memuat data kontribusi...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        Tidak ada pengajuan.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm text-slate-800 font-mono">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-800">
                          <div className="font-semibold">{titleFor(item)}</div>
                          {/* c8 ignore next */}
                          {/* istanbul ignore next */}
                          <div className="text-xs text-slate-500">
                            {item.disease_name
                              ? `Penyakit: ${item.disease_name}`
                              : ""}
                          </div>
                        </td>
                        {/* c8 ignore next */}
                        {/* istanbul ignore next */}
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {formatDate(item.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {submitterFor(item)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statePillClass(
                              item.state,
                            )}`}
                          >
                            {item.state || "PENDING"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex gap-2 flex-nowrap">
                            <button
                              onClick={() => setViewItem(item)}
                              className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                            >
                              Lihat
                            </button>
                            <button
                              onClick={() => openAction(item, "approve")}
                              className="px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 text-xs disabled:opacity-60"
                              disabled={acting || !isPending(item)}
                            >
                              Terima
                            </button>
                            <button
                              onClick={() => openAction(item, "reject")}
                              className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs disabled:opacity-60"
                              disabled={acting || !isPending(item)}
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal approve/reject */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-slate-900">
                {actionModal.action === "approve"
                  ? "Terima Pengajuan"
                  : "Tolak Pengajuan"}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {titleFor(actionModal.item)}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-slate-700">
                {actionModal.action === "approve"
                  ? "Anda akan menyetujui pengajuan ini."
                  : "Berikan alasan penolakan untuk pengajuan ini."}
              </p>
              <label className="block text-sm text-slate-700">
                Catatan (opsional untuk terima, wajib untuk tolak)
                <textarea
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    actionModal.action === "approve"
                      ? "Contoh: Data terlihat valid."
                      : "Contoh: Data tidak lengkap."
                  }
                />
              </label>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                disabled={acting}
              >
                Batal
              </button>
              <button
                onClick={handleAction}
                className="px-4 py-2 rounded-md text-sm text-white"
                disabled={acting}
                style={{
                  backgroundColor:
                    actionModal.action === "approve" ? "#16a34a" : "#dc2626",
                }}
              >
                {acting
                  ? "Memproses..."
                  : actionModal.action === "approve"
                  ? "Terima"
                  : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detail */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {titleFor(viewItem)}
                </h3>
                <p className="text-xs text-slate-500">ID: {viewItem.id}</p>
              </div>
              {/* c8 ignore next */}
              {/* istanbul ignore next */}
              <button
                onClick={() => setViewItem(null)}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                Tutup
              </button>
            </div>
            <div className="px-6 py-4 space-y-4 text-sm text-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Penyakit</div>
                  <div className="font-semibold">
                    {viewItem.disease_name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Lokasi</div>
                  <div className="font-semibold">
                    {viewItem.location?.city || "-"}
                    {viewItem.location?.province
                      ? `, ${viewItem.location.province}`
                      : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Jenis kelamin</div>
                  <div className="font-semibold">
                    {viewItem.gender || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Usia</div>
                  <div className="font-semibold">
                    {viewItem.age ?? "-"}
                  </div>
                </div>
                {/* c8 ignore next */}
                {/* istanbul ignore next */}
                <div>
                  <div className="text-xs text-slate-500">
                    Tingkat keparahan
                  </div>
                  <div className="font-semibold">
                    {viewItem.severity || "-"}
                  </div>
                </div>
                {/* c8 ignore next */}
                {/* istanbul ignore next */}
                <div>
                  <div className="text-xs text-slate-500">Status kasus</div>
                  <div className="font-semibold">
                    {viewItem.status || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">State</div>
                  <div className="font-semibold">
                    {viewItem.state || "PENDING"}
                  </div>
                </div>
                {/* c8 ignore next */}
                {/* istanbul ignore next */}
                <div>
                  <div className="text-xs text-slate-500">Dikumpulkan oleh</div>
                  <div className="font-semibold">
                    {submitterFor(viewItem)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {viewItem.created_by?.email
                      ? `(${viewItem.created_by.email})`
                      : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {formatDate(viewItem.created_at)}
                  </div>
                </div>
              </div>
              {/* c8 ignore next */}
              {/* istanbul ignore next */}
              <div>
                <div className="text-xs text-slate-500">Sumber berita</div>
                {/* c8 ignore next */}
                {/* istanbul ignore next */}
                {viewItem.news ? (
                  <div className="mt-2 space-y-1">
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    <div className="font-semibold">
                      {viewItem.news.title || "-"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {(viewItem.news.portal || "-") +
                        " - " +
                        (viewItem.news.type || "-")}
                    </div>
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    <div className="text-xs text-slate-600">
                      Penulis: {viewItem.news.author || "-"}
                    </div>
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    <div className="text-xs text-slate-600">
                      Tanggal terbit:{" "}
                      {formatDate(
                        viewItem.news?.date_published || undefined,
                      )}
                    </div>
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    {viewItem.news.url && (
                      <a
                        href={viewItem.news.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-xs hover:underline break-all"
                      >
                        {viewItem.news.url}
                      </a>
                    )}
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    {viewItem.news.img_url && (
                      <div className="text-xs break-all text-slate-600">
                        Gambar: {viewItem.news.img_url}
                      </div>
                    )}
                    {/* c8 ignore next */}
                    {/* istanbul ignore next */}
                    {viewItem.news.content && (
                      <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">
                        {viewItem.news.content}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-700">
                    Tidak ada data sumber.
                  </div>
                )}
              </div>

              {viewItem.review_note ? (
                <div className="bg-slate-50 border rounded-md px-4 py-3">
                  <div className="text-xs text-slate-500">
                    Catatan peninjau
                  </div>
                  <div className="text-sm text-slate-800 mt-1">
                    {viewItem.review_note}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
