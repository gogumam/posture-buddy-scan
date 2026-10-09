import { Suspense, useEffect, useRef, useState, Component, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Line } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RotateCcw, ZoomIn, ZoomOut, Scan, FlipVertical2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrototypeGarment } from "./PrototypeGarment";
import { PROTOTYPE_LAYOUTS, SENSOR_SIZE, type LayoutId } from "./prototype-layouts";

type Palette = { fabric: string; trim: string; sensor: string; wire: string; light: string };
type ViewCommand = { action: "front" | "back" | "reset" | "in" | "out"; version: number };

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground" role="alert">3D 화면을 표시할 수 없습니다. WebGL을 지원하는 브라우저에서 다시 열어주세요. 아래에서 배치 구성은 비교할 수 있습니다.</div> : this.props.children;
  }
}

function CameraControls({ command }: { command: ViewCommand }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit) return;
    if (command.action === "in" || command.action === "out") {
      const factor = command.action === "in" ? 0.8 : 1.25;
      const distance = camera.position.distanceTo(orbit.target);
      const next = Math.max(0.65, Math.min(1.8, distance * factor));
      camera.position.sub(orbit.target).multiplyScalar(next / distance).add(orbit.target);
    } else {
      orbit.target.set(0, 0, 0);
      if (command.action === "front") camera.position.set(0, 0.035, 1.05);
      else if (command.action === "back") camera.position.set(0, 0.035, -1.05);
      else camera.position.set(0.45, 0.12, -1.05);
    }
    orbit.update();
    invalidate();
  }, [command, camera, invalidate]);
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping={false} minDistance={0.65} maxDistance={1.8} minPolarAngle={0.35} maxPolarAngle={Math.PI - 0.35} />;
}

function PrototypeScene({ layout, palette }: { layout: LayoutId; palette: Palette }) {
  const config = PROTOTYPE_LAYOUTS[layout];
  return <>
    <ambientLight intensity={0.7} />
    <directionalLight position={[2, 3, -4]} intensity={2.5} />
    <directionalLight position={[-2, 1, 3]} intensity={1.4} />
    <Environment resolution={64}>
      <Lightformer color={palette.light} intensity={2} position={[0, 3, -2]} scale={[4, 4, 1]} />
      <Lightformer color={palette.light} intensity={1} position={[-3, 0, 0]} rotation-y={Math.PI / 2} scale={[3, 4, 1]} />
    </Environment>
    <PrototypeGarment fabric={palette.fabric} trim={palette.trim} />
    {config.paths.map((points, i) => <Line key={`${layout}-${i}`} points={points} color={palette.wire} lineWidth={3} />)}
    {config.sensors.map((sensor) => <group key={sensor.id} position={sensor.position} rotation={sensor.rotation}>
      <mesh><boxGeometry args={SENSOR_SIZE} /><meshStandardMaterial color={palette.sensor} metalness={0.25} roughness={0.35} /></mesh>
      <mesh position-z={-0.0055}><boxGeometry args={[0.023, 0.003, 0.001]} /><meshStandardMaterial color={palette.trim} /></mesh>
    </group>)}
  </>;
}

export default function PrototypeViewer() {
  const [layout, setLayout] = useState<LayoutId>("C");
  const [palette, setPalette] = useState<Palette | null>(null);
  const [command, setCommand] = useState<ViewCommand>({ action: "reset", version: 0 });
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    const token = (key: string) => styles.getPropertyValue(`--prototype-${key}`).trim();
    setPalette({ fabric: token("fabric"), trim: token("trim"), sensor: token("sensor"), wire: token("wire"), light: token("light") });
  }, []);
  const execute = (action: ViewCommand["action"]) => setCommand((previous) => ({ action, version: previous.version + 1 }));
  const selected = PROTOTYPE_LAYOUTS[layout];
  return <section aria-labelledby="prototype-title" className="border-b border-border pb-5">
    <div className="flex items-center justify-between gap-2">
      <h2 id="prototype-title" className="text-lg font-bold">3D 시제품 배치 비교</h2>
      <Badge variant="outline">설계 가안</Badge>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="센서 배치 선택">
      {(Object.keys(PROTOTYPE_LAYOUTS) as LayoutId[]).map((id) => <Button key={id} variant={id === layout ? "default" : "outline"} aria-pressed={id === layout} aria-label={`배치 ${id} ${PROTOTYPE_LAYOUTS[id].title}`} onClick={() => setLayout(id)} className="h-auto min-h-14 flex-col gap-0.5 px-1 py-2">
        <span className="font-bold">{id}</span><span className="text-[11px]">{PROTOTYPE_LAYOUTS[id].title}</span>
      </Button>)}
    </div>
    <div className="relative mt-3 h-[340px] w-full touch-none bg-secondary/40" aria-label="회전 가능한 스마트 팬츠 3D 모델" data-testid="prototype-canvas">
      <ViewerBoundary>
        {palette ? <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0.45, 0.12, -1.05], fov: 37, near: 0.01, far: 10 }} fallback={<p className="p-6 text-sm">이 브라우저는 3D 표시를 지원하지 않습니다.</p>}>
          <Suspense fallback={null}><PrototypeScene layout={layout} palette={palette} /></Suspense>
          <CameraControls command={command} />
        </Canvas> : <div className="p-6 text-sm text-muted-foreground" role="status">3D 모델 준비 중…</div>}
      </ViewerBoundary>
      <div className="pointer-events-none absolute left-3 top-3 text-xs text-muted-foreground">단순 의류 모델 · 인체 실측 아님</div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-xs text-foreground">
        <span className="size-2 rounded-full bg-[var(--prototype-sensor)]" />센서
        <span className="ml-2 h-0.5 w-4 bg-[var(--prototype-wire)]" />연결 경로 가안
      </div>
    </div>
    <div className="mt-2 flex items-center justify-between gap-1" role="toolbar" aria-label="3D 보기 조절">
      <div className="flex gap-1">
        <Button variant="outline" onClick={() => execute("front")}><Scan />앞</Button>
        <Button variant="outline" onClick={() => execute("back")}><FlipVertical2 />뒤</Button>
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="outline" aria-label="확대" title="확대" onClick={() => execute("in")}><ZoomIn /></Button>
        <Button size="icon" variant="outline" aria-label="축소" title="축소" onClick={() => execute("out")}><ZoomOut /></Button>
        <Button size="icon" variant="outline" aria-label="보기 초기화" title="보기 초기화" onClick={() => execute("reset")}><RotateCcw /></Button>
      </div>
    </div>
    <div className="mt-4" aria-live="polite" aria-atomic="true">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">{layout} · {selected.title}</h3><span className="text-sm font-bold tabular-nums">센서 {selected.sensors.length}개</span></div>
      <p className="mt-1 text-xs text-muted-foreground">{selected.composition}</p>
      <p className="mt-1 text-xs text-muted-foreground">{selected.difference}</p>
    </div>
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <table className="w-full table-fixed text-left text-xs">
        <caption className="sr-only">세 가지 센서 배치 구성 비교</caption>
        <thead className="bg-secondary"><tr><th scope="col" className="w-12 p-2">배치</th><th scope="col" className="w-12 p-2">수량</th><th scope="col" className="p-2">구성</th></tr></thead>
        <tbody>{(Object.keys(PROTOTYPE_LAYOUTS) as LayoutId[]).map((id) => <tr key={id} className={id === layout ? "border-t border-border bg-primary-soft" : "border-t border-border"}><th scope="row" className="p-2">{id}</th><td className="p-2">{PROTOTYPE_LAYOUTS[id].sensors.length}개</td><td className="p-2 leading-relaxed">{PROTOTYPE_LAYOUTS[id].composition}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="mt-4 flex gap-2 rounded-lg border border-attention/40 bg-attention-soft/60 p-3" role="note">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-attention-foreground" />
      <div><p className="text-sm font-semibold">임시 센서 크기 35×35×10 mm</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">실제 부품 치수와 성능이 검증되지 않은 설계 가안입니다. 모델의 체형·착용감·배선 경로도 검증 전이며, 배치 선택은 BLE 연결이나 가상 센서 수치에 영향을 주지 않습니다.</p></div>
    </div>
  </section>;
}