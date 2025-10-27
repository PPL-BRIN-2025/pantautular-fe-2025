"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const formatSummaryLabel = (value: Date | null) => {
  if (!value) return "Belum dipilih";
  const datePart = value.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const timePart = value
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
    .replace(":", ".");
  return `${datePart} ${timePart}`;
};

const MINUTES_IN_DAY = 24 * 60 - 1;
const MS_IN_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_YEAR_WINDOW = 3;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatDateLabel = (value: Date | null) =>
  value ? value.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "Belum dipilih";

const dateToMinutes = (date: Date | null) => {
  if (!date) return 0;
  return date.getHours() * 60 + date.getMinutes();
};

const minutesToTimeLabel = (minutes: number) => {
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const hours = Math.floor(safeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (safeMinutes % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}.${remainder}`;
};

const combineDateAndMinutes = (date: Date | null, minutes: number): Date | null => {
  if (!date) return null;
  const next = new Date(date);
  const clampedMinutes = Number.isFinite(minutes) ? Math.max(0, Math.min(minutes, MINUTES_IN_DAY)) : 0;
  const hours = Math.floor(clampedMinutes / 60);
  const remainder = clampedMinutes % 60;
  next.setHours(hours, remainder, 0, 0);
  return next;
};

const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({ value, onApply, onReset }) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const normalizedStart = useMemo(() => (value.start ? startOfDay(value.start) : null), [value.start]);
  const normalizedEnd = useMemo(() => (value.end ? startOfDay(value.end) : null), [value.end]);

  const defaultRangeStart = useMemo(() => {
    const base = new Date(today);
    base.setFullYear(base.getFullYear() - DEFAULT_YEAR_WINDOW);
    base.setMonth(0, 1);
    return base;
  }, [today]);

  const defaultRangeEnd = useMemo(() => {
    const base = new Date(today);
    base.setMonth(11, 31);
    return base;
  }, [today]);

  const rangeStart = useMemo(() => {
    let earliest = defaultRangeStart;
    if (normalizedStart && normalizedStart < earliest) earliest = normalizedStart;
    if (normalizedEnd && normalizedEnd < earliest) earliest = normalizedEnd;
    return earliest;
  }, [defaultRangeStart, normalizedEnd, normalizedStart]);

  const rangeEnd = useMemo(() => {
    let latest = defaultRangeEnd;
    if (normalizedStart && normalizedStart > latest) latest = normalizedStart;
    if (normalizedEnd && normalizedEnd > latest) latest = normalizedEnd;
    if (latest < rangeStart) return rangeStart;
    return latest;
  }, [defaultRangeEnd, normalizedEnd, normalizedStart, rangeStart]);

  const maxIndex = useMemo(
    () => Math.max(0, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / MS_IN_DAY)),
    [rangeEnd, rangeStart]
  );

  const clampIndex = useCallback((index: number) => clamp(index, 0, maxIndex), [maxIndex]);

  const dateToIndex = useCallback(
    (date: Date) => clampIndex(Math.round((startOfDay(date).getTime() - rangeStart.getTime()) / MS_IN_DAY)),
    [clampIndex, rangeStart]
  );

  const indexToDate = useCallback(
    (index: number) => {
      if (maxIndex === 0) {
        return rangeStart;
      }
      return addDays(rangeStart, clampIndex(index));
    },
    [clampIndex, maxIndex, rangeStart]
  );

  const [startIndex, setStartIndex] = useState<number>(() => (normalizedStart ? dateToIndex(normalizedStart) : 0));
  const [endIndex, setEndIndex] = useState<number>(() => (normalizedEnd ? dateToIndex(normalizedEnd) : maxIndex));
  const [startMinutes, setStartMinutes] = useState<number>(value.start ? dateToMinutes(value.start) : 0);
  const [endMinutes, setEndMinutes] = useState<number>(value.end ? dateToMinutes(value.end) : MINUTES_IN_DAY);
  const [isActive, setIsActive] = useState<boolean>(() => Boolean(value.start || value.end));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsActive(Boolean(value.start || value.end));

    if (normalizedStart) {
      const nextIndex = dateToIndex(normalizedStart);
      setStartIndex((current) => (current !== nextIndex ? nextIndex : current));
      const nextMinutes = dateToMinutes(value.start);
      setStartMinutes((current) => (current !== nextMinutes ? nextMinutes : current));
    } else {
      setStartIndex(0);
      setStartMinutes(0);
    }

    if (normalizedEnd) {
      const nextIndex = dateToIndex(normalizedEnd);
      setEndIndex((current) => (current !== nextIndex ? nextIndex : current));
      const nextMinutes = dateToMinutes(value.end);
      setEndMinutes((current) => (current !== nextMinutes ? nextMinutes : current));
    } else {
      setEndIndex(maxIndex);
      setEndMinutes(MINUTES_IN_DAY);
    }
  }, [dateToIndex, maxIndex, normalizedEnd, normalizedStart, value.end, value.start]);

  useEffect(() => {
    if (isActive && startIndex === endIndex && endMinutes < startMinutes) {
      setEndMinutes(startMinutes);
    }
  }, [endIndex, endMinutes, isActive, startIndex, startMinutes]);

  const startDateForLabels = isActive ? indexToDate(startIndex) : null;
  const endDateForLabels = isActive ? indexToDate(endIndex) : null;

  const combinedStart = isActive ? combineDateAndMinutes(startDateForLabels, startMinutes) : null;
  const combinedEnd = isActive ? combineDateAndMinutes(endDateForLabels, endMinutes) : null;

  const combinedStartMs = combinedStart ? combinedStart.getTime() : null;
  const combinedEndMs = combinedEnd ? combinedEnd.getTime() : null;

  const cannotApply = Boolean(isActive && combinedStart && combinedEnd && combinedEnd < combinedStart);

  useEffect(() => {
    if (isActive && cannotApply) {
      setError("Rentang waktu tidak valid. Periksa kembali tanggal dan jam.");
    } else {
      setError(null);
    }
  }, [cannotApply, isActive]);

  const lastAppliedRef = useRef<{ start: number | null; end: number | null; active: boolean }>({
    start: null,
    end: null,
    active: false,
  });
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
      applyTimeoutRef.current = null;
    }

    if (isActive && cannotApply) {
      return;
    }

    const nextStart = isActive && combinedStartMs !== null ? new Date(combinedStartMs) : null;
    const nextEnd = isActive && combinedEndMs !== null ? new Date(combinedEndMs) : null;
    const nextStartValue = nextStart ? nextStart.getTime() : null;
    const nextEndValue = nextEnd ? nextEnd.getTime() : null;
    const last = lastAppliedRef.current;

    const hasChanges =
      last.active !== isActive || last.start !== nextStartValue || last.end !== nextEndValue;

    if (!hasChanges) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onApply({ start: nextStart, end: nextEnd });
      lastAppliedRef.current = {
        start: nextStartValue,
        end: nextEndValue,
        active: isActive,
      };
      applyTimeoutRef.current = null;
    }, 250);

    applyTimeoutRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
      if (applyTimeoutRef.current === timeoutId) {
        applyTimeoutRef.current = null;
      }
    };
  }, [combinedEndMs, combinedStartMs, cannotApply, isActive, onApply]);

  const handleStartIndexChange = (nextIndex: number) => {
    setIsActive(true);
    const clampedIndex = clampIndex(nextIndex);
    setStartIndex(clampedIndex);
    if (clampedIndex > endIndex) {
      setEndIndex(clampedIndex);
    }
  };

  const handleEndIndexChange = (nextIndex: number) => {
    setIsActive(true);
    const clampedIndex = clampIndex(nextIndex);
    if (clampedIndex < startIndex) {
      setStartIndex(clampedIndex);
    }
    setEndIndex(clampedIndex);
  };

  const handleStartMinutesChange = (nextValue: number) => {
    setIsActive(true);
    const clampedMinutes = clamp(nextValue, 0, MINUTES_IN_DAY);
    setStartMinutes(clampedMinutes);
    if (startIndex === endIndex && clampedMinutes > endMinutes) {
      setEndMinutes(clampedMinutes);
    }
  };

  const handleEndMinutesChange = (nextValue: number) => {
    setIsActive(true);
    const clampedMinutes = clamp(nextValue, 0, MINUTES_IN_DAY);
    if (startIndex === endIndex && clampedMinutes < startMinutes) {
      setStartMinutes(clampedMinutes);
    }
    setEndMinutes(clampedMinutes);
  };

  const handleReset = () => {
    setStartIndex(0);
    setEndIndex(maxIndex);
    setStartMinutes(0);
    setEndMinutes(MINUTES_IN_DAY);
    setIsActive(false);
    setError(null);
    onReset();
  };

  const tooltipStartDate = indexToDate(startIndex);
  const tooltipEndDate = indexToDate(endIndex);
  const startTimeLabel = minutesToTimeLabel(startMinutes);
  const endTimeLabel = minutesToTimeLabel(endMinutes);

  const dateStartPercent = maxIndex === 0 ? 0 : (startIndex / maxIndex) * 100;
  const dateEndPercent = maxIndex === 0 ? 100 : (endIndex / maxIndex) * 100;
  const timeStartPercent = (startMinutes / MINUTES_IN_DAY) * 100;
  const timeEndPercent = (endMinutes / MINUTES_IN_DAY) * 100;

  const computeFillWidth = (startPercent: number, endPercent: number) => {
    const raw = endPercent - startPercent;
    const minVisible = raw <= 0 ? 0.8 : raw;
    const bounded = Math.min(minVisible, 100 - startPercent);
    return Math.max(bounded, 0);
  };

  const clampPercent = (percent: number) => clamp(percent, 0, 100);

  const dateFillWidth = computeFillWidth(dateStartPercent, dateEndPercent);
  const timeFillWidth = computeFillWidth(timeStartPercent, timeEndPercent);
  const dateStartPosition = clampPercent(dateStartPercent);
  const dateEndPosition = clampPercent(dateEndPercent);
  const timeStartPosition = clampPercent(timeStartPercent);
  const timeEndPosition = clampPercent(timeEndPercent);

  return (
    <div className="pointer-events-auto flex w-full flex-wrap items-end gap-3 rounded-lg bg-white/85 px-3 py-2 text-xs text-[#11234B] shadow-lg backdrop-blur-md md:w-auto">
      <div className="flex min-w-[240px] flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#0069CF]">Rentang Waktu</span>
        <p className="text-[11px] text-[#475569]">
          {`${formatDateLabel(tooltipStartDate)} — ${formatDateLabel(tooltipEndDate)}`}
        </p>
        <p className="text-[11px] text-[#475569]">
          {`${startTimeLabel} — ${endTimeLabel}`}
        </p>
        {isActive ? (
          <p className="text-[10px] font-medium text-[#1f2937]">
            {`${formatSummaryLabel(combinedStart)} — ${formatSummaryLabel(combinedEnd)}`}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-medium text-[#0f172a]">Tanggal</span>
          <div className="flex items-center justify-between text-[11px] text-[#475569]">
            <span>{formatDateLabel(tooltipStartDate)}</span>
            <span>{formatDateLabel(tooltipEndDate)}</span>
          </div>
          <div
            data-dual-slider
            className="relative flex h-16 w-72 items-center"
            aria-label="Rentang tanggal"
          >
            <div className="absolute left-0 h-[6px] w-full rounded-full bg-[#dbeafe]" />
            <div
              className="absolute h-[6px] rounded-full bg-[#0069CF]"
              style={{
                left: `${dateStartPosition}%`,
                width: `${dateFillWidth}%`,
              }}
            />
            <span
              className="pointer-events-none absolute left-0 top-1 -translate-y-full -translate-x-1/2 transform whitespace-nowrap rounded-md bg-[#0069CF] px-2 py-[2px] text-[10px] font-semibold text-white shadow-sm"
              style={{ left: `${dateStartPosition}%` }}
            >
              {formatDateLabel(tooltipStartDate)}
            </span>
            <span
              className="pointer-events-none absolute bottom-0 left-0 translate-y-full -translate-x-1/2 transform whitespace-nowrap rounded-md bg-[#0b83f0] px-2 py-[2px] text-[10px] font-semibold text-white shadow-sm"
              style={{ left: `${dateEndPosition}%` }}
            >
              {formatDateLabel(tooltipEndDate)}
            </span>
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={startIndex}
              onChange={(event) => handleStartIndexChange(Number(event.target.value))}
              aria-label="Tanggal awal"
            />
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={endIndex}
              onChange={(event) => handleEndIndexChange(Number(event.target.value))}
              aria-label="Tanggal akhir"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-[#0f172a]">Jam</span>
          <div className="flex items-center justify-between text-[11px] text-[#475569]">
            <span>{startTimeLabel}</span>
            <span>{endTimeLabel}</span>
          </div>
          <div
            data-dual-slider
            className="relative flex h-16 w-72 items-center"
            aria-label="Rentang jam"
          >
            <div className="absolute left-0 h-[6px] w-full rounded-full bg-[#dbeafe]" />
            <div
              className="absolute h-[6px] rounded-full bg-[#0069CF]"
              style={{
                left: `${timeStartPosition}%`,
                width: `${timeFillWidth}%`,
              }}
            />
            <span
              className="pointer-events-none absolute left-0 top-1 -translate-y-full -translate-x-1/2 transform whitespace-nowrap rounded-md bg-[#0069CF] px-2 py-[2px] text-[10px] font-semibold text-white shadow-sm"
              style={{ left: `${timeStartPosition}%` }}
            >
              {startTimeLabel}
            </span>
            <span
              className="pointer-events-none absolute bottom-0 left-0 translate-y-full -translate-x-1/2 transform whitespace-nowrap rounded-md bg-[#0b83f0] px-2 py-[2px] text-[10px] font-semibold text-white shadow-sm"
              style={{ left: `${timeEndPosition}%` }}
            >
              {endTimeLabel}
            </span>
            <input
              type="range"
              min={0}
              max={MINUTES_IN_DAY}
              step={15}
              value={startMinutes}
              onChange={(event) => handleStartMinutesChange(Number(event.target.value))}
              aria-label="Jam awal"
            />
            <input
              type="range"
              min={0}
              max={MINUTES_IN_DAY}
              step={15}
              value={endMinutes}
              onChange={(event) => handleEndMinutesChange(Number(event.target.value))}
              aria-label="Jam akhir"
            />
          </div>
        </div>
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
      </div>
      <style jsx>{`
        [data-dual-slider] input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          pointer-events: none;
          position: absolute;
          inset: 0;
          margin: 0;
        }

        [data-dual-slider] input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background-color: #ffffff;
          border: 2px solid #0069cf;
          box-shadow: 0 0 0 1px rgba(0, 105, 207, 0.35);
          pointer-events: auto;
        }

        [data-dual-slider] input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px rgba(0, 105, 207, 0.15);
        }

        [data-dual-slider] input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background-color: #ffffff;
          border: 2px solid #0069cf;
          box-shadow: 0 0 0 1px rgba(0, 105, 207, 0.35);
          pointer-events: auto;
        }

        [data-dual-slider] input[type="range"]::-moz-range-track {
          background: transparent;
        }

        [data-dual-slider] input[type="range"]::-ms-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background-color: #ffffff;
          border: 2px solid #0069cf;
          box-shadow: 0 0 0 1px rgba(0, 105, 207, 0.35);
          pointer-events: auto;
        }

        [data-dual-slider] input[type="range"]::-ms-track {
          background: transparent;
          border-color: transparent;
          color: transparent;
        }
      `}</style>
    </div>
  );
};

export default TimeRangeFilter;
