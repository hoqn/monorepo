import type { PoseSpec } from '../body/rig';
import { GRIP_PHASE, RIGHT_GRIP, TORI, TORI_SHIZENTAI, UKE, UKE_SHIZENTAI } from './common';
import type { TechniqueAnimation } from './timeline';

/**
 * 세오이나게(背負投, 업어치기). 좌표·데이터 원칙은 common.ts 참고.
 *
 * 토리는 오른발을 상대 오른발 앞에 딛고 왼쪽으로 180° 돌아 등을 상대 가슴에 붙인 뒤(yaw 0 → 180),
 * 무릎을 펴며 앞으로 숙여 상대를 오른어깨 너머로 넘긴다.
 * 우케는 몸 앞쪽으로 한 바퀴 가까이 돌아(pitch 0 → 270) 토리 앞에 등으로 떨어진다.
 * 공중에서 몸이 뒤집히므로 우케의 다리는 골반 기준(body) 좌표로 적었다.
 */

const toriLoaded: PoseSpec = {
  root: { pos: [0.0, 0.64, -0.03], yaw: 180, pitch: 15, roll: 0 },
  torso: { flex: 10, side: 0, twist: 0 },
  head: { flex: 5, twist: 0 },
  feet: { R: { at: [0.11, 0.07, -0.08] }, L: { at: [-0.12, 0.07, -0.08] } },
  hands: RIGHT_GRIP,
  toeOut: 15,
};

export const SEOI_NAGE: TechniqueAnimation = {
  id: 'seoi-nage',
  koreanName: '업어치기',
  japaneseName: '背負投',
  romaji: 'Seoi-nage',
  category: '손기술 (手技)',
  summary:
    '상대를 앞으로 끌어내 발끝에 체중이 실리게 한 뒤, 몸을 돌려 등을 상대 가슴에 붙이고 낮은 자세에서 무릎을 펴며 어깨 너머로 메어 던지는 기술입니다.',
  actors: { tori: TORI, uke: UKE },
  mapCenter: { x: 0, y: -0.2 },
  phases: [
    { start: 0, end: 0.4, ...GRIP_PHASE },
    {
      start: 0.4,
      end: 1.1,
      name: '崩し',
      label: '쿠즈시 · 무너뜨리기',
      description:
        '히키테(왼손)로 소매를 앞·위로 끌어내 상대의 체중을 발끝 쪽(앞)으로 쏠리게 한다. 동시에 오른발을 상대 오른발 앞쪽 안으로 딛으며 돌기 시작한다.',
      cues: ['우케의 질량중심이 발끝 쪽 기저면 가장자리로 이동', '토리의 오른발이 회전축이 된다'],
    },
    {
      start: 1.1,
      end: 1.75,
      name: '作り',
      label: '츠쿠리 · 만들기',
      description:
        '오른발을 축으로 왼쪽으로 돌아 왼발을 끌어와 두 발을 상대 두 발 안쪽 앞에 나란히 놓는다. 무릎을 깊이 굽혀 골반을 상대 골반보다 낮추고, 등을 상대 가슴에 밀착한다.',
      cues: ['토리의 골반이 우케의 골반보다 낮아야 들어 올릴 수 있다', '토리 혼자의 질량중심보다 두 사람의 합성 질량중심이 토리 발 위에 있는지가 중요'],
    },
    {
      start: 1.75,
      end: 2.6,
      name: '掛け',
      label: '카케 · 메치기',
      description: '무릎을 펴면서 상체를 앞으로 숙이고 양손을 끌어내려, 등에 업힌 상대를 오른어깨 너머로 회전시켜 넘긴다.',
      cues: ['우케는 토리의 등 위에서 몸 앞쪽으로 돈다', '토리의 상체 숙임이 우케 회전의 지렛대가 된다'],
    },
    {
      start: 2.6,
      end: 3.5,
      name: '受身・残心',
      label: '낙법 · 잔심',
      description: '우케는 등으로 떨어지며 왼팔로 매트를 친다. 토리는 소매를 놓지 않고 끌어올려 우케의 머리를 보호한다.',
      cues: ['토리는 다시 두 발 사이로 질량중심을 되돌린다', '우케의 머리가 토리 발 쪽, 다리가 바깥쪽으로 떨어진다'],
    },
  ],
  keyframes: [
    { t: 0, tori: TORI_SHIZENTAI, uke: UKE_SHIZENTAI },
    { t: 0.4, tori: TORI_SHIZENTAI, uke: UKE_SHIZENTAI },
    {
      t: 1.1,
      tori: {
        root: { pos: [0.03, 0.84, -0.18], yaw: 50, pitch: 8, roll: 0 },
        torso: { flex: 6, side: 0, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: { R: { at: [0.1, 0.07, -0.08] }, L: { at: [0.15, 0.07, -0.4] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.03, 0.87, 0.18], yaw: 180, pitch: 18, roll: 0 },
        torso: { flex: 8, side: 0, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: { R: { at: [0.15, 0.07, 0.15] }, L: { at: [-0.15, 0.07, 0.36] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 1.6,
      tori: toriLoaded,
      uke: {
        root: { pos: [0.03, 0.86, 0.15], yaw: 180, pitch: 26, roll: 0 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: { R: { at: [0.15, 0.07, 0.15] }, L: { at: [-0.15, 0.07, 0.36] } },
        hands: { R: { at: [0.22, 1.1, -0.12] }, L: { grip: 'sleeveR' } },
      },
    },
    {
      t: 1.75,
      tori: toriLoaded,
      uke: {
        root: { pos: [0.03, 0.88, 0.13], yaw: 180, pitch: 32, roll: 0 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: { R: { at: [0.15, 0.08, 0.15] }, L: { at: [-0.15, 0.1, 0.34] } },
        hands: { R: { at: [0.2, 1.05, -0.15] }, L: { grip: 'sleeveR' } },
      },
    },
    {
      t: 2.05,
      tori: {
        root: { pos: [0.0, 0.76, 0.03], yaw: 180, pitch: 45, roll: 0 },
        torso: { flex: 20, side: 0, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: toriLoaded.feet,
        hands: RIGHT_GRIP,
        toeOut: 15,
      },
      uke: {
        root: { pos: [0.08, 1.1, 0.02], yaw: 180, pitch: 65, roll: 8 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 15, twist: 0 },
        feet: { R: { body: [-0.1, -0.82, -0.08] }, L: { body: [0.12, -0.8, -0.02] } },
        hands: { R: { at: [-0.05, 0.95, -0.3] }, L: { body: [0.3, 0.35, 0.25] } },
      },
    },
    {
      t: 2.3,
      tori: {
        root: { pos: [0.0, 0.8, 0.05], yaw: 180, pitch: 60, roll: 0 },
        torso: { flex: 25, side: 0, twist: 0 },
        head: { flex: 0, twist: 0 },
        feet: toriLoaded.feet,
        hands: RIGHT_GRIP,
        toeOut: 15,
      },
      uke: {
        root: { pos: [0.12, 1.22, -0.25], yaw: 180, pitch: 140, roll: 15 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 25, twist: 0 },
        feet: { R: { body: [-0.1, -0.84, 0.0] }, L: { body: [0.12, -0.82, 0.05] } },
        hands: { R: { at: [-0.1, 0.85, -0.35] }, L: { body: [0.35, 0.3, 0.2] } },
      },
    },
    {
      t: 2.6,
      tori: {
        root: { pos: [0.0, 0.82, 0.03], yaw: 180, pitch: 45, roll: 0 },
        torso: { flex: 20, side: 0, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: toriLoaded.feet,
        hands: { R: { local: [-0.2, 0.2, 0.25] }, L: { grip: 'sleeveR' } },
        toeOut: 15,
      },
      uke: {
        root: { pos: [0.1, 0.72, -0.7], yaw: 180, pitch: 215, roll: 10 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 30, twist: 0 },
        feet: { R: { body: [-0.12, -0.8, 0.12] }, L: { body: [0.12, -0.78, 0.15] } },
        hands: { R: { at: [0.0, 0.7, -0.4] }, L: { body: [0.4, 0.1, 0.25] } },
      },
    },
    {
      t: 2.9,
      tori: {
        root: { pos: [0.0, 0.8, 0.02], yaw: 180, pitch: 34, roll: 0 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: toriLoaded.feet,
        hands: { R: { local: [-0.2, 0.2, 0.25] }, L: { grip: 'sleeveR' } },
        toeOut: 15,
      },
      uke: {
        root: { pos: [0.1, 0.11, -1.05], yaw: 180, pitch: 270, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { body: [-0.15, -0.62, 0.3] }, L: { body: [0.08, -0.62, 0.25] } },
        hands: { R: { at: [0.1, 0.72, -0.38] }, L: { at: [-0.55, 0.05, -0.8] } },
      },
    },
    {
      t: 3.5,
      tori: {
        root: { pos: [0.0, 0.81, 0.02], yaw: 180, pitch: 30, roll: 0 },
        torso: { flex: 12, side: 0, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: toriLoaded.feet,
        hands: { R: { local: [-0.2, 0.2, 0.25] }, L: { grip: 'sleeveR' } },
        toeOut: 15,
      },
      uke: {
        root: { pos: [0.1, 0.11, -1.05], yaw: 180, pitch: 270, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { body: [-0.15, -0.62, 0.3] }, L: { body: [0.08, -0.62, 0.25] } },
        hands: { R: { at: [0.1, 0.72, -0.38] }, L: { at: [-0.55, 0.05, -0.8] } },
      },
    },
  ],
};
