import { Vector3 } from 'three';
import type { BodyPoints, Side } from './points';

/** 바닥 평면(XZ) 위의 2D 점. x = 월드 X, y = 월드 Z */
export interface P2 {
  x: number;
  y: number;
}

export const GRAVITY = 9.81;

/** 렌더용 발 캡슐 반지름. heel/toe 점은 발바닥에서 이만큼 위에 있다. */
export const FOOT_RADIUS = 0.035;
/** heel/toe 점이 이 높이 이하이면 바닥에 닿은 것으로 본다. */
export const CONTACT_HEIGHT = FOOT_RADIUS + 0.025;

const HEEL_HALF_WIDTH = 0.032;
const TOE_HALF_WIDTH = 0.045;

/** 발바닥 네 모서리(뒤꿈치 안·밖, 발끝 안·밖)를 월드 좌표로 */
export function soleCorners(p: BodyPoints, side: Side): Vector3[] {
  const heel = p[side === 'L' ? 'heelL' : 'heelR'];
  const toe = p[side === 'L' ? 'toeL' : 'toeR'];
  const along = new Vector3().subVectors(toe, heel);
  along.y = 0;
  if (along.lengthSq() < 1e-8) along.set(0, 0, 1);
  along.normalize();
  const lateral = new Vector3(along.z, 0, -along.x); // 수평면에서 발 방향에 수직
  return [
    heel.clone().addScaledVector(lateral, HEEL_HALF_WIDTH),
    heel.clone().addScaledVector(lateral, -HEEL_HALF_WIDTH),
    toe.clone().addScaledVector(lateral, TOE_HALF_WIDTH),
    toe.clone().addScaledVector(lateral, -TOE_HALF_WIDTH),
  ];
}

export function contactPoints(p: BodyPoints, groundY = 0): Vector3[] {
  return [...soleCorners(p, 'L'), ...soleCorners(p, 'R')].filter((c) => c.y - groundY <= CONTACT_HEIGHT);
}

export function footInContact(p: BodyPoints, side: Side, groundY = 0): boolean {
  return soleCorners(p, side).some((c) => c.y - groundY <= CONTACT_HEIGHT);
}

const cross = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** Andrew's monotone chain. 반시계 방향(+X→+Z 기준) 볼록 껍질을 돌려준다. */
export function convexHull(points: P2[]): P2[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts;
  const lower: P2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 1e-12) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 1e-12) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

function distToSegment(p: P2, a: P2, b: P2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * 볼록 다각형 경계까지의 부호 있는 거리. 안쪽이면 +, 바깥이면 −.
 * 꼭짓점이 3개 미만(점·선분)이면 면적이 없으므로 항상 0 이하.
 */
export function signedDistanceToHull(p: P2, hull: P2[]): number {
  if (hull.length === 0) return -Infinity;
  if (hull.length === 1) return -Math.hypot(p.x - hull[0]!.x, p.y - hull[0]!.y);
  let minDist = Infinity;
  let inside = hull.length >= 3;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    minDist = Math.min(minDist, distToSegment(p, a, b));
    if (hull.length >= 3 && cross(a, b, p) < 0) inside = false;
  }
  return inside ? minDist : -minDist;
}

export type BalanceState = 'stable' | 'edge' | 'unstable' | 'airborne' | 'down';

export interface BalanceResult {
  /** 기저면(base of support) 볼록 껍질, XZ 평면 */
  hull: P2[];
  /** 질량중심의 바닥 투영 */
  comGround: P2;
  /** 질량중심 투영 → 기저면 경계까지 부호 있는 거리 (m). 음수면 기저면 밖. */
  margin: number;
  /** 외삽 질량중심(XCoM, Hof 2005). 속도를 반영한 "동적" 균형 지표 */
  xcom: P2 | null;
  xcomMargin: number | null;
  state: BalanceState;
}

/**
 * 정적·동적 균형 분석.
 *
 * - 정적: 질량중심의 수직 투영이 기저면 안에 있는가.
 * - 동적: XCoM = CoM + v / ω0 (ω0 = √(g/l)) 이 기저면 안에 있는가.
 *   유도의 쿠즈시(무너뜨리기)는 상대를 "움직이는 중에" 균형을 잃게 하므로,
 *   정지 자세만 보는 정적 지표보다 XCoM이 실제 체감에 가깝다.
 */
export function analyzeBalance(points: BodyPoints, com: Vector3, comVelocity: Vector3 | null, groundY = 0): BalanceResult {
  const contacts = contactPoints(points, groundY);
  const hull = convexHull(contacts.map((c) => ({ x: c.x, y: c.z })));
  const comGround = { x: com.x, y: com.z };

  if (hull.length === 0) {
    // 발이 닿지 않았는데 질량중심이 매우 낮으면 넘어져 누운 상태로 본다
    const state = com.y - groundY < 0.4 ? 'down' : 'airborne';
    return { hull, comGround, margin: -Infinity, xcom: null, xcomMargin: null, state };
  }

  const margin = signedDistanceToHull(comGround, hull);
  let xcom: P2 | null = null;
  let xcomMargin: number | null = null;
  if (comVelocity) {
    const l = Math.max(0.3, com.y - groundY);
    const omega0 = Math.sqrt(GRAVITY / l);
    xcom = { x: com.x + comVelocity.x / omega0, y: com.z + comVelocity.z / omega0 };
    xcomMargin = signedDistanceToHull(xcom, hull);
  }

  const governing = xcomMargin ?? margin;
  const state: BalanceState = governing < 0 ? 'unstable' : governing < 0.03 ? 'edge' : 'stable';
  return { hull, comGround, margin, xcom, xcomMargin, state };
}

export const BALANCE_STATE_LABEL: Record<BalanceState, string> = {
  stable: '안정',
  edge: '경계',
  unstable: '무너짐',
  airborne: '발 떨어짐',
  down: '넘어짐',
};
