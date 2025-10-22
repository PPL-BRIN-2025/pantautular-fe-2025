"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TimeRangeValue {
  start: Date | null;
  end: Date | null;
}

interface TimeRangeFilterProps {
  value: TimeRangeValue;
  onApply: (value: TimeRangeValue) => void;
  onReset: () => void;
}

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const formatLabel = (value: Date | null) =>
  value ? value.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "Belum dipilih";

const formatTime = (value: Date | null) => {
  if (!value) return "";
  const hours = value.getHours().toString().padStart(2, "0");
  const minutes = value.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const combineDateAndTime = (date: Date | null, time: string): Date | null => {
  if (!date) return null;
  const next = new Date(date);
  const [hours, minutes] = time.split(":").map((token) => Number.parseInt(token, 10));
  next.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
};

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ value, onApply, onReset }) => {
  const [startDate, setStartDate] = useState<Date | null>(value.start ? startOfDay(value.start) : null);
  const [endDate, setEndDate] = useState<Date | null>(value.end ? startOfDay(value.end) : null);
  const [startTime, setStartTime] = useState<string>(formatTime(value.start));
  const [endTime, setEndTime] = useState<string>(formatTime(value.end));
  const [error, setError] = useState<string | null>(null);

  const combinedStart = useMemo(
    () => combineDateAndTime(startDate, startTime),
    [startDate, startTime]
  );
  const combinedEnd = useMemo(() => combineDateAndTime(endDate, endTime), [endDate, endTime]);

  useEffect(() => {
    if (value.start) {
      setStartDate(startOfDay(value.start));
      setStartTime(formatTime(value.start));
    } else {
      setStartDate(null);
      setStartTime("");
    }
    if (value.end) {
      setEndDate(startOfDay(value.end));
      setEndTime(formatTime(value.end));
    } else {
      setEndDate(null);
      setEndTime("");
    }
  }, [value.start, value.end]);

  useEffect(() => {
    setError(null);
  }, [startDate, endDate, startTime, endTime]);

  const cannotApply =
    (!startDate && startTime) ||
    (!endDate && endTime) ||
    (combinedStart && combinedEnd && combinedEnd < combinedStart);

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    if (cannotApply) {
      setError("Rentang waktu tidak valid. Periksa kembali tanggal dan jam.");
      return;
    }
    onApply({ start: combinedStart, end: combinedEnd });
  };

  const handleReset = () => {
    setStartDate(null);
    setStartTime("");
    setEndDate(null);
    setEndTime("");
    setError(null);
    onReset();
  };

  return (
    <form
      onSubmit={handleApply}
      className="pointer-events-auto flex w-full flex-wrap items-end gap-3 rounded-lg bg-white/85 px-3 py-2 text-xs text-[#11234B] shadow-lg backdrop-blur-md md:w-auto"
    >
      <div className="flex min-w-[180px] flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0069CF]">Rentang Waktu</span>
        <p className="text-[11px] text-[#475569]">
          {combinedStart || combinedEnd
            ? `${formatLabel(combinedStart)} — ${formatLabel(combinedEnd)}`
            : "Pilih tanggal & jam untuk menyaring titik kasus."}
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="font-medium text-[#0f172a]">Mulai</span>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date ? startOfDay(date) : null)}
              dateFormat="dd MMM yyyy"
              placeholderText="Tanggal"
              className="w-36 rounded-md border border-[#cbd5f5] px-2 py-1 text-[#11234B] shadow-sm focus:border-[#0069CF] focus:outline-none focus:ring-2 focus:ring-[#0069CF]/40"
            />
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="w-24 rounded-md border border-[#cbd5f5] px-2 py-1 text-[#11234B] shadow-sm focus:border-[#0069CF] focus:outline-none focus:ring-2 focus:ring-[#0069CF]/40"
              aria-label="Jam mulai"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium text-[#0f172a]">Selesai</span>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date ? startOfDay(date) : null)}
              dateFormat="dd MMM yyyy"
              placeholderText="Tanggal"
              minDate={startDate ?? undefined}
              className="w-36 rounded-md border border-[#cbd5f5] px-2 py-1 text-[#11234B] shadow-sm focus:border-[#0069CF] focus:outline-none focus:ring-2 focus:ring-[#0069CF]/40"
            />
            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="w-24 rounded-md border border-[#cbd5f5] px-2 py-1 text-[#11234B] shadow-sm focus:border-[#0069CF] focus:outline-none focus:ring-2 focus:ring-[#0069CF]/40"
              aria-label="Jam selesai"
            />
          </div>
        </label>
      </div>
      {error ? <p className="text-xs font-medium text-[#DC2626]">{error}</p> : null}
      <div className="ml-auto flex items-center gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-[#cbd5f5] px-3 py-1.5 text-[#475569] transition hover:border-[#94a3b8] hover:text-[#0f172a]"
        >
          Atur Ulang
        </button>
        <button
          type="submit"
          disabled={cannotApply}
          className="rounded-md bg-[#0069CF] px-3 py-1.5 text-white transition hover:bg-[#0053a3] disabled:cursor-not-allowed disabled:bg-[#94a3b8]"
        >
          Terapkan
        </button>
      </div>
    </form>
  );
};

export default TimeRangeFilter;
