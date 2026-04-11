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

// ── 동사 ──────────────────────────────────────────────────────────────────────

export interface Verb {
  id: string;
  infinitive: string;
  meaningKo: string;
  ipa: string;
  cefrLevel: CefrLevel;
  category: string;
  isIrregular: boolean;
}

export interface VerbForm {
  pronoun: string;            // 'ich' | 'du' | 'er' | 'wir' | 'ihr' | 'sie'
  tense: string;              // 'Präsens' | 'Präteritum' | 'Perfekt'
  form: string;               // 실제 변화형 (예: 'geht')
  exampleSentence: string | null;   // 'Er ___ zur Arbeit.' — ___ 가 빈칸
  exampleSentenceKo: string | null; // '그는 직장에 간다.'
}

// ── 퀴즈 문항 ─────────────────────────────────────────────────────────────────

export type NounQuestion = {
  kind: 'noun';
  word: Word;
  type: 'article' | 'plural';
  options: string[];
  answer: string;
};

export type VerbQuestion = {
  kind: 'verb';
  verb: Verb;
  verbForm: VerbForm;
  contextSentence: string; // 빈칸 포함 예문
  options: string[];
  answer: string;
};

export type Question = NounQuestion | VerbQuestion;

// 이전 코드 호환용 (QuestionType은 kind+type 조합으로 대체됨)
export type QuestionType = 'article' | 'plural' | 'verb_conjugation';
