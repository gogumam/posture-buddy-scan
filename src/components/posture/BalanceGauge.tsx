import { cn } from "@/lib/utils";

/** Semi-circular gauge for the 0–100 balance index. */
export function BalanceGauge({
  score,
  label = "균형 지수",
  className,
}: {
  score: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 62;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("relative mx-auto w-[164px]", className)}>
      <svg viewBox="0 0 160 92" className="w-full" role="img" aria-label={`${label} ${clamped}점`}>
        <path
          d="M 18 80 A 62 62 0 0 1 142 80"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d="M 18 80 A 62 62 0 0 1 142 80"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-1 text-center">
        <div className="text-3xl font-semibold tabular-nums leading-none">{clamped}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
