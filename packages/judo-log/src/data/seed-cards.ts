import type { Card, CardType } from '../types';

/**
 * 콜드 스타트 대응 (기획서 9장).
 *
 * 기록이 없으면 복습할 게 없어서 첫 주에 이탈한다. 그래서 설치 당일부터 복습할 게 있도록
 * 입문자 공통 카드 30장을 미리 채운다. 자기 기록이 쌓이면 자연스럽게 개인화된다.
 *
 * 여기 실린 내용은 기획서 부록의 대조표와 9장 목록에서만 가져왔다. 낙법·예법은 이름과
 * 심상 유도까지만 담고 동작 절차는 넣지 않는다 — 지도자 없이 글로 따라 하면 다치는 영역이라
 * 앱이 표준 설명을 자처할 자리가 아니다.
 *
 * 주의: 유효·효과는 현행 규정에서 폐지됐다. 심판 용어 카드에 되살리지 말 것.
 */
type SeedSpec = {
  key: string;
  type: CardType;
  front: string;
  back?: string;
  techniqueId?: string;
};

const SEEDS: SeedSpec[] = [
  // ── 낙법 4종 (안전과 직결돼 가장 먼저 익힌다) ──
  {
    key: 'ukemi-back',
    type: '명칭',
    front: '뒤로 넘어질 때 턱을 당기고 두 팔로 매트를 치는 낙법은?',
    back: '후방낙법',
  },
  { key: 'ukemi-side', type: '명칭', front: '옆으로 넘어지며 한 팔로 매트를 치는 낙법은?', back: '측방낙법' },
  {
    key: 'ukemi-front',
    type: '명칭',
    front: '앞으로 넘어질 때 두 팔로 받치며 얼굴을 보호하는 낙법은?',
    back: '전방낙법',
  },
  { key: 'ukemi-roll', type: '명칭', front: '앞으로 구르며 충격을 흘려보내는 낙법은?', back: '전방회전낙법' },
  { key: 'ukemi-mental-back', type: '심상', front: '눈 감고 후방낙법을 3회 해봐. 턱을 당기는 순간까지.' },
  {
    key: 'ukemi-mental-roll',
    type: '심상',
    front: '눈 감고 전방회전낙법을 2회 해봐. 어깨부터 둥글게 굴러가는 감각으로.',
  },

  // ── 예법·도복 ──
  { key: 'rei-standing', type: '명칭', front: '서서 하는 인사를 뜻하는 말은?', back: '입례 (立礼)' },
  { key: 'rei-seated', type: '명칭', front: '무릎 꿇고 앉아서 하는 인사를 뜻하는 말은?', back: '좌례 (座礼)' },
  { key: 'dogi', type: '심상', front: '눈 감고 도복 띠를 매는 순서를 처음부터 끝까지 떠올려봐.' },

  // ── 심판·경기 용어 (기획서 부록) ──
  { key: 'term-hajime', type: '명칭', front: '경기 개시를 알리는 말은? (일본어로는 하지메)', back: '시작 · 하지메' },
  { key: 'term-mate', type: '명칭', front: '경기를 일시 중지시키는 말은? (일본어로는 마테)', back: '그쳐 · 마테' },
  {
    key: 'term-yoshi',
    type: '명칭',
    front: '중단됐던 경기를 다시 이어갈 때 하는 말은? (일본어로는 요시)',
    back: '계속 · 요시',
  },
  {
    key: 'term-soremade',
    type: '명칭',
    front: '경기 종료를 알리는 말은? (일본어로는 소레마데)',
    back: '그만 · 소레마데',
  },
  { key: 'term-ippon', type: '명칭', front: '즉시 승리가 되는 판정은? (일본어로는 잇폰)', back: '한판 · 잇폰' },
  {
    key: 'term-wazaari',
    type: '명칭',
    front: '두 번 쌓이면 한판이 되는 판정은? (일본어로는 와자아리)',
    back: '절반 · 와자아리',
  },
  {
    key: 'term-osaekomi',
    type: '명칭',
    front: '누르기가 성립됐다고 선언하는 말은? (일본어로는 오사에코미)',
    back: '누르기 · 오사에코미',
  },
  {
    key: 'term-toketa',
    type: '명칭',
    front: '누르기가 풀렸음을 알리는 말은? (일본어로는 토케타)',
    back: '풀려 · 토케타',
  },
  { key: 'term-shido', type: '명칭', front: '반칙 경고를 뜻하는 말은? (일본어로는 시도)', back: '지도 · 시도' },

  // ── 기본 용어 ──
  {
    key: 'gloss-nage',
    type: '명칭',
    front: '서서 상대를 넘기는 기술 전체를 뭐라고 하지? (일본어로는 나게와자)',
    back: '메치기 · 나게와자',
  },
  {
    key: 'gloss-katame',
    type: '명칭',
    front: '바닥에서 하는 기술 전체를 뭐라고 하지? (일본어로는 가타메와자)',
    back: '굳히기 · 가타메와자',
  },
  {
    key: 'gloss-ukemi',
    type: '명칭',
    front: '안전하게 넘어지는 법을 통틀어 뭐라고 하지? (일본어로는 우케미)',
    back: '낙법 · 우케미',
  },
  {
    key: 'gloss-randori',
    type: '명칭',
    front: '정해진 형식 없이 자유롭게 겨루는 연습을 뭐라고 하지? (일본어로는 랜도리)',
    back: '대련 · 랜도리',
  },
  {
    key: 'gloss-kuzushi',
    type: '명칭',
    front: '기술이 걸리기 위한 전제인, 상대 균형을 무너뜨리는 것을 뭐라고 하지?',
    back: '균형 무너뜨리기 · 쿠즈시',
  },

  // ── 기본 기술 6개 (기획서 9장 목록) ──
  {
    key: 'tech-osoto',
    type: '명칭',
    front: '바깥쪽에서 상대 다리를 후려 넘기는 기술은?',
    back: '밭다리후리기 · 大外刈 오소토가리',
    techniqueId: 'osoto',
  },
  {
    key: 'tech-ouchi',
    type: '명칭',
    front: '상대 다리 안쪽 오금을 후려 뒤로 넘기는 기술은?',
    back: '안다리후리기 · 大内刈 오우치가리',
    techniqueId: 'ouchi',
  },
  {
    key: 'tech-seoi',
    type: '명칭',
    front: '몸을 돌려 등을 붙이고 상대를 어깨 너머로 던지는 기술은?',
    back: '업어치기 · 背負投 세오이나게',
    techniqueId: 'seoi',
  },
  {
    key: 'tech-ukigoshi',
    type: '명칭',
    front: '허리를 상대 배에 붙여 살짝 띄워 넘기는 허리기술은?',
    back: '허리띄기 · 浮腰 우키고시',
    techniqueId: 'ukigoshi',
  },
  {
    key: 'tech-kesa',
    type: '명칭',
    front: '상대 옆에 앉아 목을 감고 다리를 벌려 버티는 누르기는?',
    back: '곁누르기 · 袈裟固 케사가타메',
    techniqueId: 'kesa',
  },
  {
    key: 'tech-okuri',
    type: '명칭',
    front: '상대 두 발이 모이는 순간 발바닥으로 함께 쓸어내는 기술은?',
    back: '모두걸기 · 送足払 오쿠리아시바라이',
    techniqueId: 'okuri-ashi',
  },

  // ── 상황 카드 (판단 훈련의 맛보기) ──
  {
    key: 'sit-push',
    type: '상황',
    front: '상대가 오른팔로 내 깃을 강하게 밀어낼 때, 그 힘을 타고 들어갈 기술은?',
    back: '미는 힘을 그대로 뒤로 — 밭다리후리기 또는 안다리후리기',
    techniqueId: 'osoto',
  },
];

/**
 * 처음 앱을 열었을 때 한 번만 만든다. 전부 오늘 자로 깔아두면 첫날 30장이 밀려
 * 부담스러우므로, 하루 상한(20장)에 걸리지 않도록 사흘에 나눠 배치한다.
 */
export function createSeedCards(today: string, addDays: (date: string, days: number) => string): Card[] {
  return SEEDS.map((seed, i) => {
    const card: Card = {
      id: `seed-${seed.key}`,
      type: seed.type,
      front: seed.front,
      step: 0,
      dueDate: addDays(today, Math.floor(i / 10)),
      isSeed: true,
    };
    if (seed.back !== undefined) card.back = seed.back;
    if (seed.techniqueId !== undefined) card.techniqueId = seed.techniqueId;
    return card;
  });
}

export const SEED_CARD_COUNT = SEEDS.length;
