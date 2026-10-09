import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ArrowDown } from "lucide-react";

import { PageHeader } from "@/components/posture/AppShell";
import { PantsFigure, SensorDemoNotice } from "@/components/pants/PantsViz";
import { Badge } from "@/components/ui/badge";
import { useSensorHub } from "@/hooks/use-sensor-hub";
import { ALL_SENSORS, SENSOR_SPECS } from "@/lib/sensor/devices";

const PrototypeViewer = lazy(() => import("@/components/pants/PrototypeViewer"));

export const Route = createFileRoute("/sensors")({
  head: () => ({
    meta: [
      { title: "웨어러블 설계 · 스마트 팬츠" },
      { name: "description", content: "스마트 팬츠의 골반 IMU 센서 위치, 역할, 데이터 흐름과 실시간 원시 센서 데이터를 확인합니다." },
      { property: "og:title", content: "웨어러블 설계 · 스마트 팬츠" },
      { property: "og:description", content: "센서 배치와 BLE → 센서 융합 → 지표 계산 데이터 흐름." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesignPage,
});

const FLOW = [
  { t: "IMU 센서 (팬츠 허리밴드)", d: "가속도·자이로·지자기 50Hz" },
  { t: "BLE 전송", d: "현재: Demo Sensor Mode · 향후: Web Bluetooth / 모바일 앱" },
  { t: "센서 융합", d: "Complementary 필터 → Madgwick / Mahony 교체 가능" },
  { t: "골반 각도 계산", d: "Roll · Pitch · Yaw, 좌·우 움직임" },
  { t: "비대칭 지표 · 기록", d: "기기 내 저장, 원시 데이터는 저장 안 함" },
];

const n = (v: number | undefined, d = 2) => (v === undefined ? "-" : v.toFixed(d));

function DesignPage() {
  const snap = useSensorHub();
  const status = Object.fromEntries(ALL_SENSORS.map((id) => [id, snap.devices[id].status]));
  const live = Object.values(snap.samples);

  return (
    <div>
      <PageHeader title="웨어러블 설계" subtitle="스마트 팬츠의 센서 배치와 데이터 흐름" />
      <div className="space-y-5 px-5 pb-6">
        <ClientOnly fallback={<div className="h-[540px] text-sm text-muted-foreground">3D 배치 비교 준비 중…</div>}>
          <Suspense fallback={<div className="h-[540px] text-sm text-muted-foreground" role="status">3D 배치 비교 준비 중…</div>}>
            <PrototypeViewer />
          </Suspense>
        </ClientOnly>
        <section className="surface-card p-5">
          <PantsFigure status={status} className="mx-auto max-w-[220px]" />
          <ul className="mt-3 space-y-3">
            {ALL_SENSORS.map((id) => {
              const s = SENSOR_SPECS[id];
              return (
                <li key={id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.label}</span>
                    {s.mvp ? <Badge variant="secondary">MVP</Badge> : <Badge variant="outline">확장</Badge>}
                  </div>
                  <p className="text-muted-foreground">{s.placement} — {s.role}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-semibold">데이터 흐름</h2>
          <ol className="mt-3 space-y-1">
            {FLOW.map((f, i) => (
              <li key={f.t}>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-sm font-semibold">{i + 1}. {f.t}</p>
                  <p className="text-xs text-muted-foreground">{f.d}</p>
                </div>
                {i < FLOW.length - 1 ? <ArrowDown className="mx-auto my-1 size-4 text-muted-foreground" aria-hidden /> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="surface-card p-5">
          <h2 className="font-semibold">실시간 센서 데이터</h2>
          {live.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">센서를 연결하면 원시 데이터가 표시됩니다.</p>
          ) : (
            <div className="mt-3 space-y-3 font-mono text-[11px] leading-relaxed">
              {live.map((s) => (
                <pre key={s.sensor_id} className="overflow-x-auto rounded-lg bg-muted p-3">
{`sensor_id: ${s.sensor_id}
timestamp: ${s.timestamp}
accel: ${n(s.accel_x)}, ${n(s.accel_y)}, ${n(s.accel_z)}
gyro:  ${n(s.gyro_x)}, ${n(s.gyro_y)}, ${n(s.gyro_z)}
mag:   ${n(s.mag_x, 1)}, ${n(s.mag_y, 1)}, ${n(s.mag_z, 1)}
quat:  ${n(s.quaternion_w, 3)}, ${n(s.quaternion_x, 3)}, ${n(s.quaternion_y, 3)}, ${n(s.quaternion_z, 3)}
r/p/y: ${n(s.roll, 1)}, ${n(s.pitch, 1)}, ${n(s.yaw, 1)}
battery: ${n(s.battery, 0)}  signal_quality: ${n(s.signal_quality, 0)}`}
                </pre>
              ))}
            </div>
          )}
        </section>
        <SensorDemoNotice />
      </div>
    </div>
  );
}
