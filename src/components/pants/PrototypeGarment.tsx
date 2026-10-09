import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, DataTexture, RepeatWrapping, DoubleSide, RGBAFormat } from "three";
import type { ThreeElements } from "@react-three/fiber";

// Replace only this garment component with a licensed GLB, keeping the
// normalized metre coordinate frame and external sensor overlay unchanged.
function shell(rings: [number, number, number][]) {
  const vertices: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 48;
  rings.forEach(([y, rx, rz], row) => {
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI * 2;
      vertices.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
      uv.push(i / segments, row / (rings.length - 1));
      if (row > 0 && i < segments) {
        const a = (row - 1) * (segments + 1) + i, b = row * (segments + 1) + i;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function PrototypeGarment({ fabric, trim }: { fabric: string; trim: string }) {
  const resources = useMemo(() => {
    const body = shell([[0.24, 0.205, 0.128], [0.18, 0.232, 0.145], [0.09, 0.24, 0.148], [0.0, 0.228, 0.135]]);
    const leg = shell([[0.055, 0.118, 0.131], [-0.04, 0.113, 0.125], [-0.15, 0.106, 0.108], [-0.26, 0.099, 0.097]]);
    const band = shell([[0.24, 0.207, 0.13], [0.21, 0.223, 0.14]]);
    const data = new Uint8Array(16 * 16 * 4);
    for (let i = 0; i < 256; i++) {
      const value = (i % 16 + Math.floor(i / 16)) % 2 === 0 ? 190 : 245;
      data.set([value, value, value, 255], i * 4);
    }
    const texture = new DataTexture(data, 16, 16, RGBAFormat);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(24, 20);
    texture.needsUpdate = true;
    return { body, leg, band, texture };
  }, []);
  useEffect(() => () => { resources.body.dispose(); resources.leg.dispose(); resources.band.dispose(); resources.texture.dispose(); }, [resources]);
  const material: ThreeElements["meshStandardMaterial"] = { color: fabric, roughness: 0.85, side: DoubleSide, bumpMap: resources.texture, bumpScale: 0.0004 };
  return (
    <group>
      <mesh geometry={resources.body}><meshStandardMaterial {...material} /></mesh>
      {[-0.117, 0.117].map((x) => <mesh key={x} geometry={resources.leg} position-x={x}><meshStandardMaterial {...material} /></mesh>)}
      <mesh geometry={resources.band}><meshStandardMaterial color={trim} roughness={0.7} side={DoubleSide} /></mesh>
      {[-0.117, 0.117].map((x) => <mesh key={x} position={[x, -0.258, 0]} rotation-x={Math.PI / 2} scale={[1, 0.98, 1]}><torusGeometry args={[0.099, 0.0025, 6, 48]} /><meshStandardMaterial color={trim} /></mesh>)}
    </group>
  );
}