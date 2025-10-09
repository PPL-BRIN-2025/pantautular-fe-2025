"use client";
import React, { useEffect, useState } from "react";

type ToastType = "success" | "error";
interface ToastMsg { id: number; type: ToastType; message: string }

export function toast(type: ToastType, message: string) {
  try {
    window.dispatchEvent(
      new CustomEvent("cf:toast", { detail: { type, message } })
    );
  } catch (e) {
    // Fallback - minimal interruption
    alert(message);
  }
}

const ToastItem = ({ type, message }: { type: ToastType; message: string }) => (
  <div
    className={`px-3 py-2 rounded shadow text-sm text-white ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`}
    role="status"
    aria-live="polite"
  >
    {message}
  </div>
);

export default function ToastCenter() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    let id = 1;
    const onToast = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { type: ToastType; message: string };
      const next: ToastMsg = { id: id++, type: detail.type, message: detail.message };
      setItems((prev) => [...prev, next]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== next.id)), 3000);
    };
    window.addEventListener("cf:toast", onToast as EventListener);
    return () => window.removeEventListener("cf:toast", onToast as EventListener);
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {items.map((t) => (
        <ToastItem key={t.id} type={t.type} message={t.message} />)
      )}
    </div>
  );
}

