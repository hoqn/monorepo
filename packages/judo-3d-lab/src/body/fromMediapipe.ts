import { Vector3 } from 'three';
import { FOOT_RADIUS } from './balance';
import { emptyBodyPoints, type BodyPoints } from './points';

/** MediaPipe Pose Landmarker의 33개 랜드마크 중 쓰는 것들 (사람 기준 좌/우) */
const LM = {
  nose: 0,
  earL: 7,
  earR: 8,
  shoulderL: 11,
  shoulderR: 12,
  elbowL: 13,
  elbowR: 14,
  wristL: 15,
  wristR: 16,
  pinkyL: 17,
  pinkyR: 18,
  indexL: 19,
  indexR: 20,
  hipL: 23,
  hipR: 24,
  kneeL: 25,
  kneeR: 26,
  ankleL: 27,
  ankleR: 28,
  heelL: 29,
  heelR: 30,
  toeL: 31,
  toeR: 32,
} as const;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * MediaPipe worldLandmarks(미터, 골반 중심 원점, y 아래, z 카메라 쪽이 작음)를
 * BodyPoints(미터, y 위, 오른손 좌표계)로 바꾼다.
 *
 * MediaPipe에는 척추·목 랜드마크가 없으므로 골반–어깨 중점을 잇는 직선 위에 보간해 넣는다.
 * 키프레임 리그와 같은 비율(골반→배꼽 26%, →명치 66%)을 쓴다.
 *
 * 바닥 높이는 알 수 없으므로 양발 중 가장 낮은 점을 매트(y = 0)에 붙인다.
 * → 점프나 공중 동작에서는 높이가 틀린다.
 */
export function worldLandmarksToBody(world: Landmark[], offset = new Vector3()): BodyPoints {
  const at = (i: number) => {
    const l = world[i]!;
    return new Vector3(l.x, -l.y, -l.z);
  };
  const p = emptyBodyPoints();
  const mid = (a: Vector3, b: Vector3, u = 0.5) => new Vector3().lerpVectors(a, b, u);

  p.hipL.copy(at(LM.hipL));
  p.hipR.copy(at(LM.hipR));
  p.pelvis.copy(mid(p.hipL, p.hipR));
  p.shoulderL.copy(at(LM.shoulderL));
  p.shoulderR.copy(at(LM.shoulderR));
  const shoulderMid = mid(p.shoulderL, p.shoulderR);
  p.neck.copy(mid(p.pelvis, shoulderMid, 1.04));
  p.spine.copy(mid(p.pelvis, p.neck, 0.26));
  p.chest.copy(mid(p.pelvis, p.neck, 0.66));
  const earMid = mid(at(LM.earL), at(LM.earR));
  p.headTop.copy(earMid).addScaledVector(new Vector3().subVectors(earMid, p.neck).normalize(), 0.13);

  for (const s of ['L', 'R'] as const) {
    p[`elbow${s}`].copy(at(LM[`elbow${s}`]));
    p[`wrist${s}`].copy(at(LM[`wrist${s}`]));
    // 셋째 손허리뼈 머리 ≈ 검지·새끼 랜드마크 중점을 손목 쪽으로 조금
    p[`hand${s}`].copy(mid(p[`wrist${s}`], mid(at(LM[`index${s}`]), at(LM[`pinky${s}`])), 0.8));
    p[`knee${s}`].copy(at(LM[`knee${s}`]));
    p[`ankle${s}`].copy(at(LM[`ankle${s}`]));
    p[`heel${s}`].copy(at(LM[`heel${s}`]));
    p[`toe${s}`].copy(at(LM[`toe${s}`]));
  }

  const lowest = Math.min(p.heelL.y, p.heelR.y, p.toeL.y, p.toeR.y);
  const lift = new Vector3(0, FOOT_RADIUS - lowest, 0).add(offset);
  for (const v of Object.values(p)) v.add(lift);
  return p;
}

/** 2D 이미지 랜드마크 연결선 (오버레이용) */
export const SKELETON_EDGES: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
  [0, 7],
  [0, 8],
];

/**
 * 여러 사람이 찍힌 경우: worldLandmarks는 사람마다 "자기 골반이 원점"이라 서로의 위치 관계가 사라진다.
 * 2D 이미지에서 골반 위치 차이를 보고, 몸 크기(어깨–발목 픽셀 길이 ↔ 미터 길이)로 대략 미터로 환산해 옆으로 벌려 놓는다.
 * 깊이(카메라 앞뒤) 관계는 복원하지 못한다 — 두 사람이 엉키는 유도에서는 이것이 가장 큰 한계다.
 */
export function estimateLateralOffsets(images: Landmark[][], worlds: Landmark[][], aspect: number): Vector3[] {
  return images.map((img, i) => {
    const w = worlds[i]!;
    const pxLen = Math.hypot((img[11]!.x - img[27]!.x) * aspect, img[11]!.y - img[27]!.y);
    const mLen = Math.hypot(w[11]!.x - w[27]!.x, w[11]!.y - w[27]!.y, w[11]!.z - w[27]!.z);
    const metersPerUnit = pxLen > 1e-3 ? mLen / pxLen : 1.5;
    const hipX = ((img[23]!.x + img[24]!.x) / 2 - 0.5) * aspect;
    return new Vector3(hipX * metersPerUnit, 0, 0);
  });
}
