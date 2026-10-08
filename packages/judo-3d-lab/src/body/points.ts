import { Vector3 } from 'three';

/**
 * 모든 실험이 공유하는 "몸의 표현"은 이름 붙은 3D 점들의 집합이다.
 *
 * - 키프레임 리그(rig.ts)는 포즈 명세 → 점들을 계산하고,
 * - 영상 포즈 추정(MediaPipe)은 랜드마크 → 점들로 변환한다.
 *
 * 렌더링과 무게중심·기저면 분석은 오직 이 점들만 보고 동작하므로,
 * 데이터를 어디서 얻었든(수작업 키프레임, 영상 추정, 모션캡처) 같은 분석을 재사용할 수 있다.
 *
 * 좌표계: Y가 위, 단위는 미터, 매트 바닥이 y = 0.
 */
export const POINT_NAMES = [
  'pelvis', // 좌우 고관절 중심의 중점
  'spine', // 배꼽 높이 (de Leva의 OMPH)
  'chest', // 명치 높이 (XYPH)
  'neck', // 경추 7번 (C7) 근처
  'headTop',
  'shoulderL',
  'elbowL',
  'wristL',
  'handL', // 셋째 손허리뼈 머리 (주먹 중심)
  'shoulderR',
  'elbowR',
  'wristR',
  'handR',
  'hipL',
  'kneeL',
  'ankleL',
  'heelL', // 발바닥 뒤꿈치 (렌더용 반지름만큼 바닥에서 띄운 높이)
  'toeL', // 발끝
  'hipR',
  'kneeR',
  'ankleR',
  'heelR',
  'toeR',
] as const;

export type PointName = (typeof POINT_NAMES)[number];
export type BodyPoints = Record<PointName, Vector3>;
export type Side = 'L' | 'R';

export function emptyBodyPoints(): BodyPoints {
  const out = {} as BodyPoints;
  for (const n of POINT_NAMES) out[n] = new Vector3();
  return out;
}

export function cloneBodyPoints(src: BodyPoints): BodyPoints {
  const out = {} as BodyPoints;
  for (const n of POINT_NAMES) out[n] = src[n].clone();
  return out;
}

/** 점들로부터 몸통의 방향 축을 추정한다. lateral은 자신의 왼쪽, forward는 배 쪽. */
export function torsoBasis(p: BodyPoints): { lateral: Vector3; up: Vector3; forward: Vector3 } {
  const up = new Vector3().subVectors(p.neck, p.pelvis).normalize();
  const lateral = new Vector3()
    .subVectors(p.shoulderL, p.shoulderR)
    .add(new Vector3().subVectors(p.hipL, p.hipR))
    .normalize();
  // lateral을 up에 직교화
  lateral.addScaledVector(up, -lateral.dot(up)).normalize();
  const forward = new Vector3().crossVectors(lateral, up).normalize();
  return { lateral, up, forward };
}
