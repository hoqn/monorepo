import { GRIP_PHASE, RIGHT_GRIP, TORI, TORI_SHIZENTAI as toriShizentai, UKE, UKE_SHIZENTAI as ukeShizentai } from './common';
import type { TechniqueAnimation } from './timeline';

/** 오소토가리(大外刈, 밭다리후리기). 좌표·데이터 원칙은 common.ts 참고 */
export const OSOTO_GARI: TechniqueAnimation = {
  id: 'o-soto-gari',
  koreanName: '밭다리후리기',
  japaneseName: '大外刈',
  romaji: 'O-soto-gari',
  summary:
    '상대를 오른쪽 뒤 모서리로 무너뜨려 오른발 뒤꿈치에 체중을 싣게 한 뒤, 디딤발을 상대 오른발 옆에 놓고 오른다리로 상대의 오른다리를 뒤에서 후려 넘기는 발기술입니다.',
  category: '발기술 (足技)',
  actors: { tori: TORI, uke: UKE },
  phases: [
    { start: 0, end: 0.5, ...GRIP_PHASE },
    {
      start: 0.5,
      end: 1.3,
      name: '崩し',
      label: '쿠즈시 · 무너뜨리기',
      description:
        '왼손(히키테)으로 소매를 당기고 오른손(츠리테)으로 깃을 밀어 올려, 상대의 체중을 오른발 뒤꿈치 쪽(오른쪽 뒤 모서리)으로 몰아넣는다. 동시에 왼발을 상대 오른발 바깥 옆에 내딛는다.',
      cues: [
        '우케의 질량중심 투영점이 오른발 뒤꿈치 쪽 기저면 가장자리로 이동',
        '토리의 왼발이 새 디딤발이 된다. 발을 든 동안 토리의 동적 여유가 크게 음수가 되는데, 걷기와 같은 "제어된 넘어짐"이라 발을 딛는 순간 회복된다',
      ],
    },
    {
      start: 1.3,
      end: 1.75,
      name: '作り',
      label: '츠쿠리 · 만들기',
      description:
        '가슴을 붙여 상대를 묶고, 체중을 왼발 하나에 실은 채 오른다리를 상대 오른다리 바깥으로 크게 뻗어 뒤로 보낸다.',
      cues: ['토리는 외발 서기 — 질량중심이 왼발 위에 있어야 한다', '우케는 오른발 하나에 체중이 걸려 있다'],
    },
    {
      start: 1.75,
      end: 2.5,
      name: '掛け',
      label: '카케 · 걸기(후리기)',
      description:
        '오른다리 넙다리 뒤쪽으로 상대의 오른다리 뒤쪽을 후려 올린다. 다리를 뒤로 차올리는 만큼 상체를 앞으로 숙여 시소처럼 균형을 맞춘다.',
      cues: ['우케의 유일한 지지발이 사라져 기저면이 소멸', '토리 상체 숙임 ↔ 후리는 다리: 질량중심을 왼발 위에 유지'],
    },
    {
      start: 2.5,
      end: 3.6,
      name: '受身・残心',
      label: '낙법 · 잔심',
      description:
        '우케는 뒤로 떨어지며 왼팔로 매트를 쳐 낙법을 한다. 토리는 소매를 끝까지 당겨 우케의 머리가 매트에 부딪히지 않게 돕고, 균형을 유지한 채 마무리한다.',
      cues: ['토리는 소매를 놓지 않는다 (상대 보호)', '토리의 질량중심이 다시 두 발 사이로 복귀'],
    },
  ],
  keyframes: [
    { t: 0, tori: toriShizentai, uke: ukeShizentai },
    { t: 0.5, tori: toriShizentai, uke: ukeShizentai },
    {
      t: 1.3,
      tori: {
        root: { pos: [0.26, 0.86, 0.02], yaw: -8, pitch: 10, roll: -3 },
        torso: { flex: 8, side: 0, twist: -5 },
        head: { flex: 10, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [-0.1, 0.07, -0.22] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.08, 0.87, 0.4], yaw: 180, pitch: -10, roll: 6 },
        torso: { flex: -6, side: 3, twist: 0 },
        head: { flex: 0, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.15, 0.07, 0.4] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      // 경유점: 후리는 다리가 우케 오른다리 "바깥"을 지나 앞으로 나가도록 (직선 보간이면 두 다리 사이를 관통한다)
      t: 1.55,
      tori: {
        root: { pos: [0.34, 0.87, 0.06], yaw: -8, pitch: 11.5, roll: -5 },
        torso: { flex: 9, side: 0, twist: -5 },
        head: { flex: 12.5, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.42, 0.15, 0.22] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.09, 0.87, 0.41], yaw: 180, pitch: -12, roll: 7 },
        torso: { flex: -7.6, side: 3.7, twist: 0 },
        head: { flex: -3.3, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.145, 0.09, 0.39] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 1.75,
      tori: {
        root: { pos: [0.37, 0.87, 0.07], yaw: -8, pitch: 15, roll: -6 },
        torso: { flex: 10, side: 0, twist: -5 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.34, 0.22, 0.62] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.1, 0.86, 0.43], yaw: 180, pitch: -16, roll: 8 },
        torso: { flex: -8, side: 4, twist: 0 },
        head: { flex: -5, twist: 0 },
        feet: { R: { at: [0.13, 0.07, 0.25] }, L: { at: [-0.14, 0.12, 0.38] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      // 경유점: 후릴 때 다리를 편 채 시계추처럼 아래를 지나간다 (직선 보간이면 무릎이 접혀 우케 엉덩이로 파고든다)
      t: 1.92,
      tori: {
        root: { pos: [0.37, 0.87, 0.09], yaw: -8, pitch: 26, roll: -6 },
        torso: { flex: 12.8, side: 0, twist: -5 },
        head: { flex: 18, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.34, 0.12, 0.22] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.11, 0.81, 0.46], yaw: 180, pitch: -25, roll: 9 },
        torso: { flex: -7.7, side: 3.7, twist: 0 },
        head: { flex: 5, twist: 0 },
        feet: { R: { at: [0.15, 0.2, 0.16] }, L: { at: [-0.12, 0.17, 0.35] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 2.1,
      tori: {
        root: { pos: [0.37, 0.86, 0.1], yaw: -8, pitch: 35, roll: -6 },
        torso: { flex: 15, side: 0, twist: -5 },
        head: { flex: 20, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.24, 0.6, -0.6] } },
        hands: RIGHT_GRIP,
      },
      uke: {
        root: { pos: [0.13, 0.72, 0.5], yaw: 180, pitch: -38, roll: 10 },
        torso: { flex: -5, side: 3, twist: 0 },
        head: { flex: 20, twist: 0 },
        feet: { R: { at: [0.12, 0.4, 0.2] }, L: { at: [-0.1, 0.22, 0.32] } },
        hands: RIGHT_GRIP,
      },
    },
    {
      t: 2.6,
      tori: {
        root: { pos: [0.36, 0.85, 0.12], yaw: -8, pitch: 28, roll: -3 },
        torso: { flex: 15, side: 0, twist: -5 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.08, 0.15, -0.12] } },
        hands: { R: { local: [-0.2, 0.25, 0.3] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [0.15, 0.4, 0.58], yaw: 180, pitch: -72, roll: 6 },
        torso: { flex: 15, side: 0, twist: 0 },
        head: { flex: 35, twist: 0 },
        feet: { R: { at: [0.2, 0.8, 0.15] }, L: { at: [-0.05, 0.6, 0.2] } },
        hands: { R: { at: [0.4, 0.8, 0.55] }, L: { at: [-0.5, 0.45, 0.65] } },
      },
    },
    {
      t: 3.1,
      tori: {
        root: { pos: [0.31, 0.78, 0.1], yaw: -8, pitch: 30, roll: 0 },
        torso: { flex: 22, side: 0, twist: -5 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.06, 0.07, -0.02] } },
        hands: { R: { local: [-0.2, 0.15, 0.2] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [0.15, 0.11, 0.45], yaw: 180, pitch: -90, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { at: [0.25, 0.35, 0.02] }, L: { at: [-0.05, 0.3, 0.05] } },
        hands: { R: { at: [0.4, 0.74, 0.62] }, L: { at: [-0.55, 0.05, 0.75] } },
      },
    },
    {
      t: 3.6,
      tori: {
        root: { pos: [0.31, 0.79, 0.1], yaw: -8, pitch: 28, roll: 0 },
        torso: { flex: 20, side: 0, twist: -5 },
        head: { flex: 15, twist: 0 },
        feet: { L: { at: [0.36, 0.07, 0.17] }, R: { at: [0.06, 0.07, -0.02] } },
        hands: { R: { local: [-0.2, 0.15, 0.2] }, L: { grip: 'sleeveR' } },
      },
      uke: {
        root: { pos: [0.15, 0.11, 0.45], yaw: 180, pitch: -90, roll: 0 },
        torso: { flex: 10, side: 0, twist: 0 },
        head: { flex: 40, twist: 0 },
        feet: { R: { at: [0.25, 0.35, 0.02] }, L: { at: [-0.05, 0.3, 0.05] } },
        hands: { R: { at: [0.4, 0.74, 0.62] }, L: { at: [-0.55, 0.05, 0.75] } },
      },
    },
  ],
};
