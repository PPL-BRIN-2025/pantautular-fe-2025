"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type FancyDatePickerProps = {
  id?: string;
  value: string;
  max?: string;
  required?: boolean;
  onChange: (value: string) => void;
  error?: string;
};

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const formatYmd = (date: Date) =>
  `${date.getFullYear().toString().padStart(4, "0")}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

function isAfterMax(date: Date, max?: string) {
  if (!max) return false;
  const maxDate = new Date(`${max}T00:00:00`);
  return date.getTime() > maxDate.getTime();
}

export default function FancyDatePicker({
  id,
  value,
  max,
  required,
  onChange,
  error,
}: FancyDatePickerProps) {
  const today = useMemo(() => new Date(), []);
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(parsedValue ?? today);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  useEffect(() => {
    if (parsedValue) setViewMonth(parsedValue);
  }, [parsedValue]);

  const days = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(Date.UTC(year, month, 1));
    const startWeekday = first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const slots: Array<{ label: number; date: Date; disabled: boolean }> = [];
    for (let i = 0; i < startWeekday; i++) {
      slots.push({
        label: 0,
        date: new Date(Date.UTC(year, month, -(startWeekday - 1 - i))),
        disabled: true,
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, month, d));
      slots.push({ label: d, date, disabled: isAfterMax(new Date(date), max) });
    }
    return slots;
  }, [viewMonth, max]);

  const goMonth = (delta: number) => {
    const next = new Date(viewMonth);
    next.setMonth(viewMonth.getMonth() + delta);
    setViewMonth(next);
  };

  const isSelected = (date: Date) =>
    parsedValue &&
    date.getUTCFullYear() === parsedValue.getUTCFullYear() &&
    date.getUTCMonth() === parsedValue.getUTCMonth() &&
    date.getUTCDate() === parsedValue.getUTCDate();

  const isToday = (date: Date) =>
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate();

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-lg px-3 py-2 bg-gradient-to-r from-slate-50 to-white border border-gray-200 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#0069cf] focus:border-[#0069cf] text-left flex items-center justify-between"
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value ? parsedValue?.toLocaleDateString() : "Pilih tanggal"}
        </span>
        <span className="text-[#0069cf] text-sm">📅</span>
      </button>
      {required && <input tabIndex={-1} className="sr-only" value={value} readOnly required />}
      {open && (
        <div className="absolute z-50 mt-2 w-full max-w-sm rounded-xl border border-gray-200 bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-700">
              {viewMonth.toLocaleString("default", { month: "long" })} {viewMonth.getFullYear()}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goMonth(-1)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                aria-label="Bulan sebelumnya"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goMonth(1)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                aria-label="Bulan berikutnya"
              >
                →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {days.map((cell, idx) => {
              if (cell.label === 0) {
                return <div key={`empty-${idx}`} />;
              }
              const disabled = cell.disabled;
              const selected = isSelected(cell.date);
              const todayMatch = isToday(cell.date);
              return (
                <button
                  key={cell.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(formatYmd(cell.date));
                    setOpen(false);
                  }}
                  className={`h-9 w-full rounded-md transition ${
                    selected
                      ? "bg-[#0069cf] text-white shadow"
                      : todayMatch
                      ? "border border-[#0069cf]/50 text-[#0069cf]"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {cell.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-[#0069cf]">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="hover:underline"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const todayVal = formatYmd(today);
                if (max && todayVal > max) return;
                onChange(todayVal);
                setOpen(false);
              }}
              className="hover:underline"
            >
              Today
            </button>
          </div>
          {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
        </div>
      )}
    </div>
  );
}
