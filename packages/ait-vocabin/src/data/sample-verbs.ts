import type { Verb, VerbForm } from '../types/word.ts';

export interface SampleVerbEntry {
  verb: Verb;
  forms: VerbForm[];
}

export const sampleVerbs: SampleVerbEntry[] = [
  {
    verb: { id: 'v001', infinitive: 'gehen', meaningKo: '가다', ipa: '/ˈɡeːən/', cefrLevel: 'A1', category: '이동', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'gehe', exampleSentence: 'Ich ___ nach Hause.', exampleSentenceKo: '나는 집에 간다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'gehst', exampleSentence: 'Du ___ in die Schule.', exampleSentenceKo: '너는 학교에 간다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'geht', exampleSentence: 'Er ___ zur Arbeit.', exampleSentenceKo: '그는 직장에 간다.' },
    ],
  },
  {
    verb: { id: 'v002', infinitive: 'haben', meaningKo: '가지다, 있다', ipa: '/ˈhaːbən/', cefrLevel: 'A1', category: '상태', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'habe', exampleSentence: 'Ich ___ ein Buch.', exampleSentenceKo: '나는 책이 있다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'hast', exampleSentence: 'Du ___ Hunger.', exampleSentenceKo: '너는 배가 고프다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'hat', exampleSentence: 'Er ___ einen Hund.', exampleSentenceKo: '그는 개가 있다.' },
    ],
  },
  {
    verb: { id: 'v003', infinitive: 'sein', meaningKo: '이다, 있다', ipa: '/zaɪn/', cefrLevel: 'A1', category: '상태', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'bin', exampleSentence: 'Ich ___ müde.', exampleSentenceKo: '나는 피곤하다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'bist', exampleSentence: 'Du ___ mein Freund.', exampleSentenceKo: '너는 내 친구다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'ist', exampleSentence: 'Er ___ Arzt.', exampleSentenceKo: '그는 의사다.' },
    ],
  },
  {
    verb: { id: 'v004', infinitive: 'machen', meaningKo: '하다, 만들다', ipa: '/ˈmaxən/', cefrLevel: 'A1', category: '행동', isIrregular: false },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'mache', exampleSentence: 'Ich ___ Hausaufgaben.', exampleSentenceKo: '나는 숙제를 한다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'machst', exampleSentence: 'Was ___ du heute?', exampleSentenceKo: '너는 오늘 무엇을 하니?' },
      { pronoun: 'er', tense: 'Präsens', form: 'macht', exampleSentence: 'Er ___ Sport.', exampleSentenceKo: '그는 운동을 한다.' },
    ],
  },
  {
    verb: { id: 'v005', infinitive: 'kommen', meaningKo: '오다', ipa: '/ˈkɔmən/', cefrLevel: 'A1', category: '이동', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'komme', exampleSentence: 'Ich ___ aus Korea.', exampleSentenceKo: '나는 한국에서 왔다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'kommst', exampleSentence: 'Wann ___ du?', exampleSentenceKo: '너는 언제 오니?' },
      { pronoun: 'er', tense: 'Präsens', form: 'kommt', exampleSentence: 'Er ___ morgen.', exampleSentenceKo: '그는 내일 온다.' },
    ],
  },
  {
    verb: { id: 'v006', infinitive: 'sprechen', meaningKo: '말하다', ipa: '/ˈʃpʁɛçən/', cefrLevel: 'A2', category: '소통', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'spreche', exampleSentence: 'Ich ___ Deutsch.', exampleSentenceKo: '나는 독일어를 한다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'sprichst', exampleSentence: 'Du ___ sehr gut.', exampleSentenceKo: '너는 매우 잘 말한다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'spricht', exampleSentence: 'Er ___ mit dem Arzt.', exampleSentenceKo: '그는 의사와 이야기한다.' },
    ],
  },
  {
    verb: { id: 'v007', infinitive: 'essen', meaningKo: '먹다', ipa: '/ˈɛsən/', cefrLevel: 'A1', category: '일상', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'esse', exampleSentence: 'Ich ___ Brot.', exampleSentenceKo: '나는 빵을 먹는다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'isst', exampleSentence: 'Was ___ du gern?', exampleSentenceKo: '너는 무엇을 즐겨 먹니?' },
      { pronoun: 'er', tense: 'Präsens', form: 'isst', exampleSentence: 'Er ___ Mittag.', exampleSentenceKo: '그는 점심을 먹는다.' },
    ],
  },
  {
    verb: { id: 'v008', infinitive: 'trinken', meaningKo: '마시다', ipa: '/ˈtʁɪŋkən/', cefrLevel: 'A1', category: '일상', isIrregular: true },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'trinke', exampleSentence: 'Ich ___ Kaffee.', exampleSentenceKo: '나는 커피를 마신다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'trinkst', exampleSentence: 'Du ___ zu viel.', exampleSentenceKo: '너는 너무 많이 마신다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'trinkt', exampleSentence: 'Er ___ Wasser.', exampleSentenceKo: '그는 물을 마신다.' },
    ],
  },
  {
    verb: { id: 'v009', infinitive: 'lernen', meaningKo: '배우다, 공부하다', ipa: '/ˈlɛʁnən/', cefrLevel: 'A1', category: '학업', isIrregular: false },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'lerne', exampleSentence: 'Ich ___ Deutsch.', exampleSentenceKo: '나는 독일어를 배운다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'lernst', exampleSentence: 'Du ___ für die Prüfung.', exampleSentenceKo: '너는 시험을 위해 공부한다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'lernt', exampleSentence: 'Er ___ viel.', exampleSentenceKo: '그는 많이 배운다.' },
    ],
  },
  {
    verb: { id: 'v010', infinitive: 'arbeiten', meaningKo: '일하다', ipa: '/ˈaʁbaɪtən/', cefrLevel: 'A2', category: '직업', isIrregular: false },
    forms: [
      { pronoun: 'ich', tense: 'Präsens', form: 'arbeite', exampleSentence: 'Ich ___ viel.', exampleSentenceKo: '나는 많이 일한다.' },
      { pronoun: 'du', tense: 'Präsens', form: 'arbeitest', exampleSentence: 'Du ___ zu Hause.', exampleSentenceKo: '너는 집에서 일한다.' },
      { pronoun: 'er', tense: 'Präsens', form: 'arbeitet', exampleSentence: 'Er ___ als Arzt.', exampleSentenceKo: '그는 의사로 일한다.' },
    ],
  },
];
