import { Link } from "@tanstack/react-router";

import { useSessions } from "@/hooks/use-sensor-hub";
import { PELVIS_METRICS, PELVIS_METRIC_ORDER, formatMetric } from "@/lib/sensor/metrics";

/** Before/after exercise comparison from the latest pre/post sessions. */
export function PrePostCompare() {
  const list = useSessions();
  if (!list) return null;
  const post = list.find((s) => s.tag === "post_exercise");
  const pre = post ? list.find((s) => s.tag === "pre_exercise" && s.timestamp < post.timestamp) : undefined;

  return (
    <section className="surface-card p-5">
      <h2 className="font-semibold">운동 전·후 비교</h2>
      {pre && post ? (
        <>
          <div className="mt-3 grid grid-cols-3 items-center gap-2 text-center">
            <div><p className="text-xs text-muted-foreground">운동 전</p><p className="text-2xl font-bold">{pre.symmetryIndex}</p></div>
            <p className="text-sm font-semibold text-primary">
              {post.symmetryIndex - pre.symmetryIndex >= 0 ? "+" : ""}
              {post.symmetryIndex - pre.symmetryIndex}점
            </p>
            <div><p className="text-xs text-muted-foreground">운동 후</p><p className="text-2xl font-bold">{post.symmetryIndex}</p></div>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {PELVIS_METRIC_ORDER.map((k) => (
              <li key={k} className="flex justify-between gap-2">
                <span className="text-muted-foreground">{PELVIS_METRICS[k].label}</span>
                <span className="tabular-nums">{formatMetric(k, pre.metrics[k])} → <b>{formatMetric(k, post.metrics[k])}</b></span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">일시적인 측정값 변화이며 교정 효과를 의미하지 않습니다.</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          운동 전에 "운동 전"으로, 운동 후에 "운동 후"로 측정하면 변화를 비교해 드려요.{" "}
          <Link to="/pelvis" className="font-medium text-primary">측정하러 가기</Link>
        </p>
      )}
    </section>
  );
}
