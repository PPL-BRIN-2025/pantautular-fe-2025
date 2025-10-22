"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../config';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AccessDeniedNotice from "../components/AccessDenied";
import { useAuth } from "../auth/hooks/useAuth";

const BLUE = "#0069cf";

export default function CuratorEditDeleteDataPage() {
  const { user } = useAuth();
  const router = useRouter();
  // redirect to login when not authenticated
  useEffect(() => {
    if (typeof window !== 'undefined' && (user === null || user === undefined)) {
      try {
        router.push('/login');
      } catch (e) {
        // fallback to direct location assignment
        window.location.href = '/login';
      }
    }
  }, [user, router]);
  const normalizeRole = (r?: string | null) => (r ? r.trim().toUpperCase() : "");
  const role = normalizeRole(user?.role);
  // only CURATOR role allowed for this page
  const allowed = role === "CURATOR";

  if (!user || !allowed) {
    return (
      <div className="min-h-screen bg-[#f0f6f8] flex flex-col">
        <Navbar />
        <main className="flex-1">
          <AccessDeniedNotice />
        </main>
      </div>
    );
  }

  const [srcDatePublished, setSrcDatePublished] = useState("");
  const [srcDateDd, setSrcDateDd] = useState("");
  const [srcDateMm, setSrcDateMm] = useState("");
  const [srcDateYyyy, setSrcDateYyyy] = useState("");
  const [srcImgUrl, setSrcImgUrl] = useState("");
  const [ringkasan, setRingkasan] = useState("Penyakit Hepatitis telah menyebar....");
  const [jenisPenyakit, setJenisPenyakit] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [srcPortal, setSrcPortal] = useState("");
  const [srcTitle, setSrcTitle] = useState("");
  const [srcType, setSrcType] = useState("artikel");
  const [srcContent, setSrcContent] = useState("");
  const [srcUrl, setSrcUrl] = useState("");
  const [srcAuthor, setSrcAuthor] = useState("");
  const [sumberBerita, setSumberBerita] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [tingkatKeparahan, setTingkatKeparahan] = useState("insiden");
  const [kewaspadaan, setKewaspadaan] = useState(1);
  const [hoverKewaspadaan, setHoverKewaspadaan] = useState<number | null>(null);
  const [clickedKewaspadaan, setClickedKewaspadaan] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState({ dd: "23", mm: "01", yyyy: "2024" });
  const [usia, setUsia] = useState("12");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverValidationRaw, setServerValidationRaw] = useState<string | null>(null);
  const [serverValidationMessages, setServerValidationMessages] = useState<string[] | null>(null);
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
  const [editSrcDateDd, setEditSrcDateDd] = useState("");
  const [editSrcDateMm, setEditSrcDateMm] = useState("");
  const [editSrcDateYyyy, setEditSrcDateYyyy] = useState("");
  const [editSrcImgUrl, setEditSrcImgUrl] = useState(srcImgUrl);
  const [editRingkasan, setEditRingkasan] = useState(ringkasan);
  const [editJenisKelamin, setEditJenisKelamin] = useState(jenisKelamin);
  const [editTingkatKeparahan, setEditTingkatKeparahan] = useState(tingkatKeparahan);
  const [editKewaspadaan, setEditKewaspadaan] = useState(kewaspadaan);
  const [editHoverKewaspadaan, setEditHoverKewaspadaan] = useState<number | null>(null);
  const [editClickedKewaspadaan, setEditClickedKewaspadaan] = useState<number | null>(null);
  const [editTanggal, setEditTanggal] = useState(tanggal);
  const [editUsia, setEditUsia] = useState(usia);
  const [editProvinsi, setEditProvinsi] = useState("");
  const [showAddJenisModal, setShowAddJenisModal] = useState(false);
  const [showAddLokasiModal, setShowAddLokasiModal] = useState(false);
  const [newJenisName, setNewJenisName] = useState("");
  const [newLokasiName, setNewLokasiName] = useState("");
  const [newLokasiLat, setNewLokasiLat] = useState<string>("");
  const [newLokasiLng, setNewLokasiLng] = useState<string>("");
  const [addJenisFeedback, setAddJenisFeedback] = useState<{ status: 'success'|'error'; msg: string } | null>(null);
  const [addLokasiFeedback, setAddLokasiFeedback] = useState<{ status: 'success'|'error'; msg: string } | null>(null);


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

  const initialProvinsi = [
    'Aceh','Bali','Bangka Belitung','Banten','Bengkulu','Gorontalo','Jakarta','Jambi','Jawa Barat','Jawa Tengah','Jawa Timur','Kalimantan Barat','Kalimantan Selatan','Kalimantan Tengah','Kalimantan Timur','Kalimantan Utara','Kepulauan Riau','Lampung','Maluku','Maluku Utara','Nusa Tenggara Barat','Nusa Tenggara Timur','Papua','Papua Barat','Riau','Sulawesi Barat','Sulawesi Selatan','Sulawesi Tengah','Sulawesi Tenggara','Sulawesi Utara','Sumatera Barat','Sumatera Selatan','Sumatera Utara','Yogyakarta'
  ].map(s => s.trim()).filter(Boolean).sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const [provinsiList, setProvinsiList] = useState<string[]>(initialProvinsi);

  const [jenisSearch, setJenisSearch] = useState("");
  const [lokasiSearch, setLokasiSearch] = useState("");
  const [provinsiSearch, setProvinsiSearch] = useState("");

  const [showAddProvinsiModal, setShowAddProvinsiModal] = useState(false);
  const [newProvinsiName, setNewProvinsiName] = useState("");
  const [addProvinsiFeedback, setAddProvinsiFeedback] = useState<{ status: 'success'|'error'; msg: string } | null>(null);

  // result modal for edit/save actions
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultStatus, setResultStatus] = useState<'success'|'error' | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [caseId, setCaseId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{ status?: number | null; detail?: any } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchUuid, setSearchUuid] = useState('');
  const [searchType, setSearchType] = useState<'news' | 'case'>('news');

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

  // load disease/lokasi/provinsi lists from backend when available (mirror add page behavior)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // prefer injected services during tests to avoid real network probes
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const injectedServices = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_SERVICES__ : undefined;
        const svc = injectedServices ?? await import('../../services/api');
        if (!mounted) return;
        try {
          if ((svc.registryApi as any) && typeof (svc.registryApi as any).getDiseases === 'function') {
            const remoteDiseases = await (svc.registryApi as any).getDiseases();
            if (Array.isArray(remoteDiseases) && remoteDiseases.length) {
              const names = remoteDiseases.map((d: any) => (d && (d.name || d.title || d.label)) ? (d.name || d.title || d.label) : String(d)).filter(Boolean);
              const merged = Array.from(new Set([...names, ...jenisList]));
              merged.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
              setJenisList(merged as string[]);
            }
          }
        } catch (e) {
          // ignore remote diseases error and keep local list
        }
        try {
          if ((svc.registryApi as any) && typeof (svc.registryApi as any).getLocations === 'function') {
            const remoteLocations = await (svc.registryApi as any).getLocations();
            if (Array.isArray(remoteLocations) && remoteLocations.length) {
              const names = remoteLocations.map((l: any) => (l && (l.name || l.city || l.label)) ? (l.name || l.city || l.label) : String(l)).filter(Boolean);
              const merged = Array.from(new Set([...names, ...lokasiList]));
              merged.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
              setLokasiList(merged as string[]);
            }
          }
        } catch (e) {
          // ignore remote locations error
        }
        try {
          if ((svc.mapApi as any) && typeof (svc.mapApi as any).getProvinces === 'function') {
            const remoteProv = await (svc.mapApi as any).getProvinces();
            if (Array.isArray(remoteProv) && remoteProv.length) {
              const names = remoteProv.map((p: any) => p && (p.name || p.label) ? (p.name || p.label) : String(p)).filter(Boolean);
              const merged = Array.from(new Set([...names, ...provinsiList]));
              merged.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
              setProvinsiList(merged as string[]);
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

  const addNewJenis = () => {
    const name = newJenisName.trim();
    if (!name) return;
    if (jenisList.some((j) => j.toLowerCase() === name.toLowerCase())) {
      setAddJenisFeedback({ status: 'error', msg: `Jenis penyakit \"${name}\" sudah ada.` });
      return;
    }
        (async () => {
      try {
        // prefer injected services during tests
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const injectedServices = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_SERVICES__ : undefined;
        const svc = injectedServices ?? await import('../../services/api');
        if (svc.registryApi && typeof svc.registryApi.createDisease === 'function') {
          const created = await svc.registryApi.createDisease(name);
          const createdName = created && (created.name || created.title || created.label) ? (created.name || created.title || created.label) : name;
          const dedup = Array.from(new Set([createdName, ...jenisList]));
          dedup.sort((a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()));
          setJenisList(dedup as string[]);
          setEditJenis(createdName);
          setAddJenisFeedback({ status: 'success', msg: `Jenis \"${createdName}\" berhasil ditambahkan.` });
          setTimeout(() => { setAddJenisFeedback(null); setNewJenisName(''); setShowAddJenisModal(false); }, 800);
          return;
        }
        throw Object.assign(new Error('No endpoint'), { endpointNotFound: true });
      } catch (err: any) {
        const isEndpointNotFound = err && err.endpointNotFound;
        const next = Array.from(new Set([name, ...jenisList]));
        next.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setJenisList(next as string[]);
        setEditJenis(name);
        if (isEndpointNotFound) {
          setAddJenisFeedback({ status: 'error', msg: `Jenis \"${name}\" ditambahkan secara lokal — backend tidak tersedia.` });
        } else {
          setAddJenisFeedback({ status: 'success', msg: `Jenis \"${name}\" berhasil ditambahkan (local).` });
        }
        setTimeout(() => { setAddJenisFeedback(null); setNewJenisName(''); setShowAddJenisModal(false); }, 1600);
      }
    })();
  };

  const addNewLokasi = () => {
    const name = newLokasiName.trim();
    if (!name) return;
    if (lokasiList.some((l) => l.toLowerCase() === name.toLowerCase())) {
      setAddLokasiFeedback({ status: 'error', msg: `Lokasi \"${name}\" sudah ada.` });
      return;
    }
        (async () => {
      try {
        // prefer injected services during tests
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const injectedServices = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_SERVICES__ : undefined;
        const svc = injectedServices ?? await import('../../services/api');
        const lat = newLokasiLat ? Number(newLokasiLat) : undefined;
        const lng = newLokasiLng ? Number(newLokasiLng) : undefined;
        if (newLokasiLat && Number.isNaN(lat)) { setAddLokasiFeedback({ status: 'error', msg: 'Latitude tidak valid' }); return; }
        if (newLokasiLng && Number.isNaN(lng)) { setAddLokasiFeedback({ status: 'error', msg: 'Longitude tidak valid' }); return; }
        if ((svc.registryApi as any) && typeof (svc.registryApi as any).createLocation === 'function') {
          const created = await (svc.registryApi as any).createLocation(name, lat, lng);
          const createdName = created && (created.name || created.city || created.label) ? (created.name || created.city || created.label) : (typeof created === 'string' ? created : name);
          const dedup = Array.from(new Set([createdName, ...lokasiList]));
          dedup.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
          setLokasiList(dedup as string[]);
          setEditLokasi(createdName);
          setAddLokasiFeedback({ status: 'success', msg: `Lokasi "${createdName}" berhasil ditambahkan.` });
          setTimeout(() => { setAddLokasiFeedback(null); setNewLokasiName(''); setNewLokasiLat(''); setNewLokasiLng(''); setShowAddLokasiModal(false); }, 800);
          return;
        }
        throw Object.assign(new Error('No endpoint'), { endpointNotFound: true });
      } catch (err: any) {
        const isEndpointNotFound = err && err.endpointNotFound;
        const next = Array.from(new Set([name, ...lokasiList]));
        next.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setLokasiList(next as string[]);
        setEditLokasi(name);
        if (isEndpointNotFound) {
          setAddLokasiFeedback({ status: 'error', msg: `Lokasi "${name}" ditambahkan secara lokal — backend tidak tersedia.` });
        } else {
          setAddLokasiFeedback({ status: 'success', msg: `Lokasi "${name}" berhasil ditambahkan (local).` });
        }
        setTimeout(() => { setAddLokasiFeedback(null); setNewLokasiName(''); setNewLokasiLat(''); setNewLokasiLng(''); setShowAddLokasiModal(false); }, 1600);
      }
    })();
  };

  // fetch case if id present in URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const rawId = params.get('id');
      // strip surrounding quotes if user copied the url with quotes
      const id = rawId ? rawId.replace(/^['"]|['"]$/g, '').trim() : null;
      if (!id) {
        // no id in URL -> show friendly not-found state
        setNotFound(true);
        setCaseId(null);
        return;
      }
      setCaseId(id);
      (async () => {
        // prefer injected test API when present (helps tests avoid dynamic import issues)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const injected = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_API__ : undefined;
        const api = injected ?? await import('../../api/curatorCases').then(m => m);
        const getCuratorCase = injected ? injected.getCuratorCase : api.getCuratorCase;
        const HttpError = api.HttpError ?? (class HttpError extends Error {});
        try {
            console.debug('Fetching curator case id=', id);
            const data: any = await getCuratorCase(id);
          // clear notFound when we got valid data
          setNotFound(false);
          if (!data) {
            setNotFound(true);
            return;
          }
          // hydrate UI from API shape
          setJenisPenyakit(data.disease_name || data.disease || '');
          setLokasi(data.location?.city || data.city || '');
          setProvinsi(data.location?.province || data.province || '');
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
          // normalize incoming gender labels to short codes
          const g = data.gender || '';
          const normGender = (function(x: any) {
            if (!x) return '';
            const s = String(x).toLowerCase();
            if (s.includes('laki') || s === 'male') return 'male';
            if (s.includes('perempuan') || s === 'female') return 'female';
            return 'other';
          })(g);
          setJenisKelamin(normGender || '');
          setTingkatKeparahan(data.severity || 'insiden');
          setKewaspadaan(data.status ? (data.status === 'biasa' ? 1 : data.status === 'minimal' ? 2 : data.status === 'bahaya' ? 3 : 4) : 1);
          setTanggal({ dd: '', mm: '', yyyy: '' });
          setUsia(data.age ? String(data.age) : '');
        } catch (err: any) {
          // handle http-like errors (in tests injected errors may be plain objects)
          const status = err && (err.status ?? err?.response?.status);
          if (status === 404) {
            // Backend returns 404 for this id. The backend does not expose a /news/:id/ endpoint,
            // so don't attempt to call nonexistent news routes — treat as not found.
            console.debug('Case GET returned 404 for id=', id);
            setNotFound(true);
            return;
          }
          if (status === 401) {
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?next=${next}`;
            return;
          }
          if (status === 403) {
            setErrors({ form: 'Akses Ditolak: halaman ini hanya untuk kurator.' });
            return;
          }
          // if validation-like 400 with details, capture raw message
          if (status === 400 && err.detail) {
            try { setServerValidationRaw(JSON.stringify(err.detail, null, 2)); } catch (e) { setServerValidationRaw(String(err.detail)); }
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
    // try to parse existing ISO date into parts when available
    try {
      if (srcDatePublished) {
        const d = new Date(srcDatePublished);
        if (!isNaN(d.getTime())) {
          setEditSrcDateDd(String(d.getUTCDate()).padStart(2, '0'));
          setEditSrcDateMm(String(d.getUTCMonth() + 1).padStart(2, '0'));
          setEditSrcDateYyyy(String(d.getUTCFullYear()));
        } else {
          setEditSrcDateDd(''); setEditSrcDateMm(''); setEditSrcDateYyyy('');
        }
      } else {
        setEditSrcDateDd(''); setEditSrcDateMm(''); setEditSrcDateYyyy('');
      }
    } catch (e) {
      setEditSrcDateDd(''); setEditSrcDateMm(''); setEditSrcDateYyyy('');
    }
    setEditSrcImgUrl(srcImgUrl);
    setEditRingkasan(ringkasan);
    setEditJenisKelamin(jenisKelamin);
    setEditTingkatKeparahan(tingkatKeparahan);
    setEditKewaspadaan(kewaspadaan);
    setEditTanggal(tanggal);
    setEditUsia(usia);
    setEditProvinsi(provinsi);
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
  // debug: log and set ringkasan so we can trace updates
  // eslint-disable-next-line no-console
  console.debug('handleEditSave: applying editRingkasan ->', editRingkasan);
  setRingkasan(editRingkasan);
  // eslint-disable-next-line no-console
  console.debug('handleEditSave: ringkasan after set ->', editRingkasan);
    setJenisKelamin(editJenisKelamin);
    setTingkatKeparahan(editTingkatKeparahan);
    setKewaspadaan(editKewaspadaan);
    setTanggal(editTanggal);
    setUsia(editUsia);

    // call backend if caseId available
    (async () => {
      try {
        if (caseId) {
          // prefer injected API in tests
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const injected = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_API__ : undefined;
          const apiModule = injected ?? await import('../../api/curatorCases').then(m => m);
          const updateCuratorCase = injected ? injected.updateCuratorCase : apiModule.updateCuratorCase;
          const STATUS_MAP: Record<number, string> = { 1: 'biasa', 2: 'minimal', 3: 'bahaya', 4: 'katastropik' };
          const finalSummary = (editRingkasan || '').trim();
          const newsContent = finalSummary || (editSrcContent || '').trim() || '';
          const payload = {
            // keep top-level ringkasan in sync with news.content
            ringkasan: finalSummary,
            disease: editJenis,
            gender: editJenisKelamin || undefined,
            age: editUsia ? Number(editUsia) : null,
            city: editLokasi || undefined,
            province: editProvinsi || undefined,
            status: STATUS_MAP[editKewaspadaan] || 'biasa',
            severity: editTingkatKeparahan,
            location: { city: editLokasi, province: editProvinsi || undefined },
            news: {
              portal: editSrcPortal || 'Unknown',
              title: editSrcTitle || '',
              type: editSrcType || 'artikel',
              // keep news.content consistent with top-level ringkasan
              content: newsContent || finalSummary || '',
              url: editSrcUrl || '',
              author: editSrcAuthor || undefined,
              // assemble date_published from DD/MM/YYYY parts (UTC midnight), or send null
              date_published: (function() {
                const raw = (editSrcDatePublished || '').trim();
                if (raw) return raw;
                const dd = (editSrcDateDd || '').trim();
                const mm = (editSrcDateMm || '').trim();
                const yyyy = (editSrcDateYyyy || '').trim();
                if (dd && mm && yyyy && dd.length <= 2 && mm.length <= 2 && yyyy.length === 4) {
                  const d = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0));
                  if (!isNaN(d.getTime())) return d.toISOString();
                }
                return null;
              })(),
              img_url: editSrcImgUrl || undefined,
            },
          };
          try {
            const updated = await updateCuratorCase(caseId, payload as any);
            // Log server response for debugging
            // eslint-disable-next-line no-console
            console.debug('[EDIT SAVE] server update response:', updated);

            // Decide which summary to keep:
            // - prefer a non-empty server-returned content if it looks newer/different
            // - otherwise preserve the local user edit (editRingkasan)
            try {
              const serverSummaryCandidates: string[] = [];
              if (updated && typeof updated === 'object') {
                const maybeNews = updated.news ?? (Array.isArray(updated) ? updated : null);
                if (Array.isArray(maybeNews) && maybeNews.length) {
                  const last = maybeNews[maybeNews.length - 1];
                  if (last) serverSummaryCandidates.push(String(last.content || last.text || last.body || '').trim());
                }
                if (updated.content) serverSummaryCandidates.push(String(updated.content).trim());
              }
              // include assembled newsContent as candidate
              serverSummaryCandidates.push(String(newsContent || '').trim());

              // pick the first non-empty server candidate that is different from editRingkasan
              let pickedServer = '';
              for (const s of serverSummaryCandidates) {
                if (s && s.length && s !== (editRingkasan || '').trim()) { pickedServer = s; break; }
              }

              if (pickedServer) {
                // server appears to have new content; use it
                setRingkasan(pickedServer);
              } else {
                // fallback: keep what the user typed — do not let stale server content overwrite local edit
                setRingkasan(editRingkasan);
              }
            } catch (e) {
              // any parsing issue -> keep local edit
              setRingkasan(editRingkasan);
            }
          } catch (err: any) {
            const status = err && (err.status ?? err?.response?.status);
            const detail = err && err.detail ? err.detail : err;
            if (status === 400 && detail) {
              try { setServerValidationRaw(JSON.stringify(detail, null, 2)); } catch (e) { setServerValidationRaw(String(detail)); }
              try {
                const messages: string[] = [];
                if (typeof detail === 'object') {
                  for (const k of Object.keys(detail)) {
                    const v = (detail as any)[k];
                    const msg = Array.isArray(v) ? v.join(' / ') : String(v);
                    const friendlyKey = k === 'gender' ? 'Jenis Kelamin' : k === 'news' ? 'Sumber Berita' : k;
                    messages.push(`${friendlyKey}: ${msg}`);
                  }
                } else {
                  messages.push(String(detail));
                }
                setServerValidationMessages(messages);
              } catch (e) {
                // ignore
              }
            }
            throw err;
          }
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
          // prefer injected API when present
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const injected = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_API__ : undefined;
          const apiModule = injected ?? await import('../../api/curatorCases').then(m => m);
          const deleteCuratorCase = injected ? injected.deleteCuratorCase : apiModule.deleteCuratorCase;
          await deleteCuratorCase(caseId);
          // after deletion redirect back to the data management page (placeholder)
          window.location.href = '/data-management';
          return;
        }
        // if no caseId, redirect to data management page as well (placeholder)
        try { window.location.href = '/data-management'; return; } catch(e) {}
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
            {notFound ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-3">‼️</div>
                <h2 className="text-xl font-semibold mb-2">Data tidak ditemukan</h2>
                  <p className="text-sm text-gray-600 mb-4">Kami tidak bisa menemukan data dengan ID yang diberikan. Periksa kembali URL atau kembali ke manajemen data.</p>
                  {caseId && (
                    <div className="text-xs text-gray-500 mt-2">ID yang dicoba: <code className="bg-gray-100 px-2 py-1 rounded">{caseId}</code></div>
                  )}
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => {
                    try {
                      router.push('/curator-data-management');
                      return;
                    } catch (e) {
                      window.location.href = '/curator-data-management';
                    }
                  }} className="px-4 py-2 bg-[#0069cf] text-white rounded-md">Kembali ke manajemen data</button>
                  <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded-md">Muat Ulang</button>
                  <button onClick={() => { setShowSearchModal(true); setSearchUuid(''); setSearchProgress(null); setSearchType('news'); }} className="px-4 py-2 border rounded-md">Cari berdasarkan ID</button>
                  
                </div>
                {searchProgress && (
                  <div className="mt-3 text-sm text-gray-600 text-center">{searchProgress}</div>
                )}
                {searchLoading && (
                  <div className="mt-2 text-sm text-gray-500 text-center">Mencari... (akan mencoba beberapa halaman)</div>
                )}
                {showSearchModal && (
                  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-6 w-full max-w-md">
                      <h3 className="font-semibold mb-3">Cari Parent Case dari News UUID</h3>
                      <p className="text-sm text-gray-500 mb-3">Pilih apakah ingin mencari berdasarkan News UUID atau langsung Case ID, lalu masukkan ID di bawah ini.</p>
                      <div className="flex items-center gap-3 mb-3">
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name="searchType" checked={searchType === 'news'} onChange={() => setSearchType('news')} />
                          <span className="text-sm">News UUID</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name="searchType" checked={searchType === 'case'} onChange={() => setSearchType('case')} />
                          <span className="text-sm">Case ID</span>
                        </label>
                      </div>
                      <input value={searchUuid} onChange={(e) => setSearchUuid(e.target.value)} placeholder={searchType === 'news' ? "Masukkan UUID berita" : "Masukkan Case ID"} className="w-full border rounded-md px-3 py-2 mb-3" />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setShowSearchModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
                        <button onClick={async () => {
                          const q = (searchUuid || '').trim();
                          if (!q) return setSearchProgress('Masukkan UUID terlebih dahulu');
                          setSearchLoading(true);
                          setSearchProgress(null);
                          try {
                            // If user selected searching by case ID, call getCuratorCase directly.
                            // Prefer injected API for tests.
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore
                            const injected = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_API__ : undefined;
                            const api = injected ?? await import('../../api/curatorCases').then(m => m);
                            if (searchType === 'case') {
                              try {
                                const getCuratorCase = injected ? injected.getCuratorCase : api.getCuratorCase;
                                const data = await getCuratorCase(q);
                                const foundCaseId = data && (data.id || data.uuid || data.pk || q) ? (data.id || data.uuid || data.pk || q) : null;
                                if (foundCaseId) {
                                  try { history.replaceState(null, '', `${window.location.pathname}?id=${foundCaseId}`); } catch (e) {}
                                  setShowSearchModal(false);
                                  window.location.href = `${window.location.pathname}?id=${foundCaseId}`;
                                  return;
                                }
                                setSearchProgress('Tidak ditemukan.');
                              } catch (err: any) {
                                const status = err && (err.status ?? err?.response?.status);
                                if (status === 404) {
                                  setSearchProgress('Tidak ditemukan.');
                                } else {
                                  setSearchProgress('Terjadi kesalahan saat mencari.');
                                }
                              }
                            } else {
                              // existing news-UUID search (paged): Use listCuratorCases and scan results
                              const listCuratorCases = injected ? injected.listCuratorCases : api.listCuratorCases;
                              const candidateBases = [
                                undefined, // let the client probe/resolved base decide
                                `${API_BASE}/api/curator-feature/curator/cases/`,
                                `${API_BASE}/curator-feature/curator/cases/`,
                                `${API_BASE}/api/curator/cases/`,
                                `${API_BASE}/curator/cases/`,
                              ];
                              let foundCaseId: string | null = null;
                              for (const base of candidateBases) {
                                try {
                                  setSearchProgress(base ? `Mencari pada ${base}` : `Mencari pada basis terdeteksi`);
                                  let pageUrl: string | undefined | null = base ?? undefined;
                                  let page = 0;
                                  while (page < 20 && !foundCaseId) {
                                    page += 1;
                                    let json: any;
                                    try {
                                      json = await listCuratorCases(pageUrl ?? undefined);
                                    } catch (e) {
                                      // if pageUrl was explicit and failed, break to next candidate
                                      break;
                                    }
                                    let items: any[] = [];
                                    let nextUrl: string | null = null;
                                    if (Array.isArray(json)) {
                                      items = json;
                                      nextUrl = null;
                                    } else if (json && Array.isArray(json.results)) {
                                      items = json.results;
                                      nextUrl = json.next || null;
                                    } else if (json && Array.isArray(json.data)) {
                                      items = json.data;
                                      nextUrl = null;
                                    } else {
                                      break;
                                    }
                                    for (const it of items) {
                                      if (it && Array.isArray(it.news)) {
                                        for (const n of it.news) {
                                          if (!n) continue;
                                          const nid = String(n.id ?? n.uuid ?? n._id ?? n).trim();
                                          if (!nid) continue;
                                          if (nid === q || String(n.id) === q || String(n.uuid) === q) {
                                            foundCaseId = it.id || it.uuid || it.pk || null;
                                            break;
                                          }
                                        }
                                      }
                                      if (foundCaseId) break;
                                    }
                                    if (foundCaseId) break;
                                    if (nextUrl) {
                                      pageUrl = nextUrl;
                                    } else {
                                      break;
                                    }
                                  }
                                  if (foundCaseId) break;
                                } catch (e) {
                                  // ignore and try next candidate base
                                }
                              }
                              if (foundCaseId) {
                                try { history.replaceState(null, '', `${window.location.pathname}?id=${foundCaseId}`); } catch (e) {}
                                setShowSearchModal(false);
                                // navigate / reload to hydrate
                                window.location.href = `${window.location.pathname}?id=${foundCaseId}`;
                                return;
                              }
                              setSearchProgress('Tidak ditemukan.');
                            }
                          } finally {
                            setSearchLoading(false);
                          }
                        }} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Cari</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (<>
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
              {errors?.form && (
                <div className="col-span-2 text-sm text-red-700 mb-2">
                  {errors.form}
                </div>
              )}

              <p className="col-span-2 text-xs text-gray-500 mb-4">Kolom bertanda * wajib diisi. Periksa kembali sebelum menerapkan.</p>

              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="jenisPenyakit" className="block text-sm font-medium text-gray-700 mb-2">Jenis Penyakit <span className="text-red-500">*</span></label>
                  {isEditing ? (
                    <div>
                      <div className="flex gap-2">
                        <input
                          id="jenisPenyakit"
                          value={editJenis}
                          onChange={(e) => { setEditJenis(e.target.value); setJenisSearch(e.target.value); }}
                          placeholder="Cari atau ketik..."
                          className="w-full border rounded-md px-3 py-2"
                        />
                        <button type="button" onClick={() => setShowAddJenisModal(true)} className="px-3 py-2 border rounded-md bg-white">Tambah</button>
                      </div>
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
                  <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700 mb-2">Provinsi</label>
                  {isEditing ? (
                    <div>
                      <input id="provinsi" value={editProvinsi} onChange={(e) => { setEditProvinsi(e.target.value); setProvinsiSearch(e.target.value); }} placeholder="Cari atau ketik provinsi..." className="w-full border rounded-md px-3 py-2" />
                      <div className="mt-2 max-h-40 overflow-auto border rounded-md p-2 bg-white">
                        {provinsiList.filter(p => p.toLowerCase().includes(provinsiSearch.trim().toLowerCase())).length === 0 ? (
                          <div className="text-xs text-gray-500">Tidak ada hasil</div>
                        ) : (
                          provinsiList.filter(p => p.toLowerCase().includes(provinsiSearch.trim().toLowerCase())).map((p) => (
                            <div key={p} onClick={() => setEditProvinsi(p)} className={`py-1 px-2 rounded-md cursor-pointer ${editProvinsi === p ? 'bg-[#e6f0ff]' : 'hover:bg-gray-50'}`}>
                              {p}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => setShowAddProvinsiModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah provinsi</button>
                        <button type="button" onClick={() => setShowAddLokasiModal(true)} className="px-3 py-2 bg-white border rounded-md">Tambah lokasi</button>
                      </div>
                    </div>
                  ) : (
                    <input id="provinsi" value={provinsi} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
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
                      <label htmlFor="sumber-author" className="text-xs text-gray-700">Penulis</label>
                      {isEditing ? (
                        <input id="sumber-author" value={editSrcAuthor} onChange={(e) => setEditSrcAuthor(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-author" value={srcAuthor} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="sumber-title" className="text-xs text-gray-700">Judul</label>
                      {isEditing ? (
                        <input id="sumber-title" value={editSrcTitle} onChange={(e) => setEditSrcTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" />
                      ) : (
                        <input id="sumber-title" value={srcTitle} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50" />
                      )}
                    </div>
                    <div>
                      <label htmlFor="sumber-type" className="text-xs text-gray-700">Tipe</label>
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
                      <label className="text-xs text-gray-700">Tanggal Terbit (DD / MM / YYYY)</label>
                      {isEditing ? (
                        <div className="flex gap-2 mt-1">
                          <input id="sumber-date-dd" value={editSrcDateDd} onChange={(e) => setEditSrcDateDd(e.target.value)} placeholder="DD" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" />
                          <input id="sumber-date-mm" value={editSrcDateMm} onChange={(e) => setEditSrcDateMm(e.target.value)} placeholder="MM" maxLength={2} className="w-20 border rounded-md px-3 py-2" inputMode="numeric" />
                          <input id="sumber-date-yyyy" value={editSrcDateYyyy} onChange={(e) => setEditSrcDateYyyy(e.target.value)} placeholder="YYYY" maxLength={4} className="w-28 border rounded-md px-3 py-2" inputMode="numeric" />
                        </div>
                      ) : (
                        // keep the visual style similar to inputs even when not editable
                        <div className="w-full border rounded-md px-3 py-2 bg-gray-50 text-sm text-gray-700">{srcDatePublished ? new Date(srcDatePublished).toLocaleDateString() : ''}</div>
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
                      <label htmlFor="sumber-img" className="text-xs text-gray-700">URL Gambar</label>
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
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                        <option value="other">Lainnya</option>
                      </select>
                    ) : (
                      <select id="jk" value={jenisKelamin} disabled className="w-full border rounded-md px-3 py-2 bg-gray-50">
                        <option value="">Pilih...</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                        <option value="other">Lainnya</option>
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

                {/* Tanggal removed from main UI per revision */}

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
            </>)}
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

      {showAddProvinsiModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Provinsi Baru</h3>
            <input value={newProvinsiName} onChange={(e) => setNewProvinsiName(e.target.value)} placeholder="Nama provinsi" className="w-full border rounded-md px-3 py-2 mb-3" />
            {addProvinsiFeedback && (
              <div className="flex items-center justify-center mb-3">
                <div className={`text-4xl ${addProvinsiFeedback.status === 'success' ? 'animate-pulse' : 'animate-shake'}`} aria-hidden>
                  {addProvinsiFeedback.status === 'success' ? '✅' : '❌'}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddProvinsiModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={async () => {
                const name = (newProvinsiName || '').trim();
                if (!name) return;
                try {
                  // prefer injected services during tests
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  const injectedServices = typeof global !== 'undefined' ? (global as any).__TEST_INJECT_SERVICES__ : undefined;
                  const svc = injectedServices ?? await import('../../services/api');
                  if (svc.registryApi && typeof (svc.registryApi as any).createProvince === 'function') {
                    const created = await (svc.registryApi as any).createProvince(name);
                    const createdName = created && (created.name || created.label) ? (created.name || created.label) : name;
                    const dedup = Array.from(new Set([createdName, ...provinsiList]));
                    dedup.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                    setProvinsiList(dedup);
                    setProvinsi(createdName);
                    setAddProvinsiFeedback({ status: 'success', msg: `Provinsi "${createdName}" berhasil ditambahkan.` });
                    setTimeout(() => { setAddProvinsiFeedback(null); setNewProvinsiName(''); setShowAddProvinsiModal(false); }, 800);
                  } else {
                    throw Object.assign(new Error('No endpoint'), { endpointNotFound: true });
                  }
                } catch (err: any) {
                  const name = (newProvinsiName || '').trim();
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
                  setTimeout(() => { setAddProvinsiFeedback(null); setNewProvinsiName(''); setShowAddProvinsiModal(false); }, 1600);
                }
              }} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showAddJenisModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md">
            <h3 className="font-semibold mb-2">Tambah Lokasi Baru</h3>
            <input value={newLokasiName} onChange={(e) => setNewLokasiName(e.target.value)} placeholder="Nama lokasi" className="w-full border rounded-md px-3 py-2 mb-3" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              <input value={newLokasiLat} onChange={(e) => setNewLokasiLat(e.target.value)} placeholder="Latitude (opsional)" className="border rounded-md px-3 py-2" />
              <input value={newLokasiLng} onChange={(e) => setNewLokasiLng(e.target.value)} placeholder="Longitude (opsional)" className="border rounded-md px-3 py-2" />
            </div>
            {addLokasiFeedback && (
              <div className="flex items-center justify-center mb-3">
                <div className={`text-4xl ${addLokasiFeedback.status === 'success' ? 'animate-pulse' : 'animate-shake'}`} aria-hidden>
                  {addLokasiFeedback.status === 'success' ? '✅' : '❌'}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddLokasiModal(false)} className="px-3 py-2 border rounded-md">Batal</button>
              <button onClick={addNewLokasi} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {(serverValidationMessages && serverValidationMessages.length > 0) ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-2xl">
            <h3 className="font-semibold mb-2">Validasi Server</h3>
            <div className="text-sm text-red-700 mb-3">Terdapat masalah pada input:</div>
            <ul className="list-disc pl-5 text-sm text-red-700 mb-3">
              {serverValidationMessages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
            <div className="flex justify-end mt-3">
              <button onClick={() => { setServerValidationMessages(null); setServerValidationRaw(null); }} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Tutup</button>
            </div>
          </div>
        </div>
      ) : serverValidationRaw ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-2xl">
            <h3 className="font-semibold mb-2">Server validation</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto" style={{ maxHeight: 300 }} data-testid="server-validation">
              {serverValidationRaw}
            </pre>
            <div className="flex justify-end mt-3">
              <button onClick={() => setServerValidationRaw(null)} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Tutup</button>
            </div>
          </div>
        </div>
      ) : null}

      {diagResult && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-2">Diagnostic GET result</h3>
            <div className="text-sm text-gray-700 mb-3">Status: {String(diagResult.status)}</div>
            <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-auto" style={{ maxHeight: 300 }}>{typeof diagResult.detail === 'string' ? diagResult.detail : JSON.stringify(diagResult.detail, null, 2)}</pre>
            <div className="flex justify-end mt-3">
              <button onClick={() => setDiagResult(null)} className="px-3 py-2 bg-[#0069cf] text-white rounded-md">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Test hooks: only render when tests inject the test API object. This allows
          unit tests to open the modal and set diagnostic result without changing
          production behavior. */}
      {typeof global !== 'undefined' && (global as any).__TEST_INJECT_API__ && (
        <div data-testid="test-hooks" style={{ display: 'none' }}>
          <button data-testid="test-open-edit-modal" onClick={openEditModal}>HOOK_OPEN_MODAL</button>
          <button data-testid="test-set-diag" onClick={() => setDiagResult({ status: 200, detail: 'test' })}>HOOK_SET_DIAG</button>
          {/* test-only: allow tests to trigger confirmDelete directly to exercise fallback/delete branches */}
          <button data-testid="test-show-delete" onClick={() => setShowDeleteConfirm(true)}>HOOK_SHOW_DELETE</button>
          <button data-testid="test-run-confirm-delete" onClick={() => confirmDelete()}>HOOK_RUN_CONFIRM_DELETE</button>
        </div>
      )}

      <Footer />
    </div>
  );
}
