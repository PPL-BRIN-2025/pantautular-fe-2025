"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied3";
import { useAuth } from "../auth/hooks/useAuth";
import {
  ContributorCaseRead,
  HttpError,
  listContributorEvents,
  deleteContributorEvent,
} from "../../api/contributorEvents";

const CONTRIBUTOR_ROLES = new Set(["CONTRIBUTOR"]);

/* istanbul ignore next */
const normalizeRole = (role?: string | null) =>
  role ? role.trim().toUpperCase() : "";

/* istanbul ignore next */
const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* istanbul ignore next */
const titleFor = (item: ContributorCaseRead) =>
  item.news?.title || item.disease_name || item.city || "Tanpa judul";

/* istanbul ignore next */
const statePillClass = (state?: string) => {
  const s = (state || "PENDING").toUpperCase();
  if (s === "APPROVED") return "bg-green-100 text-green-800";
  if (s === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
};

export default function ContributorDataPendingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = normalizeRole(user?.role as any);
  const canAccess = useMemo(() => CONTRIBUTOR_ROLES.has(role), [role]);

  const [items, setItems] = useState<ContributorCaseRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<ContributorCaseRead | null>(null);

  // delete-related state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContributorCaseRead | null>(
    null,
  );


  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        router.replace(`/login?next=${next}`);
      }
    }
  }, [user, router]);

  const fetchMine = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // backend otomatis filter created_by = current user utk non-approver
      const data = await listContributorEvents();
      /* istanbul ignore next */ setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err instanceof HttpError) {
        setError(
          typeof err.detail === "string"
            ? err.detail
            : "Gagal memuat data kontribusi. Pastikan kamu sudah login.",
        );
      } else {
        setError("Gagal memuat data kontribusi.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canAccess) return;
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canAccess]);

  const handleEdit = (item: ContributorCaseRead) => {
    router.push(
      `/contributor-edit-delete-data?id=${encodeURIComponent(item.id)}`,
    );
  };

  const openDeleteConfirm = (item: ContributorCaseRead) => {
    setDeleteTarget(item);
    setError(null);
    setSuccess(null);
  };


  /* istanbul ignore next */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    setError(null);
    setSuccess(null);

    try {
      await deleteContributorEvent(deleteTarget.id);
      setSuccess("Pengajuan berhasil dihapus.");
      setDeleteTarget(null);
      await fetchMine();
    } catch (err: any) {
      if (err instanceof HttpError) {
        const detail =
          typeof err.detail === "string"
            ? err.detail
            : err.detail?.detail || "Gagal menghapus pengajuan.";
        setError(detail);
      } else {
        setError("Gagal menghapus pengajuan.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // kalau belum login: tunggu redirect, jangan render konten
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="pt-24 pb-16 flex justify-center">
          <div className="text-sm text-slate-600">
            Mengarahkan ke halaman login...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // sudah login tapi role tidak cocok
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <AccessDeniedNotice />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-24 pb-16 px-4 flex justify-center">
        <div className="w-full max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">
              Data Kontribusi Saya
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Di sini kamu bisa melihat, mengubah, atau menghapus semua laporan
              kasus yang pernah kamu kirim, baik yang masih PENDING maupun yang
              sudah APPROVED atau REJECTED.
            </p>
          </div>

          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Pengajuan kamu
                </div>
                <div className="text-xs text-slate-500">
                  Menampilkan semua pengajuan yang kamu kirim (PENDING,
                  APPROVED, REJECTED).
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMine}
                  className="text-sm px-3 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Muat ulang
                </button>
              </div>
            </div>

            {error && (
              <div className="px-6 py-3 bg-red-50 text-sm text-red-700 border-b border-red-100">
                {error}
              </div>
            )}
            {success && (
              /* istanbul ignore next */
              <div className="px-6 py-3 bg-green-50 text-sm text-green-700 border-b border-green-100">
                {success}
              </div>
            )}

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
                        colSpan={5}
                        className="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        Memuat data kontribusi...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-center text-sm text-slate-500"
                      >
                        Kamu belum memiliki pengajuan.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const pending =
                        (item.state ||
                          /* istanbul ignore next */ "PENDING").toUpperCase() ===
                        "PENDING";

                      const editBtnClass = `
                        px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs
                        ${
                          pending
                            ? "hover:bg-blue-700"
                            : "opacity-50 cursor-not-allowed"
                        }
                      `;
                      const deleteBtnClass = `
                        px-3 py-1.5 rounded-md bg-red-600 text-white text-xs
                        ${
                          pending && deletingId !== item.id
                            ? "hover:bg-red-700"
                            : "opacity-50 cursor-not-allowed"
                        }
                      `;

                      return (
                        <tr key={item.id}>
                          <td className="px-6 py-4 text-sm text-slate-800 font-mono">
                            {item.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-800">
                            <div className="font-semibold">
                              {titleFor(item)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {/* istanbul ignore next */}
                              {item.disease_name
                                ? `Penyakit: ${item.disease_name}`
                                : /* istanbul ignore next */ ""}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statePillClass(
                                item.state,
                              )}`}
                            >
                              {item.state ||
                                /* istanbul ignore next */ "PENDING"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => setViewItem(item)}
                                className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                              >
                                Lihat
                              </button>
                              <button
                                /* istanbul ignore next */
                                onClick={() => pending && handleEdit(item)}
                                className={editBtnClass}
                                disabled={!pending}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  pending && openDeleteConfirm(item)
                                }
                                className={deleteBtnClass}
                                disabled={
                                  !pending || deletingId === item.id
                                }
                              >
                                {deletingId === item.id
                                  ? "Menghapus..."
                                  : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Detail modal */}
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
              <button
                /* istanbul ignore next */ onClick={() => setViewItem(null)}
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
                    {viewItem.disease_name ||
                      /* istanbul ignore next */ "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Lokasi</div>
                  <div className="font-semibold">
                    {viewItem.location?.city ||
                      /* istanbul ignore next */ "-"}
                    {viewItem.location?.province
                      ? `, ${viewItem.location.province}`
                      : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Jenis kelamin</div>
                  <div className="font-semibold">
                    {viewItem.gender || /* istanbul ignore next */ "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Usia</div>
                  <div className="font-semibold">{viewItem.age ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Tingkat keparahan
                  </div>
                  <div className="font-semibold">
                    {viewItem.severity ||
                      /* istanbul ignore next */ "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Status kasus</div>
                  <div className="font-semibold">
                    {viewItem.status || /* istanbul ignore next */ "-"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">State</div>
                  <div className="font-semibold">
                    {viewItem.state ||
                      /* istanbul ignore next */ "PENDING"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Dikumpulkan pada
                  </div>
                  <div className="font-semibold">
                    {formatDate(viewItem.created_at)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Sumber berita</div>
                {viewItem.news ? (
                  <div className="mt-2 space-y-1">
                    <div className="font-semibold">
                      {viewItem.news.title ||
                        /* istanbul ignore next */ "-"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {(viewItem.news.portal ||
                        /* istanbul ignore next */ "-") +
                        " - " +
                        (viewItem.news.type ||
                          /* istanbul ignore next */ "-")}
                    </div>
                    <div className="text-xs text-slate-600">
                      Penulis:{" "}
                      {viewItem.news.author ||
                        /* istanbul ignore next */ "-"}
                    </div>
                    <div className="text-xs text-slate-600">
                      Tanggal terbit:{" "}
                      {formatDate(
                        viewItem.news?.date_published ||
                          /* istanbul ignore next */ undefined,
                      )}
                    </div>
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
                    {viewItem.news.img_url && (
                      <div className="text-xs break-all text-slate-600">
                        Gambar: {viewItem.news.img_url}
                      </div>
                    )}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Hapus pengajuan?
            </h3>
            <p className="text-sm text-slate-700 mb-4">
              Kamu akan menghapus pengajuan{" "}
              <span className="font-semibold">
                {titleFor(deleteTarget)}
              </span>
              . Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-2 rounded-md border border-slate-200 text-slate-700 text-sm"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-2 rounded-md bg-red-600 text-white text-sm disabled:opacity-60"
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id
                  ? "Menghapus..."
                  : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
