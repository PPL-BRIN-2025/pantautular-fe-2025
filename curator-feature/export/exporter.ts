"use client";
import { logsApi } from "../../services/api";

export type ImageType = "png" | "jpeg";

interface ExportParams {
  element: HTMLElement | null;
  chartType: string;
  fileName: string;
  imageType?: ImageType;
  hasData: boolean;
  getRoot?: () => any | null; // amCharts Root if available
  username?: string | null;
  notify?: (type: "success" | "error", message: string) => void;
}

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const tryCanvasFallback = async (element: HTMLElement, filename: string, imageType: ImageType = "png") => {
  const canvas = element.querySelector("canvas") as HTMLCanvasElement | null;
  if (!canvas) throw new Error("Chart canvas not found for export");
  const dataUrl = canvas.toDataURL(`image/${imageType}`, 1.0);
  downloadDataUrl(dataUrl, `${filename}.${imageType}`);
};

export async function exportChartAndLog(params: ExportParams) {
  const { element, chartType, fileName, imageType = "png", hasData, getRoot, username, notify } = params;

  try {
    if (!element) throw new Error("Chart container not found");
    if (!hasData) throw new Error("Chart has no data to export");
    const visible = element.offsetWidth > 0 && element.offsetHeight > 0;
    if (!visible) throw new Error("Chart is not visible or not fully rendered");

    // Prefer amCharts v5 Exporting plugin when root is available
    let exported = false;
    let root: any | null = null;
    if (getRoot) {
      try { root = getRoot(); } catch (_) { /* ignore */ }
    }

    if (root) {
      try {
        // Use exporting plugin only if it is already loaded on the window (via CDN script)
        const anyWin: any = window as any;
        const am5exporting = anyWin?.am5exporting;
        if (am5exporting?.Exporting?.new) {
          const exporting = am5exporting.Exporting.new(root, { filePrefix: fileName });
          if (typeof (exporting as any).download === "function") {
            (exporting as any).download(imageType);
          } else if (typeof (exporting as any).export === "function") {
            (exporting as any).export(imageType);
          } else if (typeof (exporting as any).getImage === "function") {
            const canvas = await (exporting as any).getImage(imageType);
            const dataUrl = canvas.toDataURL(`image/${imageType}`, 1.0);
            downloadDataUrl(dataUrl, `${fileName}.${imageType}`);
          } else {
            throw new Error("Unsupported exporting method");
          }
          exported = true;
        }
      } catch (_) { /* ignore */ }
    }

    // Fallback to canvas image capture
    if (!exported) {
      await tryCanvasFallback(element, fileName, imageType);
    }

    notify?.("success", "Chart downloaded successfully");

    // Best-effort logging; do not block user on errors
    try {
      await logsApi.logDownload({
        username: username ?? undefined,
        chartType,
        timestamp: new Date().toISOString(),
      });
    } catch (logErr) {
      console.error("Failed to log download event", logErr);
    }
  } catch (err: any) {
    const message = err?.message ?? "Failed to export chart";
    notify?.("error", message);
    throw err; // rethrow for caller if needed
  }
}

// Simple alias for compatibility with different callers
export const exportChartLog = exportChartAndLog;
