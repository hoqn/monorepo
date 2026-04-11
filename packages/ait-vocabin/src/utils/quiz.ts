import { Word, Verb, VerbForm, NounQuestion, VerbQuestion, Question } from '../types/word.ts';
import { shuffle } from 'es-toolkit';

// ── 공통 유틸 ─────────────────────────────────────────────────────────────────

// 독일어 복수형 어미 패턴
const PLURAL_SUFFIXES = ['e', 'en', 'er', 'n', 's', ''];

const UMLAUT_MAP: Record<string, string> = {
  a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü',
};
const DE_UMLAUT_MAP: Record<string, string> = {
  ä: 'a', ö: 'o', ü: 'u', Ä: 'A', Ö: 'O', Ü: 'U',
};

/** 단어의 마지막 a/o/u에 움라우트 적용 */
function applyUmlaut(s: string): string {
  return s.replace(/[aouAOU](?=[^aouäöüAOUÄÖÜ]*$)/, (c) => UMLAUT_MAP[c] ?? c);
}

/** 움라우트 제거 */
function removeUmlaut(s: string): string {
  return s.replace(/[äöüÄÖÜ]/g, (c) => DE_UMLAUT_MAP[c] ?? c);
}

// ── 명사 퀴즈 ─────────────────────────────────────────────────────────────────

/**
 * 정답 복수형과 유사하지만 철자가 다른 오답 3개 생성.
 * 같은 단어 어간에 다른 독일어 복수형 어미를 붙이는 방식.
 */
function makePluralDistractors(word: string, correctPlural: string): string[] {
  const candidates = new Set<string>();

  const umlautWord = applyUmlaut(word);
  const hasUmlaut = umlautWord !== word;

  // 기본형 어간 + 다른 어미
  for (const suffix of PLURAL_SUFFIXES) {
    const c = word + suffix;
    if (c !== correctPlural && c !== word) candidates.add(c);
  }

  // 움라우트 어간 + 다른 어미
  if (hasUmlaut) {
    for (const suffix of PLURAL_SUFFIXES) {
      const c = umlautWord + suffix;
      if (c !== correctPlural) candidates.add(c);
    }
  }

  // 정답에서 움라우트만 추가/제거한 변형
  const pluralNoUmlaut = removeUmlaut(correctPlural);
  if (pluralNoUmlaut !== correctPlural) candidates.add(pluralNoUmlaut);
  const pluralWithUmlaut = applyUmlaut(correctPlural);
  if (pluralWithUmlaut !== correctPlural) candidates.add(pluralWithUmlaut);

  return shuffle([...candidates]).slice(0, 3);
}

function generateNounQuestion(word: Word): NounQuestion {
  const canPlural = word.plural !== null;
  const type = canPlural && Math.random() > 0.5 ? 'plural' : 'article';

  if (type === 'article') {
    return {
      kind: 'noun',
      word,
      type: 'article',
      options: ['der', 'die', 'das'],
      answer: word.article,
    };
  } else {
    const correctPlural = word.plural as string;
    const distractors = makePluralDistractors(word.word, correctPlural);
    return {
      kind: 'noun',
      word,
      type: 'plural',
      options: shuffle([correctPlural, ...distractors]),
      answer: correctPlural,
    };
  }
}

// ── 동사 퀴즈 ─────────────────────────────────────────────────────────────────

/**
 * 오답 동사 변화형 생성.
 * 같은 동사의 다른 인칭 형태를 우선 사용하고, 부족하면 규칙 변화 패턴으로 보충.
 */
function makeVerbDistractors(
  verb: Verb,
  allForms: VerbForm[],
  targetForm: VerbForm
): string[] {
  const correctForm = targetForm.form;

  // 같은 시제의 다른 인칭 형태를 오답 후보로 사용
  const sameTenseForms = allForms
    .filter((f) => f.tense === targetForm.tense && f.form !== correctForm)
    .map((f) => f.form);

  // 다른 시제 형태도 후보에 추가
  const otherTenseForms = allForms
    .filter((f) => f.tense !== targetForm.tense && f.form !== correctForm)
    .map((f) => f.form);

  const candidates = new Set([...sameTenseForms, ...otherTenseForms]);

  // 후보가 부족하면 규칙 변화 어미로 보충 (infinitive 어간 + 어미)
  if (candidates.size < 3) {
    const stem = verb.infinitive.replace(/en$/, '').replace(/n$/, '');
    for (const suffix of ['e', 'st', 't', 'en', 'et']) {
      const form = stem + suffix;
      if (form !== correctForm) candidates.add(form);
    }
  }

  return shuffle([...candidates])
    .filter((f) => f !== correctForm)
    .slice(0, 3);
}

/**
 * 동사 변화형 퀴즈 생성.
 * A1/A2 단계를 위해 Präsens에 가중치를 둠.
 */
export function generateVerbQuestion(verb: Verb, forms: VerbForm[]): VerbQuestion {
  if (forms.length === 0) {
    throw new Error(`No forms available for verb: ${verb.infinitive}`);
  }

  // Präsens 가중치 (70%), 나머지 시제 (30%)
  const prasensForms = forms.filter((f) => f.tense === 'Präsens');
  const otherForms = forms.filter((f) => f.tense !== 'Präsens');

  const pool = Math.random() < 0.7 && prasensForms.length > 0 ? prasensForms : forms;
  const targetForm = pool[Math.floor(Math.random() * pool.length)];

  const distractors = makeVerbDistractors(verb, forms, targetForm);
  const contextSentence = targetForm.exampleSentence ?? `${targetForm.pronoun} ___ ...`;

  return {
    kind: 'verb',
    verb,
    verbForm: targetForm,
    contextSentence,
    options: shuffle([targetForm.form, ...distractors]),
    answer: targetForm.form,
  };
}

// ── 통합 문제 생성 ─────────────────────────────────────────────────────────────

export interface VerbWithForms {
  verb: Verb;
  forms: VerbForm[];
}

/**
 * 명사 + 동사를 혼합한 퀴즈 세트 생성.
 * verbPool이 있으면 전체 count의 약 1/3을 동사 문제로 채움.
 */
export function generateQuestions(
  words: Word[],
  count = 12,
  verbPool: VerbWithForms[] = []
): Question[] {
  const verbCount = verbPool.length > 0 ? Math.floor(count / 3) : 0;
  const nounCount = count - verbCount;

  const nounPool = shuffle(words).slice(0, nounCount);
  const nounQuestions: NounQuestion[] = nounPool.map(generateNounQuestion);

  const verbQuestions: VerbQuestion[] = [];
  if (verbPool.length > 0) {
    const selectedVerbs = shuffle(verbPool).slice(0, verbCount);
    for (const { verb, forms } of selectedVerbs) {
      if (forms.length > 0) {
        verbQuestions.push(generateVerbQuestion(verb, forms));
      }
    }
  }

  return shuffle([...nounQuestions, ...verbQuestions]);
}
