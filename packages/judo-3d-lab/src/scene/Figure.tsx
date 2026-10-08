import { useLayoutEffect, useMemo, useRef } from 'react';
import { CylinderGeometry, Matrix4, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector3, type Mesh } from 'three';
import { FOOT_RADIUS } from '../body/balance';
import { torsoBasis, type BodyPoints, type PointName } from '../body/points';

/**
 * BodyPoints → 캡슐 마네킹. 스키닝 없이 점 사이를 원기둥+구로 잇는다.
 * 데이터 출처(키프레임/영상 추정)와 무관하게 같은 모습으로 그린다.
 */

const CYLINDER = new CylinderGeometry(1, 1, 1, 20, 1, true);
const SPHERE = new SphereGeometry(1, 20, 14);
const TORUS = new TorusGeometry(1, 0.12, 8, 32);
const SKIN = '#d9a77f';
const BELT = '#1c1f26';

const tmp = { x: new Vector3(), y: new Vector3(), z: new Vector3(), mid: new Vector3(), m: new Matrix4() };

function basisFrom(dir: Vector3, lateral: Vector3) {
  tmp.y.copy(dir).normalize();
  tmp.x.copy(lateral).addScaledVector(tmp.y, -lateral.dot(tmp.y));
  if (tmp.x.lengthSq() < 1e-6) {
    tmp.x.set(1, 0, 0).addScaledVector(tmp.y, -tmp.y.x);
    if (tmp.x.lengthSq() < 1e-6) tmp.x.set(0, 0, 1);
  }
  tmp.x.normalize();
  tmp.z.crossVectors(tmp.x, tmp.y);
}

interface LimbSpec {
  a: PointName | Vector3;
  b: PointName | Vector3;
  r: number;
  /** 좌우 방향 폭 배율 (몸통을 납작한 타원 단면으로) */
  w?: number;
  skin?: boolean;
}

interface FigureProps {
  points: BodyPoints;
  color: string;
  /** 투명 모드: 몸 안의 질량중심을 보기 위해 몸을 반투명하게 */
  xray?: boolean;
  /** 잔상 등 보조 표시용 */
  ghost?: boolean;
}

export function Figure({ points, color, xray = false, ghost = false }: FigureProps) {
  const p = points;
  const basis = torsoBasis(p);

  const headCenter = new Vector3().lerpVectors(p.headTop, p.neck, 0.37);
  const neckTop = new Vector3().lerpVectors(p.neck, p.headTop, 0.32);
  const beltCenter = new Vector3().lerpVectors(p.pelvis, p.spine, 0.45);

  const limbs: LimbSpec[] = [
    // 몸통
    { a: 'hipL', b: 'hipR', r: 0.1 },
    { a: 'pelvis', b: 'spine', r: 0.115, w: 1.3 },
    { a: 'spine', b: 'chest', r: 0.12, w: 1.35 },
    { a: 'chest', b: 'neck', r: 0.118, w: 1.3 },
    { a: 'shoulderL', b: 'shoulderR', r: 0.065 },
    { a: 'neck', b: neckTop, r: 0.05, skin: true },
    // 팔
    { a: 'shoulderL', b: 'elbowL', r: 0.052 },
    { a: 'elbowL', b: 'wristL', r: 0.044 },
    { a: 'shoulderR', b: 'elbowR', r: 0.052 },
    { a: 'elbowR', b: 'wristR', r: 0.044 },
    { a: 'wristL', b: 'handL', r: 0.038, skin: true },
    { a: 'wristR', b: 'handR', r: 0.038, skin: true },
    // 다리
    { a: 'hipL', b: 'kneeL', r: 0.075 },
    { a: 'kneeL', b: 'ankleL', r: 0.055 },
    { a: 'hipR', b: 'kneeR', r: 0.075 },
    { a: 'kneeR', b: 'ankleR', r: 0.055 },
    { a: 'ankleL', b: 'heelL', r: 0.04, skin: true },
    { a: 'ankleR', b: 'heelR', r: 0.04, skin: true },
    { a: 'heelL', b: 'toeL', r: FOOT_RADIUS, skin: true },
    { a: 'heelR', b: 'toeR', r: FOOT_RADIUS, skin: true },
  ];

  const opacity = ghost ? 0.18 : xray ? 0.32 : 1;
  const transparent = opacity < 1;
  const materials = useMemo(
    () => ({
      gi: new MeshStandardMaterial({ color, roughness: 0.85 }),
      skin: new MeshStandardMaterial({ color: SKIN, roughness: 0.7 }),
      belt: new MeshStandardMaterial({ color: BELT, roughness: 0.6 }),
    }),
    [color],
  );
  for (const m of Object.values(materials)) {
    m.opacity = opacity;
    m.transparent = transparent;
    m.depthWrite = !transparent;
  }

  return (
    <group>
      {limbs.map((l, i) => (
        <Limb
          key={i}
          a={typeof l.a === 'string' ? p[l.a] : l.a}
          b={typeof l.b === 'string' ? p[l.b] : l.b}
          r={l.r}
          w={l.w ?? 1}
          lateral={basis.lateral}
          material={l.skin ? materials.skin : materials.gi}
          castShadow={!transparent}
        />
      ))}
      <Ellipsoid center={headCenter} up={new Vector3().subVectors(p.headTop, p.neck)} lateral={basis.lateral} radii={[0.085, 0.115, 0.1]} material={materials.skin} castShadow={!transparent} />
      <Belt center={beltCenter} up={basis.up} lateral={basis.lateral} material={materials.belt} />
    </group>
  );
}

function Limb({
  a,
  b,
  r,
  w,
  lateral,
  material,
  castShadow,
}: {
  a: Vector3;
  b: Vector3;
  r: number;
  w: number;
  lateral: Vector3;
  material: MeshStandardMaterial;
  castShadow: boolean;
}) {
  const cyl = useRef<Mesh>(null);
  const capA = useRef<Mesh>(null);
  const capB = useRef<Mesh>(null);

  useLayoutEffect(() => {
    const dir = new Vector3().subVectors(b, a);
    const len = Math.max(dir.length(), 1e-4);
    basisFrom(dir, lateral);
    const { x, y, z, mid, m } = tmp;
    mid.lerpVectors(a, b, 0.5);
    m.makeBasis(x.clone().multiplyScalar(r * w), y.clone().multiplyScalar(len), z.clone().multiplyScalar(r)).setPosition(mid);
    cyl.current?.matrix.copy(m);
    m.makeBasis(x.clone().multiplyScalar(r * w), y.clone().multiplyScalar(r), z.clone().multiplyScalar(r));
    capA.current?.matrix.copy(m.clone().setPosition(a));
    capB.current?.matrix.copy(m.clone().setPosition(b));
    for (const mesh of [cyl.current, capA.current, capB.current]) if (mesh) mesh.matrixWorldNeedsUpdate = true;
  });

  return (
    <>
      <mesh ref={cyl} geometry={CYLINDER} material={material} matrixAutoUpdate={false} castShadow={castShadow} />
      <mesh ref={capA} geometry={SPHERE} material={material} matrixAutoUpdate={false} castShadow={castShadow} />
      <mesh ref={capB} geometry={SPHERE} material={material} matrixAutoUpdate={false} castShadow={castShadow} />
    </>
  );
}

function Ellipsoid({
  center,
  up,
  lateral,
  radii,
  material,
  castShadow,
}: {
  center: Vector3;
  up: Vector3;
  lateral: Vector3;
  radii: [number, number, number];
  material: MeshStandardMaterial;
  castShadow: boolean;
}) {
  const ref = useRef<Mesh>(null);
  useLayoutEffect(() => {
    basisFrom(up, lateral);
    const { x, y, z, m } = tmp;
    m.makeBasis(x.clone().multiplyScalar(radii[0]), y.clone().multiplyScalar(radii[1]), z.clone().multiplyScalar(radii[2])).setPosition(center);
    if (ref.current) {
      ref.current.matrix.copy(m);
      ref.current.matrixWorldNeedsUpdate = true;
    }
  });
  return <mesh ref={ref} geometry={SPHERE} material={material} matrixAutoUpdate={false} castShadow={castShadow} />;
}

function Belt({ center, up, lateral, material }: { center: Vector3; up: Vector3; lateral: Vector3; material: MeshStandardMaterial }) {
  const ref = useRef<Mesh>(null);
  useLayoutEffect(() => {
    basisFrom(up, lateral);
    const { x, y, z, m } = tmp;
    // 토러스는 XY 평면에 누워 있으므로 축(Z)을 몸의 위쪽으로 돌려 허리를 감싸게 한다 (−y: 오른손 좌표계 유지)
    m.makeBasis(x.clone().multiplyScalar(0.155), z.clone().multiplyScalar(0.12), y.clone().multiplyScalar(-0.12)).setPosition(center);
    if (ref.current) {
      ref.current.matrix.copy(m);
      ref.current.matrixWorldNeedsUpdate = true;
    }
  });
  return <mesh ref={ref} geometry={TORUS} material={material} matrixAutoUpdate={false} />;
}
