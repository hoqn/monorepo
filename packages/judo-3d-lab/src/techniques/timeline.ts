import { Vector3 } from 'three';
import type { ActorDef, LimbTarget, PoseSpec, Vec3 } from '../body/rig';
import type { Side } from '../body/points';

export interface Keyframe {
  /** 초 */
  t: number;
  tori: PoseSpec;
  uke: PoseSpec;
}

export interface Phase {
  start: number;
  end: number;
  /** 일본어 단계명 (예: 崩し) */
  name: string;
  label: string;
  description: string;
  /** 이 단계에서 눈여겨볼 포인트 */
  cues: string[];
}

export interface TechniqueAnimation {
  id: string;
  koreanName: string;
  japaneseName: string;
  romaji: string;
  /** 기술 분류 (예: 발기술) */
  category: string;
  summary: string;
  /** 위에서 본 기저면 지도의 중심(XZ). 두 사람이 움직이는 범위의 가운데 */
  mapCenter?: { x: number; y: number };
  actors: { tori: ActorDef; uke: ActorDef };
  keyframes: Keyframe[];
  phases: Phase[];
}

export const duration = (tech: TechniqueAnimation) => tech.keyframes[tech.keyframes.length - 1]!.t;

// ---------------------------------------------------------------------------
// 보간
//
// 숫자 파라미터(골반 위치·회전, 상체, 머리)는 Hermite(Catmull-Rom 계열) 보간을 써서
// 키프레임 경계에서도 속도가 끊기지 않게 한다. 속도가 끊기면 동적 균형(XCoM) 그래프가
// 키프레임마다 튀어 분석이 무의미해진다.
// 손발 목표는 종류가 바뀔 수 있으므로(잡기 → 놓기 등) 두 목표를 매 프레임 각각 풀어 섞는다.
// ---------------------------------------------------------------------------

function poseToVec(p: PoseSpec): number[] {
  return [
    ...p.root.pos,
    p.root.yaw,
    p.root.pitch,
    p.root.roll,
    p.torso.flex,
    p.torso.side,
    p.torso.twist,
    p.head.flex,
    p.head.twist,
    p.toeOut ?? 10,
  ];
}

function vecToPose(v: number[], feet: Record<Side, LimbTarget>, hands: Record<Side, LimbTarget>): PoseSpec {
  const n = (i: number) => v[i]!;
  return {
    root: { pos: [n(0), n(1), n(2)], yaw: n(3), pitch: n(4), roll: n(5) },
    torso: { flex: n(6), side: n(7), twist: n(8) },
    head: { flex: n(9), twist: n(10) },
    toeOut: n(11),
    feet,
    hands,
  };
}

function hermite(p0: number, p1: number, m0: number, m1: number, u: number, dt: number): number {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * dt * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * dt * m1
  );
}

function tangents(values: number[][], times: number[], i: number): number[] {
  const n = values.length;
  const cur = values[i]!;
  if (i === 0 || i === n - 1) return cur.map(() => 0);
  const prev = values[i - 1]!;
  const next = values[i + 1]!;
  const dt = times[i + 1]! - times[i - 1]!;
  return cur.map((_, k) => {
    // 극값(앞뒤 키보다 모두 크거나 작은 값)에서는 기울기 0 → 키프레임 값을 넘어서는 오버슈트 방지
    const a = prev[k]!;
    const b = cur[k]!;
    const c = next[k]!;
    if ((b - a) * (c - b) <= 0) return 0;
    return (c - a) / dt;
  });
}

function sameTarget(a: LimbTarget, b: LimbTarget): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

const smooth = (u: number) => u * u * (3 - 2 * u);

function blendLimbs(a: Record<Side, LimbTarget>, b: Record<Side, LimbTarget>, u: number, step: boolean) {
  const out = {} as Record<Side, LimbTarget>;
  for (const s of ['L', 'R'] as const) {
    const from = a[s];
    const to = b[s];
    if (sameTarget(from, to)) {
      out[s] = from;
      continue;
    }
    // 바닥 위 한 점에서 다른 점으로 옮기는 발은 미끄러지지 않게 "걸음"처럼 들어 올린다
    let lift = 0;
    if (step && 'at' in from && 'at' in to && from.at[1] < 0.1 && to.at[1] < 0.1) {
      lift = Math.min(0.08, Math.hypot(to.at[0] - from.at[0], to.at[2] - from.at[2]) * 0.35);
    }
    out[s] = { blend: [from, to, smooth(u), lift] };
  }
  return out;
}

export function sampleTechnique(tech: TechniqueAnimation, t: number): { tori: PoseSpec; uke: PoseSpec } {
  const kfs = tech.keyframes;
  const times = kfs.map((k) => k.t);
  const clamped = Math.max(times[0]!, Math.min(times[times.length - 1]!, t));
  let i = 0;
  while (i < kfs.length - 2 && clamped > times[i + 1]!) i++;
  const a = kfs[i]!;
  const b = kfs[i + 1] ?? a;
  const dt = b.t - a.t;
  const u = dt > 0 ? (clamped - a.t) / dt : 0;

  const sampleActor = (who: 'tori' | 'uke'): PoseSpec => {
    const values = kfs.map((k) => poseToVec(k[who]));
    const m0 = tangents(values, times, i);
    const m1 = tangents(values, times, Math.min(i + 1, kfs.length - 1));
    const va = values[i]!;
    const vb = values[Math.min(i + 1, kfs.length - 1)]!;
    const vec = va.map((x, k) => hermite(x, vb[k]!, m0[k]!, m1[k]!, u, dt));
    const base = vecToPose(vec, a[who].feet, a[who].hands);
    return {
      ...base,
      feet: blendLimbs(a[who].feet, b[who].feet, u, true),
      hands: blendLimbs(a[who].hands, b[who].hands, u, false),
    };
  };

  return { tori: sampleActor('tori'), uke: sampleActor('uke') };
}

export function phaseAt(tech: TechniqueAnimation, t: number): Phase | undefined {
  return tech.phases.find((p) => t >= p.start && t < p.end) ?? tech.phases[tech.phases.length - 1];
}

export const vec3 = (v: Vec3) => new Vector3(...v);
