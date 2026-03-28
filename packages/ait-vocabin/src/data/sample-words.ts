import { Word } from '../types/word.ts';

export const sampleWords: Word[] = [
  // A1 — 사람/가족
  { id: 'w001', word: 'Mann', article: 'der', plural: 'Männer', meaningKo: '남자', ipa: '/man/', cefrLevel: 'A1', category: '사람' },
  { id: 'w002', word: 'Frau', article: 'die', plural: 'Frauen', meaningKo: '여자, 부인', ipa: '/fʁaʊ/', cefrLevel: 'A1', category: '사람' },
  { id: 'w003', word: 'Kind', article: 'das', plural: 'Kinder', meaningKo: '아이', ipa: '/kɪnt/', cefrLevel: 'A1', category: '사람' },
  { id: 'w004', word: 'Vater', article: 'der', plural: 'Väter', meaningKo: '아버지', ipa: '/ˈfaːtɐ/', cefrLevel: 'A1', category: '가족' },
  { id: 'w005', word: 'Mutter', article: 'die', plural: 'Mütter', meaningKo: '어머니', ipa: '/ˈmʊtɐ/', cefrLevel: 'A1', category: '가족' },

  // A1 — 동물
  { id: 'w006', word: 'Hund', article: 'der', plural: 'Hunde', meaningKo: '개', ipa: '/hʊnt/', cefrLevel: 'A1', category: '동물' },
  { id: 'w007', word: 'Katze', article: 'die', plural: 'Katzen', meaningKo: '고양이', ipa: '/ˈkatsə/', cefrLevel: 'A1', category: '동물' },

  // A1 — 주거/장소
  { id: 'w008', word: 'Haus', article: 'das', plural: 'Häuser', meaningKo: '집', ipa: '/haʊs/', cefrLevel: 'A1', category: '주거' },
  { id: 'w009', word: 'Zimmer', article: 'das', plural: 'Zimmer', meaningKo: '방', ipa: '/ˈtsɪmɐ/', cefrLevel: 'A1', category: '주거' },
  { id: 'w010', word: 'Stadt', article: 'die', plural: 'Städte', meaningKo: '도시', ipa: '/ʃtat/', cefrLevel: 'A1', category: '장소' },
  { id: 'w011', word: 'Schule', article: 'die', plural: 'Schulen', meaningKo: '학교', ipa: '/ˈʃuːlə/', cefrLevel: 'A1', category: '장소' },
  { id: 'w012', word: 'Straße', article: 'die', plural: 'Straßen', meaningKo: '거리, 도로', ipa: '/ˈʃtʁaːsə/', cefrLevel: 'A1', category: '장소' },

  // A1 — 사물
  { id: 'w013', word: 'Buch', article: 'das', plural: 'Bücher', meaningKo: '책', ipa: '/buːx/', cefrLevel: 'A1', category: '사물' },
  { id: 'w014', word: 'Tisch', article: 'der', plural: 'Tische', meaningKo: '테이블, 책상', ipa: '/tɪʃ/', cefrLevel: 'A1', category: '사물' },

  // A1 — 음식
  { id: 'w015', word: 'Apfel', article: 'der', plural: 'Äpfel', meaningKo: '사과', ipa: '/ˈapfəl/', cefrLevel: 'A1', category: '음식' },
  { id: 'w016', word: 'Milch', article: 'die', plural: null, meaningKo: '우유', ipa: '/mɪlç/', cefrLevel: 'A1', category: '음식' },
  { id: 'w017', word: 'Wasser', article: 'das', plural: null, meaningKo: '물', ipa: '/ˈvasɐ/', cefrLevel: 'A1', category: '음식' },

  // A1 — 교통/시간
  { id: 'w018', word: 'Auto', article: 'das', plural: 'Autos', meaningKo: '자동차', ipa: '/ˈaʊto/', cefrLevel: 'A1', category: '교통' },
  { id: 'w019', word: 'Bahnhof', article: 'der', plural: 'Bahnhöfe', meaningKo: '기차역', ipa: '/ˈbaːnhoːf/', cefrLevel: 'A1', category: '교통' },
  { id: 'w020', word: 'Jahr', article: 'das', plural: 'Jahre', meaningKo: '해, 년', ipa: '/jaːɐ/', cefrLevel: 'A1', category: '시간' },
  { id: 'w021', word: 'Uhr', article: 'die', plural: 'Uhren', meaningKo: '시계, 시각', ipa: '/uːɐ/', cefrLevel: 'A1', category: '시간' },

  // A2 — 직업/일
  { id: 'w022', word: 'Beruf', article: 'der', plural: 'Berufe', meaningKo: '직업', ipa: '/bəˈʁuːf/', cefrLevel: 'A2', category: '직업' },
  { id: 'w023', word: 'Arbeit', article: 'die', plural: 'Arbeiten', meaningKo: '일, 직장', ipa: '/ˈaʁbaɪt/', cefrLevel: 'A2', category: '직업' },
  { id: 'w024', word: 'Arzt', article: 'der', plural: 'Ärzte', meaningKo: '의사', ipa: '/aːɐtst/', cefrLevel: 'A2', category: '직업' },

  // A2 — 여행/여가
  { id: 'w025', word: 'Urlaub', article: 'der', plural: 'Urlaube', meaningKo: '휴가', ipa: '/ˈʊɐlaʊp/', cefrLevel: 'A2', category: '여가' },
  { id: 'w026', word: 'Reise', article: 'die', plural: 'Reisen', meaningKo: '여행', ipa: '/ˈʁaɪzə/', cefrLevel: 'A2', category: '여가' },
  { id: 'w027', word: 'Hotel', article: 'das', plural: 'Hotels', meaningKo: '호텔', ipa: '/hoˈtɛl/', cefrLevel: 'A2', category: '여가' },

  // A2 — 언어/소통
  { id: 'w028', word: 'Sprache', article: 'die', plural: 'Sprachen', meaningKo: '언어', ipa: '/ˈʃpʁaːxə/', cefrLevel: 'A2', category: '언어' },
  { id: 'w029', word: 'Gespräch', article: 'das', plural: 'Gespräche', meaningKo: '대화', ipa: '/ɡəˈʃpʁɛːç/', cefrLevel: 'A2', category: '언어' },

  // A2 — 사람
  { id: 'w030', word: 'Freund', article: 'der', plural: 'Freunde', meaningKo: '친구 (남)', ipa: '/fʁɔɪnt/', cefrLevel: 'A2', category: '사람' },
];
