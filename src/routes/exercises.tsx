import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleCheck, Circle, Info } from "lucide-react";

import { PageHeader } from "@/components/posture/AppShell";
import { Disclaimer } from "@/components/posture/Disclaimer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { usePostureData } from "@/hooks/use-posture";
import { recommendExercises, type ExerciseRecommendation } from "@/lib/exercises";
import { getCompletions, latestMeasurement, toggleCompletion, todayKey } from "@/lib/posture-store";
import type { ExerciseCompletion } from "@/lib/posture-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exercises")({
  head: () => ({
    meta: [
      { title: "교정 운동 가이드 · 바른자세 스크리닝" },
      {
        name: "description",
        content:
          "분석 결과에 맞춘 둔근 강화, 고관절 가동성, 코어 안정화, 스트레칭 추천 운동과 자세·횟수·주의사항을 안내합니다.",
      },
      { property: "og:title", content: "교정 운동 가이드 · 바른자세 스크리닝" },
      {
        property: "og:description",
        content: "결과 기반 맞춤 운동 추천과 완료 체크로 꾸준히 관리하세요.",
      },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const completions = usePostureData<ExerciseCompletion[]>(getCompletions, []);
  const recs = usePostureData<ExerciseRecommendation[]>(
    () => recommendExercises(latestMeasurement()),
    [],
  );

  const today = todayKey();
  const doneToday = recs.filter((r) =>
    completions.some((c) => c.exerciseId === r.exercise.id && c.date === today),
  ).length;
  const pct = recs.length ? Math.round((doneToday / recs.length) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="오늘의 운동"
        subtitle="분석 결과를 참고한 추천 루틴입니다. 치료나 교정을 보장하지 않습니다."
      />

      <div className="space-y-5 px-5">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">오늘 완료</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              {doneToday} / {recs.length}
            </p>
          </div>
          <Progress value={pct} className="mt-3 h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            통증이 생기면 즉시 중단하고 전문가와 상담하세요.
          </p>
        </section>

        {recs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            추천 루틴을 준비하는 중입니다.{" "}
            <Link to="/measure" className="font-medium text-primary">
              먼저 측정해 보세요.
            </Link>
          </p>
        ) : null}

        <Accordion type="multiple" className="space-y-3">
          {recs.map(({ exercise, reason }) => {
            const done = completions.some(
              (c) => c.exerciseId === exercise.id && c.date === today,
            );
            return (
              <AccordionItem
                key={exercise.id}
                value={exercise.id}
                className={cn(
                  "surface-card overflow-hidden border-b",
                  done && "border-calm/50 bg-calm-soft/30",
                )}
              >
                <div className="flex items-start gap-2 px-4 pt-4">
                  <button
                    aria-label={done ? "완료 취소" : "완료 체크"}
                    onClick={() => toggleCompletion(exercise.id)}
                    className="mt-0.5 shrink-0"
                  >
                    {done ? (
                      <CircleCheck className="size-8 text-calm" aria-hidden />
                    ) : (
                      <Circle className="size-8 text-muted-foreground" aria-hidden />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary">{exercise.category}</p>
                    <p className="text-base font-semibold">{exercise.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {exercise.sets} · {exercise.durationLabel}
                    </p>
                  </div>
                </div>
                <AccordionTrigger className="px-4 pb-3 pt-2 text-sm">
                  자세와 주의사항 보기
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    {reason}
                  </p>
                  <ol className="mt-3 space-y-2 text-sm">
                    {exercise.howTo.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 flex gap-2 rounded-lg border border-attention/40 bg-attention-soft/50 px-3 py-2 text-xs leading-relaxed">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {exercise.cautions}
                  </p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <Disclaimer variant="medical" />
      </div>
    </div>
  );
}
