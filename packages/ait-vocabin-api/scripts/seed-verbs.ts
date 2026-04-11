/**
 * Seed German verbs into Supabase.
 *
 * A1 핵심 동사 15개는 hardcode (변화형 + 예문 + 예문 한국어 뜻 포함).
 * Run: node --env-file=.env --import tsx/esm scripts/seed-verbs.ts
 *
 * Required tables (run migrations first):
 *   verbs, verb_forms
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type VerbFormSeed = {
  pronoun: string;
  tense: string;
  form: string;
  example_sentence: string | null;
  example_sentence_ko: string | null;
};

type VerbSeed = {
  infinitive: string;
  meaning_ko: string;
  ipa: string;
  cefr_level: string;
  category: string;
  is_irregular: boolean;
  forms: VerbFormSeed[];
};

const CORE_VERBS: VerbSeed[] = [
  {
    infinitive: 'sein',
    meaning_ko: '~이다, 있다',
    ipa: '/zaɪ̯n/',
    cefr_level: 'A1',
    category: '존재',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'bin',   example_sentence: 'Ich ___ Student.',        example_sentence_ko: '나는 학생이다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'bist',  example_sentence: 'Du ___ sehr nett.',       example_sentence_ko: '너는 정말 친절하다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'ist',   example_sentence: 'Er ___ Arzt.',            example_sentence_ko: '그는 의사다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'sind',  example_sentence: 'Wir ___ Freunde.',        example_sentence_ko: '우리는 친구다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'seid',  example_sentence: 'Ihr ___ müde.',           example_sentence_ko: '너희는 피곤하다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'sind',  example_sentence: 'Sie ___ hier.',           example_sentence_ko: '그들은 여기 있다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'war',   example_sentence: 'Ich ___ gestern krank.',  example_sentence_ko: '나는 어제 아팠다.' },
      { pronoun: 'du',   tense: 'Präteritum', form: 'warst', example_sentence: 'Du ___ nicht da.',        example_sentence_ko: '너는 거기 없었다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'war',   example_sentence: 'Er ___ zu Hause.',        example_sentence_ko: '그는 집에 있었다.' },
      { pronoun: 'wir',  tense: 'Präteritum', form: 'waren', example_sentence: 'Wir ___ in Berlin.',      example_sentence_ko: '우리는 베를린에 있었다.' },
    ],
  },
  {
    infinitive: 'haben',
    meaning_ko: '가지다, 있다',
    ipa: '/ˈhaːbən/',
    cefr_level: 'A1',
    category: '소유',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'habe',  example_sentence: 'Ich ___ einen Hund.',     example_sentence_ko: '나는 개 한 마리가 있다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'hast',  example_sentence: 'Du ___ Hunger.',          example_sentence_ko: '너는 배가 고프다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'hat',   example_sentence: 'Er ___ Zeit.',            example_sentence_ko: '그는 시간이 있다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'haben', example_sentence: 'Wir ___ Glück.',          example_sentence_ko: '우리는 운이 좋다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'habt',  example_sentence: 'Ihr ___ keine Angst.',    example_sentence_ko: '너희는 두려움이 없다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'haben', example_sentence: 'Sie ___ viele Bücher.',   example_sentence_ko: '그들은 책이 많다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'hatte', example_sentence: 'Ich ___ keine Zeit.',     example_sentence_ko: '나는 시간이 없었다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'hatte', example_sentence: 'Er ___ Fieber.',          example_sentence_ko: '그는 열이 있었다.' },
    ],
  },
  {
    infinitive: 'werden',
    meaning_ko: '~이 되다',
    ipa: '/ˈveːɐ̯dən/',
    cefr_level: 'A1',
    category: '변화',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'werde',  example_sentence: 'Ich ___ Arzt.',       example_sentence_ko: '나는 의사가 될 것이다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'wirst',  example_sentence: 'Du ___ müde.',         example_sentence_ko: '너는 피곤해질 것이다.' },
      { pronoun: 'er',   tense: 'Präsens', form: 'wird',   example_sentence: 'Es ___ dunkel.',       example_sentence_ko: '어두워지고 있다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'werden', example_sentence: 'Wir ___ Freunde.',     example_sentence_ko: '우리는 친구가 될 것이다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'werdet', example_sentence: 'Ihr ___ groß.',        example_sentence_ko: '너희는 커질 것이다.' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'werden', example_sentence: 'Sie ___ kommen.',      example_sentence_ko: '그들이 올 것이다.' },
    ],
  },
  {
    infinitive: 'gehen',
    meaning_ko: '가다',
    ipa: '/ˈɡeːən/',
    cefr_level: 'A1',
    category: '이동',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'gehe',  example_sentence: 'Ich ___ in die Schule.',      example_sentence_ko: '나는 학교에 간다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'gehst', example_sentence: 'Du ___ spazieren.',            example_sentence_ko: '너는 산책하러 간다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'geht',  example_sentence: 'Er ___ zur Arbeit.',           example_sentence_ko: '그는 직장에 간다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'gehen', example_sentence: 'Wir ___ ins Kino.',            example_sentence_ko: '우리는 영화관에 간다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'geht',  example_sentence: 'Ihr ___ nach Hause.',          example_sentence_ko: '너희는 집에 간다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'gehen', example_sentence: 'Sie ___ in den Park.',         example_sentence_ko: '그들은 공원에 간다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'ging',  example_sentence: 'Ich ___ gestern schwimmen.',   example_sentence_ko: '나는 어제 수영하러 갔다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'ging',  example_sentence: 'Er ___ früh schlafen.',        example_sentence_ko: '그는 일찍 잠자리에 들었다.' },
    ],
  },
  {
    infinitive: 'kommen',
    meaning_ko: '오다',
    ipa: '/ˈkɔmən/',
    cefr_level: 'A1',
    category: '이동',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'komme',  example_sentence: 'Ich ___ aus Korea.',        example_sentence_ko: '나는 한국에서 왔다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'kommst', example_sentence: 'Wann ___ du?',              example_sentence_ko: '너는 언제 오니?' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'kommt',  example_sentence: 'Er ___ gleich.',            example_sentence_ko: '그는 곧 온다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'kommen', example_sentence: 'Wir ___ morgen.',           example_sentence_ko: '우리는 내일 간다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'kommt',  example_sentence: 'Ihr ___ zu spät.',          example_sentence_ko: '너희는 너무 늦게 온다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'kommen', example_sentence: 'Sie ___ mit dem Zug.',      example_sentence_ko: '그들은 기차를 타고 온다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'kam',    example_sentence: 'Ich ___ gestern an.',       example_sentence_ko: '나는 어제 도착했다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'kam',    example_sentence: 'Er ___ spät nach Hause.',   example_sentence_ko: '그는 늦게 집에 왔다.' },
    ],
  },
  {
    infinitive: 'machen',
    meaning_ko: '하다, 만들다',
    ipa: '/ˈmaxən/',
    cefr_level: 'A1',
    category: '일상',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'mache',  example_sentence: 'Ich ___ die Hausaufgaben.', example_sentence_ko: '나는 숙제를 한다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'machst', example_sentence: 'Was ___ du?',               example_sentence_ko: '너는 뭘 하니?' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'macht',  example_sentence: 'Er ___ Sport.',             example_sentence_ko: '그는 운동을 한다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'machen', example_sentence: 'Wir ___ eine Pause.',       example_sentence_ko: '우리는 휴식을 취한다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'macht',  example_sentence: 'Ihr ___ Lärm.',             example_sentence_ko: '너희는 소음을 낸다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'machen', example_sentence: 'Sie ___ Musik.',            example_sentence_ko: '그들은 음악을 만든다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'machte', example_sentence: 'Ich ___ einen Fehler.',     example_sentence_ko: '나는 실수를 했다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'machte', example_sentence: 'Er ___ die Tür auf.',       example_sentence_ko: '그는 문을 열었다.' },
    ],
  },
  {
    infinitive: 'spielen',
    meaning_ko: '놀다, 연주하다',
    ipa: '/ˈʃpiːlən/',
    cefr_level: 'A1',
    category: '여가',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'spiele',  example_sentence: 'Ich ___ Gitarre.',        example_sentence_ko: '나는 기타를 친다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'spielst', example_sentence: 'Du ___ Fußball.',         example_sentence_ko: '너는 축구를 한다.' },
      { pronoun: 'er',   tense: 'Präsens', form: 'spielt',  example_sentence: 'Er ___ Klavier.',         example_sentence_ko: '그는 피아노를 친다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'spielen', example_sentence: 'Wir ___ zusammen.',       example_sentence_ko: '우리는 함께 논다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'spielt',  example_sentence: 'Ihr ___ im Garten.',      example_sentence_ko: '너희는 정원에서 논다.' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'spielen', example_sentence: 'Sie ___ Tennis.',         example_sentence_ko: '그들은 테니스를 친다.' },
    ],
  },
  {
    infinitive: 'lernen',
    meaning_ko: '배우다, 공부하다',
    ipa: '/ˈlɛɐ̯nən/',
    cefr_level: 'A1',
    category: '학습',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'lerne',  example_sentence: 'Ich ___ Deutsch.',        example_sentence_ko: '나는 독일어를 배운다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'lernst', example_sentence: 'Du ___ fleißig.',         example_sentence_ko: '너는 열심히 공부한다.' },
      { pronoun: 'er',   tense: 'Präsens', form: 'lernt',  example_sentence: 'Er ___ jeden Tag.',       example_sentence_ko: '그는 매일 공부한다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'lernen', example_sentence: 'Wir ___ neue Wörter.',    example_sentence_ko: '우리는 새 단어를 배운다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'lernt',  example_sentence: 'Ihr ___ zusammen.',       example_sentence_ko: '너희는 함께 공부한다.' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'lernen', example_sentence: 'Sie ___ Vokabeln.',       example_sentence_ko: '그들은 어휘를 공부한다.' },
    ],
  },
  {
    infinitive: 'arbeiten',
    meaning_ko: '일하다',
    ipa: '/ˈaʁbaɪtən/',
    cefr_level: 'A1',
    category: '직업',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'arbeite',   example_sentence: 'Ich ___ im Büro.',           example_sentence_ko: '나는 사무실에서 일한다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'arbeitest', example_sentence: 'Du ___ zu viel.',            example_sentence_ko: '너는 너무 많이 일한다.' },
      { pronoun: 'er',   tense: 'Präsens', form: 'arbeitet',  example_sentence: 'Er ___ als Arzt.',           example_sentence_ko: '그는 의사로 일한다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'arbeiten',  example_sentence: 'Wir ___ zusammen.',          example_sentence_ko: '우리는 함께 일한다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'arbeitet',  example_sentence: 'Ihr ___ schnell.',           example_sentence_ko: '너희는 빠르게 일한다.' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'arbeiten',  example_sentence: 'Sie ___ am Wochenende.',     example_sentence_ko: '그들은 주말에 일한다.' },
    ],
  },
  {
    infinitive: 'fahren',
    meaning_ko: '(탈것으로) 가다, 운전하다',
    ipa: '/ˈfaːʁən/',
    cefr_level: 'A1',
    category: '이동',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'fahre',  example_sentence: 'Ich ___ mit dem Bus.',         example_sentence_ko: '나는 버스를 타고 간다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'fährst', example_sentence: 'Du ___ zu schnell.',           example_sentence_ko: '너는 너무 빨리 달린다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'fährt',  example_sentence: 'Er ___ nach Berlin.',          example_sentence_ko: '그는 베를린으로 간다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'fahren', example_sentence: 'Wir ___ in den Urlaub.',       example_sentence_ko: '우리는 휴가를 떠난다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'fahrt',  example_sentence: 'Ihr ___ mit dem Zug.',         example_sentence_ko: '너희는 기차를 타고 간다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'fahren', example_sentence: 'Sie ___ morgen ab.',           example_sentence_ko: '그들은 내일 출발한다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'fuhr',   example_sentence: 'Ich ___ gestern nach Hamburg.', example_sentence_ko: '나는 어제 함부르크로 갔다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'fuhr',   example_sentence: 'Er ___ allein.',               example_sentence_ko: '그는 혼자 갔다.' },
    ],
  },
  {
    infinitive: 'essen',
    meaning_ko: '먹다',
    ipa: '/ˈɛsən/',
    cefr_level: 'A1',
    category: '음식',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'esse',  example_sentence: 'Ich ___ ein Brot.',        example_sentence_ko: '나는 빵을 먹는다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'isst',  example_sentence: 'Du ___ gern Pizza.',       example_sentence_ko: '너는 피자를 좋아한다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'isst',  example_sentence: 'Er ___ viel.',             example_sentence_ko: '그는 많이 먹는다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'essen', example_sentence: 'Wir ___ zusammen.',        example_sentence_ko: '우리는 함께 먹는다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'esst',  example_sentence: 'Ihr ___ im Restaurant.',   example_sentence_ko: '너희는 식당에서 먹는다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'essen', example_sentence: 'Sie ___ Salat.',           example_sentence_ko: '그들은 샐러드를 먹는다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'aß',    example_sentence: 'Ich ___ gestern Sushi.',   example_sentence_ko: '나는 어제 초밥을 먹었다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'aß',    example_sentence: 'Er ___ nichts.',           example_sentence_ko: '그는 아무것도 먹지 않았다.' },
    ],
  },
  {
    infinitive: 'trinken',
    meaning_ko: '마시다',
    ipa: '/ˈtʁɪŋkən/',
    cefr_level: 'A1',
    category: '음식',
    is_irregular: true,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'trinke',  example_sentence: 'Ich ___ Wasser.',        example_sentence_ko: '나는 물을 마신다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'trinkst', example_sentence: 'Du ___ Kaffee.',         example_sentence_ko: '너는 커피를 마신다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'trinkt',  example_sentence: 'Er ___ Bier.',           example_sentence_ko: '그는 맥주를 마신다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'trinken', example_sentence: 'Wir ___ Tee.',           example_sentence_ko: '우리는 차를 마신다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'trinkt',  example_sentence: 'Ihr ___ Saft.',          example_sentence_ko: '너희는 주스를 마신다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'trinken', example_sentence: 'Sie ___ Milch.',         example_sentence_ko: '그들은 우유를 마신다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'trank',   example_sentence: 'Ich ___ einen Kaffee.',  example_sentence_ko: '나는 커피 한 잔을 마셨다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'trank',   example_sentence: 'Er ___ zu viel.',        example_sentence_ko: '그는 너무 많이 마셨다.' },
    ],
  },
  {
    infinitive: 'wohnen',
    meaning_ko: '살다, 거주하다',
    ipa: '/ˈvoːnən/',
    cefr_level: 'A1',
    category: '일상',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'wohne',  example_sentence: 'Ich ___ in Seoul.',             example_sentence_ko: '나는 서울에 산다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'wohnst', example_sentence: 'Wo ___ du?',                    example_sentence_ko: '너는 어디에 사니?' },
      { pronoun: 'er',   tense: 'Präsens', form: 'wohnt',  example_sentence: 'Er ___ in Berlin.',             example_sentence_ko: '그는 베를린에 산다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'wohnen', example_sentence: 'Wir ___ zusammen.',             example_sentence_ko: '우리는 함께 산다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'wohnt',  example_sentence: 'Ihr ___ nah am Bahnhof.',       example_sentence_ko: '너희는 역 가까이에 산다.' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'wohnen', example_sentence: 'Sie ___ im Norden.',            example_sentence_ko: '그들은 북쪽에 산다.' },
    ],
  },
  {
    infinitive: 'heißen',
    meaning_ko: '~라고 불리다, 이름이 ~이다',
    ipa: '/ˈhaɪ̯sən/',
    cefr_level: 'A1',
    category: '일상',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens', form: 'heiße',  example_sentence: 'Ich ___ Anna.',     example_sentence_ko: '내 이름은 안나다.' },
      { pronoun: 'du',   tense: 'Präsens', form: 'heißt',  example_sentence: 'Wie ___ du?',       example_sentence_ko: '너는 이름이 뭐니?' },
      { pronoun: 'er',   tense: 'Präsens', form: 'heißt',  example_sentence: 'Er ___ Max.',        example_sentence_ko: '그의 이름은 막스다.' },
      { pronoun: 'wir',  tense: 'Präsens', form: 'heißen', example_sentence: 'Wir ___ Schmidt.',  example_sentence_ko: '우리 성은 슈미트다.' },
      { pronoun: 'ihr',  tense: 'Präsens', form: 'heißt',  example_sentence: 'Wie ___ ihr?',      example_sentence_ko: '너희 이름은 뭐니?' },
      { pronoun: 'sie',  tense: 'Präsens', form: 'heißen', example_sentence: 'Sie ___ Müller.',   example_sentence_ko: '그들의 성은 뮐러다.' },
    ],
  },
  {
    infinitive: 'kaufen',
    meaning_ko: '사다, 구매하다',
    ipa: '/ˈkaʊ̯fən/',
    cefr_level: 'A1',
    category: '일상',
    is_irregular: false,
    forms: [
      { pronoun: 'ich',  tense: 'Präsens',    form: 'kaufe',   example_sentence: 'Ich ___ ein Buch.',           example_sentence_ko: '나는 책 한 권을 산다.' },
      { pronoun: 'du',   tense: 'Präsens',    form: 'kaufst',  example_sentence: 'Du ___ zu viel.',             example_sentence_ko: '너는 너무 많이 산다.' },
      { pronoun: 'er',   tense: 'Präsens',    form: 'kauft',   example_sentence: 'Er ___ ein Auto.',            example_sentence_ko: '그는 자동차를 산다.' },
      { pronoun: 'wir',  tense: 'Präsens',    form: 'kaufen',  example_sentence: 'Wir ___ Lebensmittel.',       example_sentence_ko: '우리는 식료품을 산다.' },
      { pronoun: 'ihr',  tense: 'Präsens',    form: 'kauft',   example_sentence: 'Ihr ___ Geschenke.',          example_sentence_ko: '너희는 선물을 산다.' },
      { pronoun: 'sie',  tense: 'Präsens',    form: 'kaufen',  example_sentence: 'Sie ___ Kleidung.',           example_sentence_ko: '그들은 옷을 산다.' },
      { pronoun: 'ich',  tense: 'Präteritum', form: 'kaufte',  example_sentence: 'Ich ___ gestern ein Handy.',  example_sentence_ko: '나는 어제 핸드폰을 샀다.' },
      { pronoun: 'er',   tense: 'Präteritum', form: 'kaufte',  example_sentence: 'Er ___ ein neues Fahrrad.',   example_sentence_ko: '그는 새 자전거를 샀다.' },
    ],
  },
];

async function seedVerbs() {
  let totalVerbs = 0;
  let totalForms = 0;
  const errors: string[] = [];

  for (const verbSeed of CORE_VERBS) {
    const { forms, ...verbData } = verbSeed;

    // 동사 upsert
    const { data: verbRow, error: verbError } = await supabase
      .from('verbs')
      .upsert(verbData, { onConflict: 'infinitive' })
      .select('id, infinitive')
      .single();

    if (verbError || !verbRow) {
      errors.push(`verbs: ${verbData.infinitive} — ${verbError?.message}`);
      continue;
    }

    totalVerbs++;

    // 변화형 upsert
    const formsWithVerbId = forms.map((f) => ({ ...f, verb_id: verbRow.id }));
    const { error: formsError } = await supabase
      .from('verb_forms')
      .upsert(formsWithVerbId, { onConflict: 'verb_id,pronoun,tense' });

    if (formsError) {
      errors.push(`verb_forms: ${verbRow.infinitive} — ${formsError.message}`);
    } else {
      totalForms += forms.length;
      console.log(` ✓ ${verbRow.infinitive} (${forms.length} forms)`);
    }
  }

  console.log(`\nSeeded ${totalVerbs} verbs, ${totalForms} forms`);
  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(' ✗', e));
    process.exit(1);
  }
}

await seedVerbs();
