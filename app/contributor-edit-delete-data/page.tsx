"use client";

import React, { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FancyDatePicker from "../components/FancyDatePicker";
import type { ContributorCasePayload, ContributorCaseRead } from "../../api/contributorEvents";
import { getContributorEvent, updateContributorEvent, deleteContributorEvent, HttpError } from "../../api/contributorEvents";
import type { User } from "@/types";


type AccessState = "loading" | "redirect" | "forbidden" | "granted";

const ALLOWED_ROLES = new Set(["CONTRIBUTOR"]);
/* istanbul ignore next */
const normalizeRole = (role?: string | null) => (role ? role.trim().toUpperCase() : "");

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

/* istanbul ignore next */
function ContributorEditDeleteDataPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [accessState, setAccessState] = useState<AccessState>("loading");

  useEffect(() => {
    // Attempt to recover persisted user data to avoid redirect flicker.
    let resolvedUser = user;
    if (!resolvedUser && typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("user");
        if (stored) {
          resolvedUser = JSON.parse(stored) as User;
        }
      } catch (error) {
        console.warn("Failed to parse stored user information", error);
      }
    }
    setEffectiveUser(resolvedUser ?? null);
    setIsCheckingAccess(false);
  }, [user]);

  useEffect(() => {
    if (isCheckingAccess) {
      return;
    }

    if (!effectiveUser) {
      setAccessState("redirect");
      return;
    }

    const role = normalizeRole(effectiveUser.role);
    if (!ALLOWED_ROLES.has(role)) {
      setAccessState("forbidden");
      return;
    }

    setAccessState("granted");
  }, [effectiveUser, isCheckingAccess]);

  useEffect(() => {
    if (accessState !== "redirect") {
      return;
    }

    const nextParam = encodeURIComponent("/contributor-event-reporting");
    router.replace(`/login?next=${nextParam}`);
  }, [accessState, router]);
  
  const [jenisPenyakit, setJenisPenyakit] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [sumberBerita, setSumberBerita] = useState("");
  const [ringkasan, setRingkasan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [tingkatKeparahan, setTingkatKeparahan] = useState("insiden");
  const [kewaspadaan, setKewaspadaan] = useState(1);
  const [kewaspadaanRaw, setKewaspadaanRaw] = useState<number>(kewaspadaan);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingKewaspadaan, setIsDraggingKewaspadaan] = useState(false);
  const [tanggal, setTanggal] = useState({ dd: "", mm: "", yyyy: "" });
  const [usia, setUsia] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverValidationRaw, setServerValidationRaw] = useState<string | null>(null);
  const [serverValidationMessages, setServerValidationMessages] = useState<string[] | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string>("");
  // transient result modal for success/failure when clicking Terapkan
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultStatus, setResultStatus] = useState<'success' | 'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [loadingSubmission, setLoadingSubmission] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [editingEnabled, setEditingEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [prefillData, setPrefillData] = useState<ContributorCaseRead | null>(null);

  // feedback inside add-jenis / add-lokasi modals
  const [addJenisFeedback, setAddJenisFeedback] = useState<{ status: 'success' | 'error'; msg: string } | null>(null);
  const [addLokasiFeedback, setAddLokasiFeedback] = useState<{ status: 'success' | 'error'; msg: string } | null>(null);
  const [diseasesRemoteAvailable, setDiseasesRemoteAvailable] = useState<boolean | null>(null);

  const mapStatusToLevel = (status?: string | null) => {
    const key = (status || "").toLowerCase();
    const map: Record<string, number> = { biasa: 1, minimal: 2, bahaya: 3, katastropik: 4 };
    return map[key] || 1;
  };

  const hydrateFromSubmission = useCallback((data: ContributorCaseRead) => {
    setPrefillData(data);
    setSubmissionState(data.state ?? null);
    setKewaspadaan(mapStatusToLevel(data.status));
    setTingkatKeparahan(data.severity || "insiden");
    const disease = data.disease_name || "";
    setJenisPenyakit(disease);
    setJenisSearch(disease);
    const city = data.location?.city || data.city || "";
    setLokasi(city);
    setLokasiSearch(city);
    const province = data.location?.province || "";
    setProvinsi(province);
    setUsia(typeof data.age === "number" ? String(data.age) : "");
    setJenisKelamin(data.gender || "");
    setRingkasan(data.news?.content || "");
    setSumberBerita(data.news?.url || "");

    const newsDate = data.news?.date_published ? new Date(data.news.date_published) : null;
    if (newsDate && !Number.isNaN(newsDate.getTime())) {
      const dd = String(newsDate.getUTCDate()).padStart(2, "0");
      const mm = String(newsDate.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = String(newsDate.getUTCFullYear());
      setTanggal({ dd, mm, yyyy });
      setSrcDateDd(dd);
      setSrcDateMm(mm);
      setSrcDateYyyy(yyyy);
      setSrcDatePublished(newsDate.toISOString());
    } else {
      setTanggal({ dd: "", mm: "", yyyy: "" });
      setSrcDateDd("");
      setSrcDateMm("");
      setSrcDateYyyy("");
      setSrcDatePublished(data.news?.date_published ? String(data.news.date_published) : "");
    }

    setSrcPortal(data.news?.portal || "");
    setSrcTitle(data.news?.title || "");
    setSrcType(data.news?.type || "artikel");
    setSrcContent(data.news?.content || "");
    setSrcUrl(data.news?.url || "");
    setSrcAuthor(data.news?.author || "");
    setSrcImgUrl(data.news?.img_url || "");
    setSelectedSumber(
      data.news
        ? {
            portal: data.news.portal || "",
            title: data.news.title || "",
            type: data.news.type || "",
            content: data.news.content || "",
            url: data.news.url || "",
            author: data.news.author || "",
            date_published: data.news.date_published || undefined,
            img_url: data.news.img_url || "",
          }
        : null
    );
  }, []);

  const resetForm = () => {
    if (prefillData) {
      hydrateFromSubmission(prefillData);
    } else {
      setJenisPenyakit("");
      setLokasi("");
      setProvinsi("");
      setSumberBerita("");
      setRingkasan("");
      setJenisKelamin("");
      setKewaspadaan(1);
      setTingkatKeparahan("");
      setTanggal({ dd: "", mm: "", yyyy: "" });
      setUsia("");
      setSelectedSumber(null);
      setSrcPortal("");
      setSrcTitle("");
      setSrcType("artikel");
      setSrcContent("");
      setSrcUrl("");
      setSrcAuthor("");
      setSrcDatePublished("");
      setSrcDateDd("");
      setSrcDateMm("");
      setSrcDateYyyy("");
      setSrcImgUrl("");
    }
    setErrors({});
    setJenisSearch(prefillData?.disease_name || "");
    setLokasiSearch(prefillData?.location?.city || "");
  };

  // local lists (in real app this would come from API or shared store)
  // initial disease list: union of existing and requested items, alphabetized
  const initialJenis = [
    "",
  ].map(s => s.trim());
  const uniqueJenis = Array.from(new Set(initialJenis.map(s => s)));
  uniqueJenis.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const [jenisList, setJenisList] = useState<string[]>(uniqueJenis);

  // initial lokasi list: union of existing and requested items, alphabetized
  const initialLokasi = [
    "Ambon","Baubau","Banda Aceh","Banjarmasin","Bandar Lampung","Bandung","Banjarbaru","Bantul","Batam","Bekasi","Bengkalis","Bengkulu","Biak","Bitung","Bima","Binjai","Bontang","Bogor","Cimahi","Cilegon","Curup","Denpasar","Dumai","Ende","Fakfak","Gianyar","Gorontalo","Gresik","Jakarta","Jakarta Barat","Jakarta Pusat","Jakarta Selatan","Jakarta Timur","Jakarta Utara","Jambi","Jayapura","Kotabumi","Kupang","Kendari","Langsa","Lhokseumawe","Limboto","Lubuklinggau","Madiun","Magelang","Makassar","Malang","Manado","Manokwari","Mamasa","Mamuju","Maumere","Manna","Marginal","Martapura","Masohi","Mataram","Maumere","Metro","Min","Muara Bungo","Nagoya","N/A","Palangka Raya","Palembang","Pangkalpinang","Pangkalan Bun","Palu","Pematangsiantar","Pekanbaru","Penapang","Parepare","Pasuruan","Pematangsiantar","Pontianak","Poso","Prabumulih","Raha","Salatiga","Samarinda","Sampit","Semarang","Serang","Sidoarjo","Singkawang","Sintang","Solo","Sragen","Surabaya","Tangerang","Tarakan","Ternate","Tidore","Toli-Toli","Tual","Tobelo","Tanjung Balai Karimun","Tanjung Pandan","Tanjung Selor","Tanjungpinang","Tilamuta","Tomohon","Trenggalek","Tuban","Us","Yogyakarta","Sungai Penuh","Balikpapan","Badung","Bakauheni","Magelang","Kupang","Malinau","Pangkalan Bun","Prabumulih","Pematangsiantar","Tilamuta","Manggar","Singkawang","Tilamuta","Tilamuta","Tilamuta","Tilamuta","Tilamuta","Tilamuta","Tilamuta","Tilamuta","Tilamuta"
  ].map(s => s.trim()).filter(Boolean);
  // The list above contained duplicates and some placeholders; we'll merge with a cleaned set from user's provided list.
  const userLokasi = [
    "Tidore","Samarinda","Cimahi","Makassar","Tanjung Pandan","Palu","Malinau","Curup","Sleman","Masohi","Biak","Bekasi","Bandar Lampung","Pekanbaru","Baubau","Pasuruan","Depok","Lhokseumawe","Poso","Jakarta Utara","Pontianak","Ternate","Bengkulu","Padang","Majene","Solo","Raha","Jakarta Timur","Denpasar","Tanjung Selor","Bandung","Pangkalpinang","Tomohon","Cilegon","Singkawang","Ambon","Manado","Banda Aceh","Bitung","Sampit","Jayapura","Tobelo","Bengkalis","Medan","Parepare","Sidoarjo","Fakfak","Banjarmasin","Manna","Balikpapan","Limboto","Prabumulih","Bontang","Tual","Palangka Raya","Tarakan","Bogor","Mamasa","Banjarbaru","Yogyakarta","Mataram","Kotabumi","Tanjung Balai Karimun","Maumere","Serang","Ende","Bima","Lubuklinggau","Semarang","Sungai Penuh","Martapura","Bukittinggi","Palopo","Muara Bungo","Magelang","Palembang","Batam","Surabaya","Tilamuta","Kupang","Jakarta Selatan","Merauke","Langsa","Jambi","Sintang","Jakarta Barat","Mamuju","Sorong","Yogyakarta","Salatiga","Manokwari","Binjai","Bantul","Gorontalo","Tangerang","Gianyar","Gresik","Sumbawa Besar","Pangkalan Bun","Kendari","Tanjungpinang","Metro","Malang","Jakarta Pusat","Manggar","Toli-Toli","Pematangsiantar","Badung","Dumai"
  ];
  // remove obvious placeholders or accidental short tokens introduced during paste
  const blacklist = new Set(['N/A', 'Min', 'Us', 'Marginal']);
  const mergedLokasiRaw = Array.from(new Set([...initialLokasi, ...userLokasi].map(s => s)));
  const mergedLokasi = mergedLokasiRaw
    .map(s => s.trim())
    .filter((s) => !!s && s.length > 2 && !blacklist.has(s))
    .sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const [lokasiList, setLokasiList] = useState<string[]>(mergedLokasi);

  // initial provinsi list (provinces of Indonesia) — simple set for selector
  const initialProvinsi = [
    'Aceh','Bali','Bangka Belitung','Banten','Bengkulu','Gorontalo','Jakarta','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur','Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah','Kalimantan Timur','Kalimantan Utara','Kepulauan Riau','Lampung','Maluku','Maluku Utara','Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat','Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara','Sulawesi Utara','Sumatera Barat','Sumatera Selatan','Sumatera Utara','Yogyakarta'
  ].map(s => s.trim()).filter(Boolean).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const [provinsiList, setProvinsiList] = useState<string[]>(initialProvinsi);

  // load disease and lokasi lists from backend on mount; fallback to local lists on error
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // dynamic import to avoid circular import at module load in tests
        const svc = await import('../../services/api');
        if (!mounted) return;
        try {
          const remoteDiseases = await svc.registryApi.getDiseases();
          setDiseasesRemoteAvailable(true);
          if (Array.isArray(remoteDiseases) && remoteDiseases.length > 0) {
            const dedup = Array.from(new Set([...remoteDiseases.map((s: any) => String(s).trim()), ...uniqueJenis]));
            dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
            setJenisList(dedup);
          }
        } catch (err: any) {
          // when service indicates endpoints are missing, mark remote as unavailable
          if (err && err.endpointNotFound) setDiseasesRemoteAvailable(false);
          // ignore, keep local list
        }
        try {
            const remoteLokasi = await svc.mapApi.getLocations();
          if (Array.isArray(remoteLokasi) && remoteLokasi.length > 0) {
            // remote locations may be objects; normalize to string names
            const names = remoteLokasi.map((x: any) => (typeof x === 'string' ? x : x.name || x.city || String(x))).filter(Boolean);
            const dedup = Array.from(new Set([...names, ...mergedLokasi]));
            dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
            setLokasiList(dedup);
          }
        } catch (err) {
          // ignore, keep local list
        }
          // try to merge remote provinces if mapApi exposes them (optional)
          try {
            // some map APIs may return provinces list at mapApi.getProvinces
            if (typeof (svc.mapApi as any).getProvinces === 'function') {
              const remoteProv = await (svc.mapApi as any).getProvinces();
              if (Array.isArray(remoteProv) && remoteProv.length > 0) {
                const names = remoteProv.map((x: any) => (typeof x === 'string' ? x : x.name || String(x))).filter(Boolean);
                const dedup = Array.from(new Set([...names, ...initialProvinsi]));
                dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
                setProvinsiList(dedup);
              }
            }
          } catch (e) {
            // ignore
          }
      } catch (e) {
        // dynamic import failed — keep local lists
      }
    })();
    return () => { mounted = false; };
  }, []);

  // search/filter states
  const [jenisSearch, setJenisSearch] = useState("");
  const [lokasiSearch, setLokasiSearch] = useState("");
  const [provinsiSearch, setProvinsiSearch] = useState("");

  const loadSubmission = useCallback(async () => {
    if (accessState !== "granted") return;
    const idFromParams = searchParams?.get("id") || "";
    setSubmissionId(idFromParams);
    if (!idFromParams) {
      setLoadError("ID data tidak ditemukan.");
      setLoadingSubmission(false);
      return;
    }

    setLoadingSubmission(true);
    setLoadError(null);
    try {
      const data = await getContributorEvent(idFromParams);
      hydrateFromSubmission(data as ContributorCaseRead);
      setEditingEnabled(false);
    } catch (err: any) {
      if (err instanceof HttpError && err.status === 404) {
        setLoadError("Data tidak ditemukan atau Anda tidak memiliki akses.");
      } else if (err instanceof HttpError && err.status === 403) {
        setLoadError("Anda tidak memiliki akses untuk melihat data ini.");
      } else {
        setLoadError("Gagal memuat data. Coba lagi.");
      }
    } finally {
      setLoadingSubmission(false);
    }
  }, [accessState, hydrateFromSubmission, searchParams]);

  // fetch existing submission by id (from ?id=UUID)
  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  // modal states for adding new jenis/lokasi
  const [showAddJenisModal, setShowAddJenisModal] = useState(false);
  const [showAddLokasiModal, setShowAddLokasiModal] = useState(false);
  const [showAddProvinsiModal, setShowAddProvinsiModal] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [newLokasiName, setNewLokasiName] = useState("");
  const [newProvinsiName, setNewProvinsiName] = useState("");
  const [newLokasiLat, setNewLokasiLat] = useState<string>("");
  const [newLokasiLng, setNewLokasiLng] = useState<string>("");
  const [addProvinsiFeedback, setAddProvinsiFeedback] = useState<{ status: 'success' | 'error'; msg: string } | null>(null);
  // modal state for adding structured sumber berita
  const [showAddSumberModal, setShowAddSumberModal] = useState(false);
  const [selectedSumber, setSelectedSumber] = useState<{
    portal?: string;
    title?: string;
    type?: string;
    content?: string;
    url?: string;
    author?: string;
    date_published?: string | null;
    img_url?: string | null;
  } | null>(null);
  const [srcPortal, setSrcPortal] = useState("");
  const [srcTitle, setSrcTitle] = useState("");
  const [srcType, setSrcType] = useState("artikel");
  const [srcContent, setSrcContent] = useState("");
  const [srcUrl, setSrcUrl] = useState("");
  const [srcAuthor, setSrcAuthor] = useState("");
  const [srcDatePublished, setSrcDatePublished] = useState("");
  const [srcDateDd, setSrcDateDd] = useState("");
  const [srcDateMm, setSrcDateMm] = useState("");
  const [srcDateYyyy, setSrcDateYyyy] = useState("");
  const sumberDateValue = useMemo(() => {
    if (srcDateYyyy && srcDateMm && srcDateDd) {
      return `${String(srcDateYyyy).padStart(4, '0')}-${String(srcDateMm).padStart(2, '0')}-${String(srcDateDd).padStart(2, '0')}`;
    }
    return "";
  }, [srcDateDd, srcDateMm, srcDateYyyy]);
  const [srcImgUrl, setSrcImgUrl] = useState("");

  // validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [hoverKewaspadaan, setHoverKewaspadaan] = useState<number | null>(null);
  const [clickedKewaspadaan, setClickedKewaspadaan] = useState<number | null>(null);

  useEffect(() => {
    setKewaspadaanRaw(kewaspadaan);
  }, [kewaspadaan]);
  // continuous raw value for smooth dragging (1..4) is declared earlier with other states.

  const todayIso = useMemo(() => new Date().toISOString().split("T")[0], []);

  const emojiFor = (n: number) => (n === 1 ? '🙂' : n === 2 ? '😐' : n === 3 ? '😟' : '😨');

  const isPending = (submissionState || "").toUpperCase() === "PENDING";
  const formLocked = !editingEnabled || !isPending;
  const statusLabel = (submissionState || "UNKNOWN").toUpperCase();
  const statusStyle = isPending
    ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
    : statusLabel === "APPROVED"
    ? "bg-green-100 text-green-800 border border-green-200"
    : "bg-red-100 text-red-800 border border-red-200";

  const handleSumberDateChange = (value: string) => {
    if (value && value > todayIso) {
      setErrors((prev) => ({ ...prev, 'sumber-date': "Tanggal terbit tidak boleh lebih dari hari ini." }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next['sumber-date'];
      return next;
    });
    if (!value) {
      setSrcDateDd("");
      setSrcDateMm("");
      setSrcDateYyyy("");
      setSrcDatePublished("");
      return;
    }
    const [yyyy, mm, dd] = value.split("-");
    setSrcDateDd(dd || "");
    setSrcDateMm(mm || "");
    setSrcDateYyyy(yyyy || "");
    const iso = new Date(`${value}T00:00:00Z`);
    setSrcDatePublished(!isNaN(iso.getTime()) ? iso.toISOString() : "");
  };

  const handleUsiaChange = (value: string) => {
    const numeric = value.replace(/\D/g, "").slice(0, 3);
    if (value && numeric !== value) {
      setErrors((prev) => ({ ...prev, usia: "Usia hanya boleh angka." }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.usia;
        return next;
      });
    }
    setUsia(numeric);
  };


  function validate() {
    const next = validateFormState({ jenisPenyakit, lokasi, tanggal, sumberBerita, usia });
    setErrors(next);
    // additional required checks for fields that are composed in the UI
    if (!ringkasan || !ringkasan.trim()) {
      next.ringkasan = "Ringkasan wajib diisi.";
    }
    // require provinsi and keparahan as well
    if (!provinsi || !provinsi.trim()) {
      next.provinsi = "Provinsi wajib diisi.";
    }
    if (!tingkatKeparahan || !tingkatKeparahan.trim()) {
      next.keparahan = "Tingkat keparahan wajib dipilih.";
    }
    // ensure a sumber is selected or a sumber URL/text was provided
    if (!(selectedSumber || (sumberBerita && sumberBerita.trim()))) {
      next.sumberBerita = next.sumberBerita || "Sumber berita wajib diisi.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // filtered lists
  const filteredJenis = useMemo(() => jenisList.filter((j) => j.toLowerCase().includes(jenisSearch.trim().toLowerCase())), [jenisList, jenisSearch]);
  const filteredLokasi = useMemo(() => lokasiList.filter((l) => l.toLowerCase().includes(lokasiSearch.trim().toLowerCase())), [lokasiList, lokasiSearch]);
  const filteredProvinsi = useMemo(() => provinsiList.filter((p) => p.toLowerCase().includes(provinsiSearch.trim().toLowerCase())), [provinsiList, provinsiSearch]);

  const addNewJenis = () => {
    const name = newJenisName.trim();
    if (!name) return;
    // case-insensitive duplicate check
    if (jenisList.some((j) => j.toLowerCase() === name.toLowerCase())) {
      setDuplicateWarning(`Jenis penyakit "${name}" sudah ada di daftar.`);
      return;
    }
    // try to create via backend; fall back to local add on failure
    (async () => {
      try {
        const svc = await import('../../services/api');
        const created = await svc.registryApi.createDisease(name);
        // use returned created object's name when available
        const createdName = created && (created.name || created.title || created.label) ? (created.name || created.title || created.label) : name;
        // merge into existing list immediately (no need to re-fetch)
        const dedup = Array.from(new Set([createdName, ...jenisList]));
        dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setJenisList(dedup);
        setJenisPenyakit(createdName);
        setAddJenisFeedback({ status: 'success', msg: `Jenis "${createdName}" berhasil ditambahkan.` });
        setTimeout(() => { setAddJenisFeedback(null); setNewJenisName(""); setShowAddJenisModal(false); }, 800);
      } catch (err: any) {
        // if endpoint missing, surface an explicit error but still add locally
        const isEndpointNotFound = err && err.endpointNotFound;
        const next = Array.from(new Set([name, ...jenisList]));
        next.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setJenisList(next);
        setJenisPenyakit(name);
        if (isEndpointNotFound) {
          setAddJenisFeedback({ status: 'error', msg: `Jenis "${name}" ditambahkan secara lokal — backend registry tidak tersedia.` });
        } else {
          setAddJenisFeedback({ status: 'success', msg: `Jenis "${name}" berhasil ditambahkan (local).` });
        }
        setTimeout(() => { setAddJenisFeedback(null); setNewJenisName(""); setShowAddJenisModal(false); }, 1600);
      }
    })();
  };

  const addNewLokasi = () => {
    const name = newLokasiName.trim();
    if (!name) return;
    if (lokasiList.some((l) => l.toLowerCase() === name.toLowerCase())) {
      setDuplicateWarning(`Lokasi "${name}" sudah ada di daftar.`);
      return;
    }
    (async () => {
      try {
        const svc = await import('../../services/api');
        // parse optional lat/lng
        const lat = newLokasiLat ? Number(newLokasiLat) : undefined;
        const lng = newLokasiLng ? Number(newLokasiLng) : undefined;
        // validate numeric when provided
        if (newLokasiLat && Number.isNaN(lat)) throw new Error('Latitude tidak valid');
        if (newLokasiLng && Number.isNaN(lng)) throw new Error('Longitude tidak valid');
        const created = await svc.registryApi.createLocation(name, lat, lng);
        // backend might return created object or a simple name; normalize
        const createdName = created && (created.name || created.city || created.label) ? (created.name || created.city || created.label) : (typeof created === 'string' ? created : name);
        const dedup = Array.from(new Set([createdName, ...lokasiList]));
        dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setLokasiList(dedup);
        setLokasi(createdName);
        setAddLokasiFeedback({ status: 'success', msg: `Lokasi "${createdName}" berhasil ditambahkan.` });
  setTimeout(() => { setAddLokasiFeedback(null); setNewLokasiName(""); setNewLokasiLat(""); setNewLokasiLng(""); setShowAddLokasiModal(false); }, 800);
      } catch (err: any) {
        const isEndpointNotFound = err && err.endpointNotFound;
        // fallback local add
        const next = Array.from(new Set([name, ...lokasiList]));
        next.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setLokasiList(next);
        setLokasi(name);
        if (isEndpointNotFound) {
          setAddLokasiFeedback({ status: 'error', msg: `Lokasi "${name}" ditambahkan secara lokal — backend lokasi tidak tersedia.` });
        } else {
          setAddLokasiFeedback({ status: 'success', msg: `Lokasi "${name}" berhasil ditambahkan (local).` });
        }
  setTimeout(() => { setAddLokasiFeedback(null); setNewLokasiName(""); setNewLokasiLat(""); setNewLokasiLng(""); setShowAddLokasiModal(false); }, 1600);
      }
    })();
  };

  const addNewProvinsi = () => {
    const name = newProvinsiName.trim();
    if (!name) return;
    if (provinsiList.some((p) => p.toLowerCase() === name.toLowerCase())) {
      setDuplicateWarning(`Provinsi "${name}" sudah ada di daftar.`);
      return;
    }
    (async () => {
      try {
        const svc = await import('../../services/api');
        // attempt to create via registry if available (many backends won't have province create)
        if (svc.registryApi && typeof (svc.registryApi as any).createProvince === 'function') {
          const created = await (svc.registryApi as any).createProvince(name);
          const createdName = created && (created.name || created.label) ? (created.name || created.label) : name;
          const dedup = Array.from(new Set([createdName, ...provinsiList]));
          dedup.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          setProvinsiList(dedup);
          setProvinsi(createdName);
          setAddProvinsiFeedback({ status: 'success', msg: `Provinsi "${createdName}" berhasil ditambahkan.` });
          setTimeout(() => { setAddProvinsiFeedback(null); setNewProvinsiName(""); setShowAddProvinsiModal(false); }, 800);
        } else {
          // no create endpoint; fallback local
          throw Object.assign(new Error('No endpoint'), { endpointNotFound: true });
        }
      } catch (err: any) {
        const isEndpointNotFound = err && err.endpointNotFound;
        const next = Array.from(new Set([name, ...provinsiList]));
        next.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setProvinsiList(next);
        setProvinsi(name);
        if (isEndpointNotFound) {
          setAddProvinsiFeedback({ status: 'error', msg: `Provinsi "${name}" ditambahkan secara lokal — backend tidak tersedia.` });
        } else {
          setAddProvinsiFeedback({ status: 'success', msg: `Provinsi "${name}" berhasil ditambahkan (local).` });
        }
        setTimeout(() => { setAddProvinsiFeedback(null); setNewProvinsiName(""); setShowAddProvinsiModal(false); }, 1600);
      }
    })();
  };

  const preSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formLocked) {
      setErrors({ form: isPending ? "Klik tombol Edit terlebih dahulu untuk mulai mengubah data." : "Data hanya bisa diubah ketika status masih PENDING." });
      return;
    }
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

  const toggleEditMode = () => {
    if (!isPending) {
      setErrors({ form: "Data hanya bisa diedit ketika status masih PENDING." });
      return;
    }
    setErrors({});
    if (!editingEnabled && prefillData) {
      hydrateFromSubmission(prefillData);
    }
    setEditingEnabled((prev) => !prev);
  };

  /* istanbul ignore next */
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLocked) {
      setErrors({ form: isPending ? "Klik tombol Edit terlebih dahulu untuk mulai mengubah data." : "Data sudah diproses dan tidak dapat diedit." });
      return;
    }
    if (!submissionId) {
      setErrors({ form: "ID data tidak ditemukan." });
      return;
    }
    setSuccessMessage("");
    setServerValidationMessages(null);
    setServerValidationRaw(null);
    setErrors({});
    if (!validate()) return;

    setSubmitting(true);
    try {
      const STATUS_MAP: Record<number, string> = { 1: "biasa", 2: "minimal", 3: "bahaya", 4: "katastropik" };
      const computedContent = (srcContent && srcContent.trim()) || (ringkasan && ringkasan.trim()) || (selectedSumber && selectedSumber.content && String(selectedSumber.content).trim()) || "Konten singkat tidak tersedia.";

      const assembledDatePublished = (function () {
        const raw = (srcDatePublished || "").trim();
        if (raw) return raw;
        const dd = (srcDateDd || "").trim();
        const mm = (srcDateMm || "").trim();
        const yyyy = (srcDateYyyy || "").trim();
        if (dd && mm && yyyy && dd.length <= 2 && mm.length <= 2 && yyyy.length === 4) {
          const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0));
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return null;
      })();

      const resolvedUrl = (srcUrl || sumberBerita || selectedSumber?.url || "").trim();
      const resolvedPortal = (srcPortal || selectedSumber?.portal || "").trim() || "Unknown";
      const resolvedTitle = (srcTitle || selectedSumber?.title || ringkasan || "").trim() || "Berita";
      const resolvedType = (srcType || selectedSumber?.type || "artikel").trim() || "artikel";
      const resolvedAuthor = (srcAuthor || selectedSumber?.author || "").trim() || "Unknown";
      const resolvedImg = (srcImgUrl || selectedSumber?.img_url || "").trim();

      const news = {
        portal: resolvedPortal,
        title: resolvedTitle,
        type: resolvedType,
        content: String(computedContent),
        url: resolvedUrl,
        author: resolvedAuthor,
        date_published: assembledDatePublished || selectedSumber?.date_published || new Date().toISOString(),
        img_url: resolvedImg,
      };

      const cleanCity = (lokasi || "").trim();
      const cleanProvince = (provinsi || "").trim();
      const rawAge = usia && usia.trim() ? parseInt(usia.trim(), 10) : undefined;
      const age = typeof rawAge === "number" && !Number.isNaN(rawAge) ? rawAge : undefined;
      const locationPayload: { city: string; province?: string } = { city: cleanCity };
      if (cleanProvince) locationPayload.province = cleanProvince;

      const payload: ContributorCasePayload = {
        disease: (jenisPenyakit || "").trim(),
        gender: jenisKelamin || undefined,
        age,
        city: cleanCity || undefined,
        status: STATUS_MAP[kewaspadaan] || "biasa",
        severity: tingkatKeparahan,
        location: locationPayload,
        news,
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const injectedApi = typeof window !== "undefined" ? (window as any).__TEST_INJECT_API__ : undefined;
      const updateFn = injectedApi?.updateContributorEvent || updateContributorEvent;

      let updated: ContributorCaseRead | undefined;
      // eslint-disable-next-line no-console
      console.log("Perbarui data kontributor:", payload);
      // eslint-disable-next-line no-console
      console.debug("Updating contributor event payload:", payload);

      if (typeof updateFn === "function") {
        updated = await updateFn(submissionId, payload as any);
      } else if (process.env.NODE_ENV === "test") {
        await Promise.resolve();
      } else {
        await Promise.resolve();
      }

      if (updated) {
        hydrateFromSubmission(updated);
      } else {
        try {
          const refreshed = await getContributorEvent(submissionId);
          hydrateFromSubmission(refreshed as ContributorCaseRead);
        } catch {
          // ignore refresh failure
        }
      }

      setSuccessMessage("Data berhasil diperbarui.");
      setResultStatus("success");
      setResultMessage("Berhasil");
      setShowResultModal(true);
      setEditingEnabled(false);
      setTimeout(() => setShowResultModal(false), 1500);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      const status = err && typeof err === "object" && "status" in err ? (err as any).status : null;
      const detail = err && typeof err === "object" && "detail" in err ? (err as any).detail : err;

      if (status === 401) {
        const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname + window.location.search) : "";
        if (next) window.location.href = `/login?next=${next}`;
        return;
      }
      if (status === 403) {
        setErrors({ form: "Akses Ditolak: Anda tidak dapat mengubah data ini." });
        return;
      }
      if (status === 400) {
        try {
          try {
            setServerValidationRaw(JSON.stringify(detail, null, 2));
          } catch {
            setServerValidationRaw(String(detail));
          }
          const messages: string[] = [];
          if (detail && typeof detail === "object") {
            const nextErrs: Record<string, string> = {};
            const friendlyMap: Record<string, string> = { gender: "Jenis Kelamin", news: "Sumber Berita" };
            const walk = (obj: any, path: string | null = null) => {
              if (Array.isArray(obj)) {
                const joined = obj.join(" / ");
                if (path) {
                  const top = path.split(".")[0];
                  if (top === "news") {
                    nextErrs["sumberBerita"] = nextErrs["sumberBerita"] ? nextErrs["sumberBerita"] + " / " + joined : joined;
                  } else {
                    nextErrs[top] = joined;
                  }
                  const first = path.split(".")[0];
                  const rest = path.indexOf(".") > -1 ? path.substring(path.indexOf(".") + 1) : "";
                  const label = friendlyMap[first] ? `${friendlyMap[first]}${rest ? `: ${rest}` : ""}` : path;
                  messages.push(`${label}: ${joined}`);
                } else {
                  messages.push(String(joined));
                }
                return;
              }
              if (obj && typeof obj === "object") {
                for (const k of Object.keys(obj)) {
                  walk(obj[k], path ? `${path}.${k}` : k);
                }
                return;
              }
              const val = String(obj);
              if (path) {
                const first = path.split(".")[0];
                const rest = path.indexOf(".") > -1 ? path.substring(path.indexOf(".") + 1) : "";
                if (first === "news") {
                  nextErrs["sumberBerita"] = nextErrs["sumberBerita"] ? nextErrs["sumberBerita"] + " / " + val : val;
                } else {
                  nextErrs[first] = val;
                }
                const label = friendlyMap[first] ? `${friendlyMap[first]}${rest ? `: ${rest}` : ""}` : path;
                messages.push(`${label}: ${val}`);
              } else {
                messages.push(val);
              }
            };
            walk(detail);
            setErrors(nextErrs);
          } else if (detail) {
            messages.push(String(detail));
            setErrors({ form: String(detail) });
          } else {
            messages.push("Validasi server gagal. Periksa input.");
            setErrors({ form: "Validasi server gagal. Periksa input." });
          }
          setServerValidationMessages(messages);
        } catch {
          setErrors({ form: "Validasi server gagal. Periksa input." });
        }
        return;
      }

      setErrors({ form: "Gagal mengirim data. Coba lagi." });
      setResultStatus("error");
      setResultMessage("Gagal");
      setShowResultModal(true);
      setTimeout(() => setShowResultModal(false), 1500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!submissionId) {
      setErrors({ form: "ID data tidak ditemukan." });
      return;
    }
    if (!isPending) {
      setErrors({ form: "Data hanya dapat dihapus ketika status masih PENDING." });
      setShowDeleteConfirm(false);
      return;
    }
    setDeleting(true);
    try {
      await deleteContributorEvent(submissionId);
      setShowDeleteConfirm(false);
      setResultStatus("success");
      setResultMessage("Data dihapus");
      setShowResultModal(true);
      setTimeout(() => setShowResultModal(false), 1200);
      router.push("/contribution-management");
    } catch (err: any) {
      const status = err && typeof err === "object" && "status" in err ? (err as any).status : null;
      if (status === 401) {
        const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname + window.location.search) : "";
        if (next) window.location.href = `/login?next=${next}`;
        return;
      }
      if (status === 403) {
        setErrors({ form: "Anda tidak dapat menghapus data ini." });
        return;
      }
      setErrors({ form: "Gagal menghapus data. Coba lagi." });
    } finally {
      setDeleting(false);
    }
  };

  const handleStarKey = (e: React.KeyboardEvent<HTMLButtonElement>, n: number) => {
    /* istanbul ignore next */
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setKewaspadaan(n);
    }
  }

  if (accessState === "redirect") {
    return null; // redirect in progress
  }

  if (accessState === "loading") {
    return (
      <div className="min-h-screen bg-[#f0f6f8]">
        <Navbar />
        <main className="pt-28 pb-28 flex justify-center">
          <div className="text-sm text-gray-600">Memeriksa akses...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (accessState === "forbidden") {
    return (
      <div className="min-h-screen bg-[#f0f6f8]">
        <Navbar />
        <AccessDeniedNotice />
        <Footer />
      </div>
    );
  }

  if (loadingSubmission) {
    return (
      <div className="min-h-screen bg-[#f0f6f8]">
        <Navbar />
        <main className="pt-28 pb-28 flex justify-center">
          <div className="text-sm text-gray-600">Memuat data...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f0f6f8]">
        <Navbar />
        <main className="pt-28 pb-28 flex justify-center px-6">
          <div className="bg-white border rounded-md shadow-md p-6 max-w-xl w-full">
            <div className="text-sm text-red-700 mb-3">{loadError}</div>
            <div className="flex gap-3">
              <button onClick={loadSubmission} className="px-4 py-2 bg-[#0069cf] text-white rounded-md">Muat ulang</button>
              <button onClick={() => router.back()} className="px-4 py-2 border rounded-md">Kembali</button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f6f8]">
      <Navbar />

      <main className="pt-28 pb-36 flex justify-center">
        <div className="w-full max-w-6xl px-6">
          <div className="bg-white rounded-md shadow-md overflow-hidden border">
            <div className="bg-[#1e6fd6] text-white px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 id="contributor-event-reporting-title" className="text-lg font-semibold">Edit / Hapus Data Kontributor</h1>
                <div className="text-sm opacity-90">Perbarui data yang sudah dikirim selama status masih PENDING.</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full ${statusStyle}`}>Status: {statusLabel}</span>
                <button
                  type="button"
                  onClick={toggleEditMode}
                  className="px-3 py-2 rounded-md border bg-white text-[#1e6fd6] disabled:opacity-60"
                  disabled={!isPending}
                >
                  {editingEnabled ? "Mode edit aktif" : "Edit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-md border border-red-200 text-red-700 bg-white disabled:opacity-60"
                  disabled={!isPending}
                >
                  Hapus
                </button>
              </div>
            </div>

            <form aria-labelledby="contributor-event-reporting-title" onSubmit={preSubmit} className="p-6" role="form">
              {errors.form && (
                <div className="mb-4 text-sm text-red-600">{errors.form}</div>
              )}
              {successMessage && (
                <div className="mb-4 text-sm text-green-700">{successMessage}</div>
              )}
              {serverValidationMessages && serverValidationMessages.length > 0 ? (
                <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                  <div className="text-sm text-yellow-800 font-semibold">Validasi server menemukan masalah:</div>
                  <ul className="list-disc pl-5 text-sm text-yellow-800 mt-2">
                    {serverValidationMessages.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                  <div className="mt-2">
                    <button onClick={() => { setServerValidationMessages(null); setServerValidationRaw(null); }} className="text-xs text-yellow-800 underline">Tutup</button>
                  </div>
                </div>
              ) : serverValidationRaw ? (
                <pre className="mb-4 p-3 bg-gray-50 text-xs text-red-700 overflow-auto">{serverValidationRaw}</pre>
              ) : null}

              <div className="relative">
                {formLocked && (
                  <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center text-sm text-gray-700 text-center px-6">
                    {isPending ? "Klik tombol Edit untuk mulai mengubah data." : "Data hanya bisa diubah ketika status masih PENDING."}
                  </div>
                )}
                <div className={formLocked ? "pointer-events-none opacity-60" : ""}>
                  <p className="text-xs text-gray-500 mb-4">Kolom bertanda * wajib diisi. Periksa kembali sebelum menerapkan.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="jenisPenyakit" className="block text-sm font-medium text-gray-700 mb-2">Jenis Penyakit <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <input id="jenisSearch" value={jenisSearch} onChange={(e) => setJenisSearch(e.target.value)} placeholder="Cari atau pilih..." className="flex-1 border rounded-md px-3 py-2" required />
                          <button type="button" onClick={() => setShowAddJenisModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah baru</button>
                        </div>
                        <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                          {filteredJenis.length === 0 ? (
                            <div className="text-xs text-gray-500">Tidak ada hasil</div>
                          ) : (
                            filteredJenis.map((j) => (
                              <div key={j} className={`py-1 px-2 rounded-md cursor-pointer ${jenisPenyakit === j ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`} onClick={() => { setJenisPenyakit(j); setJenisSearch(j); }}>
                                {j}
                              </div>
                            ))
                          )}
                        </div>
                        {diseasesRemoteAvailable === false && (
                          <div className="text-xs text-yellow-700 mt-2">Catatan: layanan registri penyakit tidak tersedia — penambahan baru hanya disimpan secara lokal.</div>
                        )}
                        {errors.jenisPenyakit && <div id="err-jenis" className="text-xs text-red-600 mt-1">{errors.jenisPenyakit}</div>}
                      </div>

                  <div>
                    <label htmlFor="keparahan" className="block text-sm font-medium text-gray-700 mb-2">Tingkat Keparahan <span className="text-red-500">*</span></label>
                    <select id="keparahan" value={tingkatKeparahan} onChange={(e) => setTingkatKeparahan(e.target.value)} className="w-full border rounded-md px-3 py-2" required>
                      <option value="insiden">Insiden</option>
                      <option value="hospitalisasi">Hospitalisasi</option>
                      <option value="mortalitas">Mortalitas</option>
                    </select>
                    {errors.keparahan && <div className="text-xs text-red-600 mt-1">{errors.keparahan}</div>}
                  </div>

                  <div>
                    <label htmlFor="lokasi" className="block text-sm font-medium text-gray-700 mb-2">Lokasi <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input id="lokasiSearch" value={lokasiSearch} onChange={(e) => setLokasiSearch(e.target.value)} placeholder="Cari atau pilih lokasi..." className="flex-1 border rounded-md px-3 py-2" required />
                      <button type="button" onClick={() => setShowAddLokasiModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah baru</button>
                    </div>
                    <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                      {filteredLokasi.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada hasil</div>
                      ) : (
                        filteredLokasi.map((l) => (
                          <div key={l} className={`py-1 px-2 rounded-md cursor-pointer ${lokasi === l ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`} onClick={() => { setLokasi(l); setLokasiSearch(l); }}>
                            {l}
                          </div>
                        ))
                      )}
                    </div>
                    {errors.lokasi && <div id="err-lokasi" className="text-xs text-red-600 mt-1">{errors.lokasi}</div>}
                  </div>

                  <div>
                    <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700 mb-2">Provinsi <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input id="provinsiSearch" value={typeof provinsiSearch !== 'undefined' ? provinsiSearch : ''} onChange={(e) => setProvinsiSearch(e.target.value)} placeholder="Cari atau pilih provinsi..." className="flex-1 border rounded-md px-3 py-2" required />
                      <button type="button" onClick={() => setShowAddProvinsiModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah baru</button>
                    </div>
                    <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                      {filteredProvinsi.length === 0 ? (
                        <div className="text-xs text-gray-500">Tidak ada hasil</div>
                      ) : (
                        filteredProvinsi.map((p) => (
                          <div key={p} className={`py-1 px-2 rounded-md cursor-pointer ${provinsi === p ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`} onClick={() => { setProvinsi(p); setProvinsiSearch(p); }}>
                            {p}
                          </div>
                        ))
                      )}
                    </div>
                    {errors.provinsi && <div className="text-xs text-red-600 mt-1">{errors.provinsi}</div>}
                  </div>

                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="jk" className="block text-sm font-medium text-gray-700 mb-2">Jenis Kelamin <span className="text-red-500">*</span></label>
                    <select id="jk" value={jenisKelamin} onChange={(e) => setJenisKelamin(e.target.value)} className="w-full border rounded-md px-3 py-2" required>
                      <option value="">Pilih...</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                      <option value="other">Lainnya / Tidak diketahui</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">Tingkat Kewaspadaan <span className="text-red-500">*</span></label>
                    {/* 4-section draggable slider: green, yellow, orange, red */}
                    <div className="w-full" role="group" aria-label="Tingkat Kewaspadaan">
                      <div
                        className="relative select-none"
                        style={{ height: 56 }}
                        onKeyDown={(e) => {
                          // keyboard support: left/right to change value
                          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            setKewaspadaan((v) => Math.max(1, (v || 1) - 1));
                            setClickedKewaspadaan(kewaspadaan);
                            setTimeout(() => setClickedKewaspadaan(null), 400);
                          }
                          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                            e.preventDefault();
                            setKewaspadaan((v) => Math.min(4, (v || 1) + 1));
                            setClickedKewaspadaan(kewaspadaan);
                            setTimeout(() => setClickedKewaspadaan(null), 400);
                          }
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-full max-w-full rounded-md overflow-hidden bg-gray-200"
                            style={{ height: 12 }}
                            // allow pointer interaction anywhere on the track so the dot can be placed continuously
                            onPointerDown={(e) => {
                              (e.target as Element).setPointerCapture?.(e.pointerId);
                              setIsDraggingKewaspadaan(true);
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              if (rect) {
                                const rel = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                                const pct = rel / rect.width;
                                const v = 1 + pct * 3;
                                setKewaspadaanRaw(v);
                                // conservative deadzone: only change hover emoji when pointer is within 20% of the segment center
                                const approxSeg = Math.round(v);
                                const centerPct = (approxSeg - 0.5) / 4;
                                const distanceToCenter = Math.abs(pct - centerPct);
                                if (distanceToCenter < 0.2) {
                                  setHoverKewaspadaan(approxSeg);
                                } else {
                                  setHoverKewaspadaan(null);
                                }
                              }
                            }}
                            onPointerMove={(e) => {
                              if (!isDraggingKewaspadaan) return;
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              if (rect) {
                                const rel = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                                const pct = rel / rect.width;
                                const v = 1 + pct * 3;
                                setKewaspadaanRaw(v);
                                const approxSeg = Math.round(v);
                                const centerPct = (approxSeg - 0.5) / 4;
                                const distanceToCenter = Math.abs(pct - centerPct);
                                if (distanceToCenter < 0.2) {
                                  setHoverKewaspadaan(approxSeg);
                                } else {
                                  setHoverKewaspadaan(null);
                                }
                              }
                            }}
                            onPointerUp={(e) => {
                              try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
                              setIsDraggingKewaspadaan(false);
                              // compute pointer position to snap to the segment under the pointer
                              const rect2 = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const rel2 = Math.min(Math.max(0, e.clientX - rect2.left), rect2.width);
                              const pct2 = rect2.width ? rel2 / rect2.width : 0;
                              const snappedSeg = Math.min(4, Math.max(1, Math.floor(pct2 * 4) + 1));
                              // set integer value for submission but KEEP visual raw value where pointer was released
                              setKewaspadaan(snappedSeg);
                              setClickedKewaspadaan(snappedSeg);
                              setTimeout(() => setClickedKewaspadaan(null), 400);
                            }}
                          >
                            <div className="h-full flex">
                              <div className="flex-1" style={{ background: '#2ecc71' }} onMouseEnter={() => setHoverKewaspadaan(1)} onMouseLeave={() => setHoverKewaspadaan(null)} />
                              <div className="flex-1" style={{ background: '#f6c343' }} onMouseEnter={() => setHoverKewaspadaan(2)} onMouseLeave={() => setHoverKewaspadaan(null)} />
                              <div className="flex-1" style={{ background: '#f39c12' }} onMouseEnter={() => setHoverKewaspadaan(3)} onMouseLeave={() => setHoverKewaspadaan(null)} />
                              <div className="flex-1" style={{ background: '#e74c3c' }} onMouseEnter={() => setHoverKewaspadaan(4)} onMouseLeave={() => setHoverKewaspadaan(null)} />
                            </div>
                          </div>

                          {/* Status counter above-right of the strip */}
                          <div className="absolute right-3 -top-8 text-sm text-gray-500 pr-3">{hoverKewaspadaan ?? kewaspadaan} / 4</div>

                          {/* Labels centered under each color section (tighter spacing) */}
                          <div className="absolute left-0 right-0 top-full mt-0 -translate-y-2 flex items-center justify-between max-w-full px-0" style={{ width: '100%' }} aria-hidden>
                            <div className="w-1/4 text-center text-xs text-gray-500">Biasa</div>
                            <div className="w-1/4 text-center text-xs text-gray-500">Minimal</div>
                            <div className="w-1/4 text-center text-xs text-gray-500">Bahaya</div>
                            <div className="w-1/4 text-center text-xs text-gray-500">Katastropik</div>
                          </div>
                        </div>

                        {/* Draggable dot + emoji (standalone, no <input>) */}
                        <div ref={trackRef} className="absolute inset-0 flex items-center justify-center">
                          {/* positioned relative container for the dot */}
                          <div style={{ position: 'absolute', left: `${((kewaspadaanRaw - 1) / 3) * 100}%` }} className="transform -translate-x-1/2">
                            <div className="relative flex items-center justify-center">
                              <span className={`absolute -top-9 text-2xl ${clickedKewaspadaan ? 'scale-125' : ''}`}>{emojiFor(hoverKewaspadaan ?? kewaspadaan)}</span>
                              <button
                                type="button"
                                aria-label="Geser tingkat kewaspadaan"
                                onPointerDown={(e) => {
                                  (e.target as Element).setPointerCapture?.(e.pointerId);
                                  setIsDraggingKewaspadaan(true);
                                  const rect = trackRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    const rel = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                                    const pct = rel / rect.width;
                                    const v = 1 + pct * 3;
                                    setKewaspadaanRaw(v);
                                    const seg = Math.min(4, Math.max(1, Math.round(v)));
                                    setHoverKewaspadaan(seg);
                                  }
                                }}
                                onPointerMove={(e) => {
                                  if (!isDraggingKewaspadaan) return;
                                  const rect = trackRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    const rel = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                                    const pct = rel / rect.width;
                                    const v = 1 + pct * 3;
                                    setKewaspadaanRaw(v);
                                    setHoverKewaspadaan(Math.min(4, Math.max(1, Math.round(v))));
                                  }
                                }}
                                onPointerUp={(e) => {
                                  try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
                                  setIsDraggingKewaspadaan(false);
                                  const rect = trackRef.current?.getBoundingClientRect();
                                  if (rect) {
                                    const rel = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
                                    const pct = rect.width ? rel / rect.width : 0;
                                    const v2 = 1 + pct * 3;
                                    const snappedSeg = Math.min(4, Math.max(1, Math.round(v2)));
                                    // set integer value for submission but keep visual raw at released location
                                    setKewaspadaan(snappedSeg);
                                    setClickedKewaspadaan(snappedSeg);
                                  } else {
                                    const snapped = Math.min(4, Math.max(1, Math.round(kewaspadaanRaw)));
                                    setKewaspadaan(snapped);
                                    setKewaspadaanRaw(snapped);
                                    setClickedKewaspadaan(snapped);
                                  }
                                  setTimeout(() => setClickedKewaspadaan(null), 400);
                                }}
                                className="w-4 h-4 rounded-full shadow-sm bg-blue-500 border-2 border-white cursor-grab active:cursor-grabbing -translate-y-1/8 transition-all duration-150"
                                style={{ touchAction: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tanggal removed from main form per UX revisions */}

                  <div>
                    <label htmlFor="usia" className="block text-sm font-medium text-gray-700 mb-2">Usia Penderita <span className="text-red-500">*</span></label>
                    <input id="usia" value={usia} onChange={(e) => handleUsiaChange(e.target.value)} placeholder="Type.." className="w-full border rounded-md px-3 py-2" inputMode="numeric" maxLength={3} required />
                    {errors.usia && <div className="text-xs text-red-600 mt-1">{errors.usia}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sumber Berita <span className="text-red-500">*</span></label>
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        {selectedSumber ? (
                          <div className="border rounded-md p-3 bg-white">
                            <div className="text-sm font-medium">{selectedSumber.portal ?? ''} — {selectedSumber.title ?? ''}</div>
                              <div className="text-xs text-gray-500">{selectedSumber.type ?? ''} • {selectedSumber.author ?? ''} • {selectedSumber.date_published ? new Date(selectedSumber.date_published).toLocaleDateString() : ''}</div>
                            <div className="text-xs text-gray-700 mt-2">{selectedSumber.content}</div>
                            {selectedSumber.url && <div className="text-xs text-blue-600 mt-2"><a href={selectedSumber.url} target="_blank" rel="noreferrer">{selectedSumber.url}</a></div>}
                          </div>
                        ) : (
                          <div className="border rounded-md p-3 bg-white text-xs text-gray-500">Belum ada sumber terpilih</div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <button type="button" onClick={() => setShowAddSumberModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah Sumber</button>
                      </div>
                    </div>
                    <div id="help-sumber" className="text-xs text-gray-400 mt-1">Masukkan link website sumber (http/https atau domain saja).</div>
                    {errors.sumberBerita && <div id="err-sumber" className="text-xs text-red-600 mt-1">{errors.sumberBerita}</div>}
                  </div>

                  <div>
                    <label htmlFor="ringkasan" className="block text-sm font-medium text-gray-700 mb-2">Ringkasan <span className="text-red-500">*</span></label>
                    <textarea id="ringkasan" value={ringkasan} onChange={(e) => setRingkasan(e.target.value)} placeholder="Tulis ringkasan singkat..." rows={10} className="w-full border rounded-md px-3 py-2 resize-none" maxLength={2000} required />
                    {errors.ringkasan && <div className="text-xs text-red-600 mt-1">{errors.ringkasan}</div>}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-400">Batas 2000 karakter.</div>
                      <div className="text-xs text-gray-500">{ringkasan.length}/2000</div>
                    </div>
                  </div>

                    {/* CSV upload link: only visible to expert users (EXP_USER) */}
                    {typeof user !== 'undefined' && (user?.role || '').toUpperCase().trim() === 'EXP_USER' && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unggah CSV (bulk)</label>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => router.push('/expert-bulk-upload')} className="px-4 py-2 bg-white border rounded-md">Buka halaman Unggah CSV</button>
                          <div className="text-sm text-gray-500">Gunakan halaman unggah CSV untuk mengunggah banyak data sekaligus. Untuk menambah satu-per-satu, gunakan form di atas.</div>
                        </div>
                        {errors.csv && <div className="text-xs text-red-600 mt-1">{errors.csv}</div>}
                      </div>
                    )}

                  <div className="flex justify-end items-center gap-4 mt-10">
                    <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md bg-white">Reset</button>
                    <button type="submit" style={{ background: BLUE }} className={`px-4 py-2 rounded-md text-white hover:brightness-90`}>
                      {submitting ? 'Menyimpan...' : 'Simpan perubahan'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </form>
          </div>
        </div>
      </main>
      {/* Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Hapus Data?</h3>
            <p className="text-sm text-gray-700 mb-4">Data hanya dapat dihapus ketika status masih PENDING. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={handleDelete} disabled={deleting} className="px-3 py-2 bg-red-600 text-white rounded-md disabled:opacity-60">
                {deleting ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Jenis Penyakit Baru</h3>
            <input value={newJenisName} onChange={(e) => setNewJenisName(e.target.value)} placeholder="Nama penyakit" className="w-full border rounded-md px-3 py-2 mb-3" />
            {addJenisFeedback && (
              <div className="flex items-center justify-center mb-3">
                <div className={`text-4xl ${addJenisFeedback.status === 'success' ? 'animate-pulse' : 'animate-shake'}`} aria-hidden>
                  {addJenisFeedback.status === 'success' ? '✅' : '❌'}
                </div>
              </div>
            )}
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
            {addLokasiFeedback && (
              <div className="flex items-center justify-center mb-3">
                <div className={`text-4xl ${addLokasiFeedback.status === 'success' ? 'animate-pulse' : 'animate-shake'}`} aria-hidden>
                  {addLokasiFeedback.status === 'success' ? '✅' : '❌'}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-700">Latitude (opsional)</label>
                <input value={newLokasiLat} onChange={(e) => setNewLokasiLat(e.target.value)} placeholder="Contoh: -6.895" className="w-full border rounded-md px-3 py-2 mt-1" />
              </div>
              <div>
                <label className="text-xs text-gray-700">Longitude (opsional)</label>
                <input value={newLokasiLng} onChange={(e) => setNewLokasiLng(e.target.value)} placeholder="Contoh: 107.618" className="w-full border rounded-md px-3 py-2 mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddLokasiModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
                <button onClick={addNewLokasi} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSumberModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-2xl">
            <h3 className="font-semibold mb-2">Tambah Sumber Berita</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="sumber-portal" className="text-xs text-gray-700">Portal <span className="text-red-500">*</span></label>
                <input id="sumber-portal" value={srcPortal} onChange={(e) => setSrcPortal(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div>
                <label htmlFor="sumber-author" className="text-xs text-gray-700">Penulis <span className="text-red-500">*</span></label>
                <input id="sumber-author" value={srcAuthor} onChange={(e) => setSrcAuthor(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="sumber-title" className="text-xs text-gray-700">Judul <span className="text-red-500">*</span></label>
                <input id="sumber-title" value={srcTitle} onChange={(e) => setSrcTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div>
                <label htmlFor="sumber-type" className="text-xs text-gray-700">Tipe <span className="text-red-500">*</span></label>
                <select id="sumber-type" value={srcType} onChange={(e) => setSrcType(e.target.value)} className="w-full border rounded-md px-3 py-2" required>
                  <option value="artikel">artikel</option>
                  <option value="video">video</option>
                  <option value="laporan">laporan</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-700">Tanggal Terbit (DD / MM / YYYY) <span className="text-red-500">*</span></label>
                <FancyDatePicker
                  id="sumber-date"
                  value={sumberDateValue}
                  max={todayIso}
                  onChange={handleSumberDateChange}
                  required
                  error={errors['sumber-date']}
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="sumber-url" className="text-xs text-gray-700">URL <span className="text-red-500">*</span></label>
                <input id="sumber-url" value={srcUrl} onChange={(e) => setSrcUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="sumber-img" className="text-xs text-gray-700">URL Gambar <span className="text-red-500">*</span></label>
                <input id="sumber-img" value={srcImgUrl} onChange={(e) => setSrcImgUrl(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowAddSumberModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={() => {
                // required validation for sumber fields
                const urlPattern = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]{2,}(\/.*)?$/;
                const maybeUrl = urlPattern.test(srcUrl.trim());
                const maybeImg = urlPattern.test(srcImgUrl.trim());
                const dateValue = sumberDateValue;
                if (!srcPortal.trim() || !srcAuthor.trim() || !srcTitle.trim() || !srcType.trim() || !srcUrl.trim() || !maybeUrl || !srcImgUrl.trim() || !maybeImg || !dateValue) {
                  setErrors((p) => ({ ...p, sumberBerita: "Semua field sumber wajib diisi dengan format yang valid (judul, portal, penulis, tipe, tanggal, URL, dan URL gambar)." }));
                  if (!dateValue) setErrors((p) => ({ ...p, 'sumber-date': "Tanggal terbit wajib diisi." }));
                  return;
                }
                if (dateValue > todayIso) {
                  setErrors((p) => ({ ...p, 'sumber-date': "Tanggal terbit tidak boleh lebih dari hari ini." }));
                  return;
                }
                const parsedDate = new Date(`${dateValue}T00:00:00Z`);
                if (Number.isNaN(parsedDate.getTime())) {
                  setErrors((p) => ({ ...p, 'sumber-date': "Format tanggal terbit tidak valid." }));
                  return;
                }
                const s = {
                  portal: srcPortal.trim(),
                  title: srcTitle.trim(),
                  type: srcType,
                  content: srcContent.trim(),
                  url: srcUrl.trim(),
                  author: srcAuthor.trim(),
                  // store null when empty so backend DateTime field isn't given an empty string
                  // assemble date_published from single date input (UTC midnight)
                  date_published: parsedDate.toISOString(),
                  img_url: srcImgUrl.trim(),
                };
                setSelectedSumber(s);
                setSumberBerita(s.url ?? '');
                // clear error if any
                setErrors((p) => { const np = { ...p }; delete np.sumberBerita; delete np['sumber-date']; return np; });
                setShowAddSumberModal(false);
              }} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showAddProvinsiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Provinsi Baru</h3>
            <input value={newProvinsiName} onChange={(e) => setNewProvinsiName(e.target.value)} placeholder="Nama provinsi" className="w-full border rounded-md px-3 py-2 mb-3" />
            {addProvinsiFeedback && (
              <div className="flex items-center justify-center mb-3">
                <div className={`text-4xl ${addProvinsiFeedback.status === 'success' ? 'animate-pulse' : 'animate-shake'}`} aria-hidden>
                  {addProvinsiFeedback.status === 'success' ? '❌' : '✅'}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddProvinsiModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={addNewProvinsi} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-2">Validasi Gagal</h3>
            <div className="flex items-center justify-center mb-3">
              <div className="text-4xl animate-shake" aria-hidden>❌</div>
            </div>
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

      {duplicateWarning && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Gagal Menambahkan</h3>
            <div className="flex items-center justify-center mb-3">
              <div className="text-4xl animate-shake" aria-hidden>❌</div>
            </div>
            <div className="text-sm text-gray-700 mb-4">{duplicateWarning}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDuplicateWarning("")} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md flex flex-col items-center">
            <div className="text-5xl mb-3 animate-pulse">{resultStatus === 'success' ? '✅' : '❌'}</div>
            <div className={`text-sm ${resultStatus === 'success' ? 'text-green-700' : 'text-red-600'}`}>{resultMessage}</div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function ContributorEditDeleteDataPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Memuat halaman...</div>}>
      <ContributorEditDeleteDataPageContent />
    </Suspense>
  );
}

// Slider replaced by range input with colored track and emoji above thumb.
