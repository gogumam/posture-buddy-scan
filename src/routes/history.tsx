import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/posture/AppShell";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { LevelBadge } from "@/components/posture/LevelBadge";
import { usePostureData } from "@/hooks/use-posture";
import { completionRate, dailyCompletionCounts, getMeasurements } from "@/lib/posture-store";
import { balanceScore, metricValue, overallLevel, type PostureMeasurement } from "@/lib/posture-types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "측정 기록 · 바른자세 스크리닝" },
      {
        name: "description",
        content:
          "날짜별 자세 스크리닝 결과와 골반 좌우 차이·몸통 기울기의 변화 그래프, 주간 운동 수행률 리포트를 확인하세요.",
      },
      { property: "og:title", content: "측정 기록 · 바른자세 스크리닝" },
      {
        property: "og:description",
        content: "골반 좌우 차이와 몸통 기울기 변화, 주간 운동 수행률 리포트.",
      },
    ],
  }),
  component: HistoryPage,
});

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  fontSize: 12,
};

function HistoryPage() {
  const list = usePostureData<PostureMeasurement[]>(getMeasurements, []);
  const rate = usePostureData<number>(() => completionRate(), 0);
  const daily = usePostureData<Array<{ date: string; count: number }>>(
    () => dailyCompletionCounts(),
    [],
  );

  const trend = [...list].reverse().map((m) => {
    const d = new Date(m.timestamp);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      pelvis: Math.abs(metricValue(m, "pelvisHeightDiff")),
      trunk: Math.abs(metricValue(m, "trunkTilt")),
      balance: balanceScore(m),
    };
  });

  return (
    <div>
      <PageHeader title="기록" subtitle="측정 결과와 운동 수행률의 변화를 확인하세요." />

      <div className="space-y-5 px-5">
        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">골반 좌우 차이 · 몸통 기울기</h2>
          {trend.length > 1 ? (
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="pelvis"
                    name="골반 좌우(mm)"
                    stroke="var(--chart-1)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trunk"
                    name="몸통 기울기(°)"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">측정이 2회 이상 필요합니다.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            값이 작아질수록 좌우 차이가 줄어든 상태입니다.
          </p>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">주간 리포트</h2>
            <span className="text-sm font-semibold tabular-nums text-primary">수행률 {rate}%</span>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5).replace("-", "/")}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}개`, "완료 운동"]} />
                <Bar dataKey="count" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="px-1 text-base font-semibold">날짜별 측정</h2>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">아직 기록이 없습니다.</p>
          ) : null}
          {list.map((m) => {
            const d = new Date(m.timestamp);
            return (
              <Link
                key={m.id}
                to="/result/$id"
                params={{ id: m.id }}
                className="surface-card flex items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {d.getFullYear()}.{String(d.getMonth() + 1).padStart(2, "0")}.
                    {String(d.getDate()).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    균형 지수 {balanceScore(m)} · 골반 {Math.abs(metricValue(m, "pelvisHeightDiff")).toFixed(1)}mm
                    · 신뢰도 {Math.round(m.confidence * 100)}%
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <LevelBadge level={overallLevel(m)} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
              </Link>
            );
          })}
        </section>

        <Disclaimer variant="privacy" />
      </div>
    </div>
  );
}
