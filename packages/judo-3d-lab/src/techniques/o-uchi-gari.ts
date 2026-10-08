import { GRIP_PHASE, RIGHT_GRIP, TORI, TORI_SHIZENTAI, UKE, UKE_SHIZENTAI } from './common';
import type { TechniqueAnimation } from './timeline';

/**
 * 오우치가리(大内刈, 안다리후리기). 좌표·데이터 원칙은 common.ts 참고.
 *
 * 토리는 왼발을 오른발 뒤로 끌어붙인 뒤, 오른다리를 상대 두 다리 사이로 넣어
 * 상대 왼다리 안쪽을 뒤에서 걸고 바깥쪽으로 후린다. 동시에 가슴으로 밀어 상대를 왼쪽 뒤로 넘긴다.
 * 밭다리후리기(바깥에서 후림)와 달리 토리의 몸이 상대 정면에 그대로 남는다.
 */

export const O_UCHI_GARI: TechniqueAnimation = {
  id: 'o-uchi-gari',
  koreanName: '안다리후리기',
  japaneseName: '大内刈',
  romaji: 'O-uchi-gari',
  category: '발기술 (足技)',
  summary:
    '상대를 뒤로 무너뜨리면서 자신의 오른다리를 상대 두 다리 사이로 넣어, 상대 왼다리를 안쪽에서 걸어 바깥으로 크게 후려 뒤로 넘기는 발기술입니다.',
  actors: { tori: TORI, uke: UKE },
  mapCenter: { x: -0.05, y: 0.2 },
  phases: [
    { start: 0, end: 0.4, ...GRIP_PHASE },
    {
      start: 0.4,
      end: 0.95,
      name: '崩し',
      label: '쿠즈시 · 무너뜨리기',
      description:
        '왼발을 오른발 뒤꿈치 쪽으로 끌어붙여 거리를 좁히고, 양손으로 상대를 뒤로 밀어 체중을 두 발 뒤꿈치(특히 왼발) 쪽으로 몰아넣는다.',
      cues: ['우케의 질량중심이 뒤꿈치 쪽 기저면 가장자리로 이동', '토리는 왼발에 체중을 옮겨 오른다리를 자유롭게 한다'],
    },
    {
      start: 0.95,
      end: 1.35,
      name: '作り',
      label: '츠쿠리 · 다리 넣기',
      description: '오른다리를 상대 두 다리 사이로 넣어, 종아리로 상대 왼다리의 종아리·무릎 뒤를 안쪽에서 건다.',
      cues: [
        '토리는 왼발 하나로 선다',
        '가슴을 붙여 상대에게 기대듯 밀어붙이므로, 토리 혼자의 균형 지표는 음수가 된다 — 두 사람 합성 질량중심을 켜서 비교해 보자',
      ],
    },
    {
      start: 1.35,
      end: 2.0,
      name: '掛け',
      label: '카케 · 걸기(후리기)',
      description: '걸어 둔 상대 왼다리를 바깥쪽으로 원을 그리듯 후리고, 가슴과 손으로 상대를 왼쪽 뒤로 밀어 넘긴다.',
      cues: ['우케의 왼발이 뜨면서 기저면이 오른발 하나로 줄었다가 사라진다', '토리는 앞으로 따라 들어가며 균형을 유지한다'],
    },
    {
      start: 2.0,
      end: 3.3,
      name: '受身・残心',
      label: '낙법 · 잔심',
      description: '우케는 뒤로 떨어지며 왼팔로 매트를 친다. 토리는 소매를 잡은 채 두 발로 서서 마무리한다.',
      cues: ['토리의 질량중심이 다시 두 발 사이로 복귀', '우케는 토리 정면 방향으로 떨어진다'],
    },
  ],
  keyframes: [
    { t: 0, tori: TORI_SHIZENTAI, uke: UKE_SHIZENTAI },
    { t: 0.4, tori: TORI_SHIZENTAI, uke: UKE_SHIZENTAI },
    {
      t: 0.95,
      tori: {
        root: { pos: [0.0, 0.85, -0.22], yaw: 0, pitch: 8, roll: 0 },
        torso: { flex: 5, side: 0, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: { L: { at: [0.06, 0.07, -0.22] }, R: { at: [-0.13, 0.07, -0.25] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.0, 0.87, 0.38], yaw: 180, pitch: -10, roll: -3 },
        torso: { flex: -6, side: -2, twist: 0 },
        head: { flex: 0, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.15, 0.07, 0.4] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 1.35,
      tori: {
        root: { pos: [0.03, 0.85, -0.08], yaw: 5, pitch: 12, roll: -4 },
        torso: { flex: 10, side: 0, twist: 5 },
        head: { flex: 10, twist: 0 },
        feet: { L: { at: [0.06, 0.07, -0.22] }, R: { at: [-0.07, 0.13, 0.4] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [-0.02, 0.86, 0.4], yaw: 180, pitch: -14, roll: -5 },
        torso: { flex: -8, side: -3, twist: 0 },
        head: { flex: -5, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.15, 0.07, 0.4] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 1.7,
      tori: {
        root: { pos: [0.0, 0.84, -0.04], yaw: 5, pitch: 18, roll: -4 },
        torso: { flex: 12, side: 0, twist: 5 },
        head: { flex: 10, twist: 0 },
        feet: { L: { at: [0.06, 0.07, -0.22] }, R: { at: [-0.3, 0.14, 0.42] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [-0.05, 0.78, 0.48], yaw: 180, pitch: -30, roll: -8 },
        torso: { flex: -5, side: -3, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.38, 0.2, 0.36] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 2.2,
      tori: {
        root: { pos: [0.0, 0.8, 0.1], yaw: 5, pitch: 26, roll: 0 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 10, twist: 0 },
        feet: { L: { at: [0.06, 0.07, -0.22] }, R: { at: [-0.18, 0.07, 0.36] } },
        hands: { R: { local: [-0.2, 0.25, 0.3] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [-0.08, 0.45, 0.68], yaw: 180, pitch: -70, roll: -6 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 35, twist: 0 },
        feet: { R: { body: [-0.1, -0.8, 0.22] }, L: { body: [0.14, -0.75, 0.35] } },
        hands: { R: { at: [0.2, 0.75, 0.62] }, L: { at: [-0.5, 0.4, 0.85] } },
      },
    },
    {
      t: 2.7,
      tori: {
        root: { pos: [0.0, 0.76, 0.24], yaw: 5, pitch: 35, roll: 0 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.15, 0.07, 0.18] }, R: { at: [-0.18, 0.07, 0.36] } },
        hands: { R: { local: [-0.2, 0.2, 0.25] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [-0.06, 0.11, 0.85], yaw: 180, pitch: -90, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { body: [-0.12, -0.62, 0.3] }, L: { body: [0.12, -0.62, 0.25] } },
        hands: { R: { at: [0.18, 0.8, 0.95] }, L: { at: [-0.6, 0.05, 1.15] } },
      },
    },
    {
      t: 3.3,
      tori: {
        root: { pos: [0.0, 0.78, 0.22], yaw: 5, pitch: 28, roll: 0 },
        torso: { flex: 12, side: 0, twist: 0 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.15, 0.07, 0.18] }, R: { at: [-0.18, 0.07, 0.36] } },
        hands: { R: { local: [-0.2, 0.2, 0.25] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [-0.06, 0.11, 0.85], yaw: 180, pitch: -90, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { body: [-0.12, -0.62, 0.3] }, L: { body: [0.12, -0.62, 0.25] } },
        hands: { R: { at: [0.18, 0.8, 0.95] }, L: { at: [-0.6, 0.05, 1.15] } },
      },
    },
  ],
};
