import { Word, Question, QuestionType } from '../types/word.ts';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makePluralOptions(word: Word, allWords: Word[]): string[] {
  const correct = word.plural ?? '없음';
  const distractors = allWords
    .filter((w) => w.id !== word.id && w.plural !== null)
    .map((w) => w.plural as string);
  const unique = [...new Set(distractors)].filter((p) => p !== correct);
  const picked = shuffle(unique).slice(0, 3);
  return shuffle([correct, ...picked]);
}

export function generateQuestions(words: Word[], count = 12): Question[] {
  const pool = shuffle(words).slice(0, count);

  return pool.map((word): Question => {
    // 복수형이 없는 단어는 항상 article 퀴즈
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
      return {
        word,
        type: 'plural',
        options: makePluralOptions(word, words),
        answer: word.plural as string,
      };
    }
  });
}
