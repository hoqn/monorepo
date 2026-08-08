export type TermCategory =
  | 'basic'
  | 'etiquette'
  | 'ukemi'
  | 'stance-grip'
  | 'technique-family'
  | 'scoring'
  | 'referee-call'
  | 'rank';

export interface Term {
  id: string;
  term: string;
  japanese?: string;
  romaji?: string;
  category: TermCategory;
  shortDefinition: string;
  longDefinition: string;
}

export const TERM_CATEGORY_LABEL: Record<TermCategory, string> = {
  basic: '기본 장비·공간',
  etiquette: '예의범절',
  ukemi: '낙법',
  'stance-grip': '자세·잡기',
  'technique-family': '기술 분류',
  scoring: '점수·경기 결과',
  'referee-call': '심판 구호',
  rank: '급수·단수',
};
