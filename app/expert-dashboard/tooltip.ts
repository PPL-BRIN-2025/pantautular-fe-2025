"use client";

export type TooltipDatum = {
  value: number;
  reference?: number | null;
  label?: string;
  timestamp?: string | number;
};

export const expertDashboardFlags = {
  showReferenceDelta: true,
};

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const coerceNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
};

const coerceOptionalNumber = (
  value: unknown
): number | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return numberFormatter.format(value);
};

const formatSignedNumber = (value: number): string => {
  const absolute = Math.abs(value);
  const formatted = formatNumber(absolute);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) return "0";
  return percentFormatter.format(value);
};

const formatSignedPercent = (value: number): string => {
  const absolute = Math.abs(value);
  const formatted = formatPercent(absolute);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export const computeDelta = (
  value: number,
  reference?: number | null
): { delta: number | null; pct: number | null } => {
  if (reference === null || reference === undefined) {
    return { delta: null, pct: null };
  }

  const delta = value - reference;
  if (reference === 0) {
    return { delta, pct: null };
  }

  const pct = (delta / reference) * 100;
  return { delta, pct };
};

const LABEL_KEYS = [
  "label",
  "name",
  "portal",
  "segment",
  "category",
  "source",
] as const;

const VALUE_KEYS = ["value", "count", "total", "amount"] as const;

const REFERENCE_KEYS = [
  "reference",
  "baseline",
  "previous",
  "prev",
  "prior",
] as const;

const TIMESTAMP_KEYS = [
  "timestamp",
  "date",
  "period",
  "week",
  "time",
] as const;

const pickFirstKey = <T extends readonly string[]>(
  raw: Record<string, unknown>,
  keys: T
): unknown => {
  for (const key of keys) {
    if (key in raw) return raw[key];
  }
  return undefined;
};

export const mapToTooltipDatum = (
  raw: Record<string, unknown>
): TooltipDatum => {
  const value = coerceNumber(pickFirstKey(raw, VALUE_KEYS));
  const reference = coerceOptionalNumber(
    pickFirstKey(raw, REFERENCE_KEYS)
  );
  const labelValue = pickFirstKey(raw, LABEL_KEYS);
  const timestampValue = pickFirstKey(raw, TIMESTAMP_KEYS);

  return {
    value,
    reference,
    label:
      typeof labelValue === "string"
        ? labelValue
        : labelValue !== undefined
        ? String(labelValue)
        : undefined,
    timestamp:
      timestampValue !== undefined
        ? (timestampValue as string | number)
        : undefined,
  };
};

const formatTimestamp = (timestamp: string | number): string => {
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return String(timestamp);
};

export const formatTooltipLines = (
  datum: TooltipDatum
): string[] => {
  const lines: string[] = [];

  const label = datum.label?.trim();
  if (label) {
    lines.push(label);
  }

  if (datum.timestamp !== undefined && datum.timestamp !== null) {
    lines.push(formatTimestamp(datum.timestamp));
  }

  lines.push(`Value: ${formatNumber(datum.value)}`);

  if (datum.reference !== null && datum.reference !== undefined) {
    lines.push(`Reference: ${formatNumber(datum.reference)}`);

    if (expertDashboardFlags.showReferenceDelta) {
      const { delta, pct } = computeDelta(
        datum.value,
        datum.reference
      );
      if (delta !== null) {
        let changeLine = `Change: ${formatSignedNumber(delta)}`;
        if (pct !== null) {
          changeLine += ` (${formatSignedPercent(pct)}%)`;
        }
        lines.push(changeLine);
      }
    }
  }

  return lines;
};
