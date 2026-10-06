import { createFileRoute } from "@tanstack/react-router";
import { Bluetooth, Watch } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/posture/AppShell";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockImuSamples } from "@/lib/posture-store";
import type { ImuSample } from "@/lib/posture-types";

export const Route = createFileRoute("/sensors")({
  head: () => ({
    meta: [
      { title: "센서 연동 준비 · 바른자세 스크리닝" },
      {
        name: "description",
        content:
          "향후 BLE IMU 센서와 스마트워치 데이터를 받기 위한 데이터 구조(timestamp, sensor_id, accel, gyro, roll/pitch/yaw)를 가상 데이터로 미리 확인합니다.",
      },
      { property: "og:title", content: "센서 연동 준비 · 바른자세 스크리닝" },
      {
        property: "og:description",
        content: "웨어러블 IMU 확장을 위한 센서 데이터 구조 미리보기.",
      },
    ],
  }),
  component: SensorsPage,
});

function SensorsPage() {
  const [samples, setSamples] = useState<ImuSample[]>([]);

  return (
    <div>
      <PageHeader
        title="센서 연동 준비"
        subtitle="아직 실제 기기와 연결되지 않았습니다. 가상 데이터로 구조만 보여드려요."
      />

      <div className="space-y-5 px-5">
        <section className="surface-card p-5">
          <div className="flex items-center gap-3">
            <Bluetooth className="size-7 text-primary" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-semibold">BLE IMU 센서</p>
              <p className="text-xs text-muted-foreground">골반 부착형 6축 센서</p>
            </div>
            <Badge variant="secondary">준비 중</Badge>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <Watch className="size-7 text-primary" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-semibold">스마트워치</p>
              <p className="text-xs text-muted-foreground">걸음·활동 데이터 연동 예정</p>
            </div>
            <Badge variant="secondary">준비 중</Badge>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">수집 예정 데이터 구조</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            센서가 연결되면 아래 형태의 샘플이 실시간으로 들어오고, 카메라 측정과 같은 기록에 함께
            저장됩니다.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              "timestamp",
              "sensor_id",
              "accel_x / y / z",
              "gyro_x / y / z",
              "roll",
              "pitch",
              "yaw",
            ].map((f) => (
              <li key={f} className="rounded-lg bg-muted px-3 py-2 font-medium">
                {f}
              </li>
            ))}
          </ul>

          <Button
            variant="outline"
            size="lg"
            className="mt-4 h-14 w-full"
            onClick={() => setSamples(mockImuSamples())}
          >
            가상 센서 데이터 생성
          </Button>

          {samples.length > 0 ? (
            <div className="mt-4 max-h-72 overflow-auto rounded-lg border border-border">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-2 py-2 font-semibold">시각</th>
                    <th className="px-2 py-2 font-semibold">roll</th>
                    <th className="px-2 py-2 font-semibold">pitch</th>
                    <th className="px-2 py-2 font-semibold">yaw</th>
                    <th className="px-2 py-2 font-semibold">accel_y</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((s, i) => (
                    <tr key={i} className="border-t border-border tabular-nums">
                      <td className="px-2 py-1.5">{s.timestamp.slice(11, 23)}</td>
                      <td className="px-2 py-1.5">{s.roll}</td>
                      <td className="px-2 py-1.5">{s.pitch}</td>
                      <td className="px-2 py-1.5">{s.yaw}</td>
                      <td className="px-2 py-1.5">{s.accel_y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <Disclaimer variant="demo" />
        <Disclaimer variant="medical" />
      </div>
    </div>
  );
}
