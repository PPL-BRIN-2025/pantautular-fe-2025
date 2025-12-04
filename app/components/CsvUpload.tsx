"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE as CONFIG_API_BASE } from "../../config";
import AccessDeniedNotice from "./AccessDenied";

const normalizeRole = (role?: string | null) => (role ? role.trim().toUpperCase() : "");

export default function CsvUpload({
  effectiveUser,
  onSuccessAction,
  onErrorAction,
}: {
  effectiveUser: any;
  onSuccessAction?: (msg: string) => void;
  onErrorAction?: (err: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const allowedRoles = ["EXP_USER", "ADMIN"];
  const isExpert = allowedRoles.includes(normalizeRole(effectiveUser?.role));
  const router = useRouter();

  // If the user isn't logged in, redirect immediately to login page with a next param.
  useEffect(() => {
    // treat null/undefined as not logged in
    if (!effectiveUser) {
      try {
        const next = encodeURIComponent(window.location.pathname || "/expert-bulk-upload");
        router.replace(`/login?next=${next}`);
      } catch (e) {
        // fallback to full navigation
        try { window.location.href = `/login?next=${encodeURIComponent(window.location.pathname || "/expert-bulk-upload")}`; } catch {}
      }
    }
  }, [effectiveUser, router]);

  // If user is present but not EXP_USER show AccessDenied component
  if (effectiveUser && !isExpert) {
    return <AccessDeniedNotice />;
  }

  const acceptFile = (file?: File | null) => {
    if (!file) return "No file provided.";
    const name = file.name || "";
    if (!name.toLowerCase().endsWith(".csv"))
      return "Hanya file CSV (.csv) yang diizinkan.";
    return null;
  };

  const uploadFile = async (file: File) => {
  const err = acceptFile(file);
  if (err) return onErrorAction?.(err) as any;
  setBusy(true);

  try {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL?.trim() || CONFIG_API_BASE || "http://localhost:8000";
    const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";
    const UPLOAD_PATH = "/expert-feature/experts/cases/upload-csv/";

    const fd = new FormData();
    fd.append("file", file, file.name);

    const accessToken =
      typeof localStorage !== "undefined" ? localStorage.getItem("accessToken") : null;

    const res = await fetch(`${API_BASE}${UPLOAD_PATH}`, {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: fd,
    });

    // Handle errors first
    if (!res.ok) {
      let errorMessage = `Upload gagal (${res.status})`;
      const text = await res.text(); // read once
      try {
        const errorJson = JSON.parse(text);
        if (errorJson.message) errorMessage = errorJson.message;
        else if (errorJson.errors) errorMessage = JSON.stringify(errorJson.errors);
        else errorMessage = text;
      } catch {
        errorMessage = text || errorMessage;
      }
      return onErrorAction?.(errorMessage);
    }


    const data = await res.json().catch(() => ({}));
    setFilename(file.name);

    const successMsg =
      data?.created != null
        ? `✅ Berhasil membuat ${data.created} kasus (Batch: ${data.batch_id})`
        : "✅ CSV berhasil diunggah";

      onSuccessAction?.(successMsg);
    } catch (e: any) {
      onErrorAction?.(String(e?.message || e || "Upload gagal"));
    } finally {
      setBusy(false);
    }
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!isExpert)
      return onErrorAction?.("Hanya EXP_USER dapat mengunggah CSV.") as any;
    const f = e.dataTransfer.files?.[0];
    if (!f) return onErrorAction?.("File tidak ditemukan pada drop.") as any;
    uploadFile(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isExpert)
      return onErrorAction?.("Hanya EXP_USER dapat mengunggah CSV.") as any;
    uploadFile(f);
  };

  return (
    <div>
      <div
        data-testid="csv-drop-zone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`w-full border-dashed rounded-md p-6 text-center ${
          dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white"
        }`}
        style={{ borderWidth: 2 }}
      >
        {!isExpert ? (
          <div className="opacity-60">
            <div className="font-semibold">Unggah CSV (Diblokir)</div>
            <div className="text-xs text-gray-500">
              Hanya pengguna dengan role EXP_USER dapat mengunggah file CSV.
            </div>
          </div>
        ) : (
          <div>
            <div className="font-semibold">
              Tarik & lepas file CSV di sini, atau klik untuk memilih
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Pastikan file berekstensi .csv dan berformat sesuai.
            </div>
            <div className="mt-3">
              <label className="inline-block px-3 py-2 bg-white border rounded-md cursor-pointer">
                <input
                  data-testid="csv-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleSelect}
                  style={{ display: "none" }}
                />
                Pilih file CSV
              </label>
            </div>
          </div>
        )}
      </div>
      {busy && <div className="text-xs text-gray-600 mt-2">Mengunggah…</div>}
      {filename && (
        <div
          data-testid="csv-filename"
          className="text-xs text-green-700 mt-2"
        >
          Terunggah: {filename}
        </div>
      )}
    </div>
  );
}