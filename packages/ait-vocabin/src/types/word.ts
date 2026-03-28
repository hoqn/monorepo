export type Article = 'der' | 'die' | 'das';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

export interface Word {
  id: string;
  word: string;
  article: Article;
  plural: string | null; // null = 복수형 없음 (예: Milch)
  meaningKo: string;
  ipa: string;
  cefrLevel: CefrLevel;
  category: string;
  exampleSentence?: string; // MVP 이후
  etymologyHint?: string;   // MVP 이후
}

// SM-2 알고리즘용 사용자별 단어 진행 상태
export interface WordProgress {
  wordId: string;
  easiness: number;      // 난이도 계수 (초기값: 2.5)
  interval: number;      // 다음 복습까지 일수
  repetitions: number;   // 복습 횟수
  nextReviewAt: string;  // ISO date string
  lastReviewedAt: string | null;
}

// 퀴즈 문항 유형
export type QuestionType = 'article' | 'plural';

export interface Question {
  word: Word;
  type: QuestionType;
  options: string[];   // 선택지 (정답 포함)
  answer: string;      // 정답
}
