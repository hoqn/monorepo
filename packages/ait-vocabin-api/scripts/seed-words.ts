/**
 * Seed sample words into Supabase.
 * Run: node --env-file=.env --import tsx/esm scripts/seed-words.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const words = [
  // A1 — 사람/가족
  { word: 'Mann',    article: 'der', plural: 'Männer',  meaning_ko: '남자',       ipa: '/man/',        cefr_level: 'A1', category: '사람' },
  { word: 'Frau',    article: 'die', plural: 'Frauen',  meaning_ko: '여자, 부인', ipa: '/fʁaʊ/',       cefr_level: 'A1', category: '사람' },
  { word: 'Kind',    article: 'das', plural: 'Kinder',  meaning_ko: '아이',       ipa: '/kɪnt/',       cefr_level: 'A1', category: '사람' },
  { word: 'Vater',   article: 'der', plural: 'Väter',   meaning_ko: '아버지',     ipa: '/ˈfaːtɐ/',     cefr_level: 'A1', category: '가족' },
  { word: 'Mutter',  article: 'die', plural: 'Mütter',  meaning_ko: '어머니',     ipa: '/ˈmʊtɐ/',      cefr_level: 'A1', category: '가족' },
  // A1 — 동물
  { word: 'Hund',    article: 'der', plural: 'Hunde',   meaning_ko: '개',         ipa: '/hʊnt/',       cefr_level: 'A1', category: '동물' },
  { word: 'Katze',   article: 'die', plural: 'Katzen',  meaning_ko: '고양이',     ipa: '/ˈkatsə/',     cefr_level: 'A1', category: '동물' },
  // A1 — 주거/장소
  { word: 'Haus',    article: 'das', plural: 'Häuser',  meaning_ko: '집',         ipa: '/haʊs/',       cefr_level: 'A1', category: '주거' },
  { word: 'Zimmer',  article: 'das', plural: 'Zimmer',  meaning_ko: '방',         ipa: '/ˈtsɪmɐ/',     cefr_level: 'A1', category: '주거' },
  { word: 'Stadt',   article: 'die', plural: 'Städte',  meaning_ko: '도시',       ipa: '/ʃtat/',       cefr_level: 'A1', category: '장소' },
  { word: 'Schule',  article: 'die', plural: 'Schulen', meaning_ko: '학교',       ipa: '/ˈʃuːlə/',     cefr_level: 'A1', category: '장소' },
  { word: 'Straße',  article: 'die', plural: 'Straßen', meaning_ko: '거리, 도로', ipa: '/ˈʃtʁaːsə/',   cefr_level: 'A1', category: '장소' },
  // A1 — 사물
  { word: 'Buch',    article: 'das', plural: 'Bücher',  meaning_ko: '책',         ipa: '/buːx/',       cefr_level: 'A1', category: '사물' },
  { word: 'Tisch',   article: 'der', plural: 'Tische',  meaning_ko: '테이블, 책상', ipa: '/tɪʃ/',      cefr_level: 'A1', category: '사물' },
  // A1 — 음식
  { word: 'Apfel',   article: 'der', plural: 'Äpfel',   meaning_ko: '사과',       ipa: '/ˈapfəl/',     cefr_level: 'A1', category: '음식' },
  { word: 'Milch',   article: 'die', plural: null,       meaning_ko: '우유',       ipa: '/mɪlç/',       cefr_level: 'A1', category: '음식' },
  { word: 'Wasser',  article: 'das', plural: null,       meaning_ko: '물',         ipa: '/ˈvasɐ/',      cefr_level: 'A1', category: '음식' },
  // A1 — 교통/시간
  { word: 'Auto',    article: 'das', plural: 'Autos',   meaning_ko: '자동차',     ipa: '/ˈaʊto/',      cefr_level: 'A1', category: '교통' },
  { word: 'Bahnhof', article: 'der', plural: 'Bahnhöfe', meaning_ko: '기차역',    ipa: '/ˈbaːnhoːf/',  cefr_level: 'A1', category: '교통' },
  { word: 'Jahr',    article: 'das', plural: 'Jahre',   meaning_ko: '해, 년',     ipa: '/jaːɐ/',       cefr_level: 'A1', category: '시간' },
  { word: 'Uhr',     article: 'die', plural: 'Uhren',   meaning_ko: '시계, 시각', ipa: '/uːɐ/',        cefr_level: 'A1', category: '시간' },
  // A2 — 직업
  { word: 'Beruf',   article: 'der', plural: 'Berufe',  meaning_ko: '직업',       ipa: '/bəˈʁuːf/',    cefr_level: 'A2', category: '직업' },
  { word: 'Arbeit',  article: 'die', plural: 'Arbeiten', meaning_ko: '일, 직장',  ipa: '/ˈaʁbaɪt/',    cefr_level: 'A2', category: '직업' },
  { word: 'Arzt',    article: 'der', plural: 'Ärzte',   meaning_ko: '의사',       ipa: '/aːɐtst/',     cefr_level: 'A2', category: '직업' },
  // A2 — 여가
  { word: 'Urlaub',  article: 'der', plural: 'Urlaube', meaning_ko: '휴가',       ipa: '/ˈʊɐlaʊp/',    cefr_level: 'A2', category: '여가' },
  { word: 'Reise',   article: 'die', plural: 'Reisen',  meaning_ko: '여행',       ipa: '/ˈʁaɪzə/',     cefr_level: 'A2', category: '여가' },
  { word: 'Hotel',   article: 'das', plural: 'Hotels',  meaning_ko: '호텔',       ipa: '/hoˈtɛl/',     cefr_level: 'A2', category: '여가' },
  // A2 — 언어
  { word: 'Sprache', article: 'die', plural: 'Sprachen', meaning_ko: '언어',      ipa: '/ˈʃpʁaːxə/',   cefr_level: 'A2', category: '언어' },
  { word: 'Gespräch', article: 'das', plural: 'Gespräche', meaning_ko: '대화',    ipa: '/ɡəˈʃpʁɛːç/', cefr_level: 'A2', category: '언어' },
  { word: 'Freund',  article: 'der', plural: 'Freunde', meaning_ko: '친구 (남)',  ipa: '/fʁɔɪnt/',     cefr_level: 'A2', category: '사람' },
];

const { data, error } = await supabase
  .from('words')
  .upsert(words, { onConflict: 'word' })
  .select('id, word');

if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}

console.log(`Seeded ${data?.length ?? 0} words`);
data?.forEach((w) => console.log(` ✓ ${w.word}`));
