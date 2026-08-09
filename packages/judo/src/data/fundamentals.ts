import type { Fundamental } from '../types/fundamental';

// 영상 출처: KODOKAN 공식 유튜브 채널 (KODOKAN × IJF ACADEMY 협력 제작)
// https://www.youtube.com/@KODOKANJUDO
//
// "100 Techniques" 재생목록은 메치기·굳히기만 다루고 낙법·예법은 빠져 있어서,
// 같은 채널에 따로 올라와 있는 기본기 영상들을 여기에 모았다.
export const FUNDAMENTALS: Fundamental[] = [
  {
    id: 'ukemi',
    koreanName: '낙법',
    japaneseName: '受身',
    romaji: 'Ukemi',
    videoId: 'VoktcQAxEPg',
    description:
      '넘어질 때 다치지 않게 떨어지는 기술입니다. 유도에서 던지기보다 먼저, 그리고 가장 오래 배우는 기초입니다. 낙법이 몸에 붙어야 마음 놓고 던져지는 연습을 할 수 있습니다.',
    segments: [
      { koreanName: '후방낙법', romaji: 'Ushiro-ukemi', note: '뒤로 넘어지며 양팔로 바닥을 쳐 충격을 분산시킵니다.' },
      { koreanName: '측방낙법', romaji: 'Yoko-ukemi', note: '옆으로 넘어지며 넘어지는 쪽 팔로 바닥을 칩니다.' },
      { koreanName: '횡전낙법', romaji: 'Outen-ukemi', note: '옆으로 구르며 충격을 흘려보냅니다.' },
      { koreanName: '전방낙법', romaji: 'Mae-ukemi', note: '앞으로 넘어지며 양 팔뚝으로 몸과 얼굴을 지지합니다.' },
      { koreanName: '전방회전낙법', romaji: 'Mae-mawari-ukemi', note: '앞으로 둥글게 구르며 어깨·등·엉덩이 순으로 닿습니다.' },
      { koreanName: '2인 후방낙법', romaji: 'Ushiro-ukemi (2인)', note: '상대가 받쳐주는 상태로 후방낙법을 연습합니다.' },
      { koreanName: '2인 전방회전낙법', romaji: 'Mae-mawari-ukemi (2인)', note: '상대와 짝을 이뤄 전방회전낙법을 연습합니다.' },
    ],
    tips: [
      '어떤 낙법이든 턱을 가슴 쪽으로 당겨 뒤통수가 바닥에 부딪히지 않게 합니다.',
      '팔로 바닥을 칠 때는 손바닥 전체로, 몸통과 각도를 벌려서 칩니다.',
      '숨을 참지 말고 바닥을 치는 순간 짧게 내쉽니다.',
    ],
  },
  {
    id: 'reiho',
    koreanName: '예법과 기본자세',
    japaneseName: '礼法',
    romaji: 'Reiho',
    videoId: 'BBZG9N4cW0U',
    description:
      '유도는 "예로 시작해 예로 끝난다"고 할 만큼 인사를 중요하게 여깁니다. 서서 하는 인사와 앉아서 하는 인사, 그리고 모든 동작의 출발점이 되는 기본자세를 함께 보여줍니다.',
    segments: [
      { koreanName: '선 인사', romaji: 'Ritsu-rei', note: '선 자세에서 상체를 약 30도 숙여 인사합니다.' },
      { koreanName: '앉은 인사', romaji: 'Za-rei', note: '정좌한 상태에서 양손을 바닥에 짚고 인사합니다.' },
      { koreanName: '자연체', romaji: 'Shizentai', note: '힘을 빼고 자연스럽게 선, 어디로든 움직이기 좋은 기본자세입니다.' },
      { koreanName: '자호체', romaji: 'Jigotai', note: '무릎을 굽혀 무게중심을 낮춘 방어적인 자세입니다.' },
    ],
  },
  {
    id: 'basic-movements',
    koreanName: '기본 움직임',
    japaneseName: '基本動作',
    romaji: 'Basic movements',
    videoId: 'zbBtzBd9Eg4',
    description:
      '기술을 걸기 전에 먼저 몸을 어떻게 옮기는지 배웁니다. 발이 꼬이거나 중심이 뜨면 아무리 좋은 기술도 걸리지 않기 때문에, 걷는 법부터 제대로 익히는 것이 중요합니다.',
    segments: [
      { koreanName: '보통걸음', romaji: 'Ayumi-ashi', note: '평소 걷듯 좌우 발을 번갈아 내딛는 이동법입니다.' },
      { koreanName: '이어걸음', romaji: 'Tsugi-ashi', note: '한쪽 발을 내딛으면 다른 발이 따라붙는, 발이 교차하지 않는 이동법입니다.' },
      { koreanName: '몸놀림', romaji: 'Tai-sabaki', note: '몸의 방향을 바꿔 상대의 힘을 흘리고 기술 걸 자리를 만드는 동작입니다.' },
    ],
    tips: ['이어걸음에서는 두 발이 절대 교차하지 않도록 합니다. 교차하는 순간 발기술에 걸리기 쉽습니다.'],
  },
];
