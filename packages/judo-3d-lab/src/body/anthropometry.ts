import { Vector3 } from 'three';
import type { BodyPoints, PointName } from './points';

/**
 * 분절(segment) 질량 분포 표.
 *
 * 출처: de Leva, P. (1996). "Adjustments to Zatsiorsky-Seluyanov's segment inertia parameters."
 * Journal of Biomechanics, 29(9), 1223–1230. — 남성 기준 값.
 *
 * - massFraction: 전체 체중 대비 분절 질량 비율
 * - comRatio: `from` 끝점에서 `to` 끝점 방향으로 분절 길이의 몇 % 지점에 분절 질량중심이 있는지
 *
 * 몸통은 de Leva의 3분할(상·중·하부 몸통)을 그대로 쓰고, 끝점은 points.ts의 근사 위치에 대응시켰다.
 */
export interface SegmentDef {
  id: string;
  label: string;
  from: PointName;
  to: PointName;
  massFraction: number;
  comRatio: number;
}

export const SEGMENTS: readonly SegmentDef[] = [
  { id: 'head', label: '머리·목', from: 'headTop', to: 'neck', massFraction: 0.0694, comRatio: 0.5976 },
  { id: 'upperTrunk', label: '상부 몸통', from: 'neck', to: 'chest', massFraction: 0.1596, comRatio: 0.2999 },
  { id: 'midTrunk', label: '중부 몸통', from: 'chest', to: 'spine', massFraction: 0.1633, comRatio: 0.4502 },
  { id: 'lowerTrunk', label: '하부 몸통', from: 'spine', to: 'pelvis', massFraction: 0.1117, comRatio: 0.6115 },
  { id: 'upperArmL', label: '왼 위팔', from: 'shoulderL', to: 'elbowL', massFraction: 0.0271, comRatio: 0.5772 },
  { id: 'forearmL', label: '왼 아래팔', from: 'elbowL', to: 'wristL', massFraction: 0.0162, comRatio: 0.4574 },
  { id: 'handL', label: '왼손', from: 'wristL', to: 'handL', massFraction: 0.0061, comRatio: 0.79 },
  { id: 'upperArmR', label: '오른 위팔', from: 'shoulderR', to: 'elbowR', massFraction: 0.0271, comRatio: 0.5772 },
  { id: 'forearmR', label: '오른 아래팔', from: 'elbowR', to: 'wristR', massFraction: 0.0162, comRatio: 0.4574 },
  { id: 'handR', label: '오른손', from: 'wristR', to: 'handR', massFraction: 0.0061, comRatio: 0.79 },
  { id: 'thighL', label: '왼 넙다리', from: 'hipL', to: 'kneeL', massFraction: 0.1416, comRatio: 0.4095 },
  { id: 'shankL', label: '왼 종아리', from: 'kneeL', to: 'ankleL', massFraction: 0.0433, comRatio: 0.4459 },
  { id: 'footL', label: '왼발', from: 'heelL', to: 'toeL', massFraction: 0.0137, comRatio: 0.4415 },
  { id: 'thighR', label: '오른 넙다리', from: 'hipR', to: 'kneeR', massFraction: 0.1416, comRatio: 0.4095 },
  { id: 'shankR', label: '오른 종아리', from: 'kneeR', to: 'ankleR', massFraction: 0.0433, comRatio: 0.4459 },
  { id: 'footR', label: '오른발', from: 'heelR', to: 'toeR', massFraction: 0.0137, comRatio: 0.4415 },
];

export interface SegmentCom {
  def: SegmentDef;
  position: Vector3;
  mass: number;
}

export interface ComResult {
  /** 전신 질량중심 */
  com: Vector3;
  totalMass: number;
  segments: SegmentCom[];
}

/** 분절 질량중심의 질량 가중 평균으로 전신 질량중심을 구한다. */
export function computeCom(points: BodyPoints, totalMass: number): ComResult {
  const com = new Vector3();
  let fractionSum = 0;
  const segments: SegmentCom[] = SEGMENTS.map((def) => {
    const position = new Vector3().lerpVectors(points[def.from], points[def.to], def.comRatio);
    com.addScaledVector(position, def.massFraction);
    fractionSum += def.massFraction;
    return { def, position, mass: def.massFraction * totalMass };
  });
  com.divideScalar(fractionSum);
  return { com, totalMass, segments };
}

/** 여러 사람(예: 잡기로 연결된 두 사람)의 합성 질량중심 */
export function combinedCom(results: ComResult[]): Vector3 {
  const out = new Vector3();
  let mass = 0;
  for (const r of results) {
    out.addScaledVector(r.com, r.totalMass);
    mass += r.totalMass;
  }
  return mass > 0 ? out.divideScalar(mass) : out;
}
