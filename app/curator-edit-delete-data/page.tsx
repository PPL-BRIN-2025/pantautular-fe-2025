"use client";

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BLUE = "#0069cf";

export default function CuratorEditDeleteDataPage() {
  const [jenisPenyakit, setJenisPenyakit] = useState("Hepatitis");
  const [lokasi, setLokasi] = useState("Kalimantan Tengah");
  const [sumberBerita, setSumberBerita] = useState("bandung.kompas.com");
  // structured sumber fields (prefilled as requested)
  const [srcPortal, setSrcPortal] = useState("Kompas");
  const [srcTitle, setSrcTitle] = useState("Kasus Hepatitis Anak");
  const [srcType, setSrcType] = useState("artikel");
  const [srcContent, setSrcContent] = useState("Penyakit Hepatitis telah menyebar...");
  const [srcUrl, setSrcUrl] = useState("https://example.com/news");
  const [srcAuthor, setSrcAuthor] = useState("Reporter A");
  const [srcDatePublished, setSrcDatePublished] = useState("2024-01-23T00:00:00Z");
  const [srcImgUrl, setSrcImgUrl] = useState("");
  const [ringkasan, setRingkasan] = useState("Penyakit Hepatitis telah menyebar....");
  const [jenisKelamin, setJenisKelamin] = useState("Pria");
  const [tingkatKeparahan, setTingkatKeparahan] = useState("insiden");
  const [kewaspadaan, setKewaspadaan] = useState(1);
  const [hoverKewaspadaan, setHoverKewaspadaan] = useState<number | null>(null);
  const [clickedKewaspadaan, setClickedKewaspadaan] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState({ dd: "23", mm: "01", yyyy: "2024" });
  const [usia, setUsia] = useState("12");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  // Edit modal state (re-uses similar fields inside the modal)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editJenis, setEditJenis] = useState(jenisPenyakit);
  const [editLokasi, setEditLokasi] = useState(lokasi);
  const [editSrcPortal, setEditSrcPortal] = useState(srcPortal);
  const [editSrcTitle, setEditSrcTitle] = useState(srcTitle);
  const [editSrcType, setEditSrcType] = useState(srcType);
  const [editSrcContent, setEditSrcContent] = useState(srcContent);
  const [editSrcUrl, setEditSrcUrl] = useState(srcUrl);
  const [editSrcAuthor, setEditSrcAuthor] = useState(srcAuthor);
  const [editSrcDatePublished, setEditSrcDatePublished] = useState(srcDatePublished);
  const [editSrcImgUrl, setEditSrcImgUrl] = useState(srcImgUrl);
  const [editRingkasan, setEditRingkasan] = useState(ringkasan);
  const [editJenisKelamin, setEditJenisKelamin] = useState(jenisKelamin);
  const [editTingkatKeparahan, setEditTingkatKeparahan] = useState(tingkatKeparahan);
  const [editKewaspadaan, setEditKewaspadaan] = useState(kewaspadaan);
  const [editHoverKewaspadaan, setEditHoverKewaspadaan] = useState<number | null>(null);
  const [editClickedKewaspadaan, setEditClickedKewaspadaan] = useState<number | null>(null);
  const [editTanggal, setEditTanggal] = useState(tanggal);
  const [editUsia, setEditUsia] = useState(usia);

  // small local lists (copied from add page) for jenis and lokasi with search/filter
  const initialJenis = [
    'Campak', 'COVID-19', 'DBD', 'Flu Singapura', 'Gastroentritis', 'HMPV', 'HFMD', 'HIV', 'Hepatitis A', 'Hepatitis B', 'Influenza', 'Malaria', 'Mpox', 'Polio', 'TBC', 'Demam Berdarah'
  ].map(s => s.trim());
  const uniqueJenis = Array.from(new Set(initialJenis.map(s => s)));
  uniqueJenis.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const [jenisList, setJenisList] = useState<string[]>(uniqueJenis);

  const initialLokasi = [
    "Ambon","Baubau","Banda Aceh","Banjarmasin","Bandar Lampung","Bandung","Bekasi","Bogor","Denpasar","Makassar","Malang","Manado","Jakarta","Yogyakarta","Semarang","Surabaya","Pekanbaru","Palembang","Balikpapan"
  ].map(s => s.trim()).filter(Boolean);
  const userLokasi = ["Depok","Tanggerang","Sleman","Kupang","Pontianak","Ternate","Tarakan","Bengkulu","Palu","Manokwari","Manokwari"].map(s => s.trim());
  const mergedLokasiRaw = Array.from(new Set([...initialLokasi, ...userLokasi].map(s => s)));
  const mergedLokasi = mergedLokasiRaw.map(s => s.trim()).filter(Boolean).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const [lokasiList, setLokasiList] = useState<string[]>(mergedLokasi);

  const [jenisSearch, setJenisSearch] = useState("");
  const [lokasiSearch, setLokasiSearch] = useState("");

  // result modal for edit/save actions
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultStatus, setResultStatus] = useState<'success'|'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Edited data submitted:", {
      jenisPenyakit,
      lokasi,
      sumberBerita: srcUrl || sumberBerita,
      tingkatKeparahan,
      sumber: {
        portal: srcPortal,
        title: srcTitle,
        type: srcType,
        content: srcContent,
        url: srcUrl,
        author: srcAuthor,
        date_published: srcDatePublished,
        img_url: srcImgUrl,
      },
      ringkasan,
      jenisKelamin,
      kewaspadaan,
      tanggal,
      usia,
    });
    setSuccessMessage("Data berhasil diperbarui.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // fetch case if id present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const id = params.get('id');
      if (!id) return;
      setCaseId(id);
      (async () => {
        const { getCuratorCase, HttpError } = await import('../../api/curatorCases');
        try {
          const data: any = await getCuratorCase(id);
          // hydrate UI from API shape
          setJenisPenyakit(data.disease_name || data.disease || '');
          setLokasi(data.location?.city || data.city || '');
          const latestNews = Array.isArray(data.news) && data.news.length ? data.news[data.news.length - 1] : null;
          setSrcPortal(latestNews?.portal || '');
          setSrcTitle(latestNews?.title || '');
          setSrcType(latestNews?.type || 'artikel');
          setSrcContent(latestNews?.content || '');
          setSrcUrl(latestNews?.url || '');
          setSrcAuthor(latestNews?.author || '');
          setSrcDatePublished(latestNews?.date_published || '');
          setSrcImgUrl(latestNews?.img_url || '');
          setRingkasan(latestNews?.content || '');
          setJenisKelamin(data.gender || '');
          setTingkatKeparahan(data.severity || 'insiden');
          setKewaspadaan(data.status ? (data.status === 'biasa' ? 1 : data.status === 'minimal' ? 2 : data.status === 'bahaya' ? 3 : 4) : 1);
          setTanggal({ dd: '', mm: '', yyyy: '' });
          setUsia(data.age ? String(data.age) : '');
        } catch (err: any) {
          if (err instanceof HttpError && err.status === 401) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?next=${next}`;
            return;
          }
          if (err instanceof HttpError && err.status === 403) {
            setErrors({ form: 'Akses Ditolak: halaman ini hanya untuk kurator.' });
            return;
          }
          console.error('Failed to load case', err);
        }
      })();
    } catch (e) {
      /* ignore for SSR */
    }
  }, []);

  const openEditModal = () => {
    // populate modal fields from current state
    setEditJenis(jenisPenyakit);
    setEditLokasi(lokasi);
    setEditSrcPortal(srcPortal);
    setEditSrcTitle(srcTitle);
    setEditSrcType(srcType);
    setEditSrcContent(srcContent);
    setEditSrcUrl(srcUrl);
    setEditSrcAuthor(srcAuthor);
    setEditSrcDatePublished(srcDatePublished);
    setEditSrcImgUrl(srcImgUrl);
    setEditRingkasan(ringkasan);
    setEditJenisKelamin(jenisKelamin);
    setEditTingkatKeparahan(tingkatKeparahan);
    setEditKewaspadaan(kewaspadaan);
    setEditTanggal(tanggal);
    setEditUsia(usia);
    setShowEditModal(true);
  };

  const handleEditSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // minimal sync back to main state
    setJenisPenyakit(editJenis);
    setLokasi(editLokasi);
    setSrcPortal(editSrcPortal);
    setSrcTitle(editSrcTitle);
    setSrcType(editSrcType);
    setSrcContent(editSrcContent);
    setSrcUrl(editSrcUrl);
    setSrcAuthor(editSrcAuthor);
    setSrcDatePublished(editSrcDatePublished);
    setSrcImgUrl(editSrcImgUrl);
    setRingkasan(editRingkasan);
    setJenisKelamin(editJenisKelamin);
    setTingkatKeparahan(editTingkatKeparahan);
    setKewaspadaan(editKewaspadaan);
    setTanggal(editTanggal);
    setUsia(editUsia);

    // call backend if caseId available
    (async () => {
      try {
        if (caseId) {
          const { updateCuratorCase, HttpError } = await import('../../api/curatorCases');
          const STATUS_MAP: Record<number, string> = { 1: 'biasa', 2: 'minimal', 3: 'bahaya', 4: 'katastropik' };
          const payload = {
            disease: editJenis,
            gender: editJenisKelamin || undefined,
            age: editUsia ? Number(editUsia) : null,
            city: editLokasi || undefined,
            status: STATUS_MAP[editKewaspadaan] || 'biasa',
            severity: editTingkatKeparahan,
            location: { city: editLokasi },
            news: {
              portal: editSrcPortal || 'Unknown',
              title: editSrcTitle || '',
              type: editSrcType || 'artikel',
              content: editSrcContent || editRingkasan || '',
              url: editSrcUrl || '',
              author: editSrcAuthor || undefined,
              date_published: editSrcDatePublished || undefined,
              img_url: editSrcImgUrl || undefined,
            },
          };
          await updateCuratorCase(caseId, payload as any);
        }

        // show result & inline success
        setSuccessMessage("Data berhasil diperbarui.");
        setResultStatus('success');
        setResultMessage('Berhasil');
        setShowResultModal(true);
        setTimeout(() => setShowResultModal(false), 1200);
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowEditModal(false);
      } catch (err: any) {
        console.error('update failed', err);
        setResultStatus('error');
        setResultMessage('Gagal');
        setShowResultModal(true);
        setTimeout(() => setShowResultModal(false), 1200);
      }
    })();
  };

  const handleDelete = () => {
    // open confirmation modal instead of browser confirm()
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    (async () => {
      try {
        if (caseId) {
          const { deleteCuratorCase, HttpError } = await import('../../api/curatorCases');
          await deleteCuratorCase(caseId);
          // after deletion redirect back to list or clear
          window.location.href = '/curator-dashboard';
          return;
        }
        // if no caseId, just close
        setSuccessMessage("Data berhasil dihapus.");
        setTimeout(() => setSuccessMessage(""), 3000);
        setShowDeleteConfirm(false);
      } catch (err: any) {
        console.error('delete failed', err);
        setErrors((p) => ({ ...p, form: 'Gagal menghapus data' }));
        setShowDeleteConfirm(false);
      }
    })();
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleStarKey = (e: React.KeyboardEvent<HTMLButtonElement>, n: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKewaspadaan(n);
      setClickedKewaspadaan(n);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f6f8]">
      <Navbar />

      <main className="pt-28 pb-36 flex justify-center">
        <div className="w-full max-w-6xl px-6">
          <div className="bg-white rounded-md shadow-md overflow-hidden border">
            {/* Header */}
            <div className="bg-[#1e6fd6] text-white px-6 py-4 flex items-center justify-between">
              <h1 id="curator-add-title" className="text-lg font-semibold">Informasi Penyakit Menular</h1>
              <div className="flex items-center gap-4">
                <div className="text-sm opacity-90">Silakan ubah atau hapus data dengan informasi yang akurat</div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      // populate edit fields then enable inline editing
                      setEditJenis(jenisPenyakit);
                      setEditLokasi(lokasi);
                      setEditSrcPortal(srcPortal);
                      setEditSrcTitle(srcTitle);
                      setEditSrcType(srcType);
                      setEditSrcContent(srcContent);
                      setEditSrcUrl(srcUrl);
                      setEditSrcAuthor(srcAuthor);
                      setEditSrcDatePublished(srcDatePublished);
                      setEditSrcImgUrl(srcImgUrl);
                      setEditRingkasan(ringkasan);
                      setEditJenisKelamin(jenisKelamin);
                      setEditTingkatKeparahan(tingkatKeparahan);
                      setEditKewaspadaan(kewaspadaan);
                      setEditTanggal(tanggal);
                      setEditUsia(usia);
                      setIsEditing(true);
                    }}
                    className="px-3 py-1 bg-[#ffffff] text-[#0069cf] text-sm rounded-md flex items-center gap-2"
                  >
                    <span aria-hidden>✏️</span>
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => {
                      // cancel editing: revert edit fields and disable
                      setEditJenis(jenisPenyakit);
                      setEditLokasi(lokasi);
                      setEditRingkasan(ringkasan);
                      setEditTingkatKeparahan(tingkatKeparahan);
                      setEditUsia(usia);
                      setEditKewaspadaan(kewaspadaan);
                      setIsEditing(false);
                    }} className="px-3 py-1 rounded-md bg-red-500 text-white hover:brightness-90">Batal</button>
                  </div>
                )}
              </div>
            </div>

            <form aria-labelledby="curator-add-title" onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6" role="form">
              {successMessage && (
                <div className="col-span-2 text-sm text-green-700 mb-2">
                  {successMessage}
                </div>
              )}

              <p className="col-span-2 text-xs text-gray-500 mb-4">Kolom bertanda * wajib diisi. Periksa kembali sebelum menerapkan.</p>

              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="jenisPenyakit" className="block text-sm font-medium text-gray-700 mb-2">Jenis Penyakit <span className="text-red-500">*</span></label>
                  {isEditing ? (
                    <div>
                      <input
                        id="jenisPenyakit"
                        value={editJenis}
                        onChange={(e) => { setEditJenis(e.target.value); setJenisSearch(e.target.value); }}
                        placeholder="Cari atau ketik..."
                        className="w-full border rounded-md px-3 py-2"
                      />
                      <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                        {jenisList.filter(j => j.toLowerCase().includes(jenisSearch.trim().toLowerCase())).length === 0 ? (
                          <div className="text-xs text-gray-500">Tidak ada hasil</div>
                        ) : (
                          jenisList.filter(j => j.toLowerCase().includes(jenisSearch.trim().toLowerCase())).map((j) => (
                            <div key={j} onClick={() => setEditJenis(j)} className={`py-1 px-2 rounded-md cursor-pointer ${editJenis === j ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`}>
                              {j}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <input id="jenisPenyakit" value={jenisPenyakit} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                  )}
                </div>

                <div>
                  <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-2">Lokasi <span className="text-red-500">*</span></label>
                  {isEditing ? (
                    <div>
                      <input
                        id="lokasi"
                        value={editLokasi}
                        onChange={(e) => { setEditLokasi(e.target.value); setLokasiSearch(e.target.value); }}
                        placeholder="Cari atau ketik lokasi..."
                        className="w-full border rounded-md px-3 py-2"
                      />
                      <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                        {lokasiList.filter(l => l.toLowerCase().includes(lokasiSearch.trim().toLowerCase())).length === 0 ? (
                          <div className="text-xs text-gray-500">Tidak ada hasil</div>
                        ) : (
                          lokasiList.filter(l => l.toLowerCase().includes(lokasiSearch.trim().toLowerCase())).map((l) => (
                            <div key={l} onClick={() => setEditLokasi(l)} className={`py-1 px-2 rounded-md cursor-pointer ${editLokasi === l ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`}>
                              {l}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <input id="lokasi" value={lokasi} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sumber Berita</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sumber-portal" className="text-xs text-gray-700">Portal</label>
                      {isEditing ? (
                        <input id="sumber-portal" value={editSrcPortal} onChange={(e) => setEditSrcPortal(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-portal" value={srcPortal} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div>
                      <label htmlFor="sumber-author" className="text-xs text-gray-700">Author</label>
                      {isEditing ? (
                        <input id="sumber-author" value={editSrcAuthor} onChange={(e) => setEditSrcAuthor(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-author" value={srcAuthor} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sumber-title" className="text-xs text-gray-700">Title</label>
                      {isEditing ? (
                        <input id="sumber-title" value={editSrcTitle} onChange={(e) => setEditSrcTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-title" value={srcTitle} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div>
                      <label htmlFor="sumber-type" className="text-xs text-gray-700">Type</label>
                      {isEditing ? (
                        <select id="sumber-type" value={editSrcType} onChange={(e) => setEditSrcType(e.target.value)} className="w-full border rounded-md px-3 py-2">
                          <option value="artikel">artikel</option>
                          <option value="video">video</option>
                          <option value="laporan">laporan</option>
                        </select>
                      ) : (
                        <select id="sumber-type" value={srcType} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50">
                          <option value="artikel">artikel</option>
                          <option value="video">video</option>
                          <option value="laporan">laporan</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label htmlFor="sumber-date" className="text-xs text-gray-700">Date Published</label>
                      {isEditing ? (
                        <input id="sumber-date" value={editSrcDatePublished} onChange={(e) => setEditSrcDatePublished(e.target.value)} placeholder="YYYY-MM-DDTHH:mm:ssZ" className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-date" value={srcDatePublished} disabled placeholder="YYYY-MM-DDTHH:mm:ssZ" className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sumber-url" className="text-xs text-gray-700">URL</label>
                      {isEditing ? (
                        <input id="sumber-url" value={editSrcUrl} onChange={(e) => setEditSrcUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-url" value={srcUrl} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sumber-img" className="text-xs text-gray-700">Image URL</label>
                      {isEditing ? (
                        <input id="sumber-img" value={editSrcImgUrl} onChange={(e) => setEditSrcImgUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-img" value={srcImgUrl} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Masukkan link website sumber (http/https atau domain saja).</div>
                </div>

                
              </div>

              {/* Right Column */}
              <div className="space-y-4">

                  <div>
                    <label htmlFor="jk" className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                    {isEditing ? (
                      <select id="jk" value={editJenisKelamin} onChange={(e) => setEditJenisKelamin(e.target.value)} className="w-full border rounded-md px-3 py-2">
                        <option value="">Pilih...</option>
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    ) : (
                      <select id="jk" value={jenisKelamin} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50">
                        <option value="">Pilih...</option>
                        <option>Laki-laki</option>
                        <option>Perempuan</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label htmlFor="keparahan" className="block text-sm font-medium text-gray-700 mb-2">Tingkat Keparahan</label>
                    {isEditing ? (
                      <select id="keparahan" value={editTingkatKeparahan} onChange={(e) => setEditTingkatKeparahan(e.target.value)} className="w-full border rounded-md px-3 py-2">
                        <option value="insiden">Insiden</option>
                        <option value="hospitalisasi">Hospitalisasi</option>
                        <option value="mortalitas">Mortalitas</option>
                      </select>
                    ) : (
                      <select id="keparahan" value={tingkatKeparahan} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50">
                        <option value="insiden">Insiden</option>
                        <option value="hospitalisasi">Hospitalisasi</option>
                        <option value="mortalitas">Mortalitas</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tingkat Kewaspadaan</label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2" role="radiogroup" aria-label="Tingkat Kewaspadaan">
                        {[1,2,3,4].map((n) => {
                          const emoji = n === 1 ? '🙂' : n === 2 ? '😐' : n === 3 ? '😟' : '😨';
                          return (
                            <button
                              key={n}
                              type="button"
                              onMouseEnter={() => setHoverKewaspadaan(n)}
                              onMouseLeave={() => setHoverKewaspadaan(null)}
                              onClick={() => { if (isEditing) { setKewaspadaan(n); setClickedKewaspadaan(n); setTimeout(() => setClickedKewaspadaan(null), 700); } }}
                              onKeyDown={(e) => handleStarKey(e, n)}
                              aria-pressed={kewaspadaan === n}
                              className={`text-2xl transition-transform ${kewaspadaan === n ? 'scale-125' : ''} ${hoverKewaspadaan === n ? 'scale-125' : ''} ${clickedKewaspadaan === n ? 'animate-pulse scale-150' : ''}`} 
                              title={`${n} dari 4`}
                              disabled={!isEditing}
                            >
                              <span className="text-2xl" aria-hidden>{emoji}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">{hoverKewaspadaan ?? kewaspadaan} / 4</span>
                        <span className="text-xs text-gray-400">1: biasa — 2: minimal — 3: bahaya — 4: katastropik</span>
                      </div>
                    </div>
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal (DD / MM / YYYY)</label>
                      <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <input value={editTanggal.dd} onChange={(e) => setEditTanggal({ ...editTanggal, dd: e.target.value })} placeholder="DD" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" />
                        <input value={editTanggal.mm} onChange={(e) => setEditTanggal({ ...editTanggal, mm: e.target.value })} placeholder="MM" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" />
                        <input value={editTanggal.yyyy} onChange={(e) => setEditTanggal({ ...editTanggal, yyyy: e.target.value })} placeholder="YYYY" maxLength={4} className="w-28 border rounded-md px-3 py-2" inputMode="numeric" />
                      </>
                    ) : (
                      <>
                        <input value={tanggal.dd} disabled placeholder="DD" className="w-20 border rounded-md px-3 py-2 bg-gray-50" />
                        <input value={tanggal.mm} disabled placeholder="MM" className="w-20 border rounded-md px-3 py-2 bg-gray-50" />
                        <input value={tanggal.yyyy} disabled placeholder="YYYY" className="w-28 border rounded-md px-3 py-2 bg-gray-50" />
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usia Penderita
                  </label>
                  {isEditing ? (
                    <input value={editUsia} onChange={(e) => setEditUsia(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                  ) : (
                    <input value={usia} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                  )}
                </div>

                <div>
                  <label htmlFor="ringkasan" className="block text-sm font-medium text-gray-700 mb-2">Ringkasan</label>
                  {isEditing ? (
                    <textarea id="ringkasan" value={editRingkasan} onChange={(e) => setEditRingkasan(e.target.value)} rows={6} className="w-full border rounded-md px-3 py-2 resize-none" maxLength={2000} />
                  ) : (
                    <textarea id="ringkasan" value={ringkasan} disabled rows={6} className="w-full border rounded-md px-3 py-2 resize-none bg-gray-50" maxLength={2000} />
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-400">Batas 2000 karakter.</div>
                    <div className="text-xs text-gray-500">{ringkasan.length}/2000</div>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 rounded-md bg-red-500 text-white hover:brightness-90"
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (isEditing) { handleEditSave(); setIsEditing(false); } }}
                    className={`px-4 py-2 rounded-md text-white hover:brightness-90 ${isEditing ? '' : 'opacity-60 cursor-not-allowed'}`}
                    style={{ background: BLUE }}
                    disabled={!isEditing}
                  >
                    {submitting ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {showEditModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-5 w-full max-w-lg">
            <h3 className="font-semibold mb-3 text-base">Edit Informasi (Minimal)</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditSave(e); }}>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-700 block mb-1">Jenis Penyakit</label>
                  <input value={editJenis} onChange={(e) => setEditJenis(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1">Lokasi</label>
                  <input value={editLokasi} onChange={(e) => setEditLokasi(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1">Tingkat Keparahan</label>
                  <select value={editTingkatKeparahan} onChange={(e) => setEditTingkatKeparahan(e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="insiden">Insiden</option>
                    <option value="hospitalisasi">Hospitalisasi</option>
                    <option value="mortalitas">Mortalitas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1">Usia</label>
                  <input value={editUsia} onChange={(e) => setEditUsia(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1">Ringkasan</label>
                  <textarea value={editRingkasan} onChange={(e) => setEditRingkasan(e.target.value)} rows={4} className="w-full border rounded-md px-3 py-2 resize-none" maxLength={2000} />
                </div>

                <div>
                  <label className="text-xs text-gray-700 block mb-1">Tingkat Kewaspadaan</label>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4].map((n) => {
                      const emoji = n === 1 ? '🙂' : n === 2 ? '😐' : n === 3 ? '😟' : '😨';
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEditKewaspadaan(n)}
                          className={`text-2xl ${editKewaspadaan === n ? 'scale-125' : ''}`}
                          title={`${n} dari 4`}
                        >
                          <span aria-hidden>{emoji}</span>
                        </button>
                      );
                    })}
                    <span className="text-xs text-gray-500">{editKewaspadaan} / 4</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
                <button data-testid="edit-save-btn" type="submit" className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <div className="flex items-start gap-3">
              <div className="text-3xl" aria-hidden>❓🤔</div>
              <div>
                <h3 className="text-lg font-semibold">Apakah Anda yakin ingin menghapus informasi penyakit ini?</h3>
                <p className="text-sm text-gray-500 mt-2">Tindakan ini tidak dapat dikembalikan.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button data-testid="delete-cancel-btn" type="button" onClick={cancelDelete} className="px-4 py-2 border rounded-md">Tidak</button>
              <button data-testid="delete-confirm-btn" type="button" onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-md">Iya</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}