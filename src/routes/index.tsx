import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, Scan, Sparkles } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/posture/AppShell";
import { AsymmetryBar } from "@/components/posture/AsymmetryBar";
import { BalanceGauge } from "@/components/posture/BalanceGauge";
import { BodySilhouette } from "@/components/posture/BodySilhouette";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { LevelBadge } from "@/components/posture/LevelBadge";
import { Button } from "@/components/ui/button";
import { usePostureData } from "@/hooks/use-posture";
import { completionRate, getMeasurements } from "@/lib/posture-store";
import {
  balanceScore,
  metricValue,
  overallLevel,
  type PostureMeasurement,
} from "@/lib/posture-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "바른자세 스크리닝 · 오늘의 자세 요약" },
      {
        name: "description",
        content:
          "스마트폰으로 자세 비대칭을 가볍게 살펴보고, 골반·어깨·몸통 지표의 변화 추이와 맞춤 운동 가이드를 확인하세요. 의료 진단이 아닌 스크리닝 체험 프로토타입입니다.",
      },
      { property: "og:title", content: "바른자세 스크리닝 · 오늘의 자세 요약" },
      {
        property: "og:description",
        content: "골반·어깨·몸통 비대칭 지표를 한눈에 보고 맞춤 운동을 추천받는 자세 스크리닝 앱.",
      },
    ],
  }),
  component: Dashboard,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function Dashboard() {
  const measurements = usePostureData<PostureMeasurement[]>(getMeasurements, []);
  const rate = usePostureData<number>(() => completionRate(), 0);
  const latest = measurements[0] ?? null;

  const trend = [...measurements]
    .reverse()
    .slice(-8)
    .map((m) => ({
      date: formatDate(m.timestamp),
      balance: balanceScore(m),
      pelvis: Math.abs(metricValue(m, "pelvisHeightDiff")),
      trunk: Math.abs(metricValue(m, "trunkTilt")),
    }));

  return (
    <div className="space-y-5">
      <div className="gradient-hero px-5 pb-20 pt-8 text-primary-foreground">
        <p className="text-sm opacity-90">안녕하세요 👋</p>
        <h1 className="mt-1 text-2xl font-bold leading-snug">
          오늘의 자세를
          <br />
          가볍게 살펴볼까요?
        </h1>
        <p className="mt-3 max-w-[18rem] text-sm leading-relaxed opacity-85">
          카메라나 사진 한 장으로 좌우 균형을 확인하고, 맞춤 운동을 추천받아 보세요.
        </p>
      </div>

      <div className="-mt-16 space-y-5 px-5">
        {latest ? (
          <section className="surface-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  최근 측정 · {formatDate(latest.timestamp)}
                </p>
                <h2 className="mt-1 text-lg font-semibold">자세 분석 요약</h2>
              </div>
              <LevelBadge level={overallLevel(latest)} size="lg" />
            </div>

            <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
              <BalanceGauge score={balanceScore(latest)} />
              <div className="h-[150px] w-[96px] shrink-0">
                <BodySilhouette
                  shoulderDiff={metricValue(latest, "shoulderHeightDiff")}
                  pelvisDiff={metricValue(latest, "pelvisHeightDiff")}
                  trunkTilt={metricValue(latest, "trunkTilt")}
                />
              </div>
            </div>

            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <AsymmetryBar
                metricKey="shoulderHeightDiff"
                value={metricValue(latest, "shoulderHeightDiff")}
                compact
              />
              <AsymmetryBar
                metricKey="pelvisHeightDiff"
                value={metricValue(latest, "pelvisHeightDiff")}
                compact
              />
              <AsymmetryBar
                metricKey="trunkTilt"
                value={metricValue(latest, "trunkTilt")}
                compact
              />
            </div>

            <Link
              to="/result/$id"
              params={{ id: latest.id }}
              className="mt-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              전체 분석 결과 보기
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </section>
        ) : (
          <section className="surface-card p-6 text-center">
            <h2 className="text-lg font-semibold">아직 측정 기록이 없어요</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              첫 측정을 시작하면 좌우 균형 지표가 여기에 표시됩니다.
            </p>
          </section>
        )}

        <Button asChild size="lg" className="h-16 w-full rounded-xl text-base font-semibold">
          <Link to="/measure">
            <Scan className="size-5" aria-hidden />
            자세 측정 시작
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Button>

        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">변화 추이</h2>
            <Link to="/history" className="text-xs font-medium text-primary">
              기록 전체 보기
            </Link>
          </div>
          {trend.length > 1 ? (
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}점`, "균형 지수"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              측정이 2회 이상 쌓이면 변화 추이가 그려집니다.
            </p>
          )}
        </section>

        <section className="surface-card flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold">이번 주 운동 수행률</p>
            <p className="mt-1 text-xs text-muted-foreground">추천 운동 완료 체크 기준</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-primary">{rate}%</p>
            <Link to="/exercises" className="text-xs font-medium text-primary">
              운동 가이드 →
            </Link>
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <h2 className="text-base font-semibold">웨어러블 연동 준비 중</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            향후 BLE IMU 센서나 스마트워치 데이터를 받아 더 촘촘한 측정이 가능해집니다. 지금은 가상
            데이터로 구조만 미리 볼 수 있어요.
          </p>
          <Link to="/sensors" className="mt-3 inline-flex text-sm font-medium text-primary">
            센서 연동 화면 보기 →
          </Link>
        </section>

        <Disclaimer variant="medical" />
        <Disclaimer variant="demo" />
      </div>
    </div>
  );
}
