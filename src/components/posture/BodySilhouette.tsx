import { cn } from "@/lib/utils";

/**
 * Simple front-view body silhouette that visualises shoulder line, pelvis line
 * and trunk axis. Angles/offsets are exaggerated for readability.
 */
export function BodySilhouette({
  shoulderDiff = 0,
  pelvisDiff = 0,
  trunkTilt = 0,
  className,
}: {
  /** mm, positive = right higher */
  shoulderDiff?: number;
  pelvisDiff?: number;
  /** degrees, positive = leaning right */
  trunkTilt?: number;
  className?: string;
}) {
  const sh = Math.max(-14, Math.min(14, shoulderDiff * 0.6));
  const pv = Math.max(-12, Math.min(12, pelvisDiff * 0.6));
  const tilt = Math.max(-8, Math.min(8, trunkTilt * 1.2));

  const shoulderY = 56;
  const pelvisY = 120;
  const halfW = 30;

  return (
    <svg
      viewBox="0 0 160 260"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="자세 시각화: 어깨선, 골반선, 몸통 축"
    >
      {/* vertical reference */}
      <line
        x1="80"
        y1="14"
        x2="80"
        y2="248"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />

      <g transform={`rotate(${tilt} 80 ${pelvisY})`}>
        {/* head */}
        <circle cx="80" cy="30" r="16" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" />
        {/* torso */}
        <path
          d={`M ${80 - halfW} ${shoulderY - sh / 2}
              L ${80 + halfW} ${shoulderY + sh / 2}
              L ${80 + halfW - 6} ${pelvisY + pv / 2}
              L ${80 - halfW + 6} ${pelvisY - pv / 2} Z`}
          fill="var(--primary-soft)"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* arms */}
        <line
          x1={80 - halfW}
          y1={shoulderY - sh / 2}
          x2={80 - halfW - 10}
          y2={pelvisY + 14}
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1={80 + halfW}
          y1={shoulderY + sh / 2}
          x2={80 + halfW + 10}
          y2={pelvisY + 14}
          stroke="var(--primary)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.5"
        />
        {/* shoulder line */}
        <line
          x1={80 - halfW - 8}
          y1={shoulderY - sh / 2}
          x2={80 + halfW + 8}
          y2={shoulderY + sh / 2}
          stroke="var(--attention)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* pelvis line */}
        <line
          x1={80 - halfW - 4}
          y1={pelvisY - pv / 2}
          x2={80 + halfW + 4}
          y2={pelvisY + pv / 2}
          stroke="var(--calm)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* legs */}
        <line
          x1={80 - 14}
          y1={pelvisY - pv / 2 + 4}
          x2={80 - 16}
          y2="238"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.45"
        />
        <line
          x1={80 + 14}
          y1={pelvisY + pv / 2 + 4}
          x2={80 + 16}
          y2="238"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>

      <text x="6" y={shoulderY - 10} fontSize="10" fill="var(--muted-foreground)">
        어깨선
      </text>
      <text x="6" y={pelvisY + 22} fontSize="10" fill="var(--muted-foreground)">
        골반선
      </text>
    </svg>
  );
}

/** Top-down pelvis ring showing left/right height difference and rotation. */
export function PelvisDiagram({
  pelvisDiff = 0,
  rotation = 0,
  className,
}: {
  pelvisDiff?: number;
  rotation?: number;
  className?: string;
}) {
  const pv = Math.max(-14, Math.min(14, pelvisDiff * 0.8));
  const rot = Math.max(-14, Math.min(14, rotation * 1.6));

  return (
    <svg
      viewBox="0 0 200 120"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label="골반 좌우 높이와 회전 시각화"
    >
      <line x1="20" y1="60" x2="180" y2="60" stroke="var(--border)" strokeWidth="1.5" strokeDasharray="4 6" />
      <g transform={`rotate(${rot} 100 60)`}>
        <path
          d={`M 40 ${60 - pv / 2} Q 100 ${34} 160 ${60 + pv / 2}`}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="40" cy={60 - pv / 2} r="9" fill="var(--calm)" />
        <circle cx="160" cy={60 + pv / 2} r="9" fill="var(--attention)" />
        <line x1="100" y1="46" x2="100" y2="92" stroke="var(--primary)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <text x="22" y="104" fontSize="11" fill="var(--muted-foreground)">
        좌
      </text>
      <text x="168" y="104" fontSize="11" fill="var(--muted-foreground)">
        우
      </text>
    </svg>
  );
}
