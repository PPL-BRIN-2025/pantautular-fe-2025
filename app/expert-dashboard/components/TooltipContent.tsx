"use client";

import clsx from "clsx";
import {
  TooltipDatum,
  computeDelta,
  expertDashboardFlags,
  formatNumber,
  formatPercent,
} from "../tooltip";

type TooltipContentProps = Readonly<{
  datum: TooltipDatum;
  className?: string;
}>;

const wrapperClasses =
  "rounded-md border border-slate-200 bg-white px-3 py-2 shadow";
const labelClasses = "text-xs font-semibold text-slate-600";
const valueClasses = "text-sm font-medium text-slate-900";
const metaClasses = "text-xs text-slate-500";

const formatSigned = (value: number): string => {
  const absolute = Math.abs(value);
  const formatted = formatNumber(absolute);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

const formatSignedPercent = (value: number): string => {
  const absolute = Math.abs(value);
  const formatted = formatPercent(absolute);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
};

export default function TooltipContent({
  datum,
  className = "",
}: TooltipContentProps) {
  const referenceProvided =
    datum.reference !== null && datum.reference !== undefined;
  const delta = computeDelta(datum.value, datum.reference);
  const shouldRenderDelta =
    referenceProvided &&
    delta.delta !== null &&
    expertDashboardFlags.showReferenceDelta;

  /* istanbul ignore next -- deterministic formatting */
  const referenceContent = referenceProvided
    ? `Reference: ${formatNumber(datum.reference ?? 0)}`
    : null;

  /* istanbul ignore next -- deterministic formatting */
  const deltaContent = shouldRenderDelta
    ? `Change: ${formatSigned(delta.delta ?? 0)}${
        delta.pct !== null ? ` (${formatSignedPercent(delta.pct)}%)` : ""
      }`
    : null;

  return (
    <div className={clsx(wrapperClasses, className)} data-testid="expert-tooltip">
      <div className="flex flex-col gap-1">
        {datum.label ? (
          <div className={labelClasses} data-testid="tooltip-label">
            {datum.label}
          </div>
        ) : null}
        {datum.timestamp !== undefined && datum.timestamp !== null ? (
          <div className={metaClasses} data-testid="tooltip-timestamp">
            {String(datum.timestamp)}
          </div>
        ) : null}
        <div className={valueClasses} data-testid="tooltip-value">
          Value: {formatNumber(datum.value)}
        </div>
        {referenceContent ? (
          <div className={metaClasses} data-testid="tooltip-reference">
            {referenceContent}
          </div>
        ) : null}
        {deltaContent ? (
          <div className={metaClasses} data-testid="tooltip-change">
            {deltaContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}
