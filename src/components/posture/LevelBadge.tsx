import { LEVEL_LABEL, type AsymmetryLevel } from "@/lib/posture-types";
import { cn } from "@/lib/utils";

const styles: Record<AsymmetryLevel, string> = {
  low: "bg-calm-soft text-calm-foreground",
  moderate: "bg-primary-soft text-primary",
  observe: "bg-attention-soft text-attention-foreground",
};

export function LevelBadge({
  level,
  className,
  size = "sm",
}: {
  level: AsymmetryLevel;
  className?: string;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        styles[level],
        className,
      )}
    >
      {LEVEL_LABEL[level]}
    </span>
  );
}
