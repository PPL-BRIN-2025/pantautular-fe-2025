"use client";
import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, DownloadCloud } from "lucide-react";
import clsx from "clsx";
import { exportElementAsPng } from "@/utils/exportAsImage";

interface DownloadButtonProps {
  filename: string;
  getTarget: () => HTMLElement | null;
  canDownload?: () => boolean;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  successMessage?: string;
  emptyMessage?: string;
  errorMessage?: string;
  missingTargetMessage?: string;
  ignoreDuringCapture?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-md border border-[#0069CF] text-[#0069CF] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#11234B]";

const sizeClasses: Record<NonNullable<DownloadButtonProps["size"]>, string> = {
  sm: "px-2.5 py-1.5 text-xs font-medium gap-1.5",
  md: "px-3.5 py-2 text-sm font-semibold gap-2"
};

const ensurePngExtension = (filename: string) =>
  filename.toLowerCase().endsWith(".png") ? filename : `${filename}.png`;

const DownloadButton: React.FC<DownloadButtonProps> = ({
  filename,
  getTarget,
  canDownload,
  label = "Unduh Gambar",
  className,
  size = "sm",
  successMessage = "Berhasil mengunduh gambar visualisasi.",
  emptyMessage = "Gagal mengunduh gambar visualisasi karena data kosong.",
  errorMessage = "Gagal mengunduh gambar visualisasi karena terjadi kesalahan.",
  missingTargetMessage = "Gagal mengunduh gambar visualisasi karena elemen visualisasi tidak ditemukan.",
  ignoreDuringCapture = false
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleDownload = async () => {
    if (isExporting) return;

    const target = getTarget();
    if (!target) {
      console.warn(`No element available for download: ${filename}`);
      showNotification("error", missingTargetMessage);
      return;
    }

    if (canDownload && !canDownload()) {
      showNotification("error", emptyMessage);
      return;
    }

    setIsExporting(true);
    try {
      const dataUrl = await exportElementAsPng(target);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = ensurePngExtension(filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification("success", successMessage);
    } catch (error) {
      console.error(`Failed to export ${filename} as image`, error);
      showNotification("error", errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const toneClasses = notification
    ? notification.type === "success"
      ? "border-[#0069CF] bg-[#E6F4FF] text-[#11234B]"
      : "border-[#DC2626] bg-[#FFE5E5] text-[#4C0519]"
    : "";

  return (
    <div
      className="relative inline-flex items-center"
      data-html2canvas-ignore={ignoreDuringCapture ? "true" : undefined}
    >
      <button
        type="button"
        onClick={handleDownload}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          className,
          isExporting && "cursor-wait opacity-60"
        )}
        aria-label={label}
        disabled={isExporting}
      >
        <DownloadCloud className="h-4 w-4" aria-hidden="true" />
        <span>{isExporting ? "Memproses..." : label}</span>
      </button>
      {notification && (
        <div
          data-testid="download-notification"
          className={clsx(
            "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 rounded-md border px-3 py-2 text-xs font-medium shadow-lg transition-opacity duration-200 ease-out",
            toneClasses
          )}
          role={notification.type === "success" ? "status" : "alert"}
          aria-live={notification.type === "success" ? "polite" : "assertive"}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadButton;
