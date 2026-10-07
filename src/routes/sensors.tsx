import { createFileRoute } from "@tanstack/react-router";
import { Activity, ArrowRight, Battery, Bluetooth, Shirt } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/posture/AppShell";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockImuSamples } from "@/lib/posture-store";
import type { ImuSample } from "@/lib/posture-types";

export const Route = createFileRoute("/sensors")({
  head: () => ({
    meta: [
      { title: "스마트 팬츠 센서 · 바른자세 스크리닝" },
      {
        name: "description",
        content: "스마트 팬츠의 골반 IMU 센서 위치와 가상 센서 데이터를 확인합니다. 실제 BLE 기기는 아직 연결되지 않습니다.",
      },
      { property: "og:title", content: "스마트 팬츠 센서 · 바른자세 스크리닝" },
      { property: "og:description", content: "좌·우·중앙 골반 IMU 센서를 활용한 데모 화면입니다." },
    ],
  }),
  component: SensorsPage,
});

const sensors = [
  { id: "left", name: "왼쪽 골반", position: "좌측 장골 부근", battery: 92 },
  { id: "center", name: "중앙 골반", position: "허리 뒤쪽 중앙", battery: 86 },
  { id: "right", name: "오른쪽 골반", position: "우측 장골 부근", battery: 78 },
];

function SensorsPage() {
  const [samples, setSamples] = useState<ImuSample[]>([]);
  const latest = samples[samples.length - 1];
  const isDemoActive = samples.length > 0;

  return (
    <div>
      <PageHeader
        title="스마트 팬츠 센서"
        subtitle="골반에 배치된 IMU 센서로 자세와 움직임을 살펴봅니다."
      />

      <div className="space-y-5 px-5 pb-6">
        <section className="surface-card overflow-hidden p-5" aria-labelledby="pants-title">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shirt className="size-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="pants-title" className="text-base font-semibold">골반 IMU 배치</h2>
                <Badge variant="secondary">3개 센서</Badge>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                스마트 팬츠 허리밴드의 좌·우와 중앙에 센서를 둔 구성입니다.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{sensor.name}</span>
                  <span className="size-2 rounded-full bg-emerald-500" aria-label="데모 센서 준비됨" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{sensor.position}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Battery className="size-4" aria-hidden />
                  <span>배터리 예시 {sensor.battery}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl bg-muted/70 p-3 text-xs leading-relaxed text-muted-foreground">
            <Bluetooth className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <p><strong className="text-foreground">실제 블루투스 연결은 아직 지원하지 않습니다.</strong> 아래 데모를 시작하면 화면 검토용 가상 센서 데이터가 표시됩니다.</p>
          </div>
        </section>

        <section className="surface-card p-5" aria-labelledby="demo-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="demo-title" className="text-base font-semibold">가상 센서 데모</h2>
              <p className="mt-1 text-xs text-muted-foreground">실제 신체 측정값이나 의료 분석 결과가 아닙니다.</p>
            </div>
            <Badge variant={isDemoActive ? "default" : "secondary"}>
              {isDemoActive ? "데모 실행 중" : "대기 중"}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {([
              ["Roll", "좌우 기울기", latest?.roll],
              ["Pitch", "전후 기울기", latest?.pitch],
              ["Yaw", "회전", latest?.yaw],
            ] as const).map(([axis, label, value]) => (
              <div key={axis} className="rounded-xl bg-muted/70 p-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">{axis}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{value === undefined ? "—" : String(value.toFixed(1)) + "°"}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button className="h-12 flex-1" onClick={() => setSamples(mockImuSamples())}>
              <Activity className="mr-2 size-4" aria-hidden />
              데모 데이터 불러오기
            </Button>
            {isDemoActive ? (
              <Button variant="outline" className="h-12" onClick={() => setSamples([])}>
                데모 초기화
              </Button>
            ) : null}
          </div>

          {isDemoActive ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between bg-muted/70 px-3 py-2 text-xs">
                <span className="font-medium">IMU 샘플 미리보기</span>
                <span className="text-muted-foreground">{samples.length}개 샘플 · 가상 데이터</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] tabular-nums">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">시각</th>
                      <th className="px-3 py-2 font-medium">Roll</th>
                      <th className="px-3 py-2 font-medium">Pitch</th>
                      <th className="px-3 py-2 font-medium">Yaw</th>
                      <th className="px-3 py-2 font-medium">가속도 Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.slice(-5).reverse().map((sample, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="px-3 py-2">{sample.timestamp.slice(11, 19)}</td>
                        <td className="px-3 py-2">{sample.roll}°</td>
                        <td className="px-3 py-2">{sample.pitch}°</td>
                        <td className="px-3 py-2">{sample.yaw}°</td>
                        <td className="px-3 py-2">{sample.accel_y}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface-card p-5" aria-labelledby="flow-title">
          <h2 id="flow-title" className="text-base font-semibold">측정 데이터 흐름</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {["골반 IMU", "가상 BLE 데이터", "센서 융합", "자세 지표"].map((step, index) => (
              <div key={step} className="flex items-center gap-2 rounded-lg bg-muted/70 px-3 py-3 text-xs font-medium">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{index + 1}</span>
                <span>{step}</span>
                {index < 3 ? <ArrowRight className="ml-auto size-3 text-muted-foreground" aria-hidden /> : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            현재는 BLE 연결과 센서 융합이 시뮬레이션 단계입니다. 실제 하드웨어가 연결되면 이 화면의 입력 계층을 교체할 수 있도록 준비 중입니다.
          </p>
        </section>

        <Disclaimer variant="demo" />
        <Disclaimer variant="medical" />
      </div>
    </div>
  );
}
