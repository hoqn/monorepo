import { Euler, Quaternion, Vector3 } from 'three';
import { FOOT_RADIUS } from './balance';
import { emptyBodyPoints, type BodyPoints, type Side } from './points';

/**
 * 키프레임 리그.
 *
 * 관절 각도를 일일이 지정하는 대신, 사람이 "기술 설명"을 할 때 쓰는 단위로 포즈를 적는다.
 * - 골반: 어디에 있고 얼마나 돌고 기울었는가
 * - 상체: 얼마나 숙이고 비틀었는가
 * - 발: 어디를 디디는가 (→ 다리는 2관절 IK로 자동 계산)
 * - 손: 상대의 어디를 잡는가 (→ 팔은 2관절 IK로 자동 계산)
 *
 * 손이 상대의 깃·소매에 "붙어 있게" 만드는 게 핵심이다. 키프레임 사이를 보간해도
 * 잡기 위치는 매 프레임 상대 몸에서 다시 계산되므로 손이 허공에 뜨지 않는다.
 *
 * 좌표계: Y 위, 미터. yaw 0이면 +Z를 바라보며, 이때 자신의 왼쪽이 +X.
 */

export type Vec3 = [number, number, number];

/** 상대 몸의 잡기 지점 */
export type GripPoint = 'lapelL' | 'lapelR' | 'sleeveL' | 'sleeveR' | 'collarBack' | 'beltBack' | 'beltFront';

export type LimbTarget =
  /** 월드 좌표 */
  | { at: Vec3 }
  /** 자기 골반 기준(yaw만 반영) 좌표. x = 왼쪽, y = 위, z = 앞 */
  | { local: Vec3 }
  /** 자기 골반 기준(yaw·pitch·roll 모두 반영) 좌표. 몸이 뒤집혀도 함께 돈다 — 공중에 뜬 우케의 다리 등 */
  | { body: Vec3 }
  /** 상대의 잡기 지점 */
  | { grip: GripPoint }
  /** 두 목표를 각각 푼 뒤 섞음(키프레임 보간용). 세 번째 값은 0→1 비율, 네 번째는 걸음처럼 들어 올리는 높이(m) */
  | { blend: [LimbTarget, LimbTarget, number, number?] };

export interface PoseSpec {
  /** 골반 중심 위치(월드)와 방향(도). pitch+ 앞으로 숙임, roll+ 자기 오른쪽으로 기울어짐 */
  root: { pos: Vec3; yaw: number; pitch: number; roll: number };
  /** 상체(허리~가슴) 굽힘. flex+ 앞으로, side+ 오른쪽으로, twist+ 왼쪽으로 비틂 */
  torso: { flex: number; side: number; twist: number };
  head: { flex: number; twist: number };
  feet: Record<Side, LimbTarget>;
  hands: Record<Side, LimbTarget>;
  /** 발끝을 바깥으로 벌린 각도(도). 기본 10° */
  toeOut?: number;
}

export interface ActorDef {
  id: string;
  name: string;
  /** 키(m) */
  height: number;
  /** 체중(kg) */
  mass: number;
  color: string;
}

/** 키 1.75m 기준 골격 치수(m). 다른 키는 비례 축소·확대한다. */
const BASE_HEIGHT = 1.75;
const DIM = {
  hipHalfWidth: 0.09,
  pelvisToSpine: 0.14,
  spineToChest: 0.21,
  chestToNeck: 0.18,
  neckToHeadTop: 0.3,
  shoulderHalfWidth: 0.18,
  shoulderAboveChest: 0.14,
  upperArm: 0.29,
  forearm: 0.26,
  hand: 0.08,
  thigh: 0.43,
  shank: 0.42,
  ankleHeight: 0.07,
  heelBack: 0.05,
  toeFront: 0.16,
  chestDepth: 0.11,
};

export interface ResolvedBody {
  actor: ActorDef;
  points: BodyPoints;
  /** 골반·가슴 좌표계(월드 회전). 열벡터가 각각 왼쪽, 위, 앞 */
  pelvisRot: Quaternion;
  chestRot: Quaternion;
  /** IK 목표에 손발이 닿지 못한 거리(m). 포즈 작성 시 디버깅용 */
  reachError: Record<'handL' | 'handR' | 'footL' | 'footR', number>;
}

const DEG = Math.PI / 180;

function quatFromEulerDeg(yaw: number, pitch: number, roll: number): Quaternion {
  // pitch+는 +X축 회전(위쪽 벡터가 +Z로 = 앞으로 숙임), roll+는 +Z축 회전(위쪽이 −X = 자기 오른쪽)
  return new Quaternion().setFromEuler(new Euler(pitch * DEG, yaw * DEG, roll * DEG, 'YXZ'));
}

/**
 * 2관절 IK. root에서 target으로 길이 l1, l2인 두 뼈를 뻗고, 중간 관절은 pole 방향으로 굽힌다.
 * 닿지 않으면 target 방향으로 쭉 편다.
 */
export function solveTwoBone(
  root: Vector3,
  target: Vector3,
  l1: number,
  l2: number,
  pole: Vector3,
): { mid: Vector3; end: Vector3; error: number } {
  const d = new Vector3().subVectors(target, root);
  const rawDist = d.length();
  const dir = rawDist > 1e-6 ? d.divideScalar(rawDist) : new Vector3(0, -1, 0);
  const dist = Math.min(Math.max(rawDist, Math.abs(l1 - l2) + 1e-4), l1 + l2 - 1e-5);
  const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
  const a = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const bend = pole.clone().addScaledVector(dir, -pole.dot(dir));
  if (bend.lengthSq() < 1e-8) {
    // pole이 뼈 방향과 평행이면 아무 수직 방향이나 사용
    bend.set(1, 0, 0).addScaledVector(dir, -dir.x);
    if (bend.lengthSq() < 1e-8) bend.set(0, 0, 1).addScaledVector(dir, -dir.z);
  }
  bend.normalize();
  const mid = root.clone().addScaledVector(dir, l1 * Math.cos(a)).addScaledVector(bend, l1 * Math.sin(a));
  const end = root.clone().addScaledVector(dir, dist);
  return { mid, end, error: Math.max(0, rawDist - dist) };
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** 잡기 지점을 상대 몸 위의 월드 좌표로 */
export function gripPosition(body: ResolvedBody, grip: GripPoint): Vector3 {
  const p = body.points;
  const s = body.actor.height / BASE_HEIGHT;
  const lateral = v(1, 0, 0).applyQuaternion(body.chestRot);
  const forward = v(0, 0, 1).applyQuaternion(body.chestRot);
  const depth = DIM.chestDepth * s;
  switch (grip) {
    case 'lapelL':
    case 'lapelR': {
      const sign = grip === 'lapelL' ? 1 : -1;
      return new Vector3()
        .lerpVectors(p.chest, p.neck, 0.45)
        .addScaledVector(lateral, sign * 0.08 * s)
        .addScaledVector(forward, depth);
    }
    case 'sleeveL':
      return new Vector3().lerpVectors(p.elbowL, p.wristL, 0.4);
    case 'sleeveR':
      return new Vector3().lerpVectors(p.elbowR, p.wristR, 0.4);
    case 'collarBack':
      return p.neck.clone().addScaledVector(forward, -0.07 * s);
    case 'beltBack':
    case 'beltFront': {
      const sign = grip === 'beltFront' ? 1 : -1;
      return new Vector3().lerpVectors(p.pelvis, p.spine, 0.5).addScaledVector(forward, sign * 0.12 * s);
    }
  }
}

function resolveTarget(
  t: LimbTarget,
  self: { pelvisPos: Vector3; yawRot: Quaternion; pelvisRot: Quaternion },
  other: ResolvedBody | undefined,
): Vector3 {
  if ('at' in t) return v(...t.at);
  if ('local' in t) return v(...t.local).applyQuaternion(self.yawRot).add(self.pelvisPos);
  if ('body' in t) return v(...t.body).applyQuaternion(self.pelvisRot).add(self.pelvisPos);
  if ('blend' in t) {
    const [a, b, u, lift = 0] = t.blend;
    const out = resolveTarget(a, self, other).lerp(resolveTarget(b, self, other), u);
    out.y += 4 * u * (1 - u) * lift;
    return out;
  }
  if (!other) throw new Error(`잡기 대상(${t.grip})이 없는데 grip 목표를 썼습니다.`);
  return gripPosition(other, t.grip);
}

/** 1단계: 몸통·머리·다리. 팔은 상대 몸이 정해진 뒤 2단계에서 푼다. */
function resolveTrunkAndLegs(actor: ActorDef, pose: PoseSpec): ResolvedBody {
  const s = actor.height / BASE_HEIGHT;
  const p = emptyBodyPoints();
  const pelvisPos = v(...pose.root.pos);
  const pelvisRot = quatFromEulerDeg(pose.root.yaw, pose.root.pitch, pose.root.roll);
  const yawRot = quatFromEulerDeg(pose.root.yaw, 0, 0);

  const { flex, side, twist } = pose.torso;
  const spineRot = pelvisRot.clone().multiply(quatFromEulerDeg(twist * 0.4, flex * 0.4, side * 0.4));
  const chestRot = spineRot.clone().multiply(quatFromEulerDeg(twist * 0.6, flex * 0.6, side * 0.6));
  const neckRot = chestRot.clone().multiply(quatFromEulerDeg(pose.head.twist, pose.head.flex, 0));

  const at = (base: Vector3, rot: Quaternion, x: number, y: number, z: number) =>
    v(x * s, y * s, z * s).applyQuaternion(rot).add(base);

  p.pelvis.copy(pelvisPos);
  p.spine.copy(at(p.pelvis, pelvisRot, 0, DIM.pelvisToSpine, 0));
  p.chest.copy(at(p.spine, spineRot, 0, DIM.spineToChest, 0));
  p.neck.copy(at(p.chest, chestRot, 0, DIM.chestToNeck, 0));
  p.headTop.copy(at(p.neck, neckRot, 0, DIM.neckToHeadTop, 0));
  p.shoulderL.copy(at(p.chest, chestRot, DIM.shoulderHalfWidth, DIM.shoulderAboveChest, 0));
  p.shoulderR.copy(at(p.chest, chestRot, -DIM.shoulderHalfWidth, DIM.shoulderAboveChest, 0));
  p.hipL.copy(at(p.pelvis, pelvisRot, DIM.hipHalfWidth, 0, 0));
  p.hipR.copy(at(p.pelvis, pelvisRot, -DIM.hipHalfWidth, 0, 0));

  const pelvisForward = v(0, 0, 1).applyQuaternion(pelvisRot);
  const pelvisLateral = v(1, 0, 0).applyQuaternion(pelvisRot);
  const reachError = { handL: 0, handR: 0, footL: 0, footR: 0 };

  for (const sideKey of ['L', 'R'] as const) {
    const sign = sideKey === 'L' ? 1 : -1;
    const hip = sideKey === 'L' ? p.hipL : p.hipR;
    const target = resolveTarget(pose.feet[sideKey], { pelvisPos, yawRot, pelvisRot }, undefined);
    // 무릎은 골반 앞쪽 + 살짝 바깥으로 굽는다
    const pole = pelvisForward.clone().addScaledVector(pelvisLateral, sign * 0.15);
    const { mid, end, error } = solveTwoBone(hip, target, DIM.thigh * s, DIM.shank * s, pole);
    const knee = sideKey === 'L' ? p.kneeL : p.kneeR;
    const ankle = sideKey === 'L' ? p.ankleL : p.ankleR;
    knee.copy(mid);
    ankle.copy(end);
    reachError[sideKey === 'L' ? 'footL' : 'footR'] = error;

    // 발 방향: 바닥 근처에선 수평(발바닥이 매트에 붙음), 높이 들리면 정강이에 수직
    const toeOut = (pose.toeOut ?? 10) * sign * DEG;
    const flatForward = v(pelvisForward.x, 0, pelvisForward.z);
    if (flatForward.lengthSq() < 1e-6) flatForward.set(0, 0, 1).applyQuaternion(yawRot);
    flatForward.normalize().applyAxisAngle(v(0, 1, 0), toeOut);
    const shankDir = new Vector3().subVectors(end, mid).normalize();
    const perpForward = pelvisForward.clone().applyAxisAngle(shankDir, toeOut);
    perpForward.addScaledVector(shankDir, -perpForward.dot(shankDir));
    if (perpForward.lengthSq() < 1e-6) perpForward.copy(flatForward);
    perpForward.normalize();
    const lift = Math.min(1, Math.max(0, (end.y - DIM.ankleHeight * s - 0.04) / 0.2));
    const footDir = flatForward.clone().lerp(perpForward, lift).normalize();
    const soleDown = v(0, -1, 0).lerp(shankDir, lift).normalize();
    const soleDrop = DIM.ankleHeight * s - FOOT_RADIUS;
    const heel = end.clone().addScaledVector(soleDown, soleDrop).addScaledVector(footDir, -DIM.heelBack * s);
    const toe = end.clone().addScaledVector(soleDown, soleDrop).addScaledVector(footDir, DIM.toeFront * s);
    (sideKey === 'L' ? p.heelL : p.heelR).copy(heel);
    (sideKey === 'L' ? p.toeL : p.toeR).copy(toe);
  }

  return { actor, points: p, pelvisRot, chestRot, reachError };
}

function resolveArm(body: ResolvedBody, pose: PoseSpec, side: Side, other: ResolvedBody | undefined): void {
  const s = body.actor.height / BASE_HEIGHT;
  const p = body.points;
  const sign = side === 'L' ? 1 : -1;
  const shoulder = side === 'L' ? p.shoulderL : p.shoulderR;
  const yawRot = quatFromEulerDeg(pose.root.yaw, 0, 0);
  const wristTarget = resolveTarget(pose.hands[side], { pelvisPos: p.pelvis, yawRot, pelvisRot: body.pelvisRot }, other);

  // 손목이 아니라 "주먹 중심"이 잡기 지점에 오도록, 목표에서 손 길이만큼 어깨 쪽으로 당긴다
  const toShoulder = new Vector3().subVectors(shoulder, wristTarget);
  const handLen = DIM.hand * s;
  const wristGoal = wristTarget.clone().addScaledVector(toShoulder.normalize(), handLen);

  const lateral = v(1, 0, 0).applyQuaternion(body.chestRot);
  const up = v(0, 1, 0).applyQuaternion(body.chestRot);
  const forward = v(0, 0, 1).applyQuaternion(body.chestRot);
  // 팔꿈치는 아래·바깥·약간 뒤로
  const pole = up.clone().multiplyScalar(-1).addScaledVector(lateral, sign * 0.6).addScaledVector(forward, -0.3);
  const { mid, end, error } = solveTwoBone(shoulder, wristGoal, DIM.upperArm * s, DIM.forearm * s, pole);
  const elbow = side === 'L' ? p.elbowL : p.elbowR;
  const wrist = side === 'L' ? p.wristL : p.wristR;
  const hand = side === 'L' ? p.handL : p.handR;
  elbow.copy(mid);
  wrist.copy(end);
  hand.copy(end).addScaledVector(new Vector3().subVectors(end, mid).normalize(), handLen);
  body.reachError[side === 'L' ? 'handL' : 'handR'] = error;
}

function targetsSleeve(t: LimbTarget): boolean {
  if ('blend' in t) return targetsSleeve(t.blend[0]) || targetsSleeve(t.blend[1]);
  return 'grip' in t && (t.grip === 'sleeveL' || t.grip === 'sleeveR');
}

/**
 * 여러 사람의 포즈를 한꺼번에 푼다. 두 사람(tori/uke)을 가정하며, 각자의 grip은 상대를 가리킨다.
 *
 * 순서: 몸통·다리 → 상대 몸통을 잡는 팔 → 상대 소매(=상대 팔)를 잡는 팔.
 */
export function resolvePair(
  actors: [ActorDef, ActorDef],
  poses: [PoseSpec, PoseSpec],
): [ResolvedBody, ResolvedBody] {
  const bodies: [ResolvedBody, ResolvedBody] = [
    resolveTrunkAndLegs(actors[0], poses[0]),
    resolveTrunkAndLegs(actors[1], poses[1]),
  ];
  for (const pass of [false, true]) {
    for (const i of [0, 1] as const) {
      for (const side of ['L', 'R'] as const) {
        if (targetsSleeve(poses[i].hands[side]) === pass) {
          resolveArm(bodies[i], poses[i], side, bodies[1 - i]);
        }
      }
    }
  }
  return bodies;
}

export function resolveSolo(actor: ActorDef, pose: PoseSpec): ResolvedBody {
  const body = resolveTrunkAndLegs(actor, pose);
  resolveArm(body, pose, 'L', undefined);
  resolveArm(body, pose, 'R', undefined);
  return body;
}
