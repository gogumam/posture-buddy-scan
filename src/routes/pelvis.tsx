import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Play, Square } from "lucide-react";
import { useState } from "react";
import { Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/posture/AppShell";
import { AxisDial, PantsFigure, SensorDemoNotice } from "@/components/pants/PantsViz";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { connectedCount, useSensorHub } from "@/hooks/use-sensor-hub";
import { saveSession } from "@/lib/pelvis-store";
import { ALL_SENSORS } from "@/lib/sensor/devices";
import { getHub } from "@/lib/sensor/hub";
import { TAG_LABEL, TEST_META } from "@/lib/sensor/metrics";
import type { SessionTag, TestType } from "@/lib/sensor/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pelvis")({
  head: () => ({
    meta: [
      { title: "골반 측정 · 스마트 팬츠" },
      { name: "description", content: "실시간 Roll·Pitch·Yaw 그래프로 정적 서기, 걷기, 스쿼트, 한발 서기 중 골반 비대칭 지표를 측정합니다." },
      { property: "og:title", content: "골반 측정 · 스마트 팬츠" },
      { property: "og:description", content: "스마트 팬츠 IMU로 동작 중 골반 움직임을 실시간 확인합니다." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PelvisPage,
});

const TESTS: TestType[] = ["static", "walk", "squat", "single_leg"];
const TAGS: SessionTag[] = ["baseline", "pre_exercise", "post_exercise"];

function PelvisPage() {
  const snap = useSensorHub();
  const hub = getHub();
  const navigate = useNavigate();
  const [tag, setTag] = useState<SessionTag>("baseline");
  const n = connectedCount(snap);
  const f = snap.frame;
  const rec = snap.recording;
  const test = snap.test;
  const status = Object.fromEntries(ALL_SENSORS.map((id) => [id, snap.devices[id].status]));
  const t0 = snap.history[0]?.t ?? 0;
  const chart = snap.history.filter((_, i) => i % 2 === 0).map((h) => ({
    t: +(h.t - t0).toFixed(1),
    Roll: +h.roll.toFixed(1),
    Pitch: +h.pitch.toFixed(1),
    Yaw: +h.yaw.toFixed(1),
  }));

  const start = async () => {
    try {
      const s = await hub.startRecording({ test, tag, durationSec: TEST_META[test].durationSec });
      saveSession(s);
      navigate({ to: "/session/$id", params: { id: s.id } });
    } catch {
      /* cancelled */
    }
  };

  if (n === 0) {
    return (
      <div>
        <PageHeader title="골반 측정" />
        <div className="space-y-4 px-5">
          <div className="surface-card p-6 text-center">
            <PantsFigure status={status} className="mx-auto max-w-[180px]" />
            <p className="mt-2 font-semibold">센서가 연결되어 있지 않아요</p>
            <p className="mt-1 text-sm text-muted-foreground">팬츠를 착용하고 센서를 먼저 연결해 주세요.</p>
            <Button asChild size="lg" className="mt-4 h-14 w-full text-base"><Link to="/connect">센서 연결하기</Link></Button>
          </div>
          <SensorDemoNotice />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="골반 측정" subtitle={`${n}/3 센서 연결 · 필터: ${snap.filterName}`} />
      <div className="space-y-5 px-5 pb-6">
        <section aria-label="측정 동작">
          <div className="grid grid-cols-4 gap-2">
            {TESTS.map((t) => (
              <button
                key={t}
                disabled={!!rec}
                onClick={() => hub.setTest(t)}
                className={cn(
                  "min-h-12 rounded-xl border text-sm font-medium",
                  t === test ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                {TEST_META[t].short}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{TEST_META[test].guide}</p>
        </section>

        <section className="surface-card p-4">
          <PantsFigure status={status} roll={f?.roll ?? 0} className="mx-auto max-w-[200px]" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <AxisDial label="Roll" sub="좌우 기울기" value={f?.roll ?? 0} />
            <AxisDial label="Pitch" sub="전후 기울기" value={f?.pitch ?? 0} range={20} />
            <AxisDial label="Yaw" sub="회전" value={f?.yaw ?? 0} />
          </div>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">최근 10초 각도 그래프</h2>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ left: -20, right: 4 }}>
                <XAxis dataKey="t" hide />
                <YAxis fontSize={11} domain={["auto", "auto"]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="Roll" stroke="var(--chart-1)" dot={false} isAnimationActive={false} strokeWidth={2} />
                <Line dataKey="Pitch" stroke="var(--chart-2)" dot={false} isAnimationActive={false} strokeWidth={2} />
                <Line dataKey="Yaw" stroke="var(--chart-3)" dot={false} isAnimationActive={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {f ? (
            <p className="mt-1 text-xs text-muted-foreground">
              좌측 Pitch {f.leftPitch.toFixed(1)}° · 우측 Pitch {f.rightPitch.toFixed(1)}° · 신호 {Math.round(f.quality)}%
            </p>
          ) : null}
        </section>

        <section className="surface-card space-y-3 p-4">
          <h2 className="text-sm font-semibold">측정 구분</h2>
          <div className="grid grid-cols-3 gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                disabled={!!rec}
                onClick={() => setTag(t)}
                className={cn("min-h-11 rounded-xl border text-sm", t === tag ? "border-primary bg-primary-soft font-semibold text-primary" : "border-border")}
              >
                {TAG_LABEL[t]}
              </button>
            ))}
          </div>
          {rec ? (
            <>
              <Progress value={(rec.elapsedSec / rec.durationSec) * 100} />
              <p className="text-center text-sm">{TEST_META[rec.test].label} 측정 중… {Math.max(0, Math.ceil(rec.durationSec - rec.elapsedSec))}초 남음</p>
              <Button size="lg" variant="outline" className="h-14 w-full text-base" onClick={() => hub.cancelRecording()}>
                <Square className="size-5" /> 측정 취소
              </Button>
            </>
          ) : (
            <Button size="lg" className="h-14 w-full text-base" onClick={start}>
              <Play className="size-5" /> {TEST_META[test].durationSec}초 측정 시작
            </Button>
          )}
        </section>
        <SensorDemoNotice />
      </div>
    </div>
  );
}
