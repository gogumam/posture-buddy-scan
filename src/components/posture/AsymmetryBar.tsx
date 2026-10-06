import { METRIC_META, levelOf, type MetricKey } from "@/lib/posture-types";
import { cn } from "@/lib/utils";
import { LevelBadge } from "./LevelBadge";

/** Centre-anchored bar: left/right deviation from a symmetric midline. */
export function AsymmetryBar({
  metricKey,
  value,
  compact = false,
}: {
  metricKey: MetricKey;
  value: number;
  compact?: boolean;
}) {
  const meta = METRIC_META[metricKey];
  const level = levelOf(metricKey, value);
  const ratio = Math.min(1, Math.abs(value) / meta.scaleMax);
  const width = `${ratio * 50}%`;
  const toRight = value >= 0;

  const fill =
    level === "observe" ? "bg-attention" : level === "moderate" ? "bg-primary" : "bg-calm";

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-medium", compact ? "text-sm" : "text-base")}>{meta.label}</span>
        <span className="flex items-center gap-2">
          <span className="text-sm tabular-nums text-muted-foreground">
            {Math.abs(value).toFixed(1)}
            {meta.unit}
          </span>
          <LevelBadge level={level} />
        </span>
      </div>

      <div className="relative h-3 w-full rounded-full bg-muted" aria-hidden>
        <div className="absolute left-1/2 top-[-3px] h-[18px] w-0.5 -translate-x-1/2 rounded bg-border" />
        <div
          className={cn("absolute top-0 h-3 rounded-full transition-all duration-500", fill)}
          style={toRight ? { left: "50%", width } : { right: "50%", width }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{meta.leftLabel}</span>
        <span className={cn("font-medium", Math.abs(value) > meta.lowThreshold && "text-foreground")}>
          {Math.abs(value) <= meta.lowThreshold
            ? "거의 대칭"
            : toRight
              ? meta.rightLabel
              : meta.leftLabel}
        </span>
        <span>{meta.rightLabel}</span>
      </div>
    </div>
  );
}
