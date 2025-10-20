"use client";
import React, { useState } from "react";
import { DownloadCloud } from "lucide-react";
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
  successMessage = "Berhasil mengunduh visualisasi.",
  emptyMessage = "Gagal mengunduh: data kosong.",
  errorMessage = "Gagal mengunduh visualisasi."
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (isExporting) return;

    const target = getTarget();
    if (!target) {
      console.warn(`No element available for download: ${filename}`);
      window.alert(errorMessage);
      return;
    }

    if (canDownload && !canDownload()) {
      window.alert(emptyMessage);
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
      window.alert(successMessage);
    } catch (error) {
      console.error(`Failed to export ${filename} as image`, error);
      window.alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        className,
        isExporting && "opacity-60 cursor-wait"
      )}
      aria-label={label}
      disabled={isExporting}
    >
      <DownloadCloud className="h-4 w-4" aria-hidden="true" />
      <span>{isExporting ? "Memproses..." : label}</span>
    </button>
  );
};

export default DownloadButton;
