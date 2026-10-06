import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, RefreshCcw } from "lucide-react";

import { PageHeader } from "@/components/posture/AppShell";
import { AsymmetryBar } from "@/components/posture/AsymmetryBar";
import { BalanceGauge } from "@/components/posture/BalanceGauge";
import { BodySilhouette, PelvisDiagram } from "@/components/posture/BodySilhouette";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { LevelBadge } from "@/components/posture/LevelBadge";
import { Button } from "@/components/ui/button";
import { usePostureData } from "@/hooks/use-posture";
import { getMeasurements } from "@/lib/posture-store";
import {
  METRIC_META,
  METRIC_ORDER,
  balanceScore,
  metricValue,
  overallLevel,
  type PostureMeasurement,
} from "@/lib/posture-types";

export const Route = createFileRoute("/result/$id")({
  head: () => ({
    meta: [
      { title: "자세 분석 결과 · 바른자세 스크리닝" },
      {
        name: "description",
        content:
          "골반 좌우 높이, 골반 회전, 어깨 높이, 몸통 기울기, 체중 이동 지표를 중립적인 표현으로 보여주는 스크리닝 결과 화면입니다.",
      },
      { property: "og:title", content: "자세 분석 결과 · 바른자세 스크리닝" },
      {
        property: "og:description",
        content: "좌우 비대칭 지표와 각 지표의 의미를 쉽게 설명하는 스크리닝 결과.",
      },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = useParams({ from: "/result/$id" });
  const list = usePostureData<PostureMeasurement[]>(getMeasurements, []);
  const m = list.find((x) => x.id === id) ?? null;

  if (!m) {
    return (
      <div className="px-5 pt-10">
        <div className="surface-card p-6 text-center">
          <h2 className="text-lg font-semibold">결과를 불러오는 중입니다</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            기록을 찾을 수 없다면 새로 측정해 주세요.
          </p>
          <Button asChild className="mt-4 h-12 w-full">
            <Link to="/measure">자세 측정 시작</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lowConfidence = m.confidence < 0.7;
  const d = new Date(m.timestamp);

  return (
    <div>
      <PageHeader
        title="자세 분석 결과"
        subtitle={`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 · ${
          m.views.length === 2 ? "정면·측면" : m.views[0] === "side" ? "측면" : "정면"
        } 기준`}
        action={<LevelBadge level={overallLevel(m)} size="lg" />}
      />

      <div className="space-y-5 px-5">
        {lowConfidence ? (
          <div className="flex gap-3 rounded-xl border border-attention/50 bg-attention-soft/70 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div>
              <p className="text-sm font-semibold">
                신뢰도가 낮습니다 ({Math.round(m.confidence * 100)}%)
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                전신이 다 들어오지 않았거나 조명이 어두웠을 수 있어요. 정면과 측면을 각각 다시
                촬영하면 결과가 더 안정적입니다.
              </p>
              <Button asChild size="sm" variant="outline" className="mt-3 h-10">
                <Link to="/measure">
                  <RefreshCcw className="size-4" aria-hidden />
                  다시 측정하기
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        <section className="surface-card p-5">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <BalanceGauge score={balanceScore(m)} />
            <div className="h-[170px] w-[104px]">
              <BodySilhouette
                shoulderDiff={metricValue(m, "shoulderHeightDiff")}
                pelvisDiff={metricValue(m, "pelvisHeightDiff")}
                trunkTilt={metricValue(m, "trunkTilt")}
              />
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            분석 신뢰도 {Math.round(m.confidence * 100)}%
          </p>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">골반 시각화</h2>
          <div className="mt-2 h-28">
            <PelvisDiagram
              pelvisDiff={metricValue(m, "pelvisHeightDiff")}
              rotation={metricValue(m, "pelvisRotation")}
            />
          </div>
        </section>

        <section className="space-y-4">
          {METRIC_ORDER.map((key) => (
            <div key={key} className="surface-card p-5">
              <AsymmetryBar metricKey={key} value={metricValue(m, key)} />
              <p className="mt-3 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                {METRIC_META[key].description}
              </p>
            </div>
          ))}
        </section>

        <Button asChild size="lg" className="h-16 w-full rounded-xl text-base font-semibold">
          <Link to="/exercises">
            추천 운동 보기
            <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Button>

        <Disclaimer variant="medical" />
        <Disclaimer variant="demo" />
        <Disclaimer variant="privacy" />
      </div>
    </div>
  );
}
