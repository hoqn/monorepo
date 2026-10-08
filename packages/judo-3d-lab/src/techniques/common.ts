import type { ActorDef, PoseSpec } from '../body/rig';

/**
 * 모든 기술이 공유하는 출발 상태.
 *
 * 기술 데이터는 수작업 키프레임이다. 실제 선수 데이터를 측정한 것이 아니라, KODOKAN 시범 영상을 보며
 * 단계별 대표 자세를 "기술 설명 단위"(골반 위치, 상체 숙임, 디딤발 위치, 잡기)로 옮겨 적었다.
 * 따라서 각도·위치는 교육용 근사치이며, 분석 결과도 그 정확도를 넘지 않는다.
 *
 * 배치: 토리(던지는 사람)는 처음에 +Z를 바라보고, 우케(받는 사람)는 −Z를 바라본다.
 * 토리의 왼쪽 = +X, 우케의 오른쪽 = +X. 모두 오른쪽 기술 기준.
 */

export const TORI: ActorDef = { id: 'tori', name: '토리 (던지는 사람)', height: 1.75, mass: 75, color: '#f3f1ea' };
export const UKE: ActorDef = { id: 'uke', name: '우케 (받는 사람)', height: 1.75, mass: 75, color: '#2f63b5' };

/** 오른쪽 맞잡기: 오른손은 상대 왼깃, 왼손은 상대 오른소매 */
export const RIGHT_GRIP = { R: { grip: 'lapelL' }, L: { grip: 'sleeveR' } } as const satisfies PoseSpec['hands'];

export const TORI_SHIZENTAI: PoseSpec = {
  root: { pos: [0, 0.89, -0.33], yaw: 0, pitch: 3, roll: 0 },
  torso: { flex: 3, side: 0, twist: 0 },
  head: { flex: 5, twist: 0 },
  feet: { L: { at: [0.15, 0.07, -0.4] }, R: { at: [-0.13, 0.07, -0.25] } },
  hands: RIGHT_GRIP,
};

export const UKE_SHIZENTAI: PoseSpec = {
  root: { pos: [0, 0.89, 0.33], yaw: 180, pitch: 3, roll: 0 },
  torso: { flex: 3, side: 0, twist: 0 },
  head: { flex: 5, twist: 0 },
  feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.15, 0.07, 0.4] } },
  hands: RIGHT_GRIP,
};

export const GRIP_PHASE = {
  name: '組み手',
  label: '맞잡기 · 자연체',
  description: '오른쪽 맞잡기. 두 사람 모두 질량중심이 두 발 사이(기저면) 한가운데에 있어 안정적이다.',
  cues: ['오른손은 상대 왼깃, 왼손은 상대 오른소매', '무릎을 살짝 굽힌 자연체'],
};
