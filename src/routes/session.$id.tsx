import { createFileRoute, Link } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts";

import { PageHeader } from "@/components/posture/AppShell";
import { BalanceGauge } from "@/components/posture/BalanceGauge";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { LevelBadge } from "@/components/posture/LevelBadge";
import { SensorDemoNotice } from "@/components/pants/PantsViz";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/hooks/use-sensor-hub";
import {
  PELVIS_METRICS,
  PELVIS_METRIC_ORDER,
  TAG_LABEL,
  TEST_META,
  directionLabel,
  formatMetric,
  levelOfPelvis,
} from "@/lib/sensor/metrics";

export const Route = createFileRoute("/session/$id")({
  head: () => ({
    meta: [
      { title: "골반 측정 결과 · 스마트 팬츠" },
      { name: "description", content: "골반 좌우 기울기, 전후 기울기, 회전 비대칭, 좌우 움직임 차이 등 자세 비대칭 지표 결과입니다." },
      { property: "og:title", content: "골반 측정 결과 · 스마트 팬츠" },
      { property: "og:description", content: "스마트 팬츠로 측정한 골반 비대칭 지표 결과입니다." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const list = useSessions();
  if (list === null) return <div className="p-6 text-muted-foreground">불러오는 중…</div>;
  const s = list.find((x) => x.id === id);
  if (!s) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="font-semibold">측정 기록을 찾을 수 없어요</p>
        <Button asChild size="lg"><Link to="/pelvis">새로 측정하기</Link></Button>
      </div>
    );
  }
  return (
    <div>
      <PageHeader
        title="측정 결과"
        subtitle={`${TEST_META[s.test].label} · ${TAG_LABEL[s.tag]} · ${new Date(s.timestamp).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}`}
      />
      <div className="space-y-5 px-5 pb-6">
        <section className="surface-card flex items-center gap-4 p-5">
          <BalanceGauge score={s.symmetryIndex} label="대칭 지수" className="w-32 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">골반 대칭 지수 {s.symmetryIndex}점</p>
            <p className="mt-1 text-muted-foreground">높을수록 좌우가 비슷하게 측정되었다는 뜻이며, 건강 점수가 아닙니다.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              신호 품질 {s.signalQuality}% · 신뢰도 {Math.round(s.confidence * 100)}% · 센서 {s.sensors.length}개
            </p>
          </div>
        </section>

        <ul className="space-y-3">
          {PELVIS_METRIC_ORDER.map((k) => {
            const m = PELVIS_METRICS[k];
            const v = s.metrics[k];
            return (
              <li key={k} className="surface-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{m.label} <span className="text-xs font-normal text-muted-foreground">{m.axis}</span></p>
                  <LevelBadge level={levelOfPelvis(k, v)} />
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatMetric(k, v)}</p>
                <p className="text-sm text-primary">{directionLabel(k, v)}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
              </li>
            );
          })}
        </ul>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">좌·우 가동 범위</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">왼쪽</p><p className="text-xl font-bold">{s.leftRom.toFixed(1)}°</p></div>
            <div className="rounded-xl bg-secondary p-3"><p className="text-xs text-muted-foreground">오른쪽</p><p className="text-xl font-bold">{s.rightRom.toFixed(1)}°</p></div>
          </div>
        </section>

        <section className="surface-card p-4">
          <h2 className="text-sm font-semibold">측정 중 골반 각도</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.trace} margin={{ left: -20, right: 4 }}>
                <XAxis dataKey="t" fontSize={11} unit="s" />
                <YAxis fontSize={11} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="roll" name="Roll" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
                <Line dataKey="pitch" name="Pitch" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
                <Line dataKey="yaw" name="Yaw" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="lg" className="h-14 text-base"><Link to="/exercises">운동 가이드</Link></Button>
          <Button asChild size="lg" variant="outline" className="h-14 text-base"><Link to="/pelvis">다시 측정</Link></Button>
        </div>
        {s.source === "demo" ? <SensorDemoNotice /> : null}
        <Disclaimer variant="medical" />
      </div>
    </div>
  );
}
