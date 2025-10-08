"use client";

import React, { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BLUE = "#0069cf";

// exported pure validator for easier testing
export function validateFormState(input: {
  jenisPenyakit?: string;
  lokasi?: string;
  tanggal?: { dd?: string; mm?: string; yyyy?: string };
  sumberBerita?: string;
  usia?: string;
}) {
  const { jenisPenyakit = '', lokasi = '', tanggal = { dd: '', mm: '', yyyy: '' }, sumberBerita = '', usia = '' } = input;
  const next: Record<string, string> = {};

  if (!jenisPenyakit) next.jenisPenyakit = "Jenis penyakit wajib diisi.";
  if (!lokasi) next.lokasi = "Lokasi wajib diisi.";

  // simple date validation
  const dd = parseInt(tanggal.dd || "0", 10);
  const mm = parseInt(tanggal.mm || "0", 10);
  const yyyy = parseInt(tanggal.yyyy || "0", 10);
  if (tanggal.dd || tanggal.mm || tanggal.yyyy) {
    if (!(dd >= 1 && dd <= 31)) next.tanggal = "Format hari tidak valid (1-31).";
    if (!(mm >= 1 && mm <= 12)) next.tanggal = next.tanggal ? next.tanggal + " / Bulan tidak valid (1-12)." : "Format bulan tidak valid (1-12).";
    if (!(yyyy >= 1900 && yyyy <= 2100)) next.tanggal = next.tanggal ? next.tanggal + " / Tahun tidak valid." : "Format tahun tidak valid (1900-2100).";
  }

  if (sumberBerita) {
    // stricter url check: allow http(s):// or domain-like entries
    const maybeUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/.*)?$/.test(sumberBerita.trim());
    if (!maybeUrl) next.sumberBerita = "Masukkan sumber berita yang valid (contoh: https://bandung.kompas.com atau bandung.kompas.com).";
  }

  if (usia) {
    // usia must be a non-negative integer string (no signs or letters)
    if (!/^\d+$/.test(usia.trim())) next.usia = "Masukkan usia yang valid.";
  }

  return next;
}

export default function CuratorAddDataPage() {
  const [jenisPenyakit, setJenisPenyakit] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [sumberBerita, setSumberBerita] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [kewaspadaan, setKewaspadaan] = useState(0);
  const [tanggal, setTanggal] = useState({ dd: "", mm: "", yyyy: "" });
  const [usia, setUsia] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setJenisPenyakit("");
    setLokasi("");
    setSumberBerita("");
    setRingkasan("");
    setJenisKelamin("");
    setKewaspadaan(0);
    setTanggal({ dd: "", mm: "", yyyy: "" });
    setUsia("");
    setErrors({});
    setJenisSearch("");
    setLokasiSearch("");
  };

  // local lists (in real app this would come from API or shared store)
  const [jenisList, setJenisList] = useState<string[]>(["Demam Berdarah", "COVID-19", "Influenza", "Campak"]);
  const [lokasiList, setLokasiList] = useState<string[]>(["Jakarta", "Bandung", "Surabaya", "Yogyakarta"]);

  // search/filter states
  const [jenisSearch, setJenisSearch] = useState("");
  const [lokasiSearch, setLokasiSearch] = useState("");

  // modal states for adding new jenis/lokasi
  const [showAddJenisModal, setShowAddJenisModal] = useState(false);
  const [showAddLokasiModal, setShowAddLokasiModal] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [newLokasiName, setNewLokasiName] = useState("");

  // validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [hoverKewaspadaan, setHoverKewaspadaan] = useState<number | null>(null);
  const [clickedKewaspadaan, setClickedKewaspadaan] = useState<number | null>(null);

  const canSubmit = Boolean(jenisPenyakit && lokasi && !submitting);


  function validate() {
    const next = validateFormState({ jenisPenyakit, lokasi, tanggal, sumberBerita, usia });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // filtered lists
  const filteredJenis = useMemo(() => jenisList.filter((j) => j.toLowerCase().includes(jenisSearch.trim().toLowerCase())), [jenisList, jenisSearch]);
  const filteredLokasi = useMemo(() => lokasiList.filter((l) => l.toLowerCase().includes(lokasiSearch.trim().toLowerCase())), [lokasiList, lokasiSearch]);

  const addNewJenis = () => {
    if (!newJenisName.trim()) return;
    setJenisList((s) => [newJenisName.trim(), ...s]);
    setJenisPenyakit(newJenisName.trim());
    setNewJenisName("");
    setShowAddJenisModal(false);
  };

  const addNewLokasi = () => {
    if (!newLokasiName.trim()) return;
    setLokasiList((s) => [newLokasiName.trim(), ...s]);
    setLokasi(newLokasiName.trim());
    setNewLokasiName("");
    setShowAddLokasiModal(false);
  };

  const preSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = validate();
    if (!ok) {
      // collect messages
      const msgs = Object.entries(errors).map(([k,v]) => `${k}: ${v}`);
      // if validate() just ran, errors is set; but ensure we read latest
      const nextMsgs = Object.keys(errors).length ? Object.entries(errors).map(([k,v]) => `${k}: ${v}`) : [];
      setValidationMessages(nextMsgs.length ? nextMsgs : ["Terdapat kesalahan input, periksa kembali."]);
      setShowValidationModal(true);
      return;
    }
    handleApply(e);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        jenisPenyakit,
        lokasi,
        sumberBerita,
        ringkasan,
        jenisKelamin,
        kewaspadaan,
        tanggal,
        usia,
      };

      // TODO: replace with actual API call
      console.log("Kirim data kurator:", payload);

      setSuccessMessage("Data berhasil disimpan.");
      // keep success visible briefly
      setTimeout(() => setSuccessMessage("") , 4000);
      resetForm();
    } catch (err) {
      setErrors({ form: "Gagal mengirim data. Coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarKey = (e: React.KeyboardEvent<HTMLButtonElement>, n: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKewaspadaan(n);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f6f8]">
      <Navbar />

      <main className="pt-28 pb-36 flex justify-center">
        <div className="w-full max-w-6xl px-6">
          <div className="bg-white rounded-md shadow-md overflow-hidden border">
            <div className="bg-[#1e6fd6] text-white px-6 py-4 flex items-center justify-between">
              <h1 id="curator-add-title" className="text-lg font-semibold">Tambahkan Informasi Penyakit Menular</h1>
              <div className="text-sm opacity-90">Silakan isi data dengan informasi yang akurat</div>
            </div>

            <form aria-labelledby="curator-add-title" onSubmit={preSubmit} className="p-6" role="form">
              {errors.form && (
                <div className="mb-4 text-sm text-red-600">{errors.form}</div>
              )}
              {successMessage && (
                <div className="mb-4 text-sm text-green-700">{successMessage}</div>
              )}

              <p className="text-xs text-gray-500 mb-4">Kolom bertanda * wajib diisi. Periksa kembali sebelum menerapkan.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="jenisPenyakit" className="block text-sm font-medium text-gray-700 mb-2">Jenis Penyakit <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input id="jenisSearch" value={jenisSearch} onChange={(e) => setJenisSearch(e.target.value)} placeholder="Cari atau pilih..." className="flex-1 border rounded-md px-3 py-2" />
                      <button type="button" onClick={() => setShowAddJenisModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah baru</button>
                    </div>
                    <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                      {filteredJenis.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada hasil</div>
                      ) : (
                        filteredJenis.map((j) => (
                          <div key={j} className={`py-1 px-2 rounded-md cursor-pointer ${jenisPenyakit === j ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`} onClick={() => setJenisPenyakit(j)}>
                            {j}
                          </div>
                        ))
                      )}
                    </div>
                    {errors.jenisPenyakit && <div id="err-jenis" className="text-xs text-red-600 mt-1">{errors.jenisPenyakit}</div>}
                  </div>

                  <div>
                    <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-2">Lokasi <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input id="lokasiSearch" value={lokasiSearch} onChange={(e) => setLokasiSearch(e.target.value)} placeholder="Cari atau pilih lokasi..." className="flex-1 border rounded-md px-3 py-2" />
                      <button type="button" onClick={() => setShowAddLokasiModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah baru</button>
                    </div>
                    <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                      {filteredLokasi.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada hasil</div>
                      ) : (
                        filteredLokasi.map((l) => (
                          <div key={l} className={`py-1 px-2 rounded-md cursor-pointer ${lokasi === l ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`} onClick={() => setLokasi(l)}>
                            {l}
                          </div>
                        ))
                      )}
                    </div>
                    {errors.lokasi && <div id="err-lokasi" className="text-xs text-red-600 mt-1">{errors.lokasi}</div>}
                  </div>

                  <div>
                    <label htmlFor="sumber" className="block text-sm font-medium text-gray-700 mb-2">Sumber Berita</label>
                    <input
                      id="sumber"
                      value={sumberBerita}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSumberBerita(v);
                        // immediate validation for better UX
                        if (v) {
                          const maybeUrl = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/.*)?$/.test(v.trim());
                          if (!maybeUrl) setErrors((p) => ({ ...p, sumberBerita: "Masukkan sumber berita yang valid (contoh: https://bandung.kompas.com atau bandung.kompas.com)." }));
                          else setErrors((p) => { const np = { ...p }; delete np.sumberBerita; return np; });
                        } else {
                          setErrors((p) => { const np = { ...p }; delete np.sumberBerita; return np; });
                        }
                      }}
                      placeholder="E.g: https://bandung.kompas.com"
                      aria-describedby={errors.sumberBerita ? 'err-sumber' : 'help-sumber'}
                      className="w-full border rounded-md px-3 py-2"
                      maxLength={200}
                    />
                    <div id="help-sumber" className="text-xs text-gray-400 mt-1">Masukkan link website sumber (http/https atau domain saja).</div>
                    {errors.sumberBerita && <div id="err-sumber" className="text-xs text-red-600 mt-1">{errors.sumberBerita}</div>}
                  </div>

                  <div>
                    <label htmlFor="ringkasan" className="block text-sm font-medium text-gray-700 mb-2">Ringkasan</label>
                    <textarea id="ringkasan" value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} placeholder="Tulis ringkasan singkat..." rows={10} className="w-full border rounded-md px-3 py-2 resize-none" maxLength={2000} />
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-400">Batas 2000 karakter.</div>
                      <div className="text-xs text-gray-500">{ringkasan.length}/2000</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="jk" className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin</label>
                    <select id="jk" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="w-full border rounded-md px-3 py-2">
                      <option value="">Pilih...</option>
                      <option>Laki-laki</option>
                      <option>Perempuan</option>
                      <option>Lainnya / Tidak diketahui</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tingkat Kewaspadaan</label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2" role="radiogroup" aria-label="Tingkat Kewaspadaan">
                        {[0,1,2,3,4,5].map((n) => {
                          // emoji scale from calm to alarm
                          const emoji = n === 0 ? '⚪️' : n === 1 ? '🙂' : n === 2 ? '😐' : n === 3 ? '😟' : n === 4 ? '😨' : '🚨';
                          return (
                            <button
                              key={n}
                              type="button"
                              onMouseEnter={() => setHoverKewaspadaan(n)}
                              onMouseLeave={() => setHoverKewaspadaan(null)}
                              onClick={() => { setKewaspadaan(n); setClickedKewaspadaan(n); setTimeout(() => setClickedKewaspadaan(null), 700); }}
                              onKeyDown={(e) => handleStarKey(e, n)}
                              aria-pressed={kewaspadaan === n}
                              className={`text-2xl transition-transform ${kewaspadaan === n ? 'scale-125' : ''} ${hoverKewaspadaan === n ? 'scale-125' : ''} ${clickedKewaspadaan === n ? 'animate-pulse scale-150' : ''}`} 
                              title={`${n} dari 5`}
                            >
                              <span className="text-2xl" aria-hidden>{emoji}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">{hoverKewaspadaan ?? kewaspadaan} / 5</span>
                        <span className="text-xs text-gray-400">0: tidak perlu diwaspadai — 5: sangat perlu diwaspadai</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal (DD / MM / YYYY)</label>
                    <div className="flex gap-3">
                      <input value={tanggal.dd} onChange={(e) => setTanggal({ ...tanggal, dd: e.target.value })} placeholder="DD" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" aria-invalid={!!errors.tanggal} />
                      <input value={tanggal.mm} onChange={(e) => setTanggal({ ...tanggal, mm: e.target.value })} placeholder="MM" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" aria-invalid={!!errors.tanggal} />
                      <input value={tanggal.yyyy} onChange={(e) => setTanggal({ ...tanggal, yyyy: e.target.value })} placeholder="YYYY" maxLength={4} className="w-28 border rounded-md px-3 py-2" inputMode="numeric" aria-invalid={!!errors.tanggal} />
                    </div>
                    {errors.tanggal && <div className="text-xs text-red-600 mt-1">{errors.tanggal}</div>}
                  </div>

                  <div>
                    <label htmlFor="usia" className="block text-sm font-medium text-gray-700 mb-2">Usia Penderita</label>
                    <input id="usia" value={usia} onChange={(e) => setUsia(e.target.value)} placeholder="Type.." className="w-full border rounded-md px-3 py-2" inputMode="numeric" maxLength={6} />
                    {errors.usia && <div className="text-xs text-red-600 mt-1">{errors.usia}</div>}
                  </div>

                  <div className="flex justify-end items-center gap-4 mt-10">
                    <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md bg-white">Reset</button>
                    <button type="submit" style={{ background: BLUE }} className={`px-4 py-2 rounded-md text-white hover:brightness-90`}>
                      {submitting ? 'Menyimpan...' : 'Terapkan'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      {/* Modals */}
      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Jenis Penyakit Baru</h3>
            <input value={newJenisName} onChange={(e) => setNewJenisName(e.target.value)} placeholder="Nama penyakit" className="w-full border rounded-md px-3 py-2 mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddJenisModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={addNewJenis} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showAddLokasiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Lokasi Baru</h3>
            <input value={newLokasiName} onChange={(e) => setNewLokasiName(e.target.value)} placeholder="Nama lokasi" className="w-full border rounded-md px-3 py-2 mb-3" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddLokasiModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={addNewLokasi} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-2">Validasi Gagal</h3>
            <div className="text-sm text-gray-700 mb-4">Form belum dapat dikirim karena ada masalah pada field berikut:</div>
            <ul className="list-disc pl-5 text-sm text-red-600 mb-4">
              {validationMessages.map((m, idx) => <li key={idx}>{m}</li>)}
            </ul>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowValidationModal(false)} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Tutup</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
