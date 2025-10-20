"use client";

import type { Options as Html2CanvasOptions } from "html2canvas";

const defaultOptions: Html2CanvasOptions = {
  backgroundColor: "#ffffff",
  scale: 2,
  useCORS: true,
  allowTaint: false,
  logging: false
};

const createFallbackImage = (element: HTMLElement, backgroundColor: string) => {
  const fallback = document.createElement("canvas");
  const width = element.offsetWidth || 400;
  const height = element.offsetHeight || 300;
  fallback.width = width * 2;
  fallback.height = height * 2;

  const fallbackContext = fallback.getContext("2d");
  if (fallbackContext) {
    fallbackContext.fillStyle = backgroundColor;
    fallbackContext.fillRect(0, 0, fallback.width, fallback.height);
    fallbackContext.fillStyle = "#4b5563";
    fallbackContext.textAlign = "center";
    fallbackContext.textBaseline = "middle";
    const fontSize = Math.max(16, Math.min(28, fallback.height / 14));
    fallbackContext.font = `${fontSize}px sans-serif`;
    fallbackContext.fillText(
      "Gagal mengekspor visualisasi",
      fallback.width / 2,
      fallback.height / 2
    );
  }
  return fallback.toDataURL("image/png");
};

export const exportElementAsPng = async (
  element: HTMLElement,
  options: Partial<Html2CanvasOptions> = {}
): Promise<string> => {
  if (typeof window === "undefined") {
    throw new Error("exportElementAsPng can only be used in the browser");
  }

  try {
    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const canvas = await html2canvas(element, {
      ...defaultOptions,
      ...options
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to export element with html2canvas", error);
    return createFallbackImage(element, options.backgroundColor ?? defaultOptions.backgroundColor ?? "#ffffff");
  }
};
