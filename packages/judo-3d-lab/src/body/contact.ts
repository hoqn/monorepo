import { Vector3 } from 'three';
import { CONTACT_HEIGHT } from './balance';
import type { BodyPoints, PointName } from './points';

/**
 * 두 사람 사이의 겹침(관통)을 풀고 접촉 지점을 찾는다.
 *
 * 키프레임 리그는 각자의 자세를 따로 계산하므로, 몸이 맞붙는 유도에서는 팔다리·몸통이 서로 파고들기 쉽다.
 * 여기서는 몸을 캡슐(굵기 있는 선분) 묶음으로 근사하고, 위치 기반 동역학(PBD) 방식으로 반복해서
 * 1) 서로 다른 사람의 캡슐이 겹치면 밀어내고,
 * 2) 뼈 길이(넙다리·종아리·위팔·아래팔)를 원래대로 되돌린다.
 *
 * - 몸통(골반·척추·가슴·목·머리·어깨·고관절)은 하나의 강체로 보고 통째로 평행이동한다.
 * - 바닥을 딛고 있는 발목은 고정한다(질량 무한대).
 * - 손은 상대의 깃·소매를 "잡아야" 하므로 충돌에서 뺀다.
 */

interface Capsule {
  a: PointName;
  b: PointName;
  /** a→b 사이에서 캡슐이 차지하는 구간 */
  ta: number;
  tb: number;
  r: number;
  label: string;
}

const cap = (a: PointName, b: PointName, r: number, label: string, ta = 0, tb = 1): Capsule => ({ a, b, ta, tb, r, label });

/** Figure.tsx의 외형보다 약간 작게 잡아, 옷끼리 살짝 닿는 정도는 허용한다 */
const CAPSULES: Capsule[] = [
  cap('pelvis', 'spine', 0.12, '허리'),
  cap('spine', 'chest', 0.12, '몸통'),
  cap('chest', 'neck', 0.12, '가슴·등'),
  cap('hipL', 'hipR', 0.1, '엉덩이'),
  cap('shoulderL', 'shoulderR', 0.07, '어깨'),
  cap('neck', 'headTop', 0.09, '머리', 0.4, 0.72),
  cap('hipL', 'kneeL', 0.075, '왼 넙다리'),
  cap('hipR', 'kneeR', 0.075, '오른 넙다리'),
  cap('kneeL', 'ankleL', 0.055, '왼 종아리'),
  cap('kneeR', 'ankleR', 0.055, '오른 종아리'),
  cap('heelL', 'toeL', 0.035, '왼발'),
  cap('heelR', 'toeR', 0.035, '오른발'),
  cap('shoulderL', 'elbowL', 0.05, '왼 위팔'),
  cap('shoulderR', 'elbowR', 0.05, '오른 위팔'),
  cap('elbowL', 'wristL', 0.04, '왼 아래팔', 0, 0.75),
  cap('elbowR', 'wristR', 0.04, '오른 아래팔', 0, 0.75),
];

const TORSO: PointName[] = ['pelvis', 'spine', 'chest', 'neck', 'headTop', 'shoulderL', 'shoulderR', 'hipL', 'hipR'];
const TORSO_SET = new Set<PointName>(TORSO);

const BONES: [PointName, PointName][] = [
  ['hipL', 'kneeL'],
  ['kneeL', 'ankleL'],
  ['hipR', 'kneeR'],
  ['kneeR', 'ankleR'],
  ['shoulderL', 'elbowL'],
  ['elbowL', 'wristL'],
  ['shoulderR', 'elbowR'],
  ['elbowR', 'wristR'],
];

/** 끝점(손·발)은 부모 관절을 따라 함께 움직인다 */
const FOLLOWERS: [PointName, PointName][] = [
  ['ankleL', 'heelL'],
  ['ankleL', 'toeL'],
  ['ankleR', 'heelR'],
  ['ankleR', 'toeR'],
  ['wristL', 'handL'],
  ['wristR', 'handR'],
];

export interface Contact {
  position: Vector3;
  /** 예: "가슴 ↔ 가슴" (첫 번째가 tori 쪽) */
  label: string;
}

export interface ContactResult {
  contacts: Contact[];
  /** 보정 전 가장 깊이 파고든 정도(m) */
  maxPenetrationBefore: number;
  maxPenetrationAfter: number;
}

/** 두 선분 p1q1, p2q2 사이 최단 거리의 매개변수 (Ericson, Real-Time Collision Detection 5.1.9) */
function closestParams(p1: Vector3, q1: Vector3, p2: Vector3, q2: Vector3): [number, number] {
  const d1 = new Vector3().subVectors(q1, p1);
  const d2 = new Vector3().subVectors(q2, p2);
  const r = new Vector3().subVectors(p1, p2);
  const a = d1.dot(d1);
  const e = d2.dot(d2);
  const f = d2.dot(r);
  const EPS = 1e-9;
  if (a <= EPS && e <= EPS) return [0, 0];
  if (a <= EPS) return [0, clamp01(f / e)];
  const c = d1.dot(r);
  if (e <= EPS) return [clamp01(-c / a), 0];
  const b = d1.dot(d2);
  const denom = a * e - b * b;
  let s = denom > EPS ? clamp01((b * f - c * e) / denom) : 0;
  let t = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = clamp01(-c / a);
  } else if (t > 1) {
    t = 1;
    s = clamp01((b - c) / a);
  }
  return [s, t];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * 몸 하나의 "움직일 수 있는 입자" 표현.
 * 몸통 점들은 하나의 입자(평행이동)로 묶고, 팔다리 관절은 각각 입자다.
 */
class BodySolver {
  readonly torsoOffset = new Vector3();
  readonly torsoInvMass: number;
  readonly pinned = new Set<PointName>();
  private readonly restLength: number[];

  constructor(
    readonly p: BodyPoints,
    groundY: number,
  ) {
    for (const s of ['L', 'R'] as const) {
      const grounded = [p[`heel${s}`], p[`toe${s}`]].some((v) => v.y - groundY <= CONTACT_HEIGHT);
      if (grounded) this.pinned.add(`ankle${s}`);
    }
    // 두 발이 다 떠 있으면(던져지는 중) 몸통이 가볍게 밀린다
    this.torsoInvMass = this.pinned.size === 0 ? 1 : 0.35;
    this.restLength = BONES.map(([a, b]) => p[a].distanceTo(p[b]));
  }

  invMass(n: PointName): number {
    if (TORSO_SET.has(n)) return this.torsoInvMass;
    return this.pinned.has(n) ? 0 : 1;
  }

  /** 점 n을 delta만큼 옮긴다. 몸통 점이면 몸통 전체를 옮긴다 */
  move(n: PointName, delta: Vector3) {
    if (TORSO_SET.has(n)) {
      for (const t of TORSO) this.p[t].add(delta);
      this.torsoOffset.add(delta);
    } else {
      this.p[n].add(delta);
    }
  }

  solveBones() {
    BONES.forEach(([a, b], i) => {
      const wa = this.invMass(a);
      const wb = this.invMass(b);
      if (wa + wb === 0) return;
      const d = new Vector3().subVectors(this.p[b], this.p[a]);
      const len = d.length();
      if (len < 1e-6) return;
      const err = len - this.restLength[i]!;
      d.multiplyScalar(err / len / (wa + wb));
      this.move(a, d.clone().multiplyScalar(wa));
      this.move(b, d.multiplyScalar(-wb));
    });
  }
}

function endpoints(p: BodyPoints, c: Capsule): [Vector3, Vector3] {
  return [new Vector3().lerpVectors(p[c.a], p[c.b], c.ta), new Vector3().lerpVectors(p[c.a], p[c.b], c.tb)];
}

/** 두 캡슐의 최근접점과 거리. 몸통끼리의 같은 점 쌍 비교는 하지 않는다(서로 다른 사람만 비교) */
function measure(pa: BodyPoints, ca: Capsule, pb: BodyPoints, cb: Capsule) {
  const [a0, a1] = endpoints(pa, ca);
  const [b0, b1] = endpoints(pb, cb);
  const [s, t] = closestParams(a0, a1, b0, b1);
  const qa = new Vector3().lerpVectors(a0, a1, s);
  const qb = new Vector3().lerpVectors(b0, b1, t);
  return { s, t, qa, qb, dist: qa.distanceTo(qb) };
}

const ITERATIONS = 24;
/** 이 정도 겹침은 도복이 눌리는 것으로 보고 허용 */
const SLOP = 0.01;
/** 이 거리 안이면 "닿아 있다"고 표시 */
const TOUCH = 0.025;

/**
 * a, b의 점을 제자리에서 고쳐 겹침을 푼다.
 * 반환값의 contacts는 보정 후 실제로 맞닿은 지점들이다.
 */
export function resolveContacts(a: BodyPoints, b: BodyPoints, groundY = 0): ContactResult {
  const sa = new BodySolver(a, groundY);
  const sb = new BodySolver(b, groundY);
  const followerBase = FOLLOWERS.map(([parent]) => [a[parent].clone(), b[parent].clone()] as const);

  let maxPenetrationBefore = 0;
  let maxPenetrationAfter = 0;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    let maxPen = 0;
    for (const ca of CAPSULES) {
      for (const cb of CAPSULES) {
        const m = measure(a, ca, b, cb);
        const minDist = ca.r + cb.r - SLOP;
        if (m.dist >= minDist) continue;
        const pen = minDist - m.dist;
        maxPen = Math.max(maxPen, pen);

        let n = new Vector3().subVectors(m.qb, m.qa);
        if (n.lengthSq() < 1e-10) n = new Vector3().subVectors(b.pelvis, a.pelvis);
        if (n.lengthSq() < 1e-10) n.set(0, 1, 0);
        n.normalize();

        // 각 캡슐의 두 끝점이 최근접점에 기여하는 비율
        const ua = ca.ta + m.s * (ca.tb - ca.ta);
        const ub = cb.ta + m.t * (cb.tb - cb.ta);
        const raw: { solver: BodySolver; name: PointName; w: number; sign: number }[] = [
          { solver: sa, name: ca.a, w: 1 - ua, sign: -1 },
          { solver: sa, name: ca.b, w: ua, sign: -1 },
          { solver: sb, name: cb.a, w: 1 - ub, sign: 1 },
          { solver: sb, name: cb.b, w: ub, sign: 1 },
        ];
        // 두 끝점이 모두 몸통(같은 강체)이면 하나의 항으로 합친다. 안 그러면 몸통이 두 번 밀린다
        const terms: typeof raw = [];
        for (const x of raw) {
          const same = terms.find((y) => y.solver === x.solver && TORSO_SET.has(y.name) && TORSO_SET.has(x.name));
          if (same) same.w += x.w;
          else terms.push({ ...x });
        }
        const denom = terms.reduce((acc, x) => acc + x.w * x.w * x.solver.invMass(x.name), 0);
        if (denom < 1e-9) continue;
        const lambda = pen / denom;
        for (const x of terms) {
          const k = x.w * x.solver.invMass(x.name) * lambda * x.sign;
          if (k !== 0) x.solver.move(x.name, n.clone().multiplyScalar(k));
        }
      }
    }
    if (iter === 0) maxPenetrationBefore = maxPen;
    maxPenetrationAfter = maxPen;
    sa.solveBones();
    sb.solveBones();
    if (maxPen < 1e-4) break;
  }

  // 손·발 끝점을 부모 관절의 이동만큼 따라 옮긴다
  FOLLOWERS.forEach(([parent, child], i) => {
    const [baseA, baseB] = followerBase[i]!;
    a[child].add(new Vector3().subVectors(a[parent], baseA));
    b[child].add(new Vector3().subVectors(b[parent], baseB));
  });

  // 접촉 지점 수집 (가까운 것끼리는 하나로)
  const contacts: Contact[] = [];
  for (const ca of CAPSULES) {
    for (const cb of CAPSULES) {
      const m = measure(a, ca, b, cb);
      if (m.dist > ca.r + cb.r + TOUCH) continue;
      // 두 표면 사이의 중간점
      const n = new Vector3().subVectors(m.qb, m.qa).normalize();
      const position = m.qa.clone().addScaledVector(n, ca.r + (m.dist - ca.r - cb.r) / 2);
      if (contacts.some((c) => c.position.distanceTo(position) < 0.09)) continue;
      contacts.push({ position, label: `${ca.label} ↔ ${cb.label}` });
    }
  }

  return { contacts, maxPenetrationBefore, maxPenetrationAfter };
}
