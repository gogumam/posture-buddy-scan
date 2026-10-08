import { createFileRoute, Link } from "@tanstack/react-router";
import { Battery, Bluetooth, BluetoothOff, Loader2, Signal } from "lucide-react";

import { PageHeader } from "@/components/posture/AppShell";
import { PantsFigure, SensorDemoNotice } from "@/components/pants/PantsViz";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectedCount, useSensorHub } from "@/hooks/use-sensor-hub";
import { ALL_SENSORS, SENSOR_SPECS } from "@/lib/sensor/devices";
import { getHub } from "@/lib/sensor/hub";
import { isWebBluetoothAvailable } from "@/lib/sensor/sources";
import type { ConnectionStatus } from "@/lib/sensor/types";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "센서 연결 · 스마트 팬츠" },
      { name: "description", content: "스마트 팬츠의 중앙·좌측·우측 골반 IMU 센서 연결 상태, 배터리, 신호 품질을 확인합니다." },
      { property: "og:title", content: "센서 연결 · 스마트 팬츠" },
      { property: "og:description", content: "골반 IMU 3개의 블루투스 연결 상태를 확인하세요." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectPage,
});

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: "연결 안 됨",
  scanning: "검색 중",
  connecting: "연결 중",
  connected: "연결됨",
};

function ConnectPage() {
  const snap = useSensorHub();
  const hub = getHub();
  const n = connectedCount(snap);
  const status = Object.fromEntries(ALL_SENSORS.map((id) => [id, snap.devices[id].status]));

  return (
    <div>
      <PageHeader title="센서 연결" subtitle="팬츠를 착용한 뒤 골반 센서 3개를 연결하세요." />
      <div className="space-y-5 px-5 pb-6">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{snap.mode === "demo" ? "Demo Sensor Mode" : "Web Bluetooth"}</Badge>
            <span className="text-sm font-semibold">{n}/3 연결됨</span>
          </div>
          <PantsFigure status={status} className="mx-auto mt-2 max-w-[220px]" />
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" className="h-14 text-base" onClick={() => hub.connectAll()} disabled={n === 3}>
              <Bluetooth className="size-5" /> 모두 연결
            </Button>
            <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => hub.disconnectAll()} disabled={n === 0}>
              <BluetoothOff className="size-5" /> 연결 해제
            </Button>
          </div>
          {n === 3 ? (
            <Button asChild size="lg" variant="secondary" className="mt-2 h-14 w-full text-base">
              <Link to="/pelvis">골반 측정 시작</Link>
            </Button>
          ) : null}
        </section>

        <ul className="space-y-3">
          {ALL_SENSORS.map((id) => {
            const spec = SENSOR_SPECS[id];
            const d = snap.devices[id];
            const busy = d.status === "scanning" || d.status === "connecting";
            return (
              <li key={id} className={`surface-card p-4 ${spec.mvp ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{spec.name}</p>
                    <p className="text-sm text-muted-foreground">{spec.label} · {spec.placement}</p>
                  </div>
                  {spec.mvp ? (
                    <Badge variant={d.status === "connected" ? "default" : "outline"}>
                      {busy ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">확장 예정</Badge>
                  )}
                </div>
                {spec.mvp ? (
                  <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Battery className="size-4" />{Math.round(d.battery)}%</span>
                      <span className="inline-flex items-center gap-1"><Signal className="size-4" />{d.status === "connected" ? `${Math.round(d.signalQuality)}%` : "-"}</span>
                      <span>{d.sampleRateHz ? `${d.sampleRateHz}Hz` : "-"}</span>
                    </div>
                    {d.status === "connected" ? (
                      <Button size="sm" variant="ghost" onClick={() => hub.disconnect(id)}>해제</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => hub.connect(id)}>연결</Button>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground">
          {isWebBluetoothAvailable()
            ? "이 브라우저는 Web Bluetooth를 지원합니다. 실제 하드웨어 연동 시 바로 사용할 수 있도록 준비되어 있습니다."
            : "이 브라우저는 Web Bluetooth를 지원하지 않습니다. 실제 기기는 향후 모바일 앱의 블루투스 연결로 지원 예정입니다."}
        </p>
        <SensorDemoNotice />
      </div>
    </div>
  );
}
