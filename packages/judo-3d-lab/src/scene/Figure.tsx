import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  Color,
  DoubleSide,
  LatheGeometry,
  Matrix4,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Mesh,
} from 'three';
import { torsoBasis, type BodyPoints } from '../body/points';

/**
 * BodyPoints → 도복 입은 마네킹.
 *
 * 스키닝(뼈대에 메시를 입히는 방식) 없이, 관절점 사이마다 단면 반지름이 변하는 회전체(lathe)를
 * 하나씩 놓아 몸을 만든다. 점만 있으면 그릴 수 있으므로 키프레임 리그든 영상 추정이든 같은 모습으로 보인다.
 *
 * 각 부위는 "a → b 방향을 y축, 몸의 왼쪽(lateral)을 x축"으로 하는 좌표계에 놓인다.
 * 그러면 z축(x × y)이 몸의 앞쪽이 되어, 몸통을 좌우로 넓고 앞뒤로 얇게 만들 수 있다.
 */

const SKIN = '#d6a27c';
const HAIR = '#2b2420';
const BELT = '#1c1f26';

// ---------------------------------------------------------------------------
// 형상 정의: [길이 비율 t(0=a, 1=b), 반지름(m)]
// ---------------------------------------------------------------------------

function lathe(profile: [number, number][], segments = 18): LatheGeometry {
  return new LatheGeometry(
    profile.map(([t, r]) => new Vector2(r, t)),
    segments,
  );
}

const GEO = {
  // 몸통 (도복 상의). 가슴이 넓고 허리가 잘록하다
  lowerTrunk: lathe([
    [0, 0.122],
    [0.5, 0.116],
    [1, 0.114],
  ]),
  midTrunk: lathe([
    [0, 0.114],
    [0.5, 0.122],
    [1, 0.13],
  ]),
  upperTrunk: lathe([
    [0, 0.13],
    [0.45, 0.134],
    [0.8, 0.118],
    [1, 0.07],
  ]),
  // 도복 상의 아랫자락: 띠에서 엉덩이를 덮으며 살짝 퍼진다
  skirt: lathe([
    [0, 0.128],
    [0.5, 0.142],
    [1, 0.15],
  ]),
  // 하의: 넉넉한 도복 바지
  thigh: lathe([
    [0, 0.088],
    [0.35, 0.086],
    [0.8, 0.07],
    [1, 0.064],
  ]),
  shank: lathe([
    [0, 0.064],
    [0.3, 0.064],
    [1, 0.058],
  ]),
  // 소매: 아래팔 2/3 지점까지 덮고 끝이 약간 벌어진다
  upperArm: lathe([
    [0, 0.064],
    [0.5, 0.058],
    [1, 0.054],
  ]),
  sleeve: lathe([
    [0, 0.054],
    [0.9, 0.053],
    [1, 0.056],
  ]),
  // 맨살
  forearm: lathe([
    [0, 0.038],
    [0.6, 0.033],
    [1, 0.029],
  ]),
  neck: lathe([
    [0, 0.052],
    [1, 0.048],
  ]),
  ankle: lathe([
    [0, 0.04],
    [1, 0.036],
  ]),
};

const SPHERE = new SphereGeometry(1, 24, 16);
const TORUS = new TorusGeometry(1, 0.13, 10, 40);
const BOX = new BoxGeometry(1, 1, 1);

// ---------------------------------------------------------------------------
// 배치 유틸
// ---------------------------------------------------------------------------

const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _m = new Matrix4();

/** dir을 y축으로, lateral을 x축 기준으로 하는 직교 기저 */
function basis(dir: Vector3, lateral: Vector3) {
  _y.copy(dir).normalize();
  _x.copy(lateral).addScaledVector(_y, -lateral.dot(_y));
  if (_x.lengthSq() < 1e-6) {
    _x.set(1, 0, 0).addScaledVector(_y, -_y.x);
    if (_x.lengthSq() < 1e-6) _x.set(0, 0, 1);
  }
  _x.normalize();
  _z.crossVectors(_x, _y);
}

type Placement =
  /** a에서 b까지 늘인 회전체. sx/sz는 좌우·앞뒤 단면 배율 */
  | { kind: 'seg'; a: Vector3; b: Vector3; sx?: number; sz?: number }
  /** 중심 center, 주축 dir인 타원체(또는 임의 형상). radii = [좌우, 주축, 앞뒤] */
  | { kind: 'blob'; center: Vector3; dir: Vector3; radii: [number, number, number] }
  /** a에서 b로 가는 얇은 띠. 폭은 width, 두께 방향은 몸의 앞쪽 */
  | { kind: 'strip'; a: Vector3; b: Vector3; width: number; thickness: number };

function placementMatrix(p: Placement, lateral: Vector3): Matrix4 {
  if (p.kind === 'seg') {
    const d = new Vector3().subVectors(p.b, p.a);
    const len = Math.max(d.length(), 1e-4);
    basis(d, lateral);
    return _m.makeBasis(_x.multiplyScalar(p.sx ?? 1), _y.multiplyScalar(len), _z.multiplyScalar(p.sz ?? 1)).setPosition(p.a);
  }
  if (p.kind === 'blob') {
    basis(p.dir, lateral);
    const [rx, ry, rz] = p.radii;
    return _m.makeBasis(_x.multiplyScalar(rx), _y.multiplyScalar(ry), _z.multiplyScalar(rz)).setPosition(p.center);
  }
  const d = new Vector3().subVectors(p.b, p.a);
  basis(d, lateral);
  const mid = new Vector3().lerpVectors(p.a, p.b, 0.5);
  return _m
    .makeBasis(_x.multiplyScalar(p.width), _y.multiplyScalar(Math.max(d.length(), 1e-4)), _z.multiplyScalar(p.thickness))
    .setPosition(mid);
}

function Part({
  geometry,
  material,
  placement,
  lateral,
  castShadow,
}: {
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  placement: Placement;
  lateral: Vector3;
  castShadow: boolean;
}) {
  const ref = useRef<Mesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.matrix.copy(placementMatrix(placement, lateral));
    ref.current.matrixWorldNeedsUpdate = true;
  });
  return <mesh ref={ref} geometry={geometry} material={material} matrixAutoUpdate={false} castShadow={castShadow} receiveShadow />;
}

// ---------------------------------------------------------------------------
// 마네킹
// ---------------------------------------------------------------------------

interface FigureProps {
  points: BodyPoints;
  color: string;
  /** 투명 모드: 몸 안의 질량중심을 보기 위해 몸을 반투명하게 */
  xray?: boolean;
  ghost?: boolean;
}

type MatKey = 'gi' | 'lapel' | 'skin' | 'hair' | 'belt';

export function Figure({ points: p, color, xray = false, ghost = false }: FigureProps) {
  const { lateral, up, forward } = torsoBasis(p);

  const materials = useMemo(() => {
    const lapel = new Color(color).offsetHSL(0, 0, -0.07);
    return {
      gi: new MeshStandardMaterial({ color, roughness: 0.92, side: DoubleSide }),
      lapel: new MeshStandardMaterial({ color: lapel, roughness: 0.85 }),
      skin: new MeshStandardMaterial({ color: SKIN, roughness: 0.65 }),
      hair: new MeshStandardMaterial({ color: HAIR, roughness: 0.9 }),
      belt: new MeshStandardMaterial({ color: BELT, roughness: 0.7 }),
    } satisfies Record<MatKey, MeshStandardMaterial>;
  }, [color]);
  const opacity = ghost ? 0.18 : xray ? 0.32 : 1;
  const transparent = opacity < 1;
  for (const m of Object.values(materials)) {
    m.opacity = opacity;
    m.transparent = transparent;
    m.depthWrite = !transparent;
  }

  const lerp = (a: Vector3, b: Vector3, t: number) => new Vector3().lerpVectors(a, b, t);
  const parts: { geo: BufferGeometry; mat: MatKey; at: Placement }[] = [];
  const add = (geo: BufferGeometry, mat: MatKey, at: Placement) => parts.push({ geo, mat, at });
  const ball = (center: Vector3, r: number, mat: MatKey) => add(SPHERE, mat, { kind: 'blob', center, dir: up, radii: [r, r, r] });

  // --- 몸통 (상의) ---
  const DEPTH = 0.82; // 몸통 앞뒤 두께 / 좌우 폭 비율의 기준
  add(GEO.lowerTrunk, 'gi', { kind: 'seg', a: p.pelvis, b: p.spine, sx: 1.32, sz: DEPTH });
  add(GEO.midTrunk, 'gi', { kind: 'seg', a: p.spine, b: p.chest, sx: 1.36, sz: DEPTH });
  add(GEO.upperTrunk, 'gi', { kind: 'seg', a: p.chest, b: p.neck, sx: 1.4, sz: DEPTH });
  // 어깨: 양 어깨를 잇는 둥근 덩어리 + 삼각근
  const shoulderMid = lerp(p.shoulderL, p.shoulderR, 0.5);
  add(SPHERE, 'gi', {
    kind: 'blob',
    center: shoulderMid.clone().addScaledVector(up, -0.02),
    dir: up,
    radii: [p.shoulderL.distanceTo(p.shoulderR) / 2 + 0.02, 0.07, 0.1],
  });
  ball(p.shoulderL, 0.066, 'gi');
  ball(p.shoulderR, 0.066, 'gi');

  // 상의 아랫자락 (띠 아래로 엉덩이를 덮음)
  const beltCenter = lerp(p.pelvis, p.spine, 0.42);
  const down = new Vector3().subVectors(p.pelvis, p.spine).normalize();
  add(GEO.skirt, 'gi', { kind: 'seg', a: beltCenter, b: beltCenter.clone().addScaledVector(down, 0.2), sx: 1.3, sz: 0.95 });

  // 깃: 왼깃이 오른깃 위로 겹치는 V자
  const lapelDepth = (pt: Vector3, d: number) => pt.clone().addScaledVector(forward, d);
  const lapelTopL = lapelDepth(p.neck.clone().addScaledVector(lateral, 0.06).addScaledVector(up, -0.01), 0.055);
  const lapelTopR = lapelDepth(p.neck.clone().addScaledVector(lateral, -0.06).addScaledVector(up, -0.01), 0.055);
  const lapelEndL = lapelDepth(beltCenter.clone().addScaledVector(lateral, -0.07).addScaledVector(up, 0.03), 0.118);
  const lapelEndR = lapelDepth(beltCenter.clone().addScaledVector(lateral, 0.07).addScaledVector(up, 0.03), 0.112);
  const lapelMidL = lapelDepth(lerp(p.chest, p.neck, 0.35).addScaledVector(lateral, 0.0), 0.128);
  const lapelMidR = lapelDepth(lerp(p.chest, p.neck, 0.35).addScaledVector(lateral, 0.0), 0.122);
  add(BOX, 'lapel', { kind: 'strip', a: lapelTopR, b: lapelMidR, width: 0.055, thickness: 0.014 });
  add(BOX, 'lapel', { kind: 'strip', a: lapelMidR, b: lapelEndR, width: 0.055, thickness: 0.014 });
  add(BOX, 'lapel', { kind: 'strip', a: lapelTopL, b: lapelMidL, width: 0.058, thickness: 0.016 });
  add(BOX, 'lapel', { kind: 'strip', a: lapelMidL, b: lapelEndL, width: 0.058, thickness: 0.016 });
  // 뒷깃
  add(BOX, 'lapel', {
    kind: 'strip',
    a: p.neck.clone().addScaledVector(lateral, 0.065).addScaledVector(forward, -0.035).addScaledVector(up, 0.01),
    b: p.neck.clone().addScaledVector(lateral, -0.065).addScaledVector(forward, -0.035).addScaledVector(up, 0.01),
    width: 0.05,
    thickness: 0.02,
  });

  // 띠: 허리를 감는 고리 + 앞 매듭 + 늘어진 두 가닥
  add(TORUS, 'belt', { kind: 'blob', center: beltCenter, dir: forward.clone().negate(), radii: [0.165, 0.118, 0.1] });
  const knot = beltCenter.clone().addScaledVector(forward, 0.13);
  add(SPHERE, 'belt', { kind: 'blob', center: knot, dir: up, radii: [0.03, 0.022, 0.018] });
  for (const s of [1, -1]) {
    const tail = knot.clone().addScaledVector(down, 0.2).addScaledVector(lateral, s * 0.05).addScaledVector(forward, 0.03);
    add(BOX, 'belt', { kind: 'strip', a: knot, b: tail, width: 0.035, thickness: 0.008 });
  }

  // --- 하의 · 다리 ---
  ball(lerp(p.hipL, p.hipR, 0.5).addScaledVector(down, 0.02), 0.13, 'gi');
  for (const s of ['L', 'R'] as const) {
    const hip = p[`hip${s}`];
    const knee = p[`knee${s}`];
    const ankle = p[`ankle${s}`];
    const heel = p[`heel${s}`];
    const toe = p[`toe${s}`];
    ball(hip, 0.088, 'gi');
    add(GEO.thigh, 'gi', { kind: 'seg', a: hip, b: knee });
    ball(knee, 0.064, 'gi');
    const hem = lerp(knee, ankle, 0.88);
    add(GEO.shank, 'gi', { kind: 'seg', a: knee, b: hem });
    add(GEO.ankle, 'skin', { kind: 'seg', a: lerp(knee, ankle, 0.8), b: ankle });
    // 발: 뒤꿈치에서 발끝까지 납작한 타원체 + 발목 연결
    const footDir = new Vector3().subVectors(toe, heel);
    const footCenter = lerp(heel, toe, 0.48);
    add(SPHERE, 'skin', { kind: 'blob', center: footCenter, dir: footDir, radii: [0.045, footDir.length() / 2 + 0.02, 0.036] });
    ball(ankle, 0.037, 'skin');
    add(GEO.ankle, 'skin', { kind: 'seg', a: ankle, b: lerp(heel, toe, 0.3) });
  }

  // --- 팔 ---
  for (const s of ['L', 'R'] as const) {
    const shoulder = p[`shoulder${s}`];
    const elbow = p[`elbow${s}`];
    const wrist = p[`wrist${s}`];
    const hand = p[`hand${s}`];
    add(GEO.upperArm, 'gi', { kind: 'seg', a: shoulder, b: elbow });
    ball(elbow, 0.054, 'gi');
    add(GEO.sleeve, 'gi', { kind: 'seg', a: elbow, b: lerp(elbow, wrist, 0.62) });
    add(GEO.forearm, 'skin', { kind: 'seg', a: lerp(elbow, wrist, 0.4), b: wrist });
    // 손: 주먹 쥔 모양의 납작한 타원체
    const handDir = new Vector3().subVectors(hand, wrist);
    add(SPHERE, 'skin', { kind: 'blob', center: lerp(wrist, hand, 0.75), dir: handDir, radii: [0.042, 0.058, 0.03] });
  }

  // --- 목 · 머리 ---
  const headUp = new Vector3().subVectors(p.headTop, p.neck).normalize();
  const faceFwd = forward.clone().addScaledVector(headUp, -forward.dot(headUp)).normalize();
  const neckTop = lerp(p.neck, p.headTop, 0.34);
  add(GEO.neck, 'skin', { kind: 'seg', a: p.neck.clone().addScaledVector(headUp, -0.03), b: neckTop });
  const skull = lerp(p.headTop, p.neck, 0.36);
  add(SPHERE, 'skin', { kind: 'blob', center: skull, dir: headUp, radii: [0.078, 0.102, 0.092] });
  // 턱·얼굴
  add(SPHERE, 'skin', {
    kind: 'blob',
    center: skull.clone().addScaledVector(headUp, -0.045).addScaledVector(faceFwd, 0.03),
    dir: headUp,
    radii: [0.06, 0.07, 0.07],
  });
  // 코 (얼굴 방향 표시)
  add(SPHERE, 'skin', {
    kind: 'blob',
    center: skull.clone().addScaledVector(headUp, -0.02).addScaledVector(faceFwd, 0.095),
    dir: headUp,
    radii: [0.012, 0.022, 0.016],
  });
  // 귀
  for (const s of [1, -1]) {
    add(SPHERE, 'skin', {
      kind: 'blob',
      center: skull.clone().addScaledVector(lateral, s * 0.077).addScaledVector(headUp, -0.01),
      dir: headUp,
      radii: [0.012, 0.028, 0.02],
    });
  }
  // 머리카락: 두개골 위·뒤를 덮는 조금 큰 타원체
  add(SPHERE, 'hair', {
    kind: 'blob',
    center: skull.clone().addScaledVector(headUp, 0.016).addScaledVector(faceFwd, -0.014),
    dir: headUp,
    radii: [0.082, 0.1, 0.092],
  });

  return (
    <group>
      {parts.map((part, i) => (
        <Part key={i} geometry={part.geo} material={materials[part.mat]} placement={part.at} lateral={lateral} castShadow={!transparent} />
      ))}
    </group>
  );
}
