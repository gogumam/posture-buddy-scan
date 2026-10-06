import { Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Disclaimer({
  variant = "medical",
  className,
}: {
  variant?: "medical" | "demo" | "privacy";
  className?: string;
}) {
  const content = {
    medical: {
      icon: TriangleAlert,
      title: "의료 진단이 아닙니다",
      body: "이 앱은 자세 비대칭을 가볍게 살펴보는 스크리닝 체험용 프로토타입입니다. 질병을 진단하거나 치료 효과를 보장하지 않습니다. 통증, 저림, 보행 불편 등 증상이 있다면 정형외과·재활의학과 전문가와 상담하세요.",
    },
    demo: {
      icon: Info,
      title: "현재는 데모 분석입니다",
      body: "실제 자세 추정(컴퓨터비전) 모델이 연결되어 있지 않습니다. 결과 수치는 흐름을 체험하기 위한 예시 값이며 실제 신체 측정값이 아닙니다.",
    },
    privacy: {
      icon: ShieldCheck,
      title: "사진은 저장되지 않습니다",
      body: "촬영·업로드한 이미지는 화면에서만 사용되고 어디에도 전송·저장되지 않습니다. 기기에 남는 것은 숫자 지표와 날짜뿐입니다.",
    },
  }[variant];

  const Icon = content.icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3.5",
        variant === "medical"
          ? "border-attention/40 bg-attention-soft/60"
          : variant === "privacy"
            ? "border-calm/40 bg-calm-soft/60"
            : "border-border bg-muted/60",
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-foreground/70" aria-hidden />
      <div className="space-y-1">
        <p className="text-sm font-semibold">{content.title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{content.body}</p>
      </div>
    </div>
  );
}
