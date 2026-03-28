import { Word, Question, QuestionType } from '../types/word.ts';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

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

export function generateQuestions(words: Word[], count = 12): Question[] {
  const pool = shuffle(words).slice(0, count);

  return pool.map((word): Question => {
    const canPlural = word.plural !== null;
    const type: QuestionType = canPlural && Math.random() > 0.5 ? 'plural' : 'article';

    if (type === 'article') {
      return {
        word,
        type: 'article',
        options: ['der', 'die', 'das'],
        answer: word.article,
      };
    } else {
      const correctPlural = word.plural as string;
      const distractors = makePluralDistractors(word.word, correctPlural);
      return {
        word,
        type: 'plural',
        options: shuffle([correctPlural, ...distractors]),
        answer: correctPlural,
      };
    }
  });
}
