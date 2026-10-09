import { createFileRoute, Link } from "@tanstack/react-router";
import { Bluetooth, Camera, ChevronRight, Cpu, Play } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/posture/AppShell";
import { BalanceGauge } from "@/components/posture/BalanceGauge";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { LevelBadge } from "@/components/posture/LevelBadge";
import { PantsFigure, SensorDemoNotice } from "@/components/pants/PantsViz";
import { Button } from "@/components/ui/button";
import { connectedCount, useSensorHub, useSessions } from "@/hooks/use-sensor-hub";
import { ALL_SENSORS } from "@/lib/sensor/devices";
import {
  PELVIS_METRICS,
  TAG_LABEL,
  TEST_META,
  formatMetric,
  levelOfPelvis,
} from "@/lib/sensor/metrics";
import type { PelvisMetricKey } from "@/lib/sensor/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "스마트 팬츠 골반 비대칭 측정 · 대시보드" },
      { name: "description", content: "IMU 센서가 내장된 스마트 팬츠로 골반 좌우·전후 기울기, 회전, 동작 중 좌우 비대칭을 측정하고 추적합니다." },
      { property: "og:title", content: "스마트 팬츠 골반 비대칭 측정" },
      { property: "og:description", content: "입기만 하면 골반 움직임을 측정하는 스마트 팬츠 MVP 데모." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const KEYS: PelvisMetricKey[] = ["obliquity", "tilt", "rotationAsym", "motionDiff"];

function HomePage() {
  const snap = useSensorHub();
  const sessions = useSessions();
  const n = connectedCount(snap);
  const latest = sessions?.[0] ?? null;
  const status = Object.fromEntries(ALL_SENSORS.map((id) => [id, snap.devices[id].status]));
  const trend = [...(sessions ?? [])].reverse().map((s) => ({
    d: new Date(s.timestamp).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
    v: s.symmetryIndex,
  }));

  return (
    <div>
      <PageHeader title="스마트 팬츠" subtitle="스마트 팬츠 기반 골반 움직임 스크리닝 · MVP" />
      <div className="space-y-5 px-5 pb-6">
        <section className="surface-card flex items-center gap-4 p-4">
          <PantsFigure status={status} className="w-28 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">팬츠 센서</p>
            <p className="text-lg font-bold">{n === 3 ? "착용·연결 완료" : `${n}/3 센서 연결됨`}</p>
            <Button asChild size="lg" variant={n === 3 ? "outline" : "default"} className="mt-2 h-12 w-full">
              <Link to="/connect"><Bluetooth className="size-5" />{n === 3 ? "연결 상태 보기" : "센서 연결"}</Link>
            </Button>
          </div>
        </section>

        <div className="space-y-2">
          <Button asChild size="lg" className="h-16 w-full text-lg">
            <Link to="/sensors"><Cpu className="size-6" /> 센서 데모 보기</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 w-full">
            <Link to="/pelvis"><Play className="size-5" /> 골반 측정 시작</Link>
          </Button>
        </div>

        {latest ? (
          <section className="surface-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">최근 측정</h2>
              <span className="text-xs text-muted-foreground">{TEST_META[latest.test].label} · {TAG_LABEL[latest.tag]}</span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <BalanceGauge score={latest.symmetryIndex} label="대칭 지수" className="w-28 shrink-0" />
              <ul className="flex-1 space-y-2 text-sm">
                {KEYS.map((k) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{PELVIS_METRICS[k].axis}</span>
                    <span className="font-semibold tabular-nums">{formatMetric(k, latest.metrics[k])}</span>
                    <LevelBadge level={levelOfPelvis(k, latest.metrics[k])} />
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/session/$id" params={{ id: latest.id }} className="mt-3 inline-flex items-center text-sm font-medium text-primary">
              결과 자세히 보기 <ChevronRight className="size-4" />
            </Link>
          </section>
        ) : null}

        {trend.length > 1 ? (
          <section className="surface-card p-5">
            <h2 className="font-semibold">대칭 지수 추이</h2>
            <div className="mt-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -24, right: 8 }}>
                  <XAxis dataKey="d" fontSize={11} />
                  <YAxis domain={[40, 100]} fontSize={11} />
                  <Tooltip />
                  <Line dataKey="v" name="대칭 지수" stroke="var(--primary)" strokeWidth={2.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Link to="/history" className="inline-flex items-center text-sm font-medium text-primary">전체 기록 <ChevronRight className="size-4" /></Link>
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Link to="/sensors" className="surface-card flex flex-col gap-2 p-4">
            <Cpu className="size-6 text-primary" />
            <span className="font-semibold">웨어러블 설계</span>
            <span className="text-xs text-muted-foreground">센서 위치 · 데이터 흐름</span>
          </Link>
          <Link to="/measure" className="surface-card flex flex-col gap-2 p-4">
            <Camera className="size-6 text-primary" />
            <span className="font-semibold">보조 측정</span>
            <span className="text-xs text-muted-foreground">카메라 사진 체험</span>
          </Link>
        </div>

        <SensorDemoNotice />
        <Disclaimer variant="medical" />
      </div>
    </div>
  );
}
