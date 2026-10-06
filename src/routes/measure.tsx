import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  CameraOff,
  Check,
  ImageUp,
  Loader2,
  RefreshCcw,
  ScanLine,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/posture/AppShell";
import { Disclaimer } from "@/components/posture/Disclaimer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { latestMeasurement, runDemoAnalysis, saveMeasurement } from "@/lib/posture-store";
import type { MeasurementSource } from "@/lib/posture-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/measure")({
  head: () => ({
    meta: [
      { title: "자세 측정 · 바른자세 스크리닝" },
      {
        name: "description",
        content:
          "정면·측면 촬영 안내와 준비 자세 체크리스트를 따라 자세 스크리닝을 진행합니다. 사진은 저장되지 않습니다.",
      },
      { property: "og:title", content: "자세 측정 · 바른자세 스크리닝" },
      {
        property: "og:description",
        content: "정면·측면 촬영 안내에 따라 좌우 균형을 확인하는 스크리닝 흐름.",
      },
    ],
  }),
  component: MeasurePage,
});

const CHECKLIST = [
  { id: "barefoot", label: "맨발로 서 있습니다" },
  { id: "relaxed", label: "힘을 빼고 평소처럼 편하게 섭니다" },
  { id: "fullbody", label: "머리부터 발끝까지 화면에 들어옵니다" },
  { id: "views", label: "정면과 측면을 각각 촬영할 준비가 되었습니다" },
  { id: "light", label: "밝은 곳에서 배경이 단순한 벽 앞에 섭니다" },
];

type Stage = "prepare" | "capture" | "analyzing";
type View = "front" | "side";

function MeasurePage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("prepare");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<View>("front");
  const [captured, setCaptured] = useState<Record<View, string | null>>({
    front: null,
    side: null,
  });
  const [cameraState, setCameraState] = useState<"idle" | "live" | "denied">("idle");
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const previewUrls = useRef<string[]>([]);

  const allChecked = CHECKLIST.every((c) => checked[c.id]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState("idle");
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  async function requestCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("denied");
      toast.error("이 브라우저에서는 카메라를 사용할 수 없어요. 사진 업로드를 이용해 주세요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraState("live");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraState("denied");
      toast.error("카메라 권한이 거부되었습니다. 사진 업로드로 진행할 수 있어요.");
    }
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    // Kept in memory only (object URL), never uploaded or persisted.
    const url = canvas.toDataURL("image/jpeg", 0.7);
    setCaptured((prev) => ({ ...prev, [view]: url }));
    toast.success(view === "front" ? "정면 사진이 준비되었어요" : "측면 사진이 준비되었어요");
    if (view === "front") setView("side");
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    setCaptured((prev) => ({ ...prev, [view]: url }));
    if (view === "front") setView("side");
    e.target.value = "";
  }

  const views = (["front", "side"] as View[]).filter((v) => captured[v]);

  function analyze(source: MeasurementSource) {
    stopCamera();
    setStage("analyzing");
    setProgress(8);
    const timer = setInterval(() => setProgress((p) => Math.min(96, p + 11)), 220);

    setTimeout(() => {
      clearInterval(timer);
      setProgress(100);
      const measurement = runDemoAnalysis({
        source,
        views: views.length ? views : ["front"],
        baseline: latestMeasurement(),
      });
      saveMeasurement(measurement);
      // Images are dropped here — nothing about them is stored.
      setCaptured({ front: null, side: null });
      navigate({ to: "/result/$id", params: { id: measurement.id } });
    }, 2100);
  }

  if (stage === "analyzing") {
    return (
      <div className="px-5 pt-10">
        <div className="surface-card scan-sweep flex flex-col items-center gap-5 p-8 text-center">
          <ScanLine className="size-12 text-primary" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold">자세를 분석하고 있어요</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              어깨선·골반선·몸통 축의 좌우 차이를 계산 중입니다.
            </p>
          </div>
          <Progress value={progress} className="h-2" />
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
        </div>
        <Disclaimer variant="demo" className="mt-5" />
      </div>
    );
  }

  if (stage === "prepare") {
    return (
      <div>
        <PageHeader
          title="측정 준비"
          subtitle="아래 항목을 모두 확인하면 더 안정적인 결과를 얻을 수 있어요."
        />
        <div className="space-y-5 px-5">
          <section className="surface-card overflow-hidden">
            <div className="flex items-center gap-4 bg-primary-soft/60 px-5 py-4">
              <User className="size-8 text-primary" aria-hidden />
              <div>
                <p className="text-sm font-semibold">정면 1장 + 측면 1장</p>
                <p className="text-xs text-muted-foreground">
                  휴대폰을 벽에 세우고 2~3m 떨어져 서 주세요.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {CHECKLIST.map((item) => (
                <li key={item.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-5 py-3">
                    <Checkbox
                      checked={!!checked[item.id]}
                      onCheckedChange={(v) =>
                        setChecked((prev) => ({ ...prev, [item.id]: v === true }))
                      }
                      className="size-6"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <Disclaimer variant="privacy" />
          <Disclaimer variant="demo" />

          <Button
            size="lg"
            className="h-16 w-full rounded-xl text-base font-semibold"
            disabled={!allChecked}
            onClick={() => setStage("capture")}
          >
            {allChecked ? "촬영 단계로 이동" : "체크리스트를 모두 확인해 주세요"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="촬영" subtitle="정면과 측면을 각각 담아 주세요. 한 장만으로도 진행할 수 있어요." />
      <div className="space-y-5 px-5">
        <div className="grid grid-cols-2 gap-2">
          {(["front", "side"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                view === v
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-1.5">
                {captured[v] ? <Check className="size-4" aria-hidden /> : null}
                {v === "front" ? "정면" : "측면"}
              </span>
              <span className="text-[11px] font-normal">
                {captured[v] ? "준비 완료" : "미촬영"}
              </span>
            </button>
          ))}
        </div>

        <section className="surface-card overflow-hidden">
          <div className="relative aspect-[3/4] bg-muted">
            {captured[view] ? (
              <img
                src={captured[view] as string}
                alt={view === "front" ? "정면 미리보기" : "측면 미리보기"}
                className="h-full w-full object-cover"
              />
            ) : cameraState === "live" ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
                aria-label="카메라 미리보기"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                {cameraState === "denied" ? (
                  <>
                    <CameraOff className="size-10 text-muted-foreground" aria-hidden />
                    <p className="text-sm font-medium">카메라를 사용할 수 없어요</p>
                    <p className="text-xs text-muted-foreground">
                      브라우저 설정에서 권한을 허용하거나, 갤러리에서 사진을 선택해 주세요.
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="size-10 text-muted-foreground" aria-hidden />
                    <p className="text-sm font-medium">카메라 권한이 필요합니다</p>
                    <p className="text-xs text-muted-foreground">
                      촬영 화면은 기기에서만 사용되고 서버로 전송되지 않습니다.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* alignment guide */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary-foreground/40" />
              <div className="absolute inset-x-[18%] top-[16%] border-t border-dashed border-primary-foreground/50" />
              <div className="absolute inset-x-[18%] top-[48%] border-t border-dashed border-primary-foreground/50" />
              <div className="absolute inset-x-6 bottom-4 rounded-lg bg-foreground/55 px-3 py-2 text-center text-[11px] text-background">
                {view === "front"
                  ? "양발을 골반 너비로, 어깨선이 가로 점선에 닿게"
                  : "몸 측면이 보이도록 90도 돌아 서기"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4">
            {captured[view] ? (
              <Button
                variant="outline"
                size="lg"
                className="col-span-2 h-14"
                onClick={() => setCaptured((prev) => ({ ...prev, [view]: null }))}
              >
                <RefreshCcw className="size-4" aria-hidden />
                다시 촬영
              </Button>
            ) : cameraState === "live" ? (
              <>
                <Button size="lg" className="h-14" onClick={captureFromCamera}>
                  <Camera className="size-5" aria-hidden />
                  촬영
                </Button>
                <Button variant="outline" size="lg" className="h-14" onClick={stopCamera}>
                  카메라 끄기
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="h-14" onClick={requestCamera}>
                  <Camera className="size-5" aria-hidden />
                  카메라 사용
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageUp className="size-5" aria-hidden />
                  사진 업로드
                </Button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        </section>

        <Disclaimer variant="privacy" />

        <Button
          size="lg"
          className="h-16 w-full rounded-xl text-base font-semibold"
          onClick={() => analyze(cameraState === "live" ? "camera_demo" : "photo_upload")}
          disabled={views.length === 0}
        >
          <ScanLine className="size-5" aria-hidden />
          {views.length === 0
            ? "사진을 1장 이상 준비해 주세요"
            : views.length === 1
              ? "1장으로 분석 시작"
              : "정면·측면으로 분석 시작"}
        </Button>

        <button
          className="w-full pb-2 text-center text-sm text-muted-foreground underline"
          onClick={() => setStage("prepare")}
        >
          준비 단계로 돌아가기
        </button>
      </div>
    </div>
  );
}
