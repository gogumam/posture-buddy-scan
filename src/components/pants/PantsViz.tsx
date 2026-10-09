import { cn } from "@/lib/utils";
import type { ConnectionStatus, SensorId } from "@/lib/sensor/types";

const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/** Smart pants front view with sensor dots. Pelvis band tilts with roll. */
export function PantsFigure({
  status,
  roll = 0,
  highlight,
  className,
}: {
  status: Partial<Record<SensorId, ConnectionStatus>>;
  roll?: number;
  highlight?: SensorId;
  className?: string;
}) {
  const dot = (id: SensorId, x: number, y: number) => {
    const s = status[id] ?? "disconnected";
    const fill =
      s === "connected"
        ? "var(--calm)"
        : s === "disconnected"
          ? "var(--muted-foreground)"
          : "var(--primary)";
    return (
      <g key={id}>
        {s !== "disconnected" && s !== "connected" ? (
          <circle cx={x} cy={y} r={11} fill="none" stroke={fill} strokeWidth={2} className="animate-ping origin-center" style={{ transformBox: "fill-box" }} />
        ) : null}
        <circle cx={x} cy={y} r={highlight === id ? 9 : 7} fill={fill} stroke="var(--card)" strokeWidth={3} />
      </g>
    );
  };
  const r = clamp(roll, 10);
  return (
    <svg viewBox="0 0 200 220" className={cn("w-full", className)} role="img" aria-label="스마트 팬츠 센서 배치도">
      {/* legs */}
      <path d="M48 70 L40 210 L92 210 L100 110 L108 210 L160 210 L152 70 Z" fill="var(--secondary)" stroke="var(--border)" strokeWidth={2} />
      {/* thigh slots (future) */}
      <circle cx={68} cy={150} r={6} fill="none" stroke="var(--muted-foreground)" strokeDasharray="3 3" />
      <circle cx={132} cy={150} r={6} fill="none" stroke="var(--muted-foreground)" strokeDasharray="3 3" />
      <g transform={`rotate(${-r * 2} 100 55)`} style={{ transition: "transform 120ms linear" }}>
        <rect x={44} y={40} width={112} height={30} rx={8} fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth={2} />
        <line x1={30} y1={55} x2={170} y2={55} stroke="var(--primary)" strokeDasharray="4 4" opacity={0.5} />
        {dot("pelvis_left", 60, 55)}
        {dot("pelvis_center", 100, 55)}
        {dot("pelvis_right", 140, 55)}
      </g>
      <text x={60} y={30} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">L</text>
      <text x={100} y={30} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">C</text>
      <text x={140} y={30} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">R</text>
    </svg>
  );
}

/** One axis dial for roll / pitch / yaw. */
export function AxisDial({ label, sub, value, range = 15 }: { label: string; sub: string; value: number; range?: number }) {
  const a = clamp(value, range) * (60 / range);
  return (
    <div className="surface-card flex flex-col items-center p-3">
      <svg viewBox="0 0 100 60" className="w-full max-w-[110px]" aria-hidden>
        <path d="M10 55 A40 40 0 0 1 90 55" fill="none" stroke="var(--muted)" strokeWidth={8} strokeLinecap="round" />
        <line
          x1={50}
          y1={55}
          x2={50}
          y2={20}
          stroke="var(--primary)"
          strokeWidth={4}
          strokeLinecap="round"
          transform={`rotate(${a} 50 55)`}
          style={{ transition: "transform 120ms linear" }}
        />
        <circle cx={50} cy={55} r={5} fill="var(--primary)" />
      </svg>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}°
      </p>
      <p className="text-xs font-semibold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export function SensorDemoNotice({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-primary/30 bg-primary-soft p-4 text-sm", className)} role="note">
      <p className="font-semibold text-primary">Demo Sensor Mode · 가상 센서 데이터</p>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        실제 BLE 센서 연결은 아직 없습니다. 지금 표시되는 모든 센서 값과 지표는 가상 데모 데이터이며, 실측이 아니므로
        의료 진단이나 참고 판단에 사용할 수 없습니다.
      </p>
    </div>
  );
}
