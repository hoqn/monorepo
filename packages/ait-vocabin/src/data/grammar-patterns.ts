/**
 * 독일어 문법 패턴 — 오답 피드백 문맥 카드에 활용
 */

export interface ArticlePattern {
  suffixes: string[];
  article: 'der' | 'die' | 'das';
  rule: string;
  examples: string;
}

export const ARTICLE_PATTERNS: ArticlePattern[] = [
  {
    suffixes: ['ung'],
    article: 'die',
    rule: '~ung으로 끝나는 명사는 항상 여성(die)이에요',
    examples: 'Zeitung, Wohnung, Übung',
  },
  {
    suffixes: ['heit', 'keit'],
    article: 'die',
    rule: '~heit / ~keit로 끝나는 명사는 항상 여성(die)이에요',
    examples: 'Freiheit, Möglichkeit',
  },
  {
    suffixes: ['schaft'],
    article: 'die',
    rule: '~schaft로 끝나는 명사는 항상 여성(die)이에요',
    examples: 'Gesellschaft, Mannschaft',
  },
  {
    suffixes: ['tion', 'sion', 'xion'],
    article: 'die',
    rule: '~tion / ~sion으로 끝나는 명사는 항상 여성(die)이에요',
    examples: 'Nation, Lektion',
  },
  {
    suffixes: ['tät', 'ität'],
    article: 'die',
    rule: '~tät / ~ität로 끝나는 명사는 항상 여성(die)이에요',
    examples: 'Qualität, Universität',
  },
  {
    suffixes: ['ie'],
    article: 'die',
    rule: '~ie로 끝나는 명사는 대부분 여성(die)이에요',
    examples: 'Energie, Melodie',
  },
  {
    suffixes: ['chen', 'lein'],
    article: 'das',
    rule: '~chen / ~lein 축소사는 항상 중성(das)이에요',
    examples: 'Mädchen, Kindlein',
  },
  {
    suffixes: ['nis'],
    article: 'das',
    rule: '~nis로 끝나는 명사는 주로 중성(das)이에요',
    examples: 'Ergebnis, Zeugnis',
  },
  {
    suffixes: ['tum'],
    article: 'das',
    rule: '~tum으로 끝나는 명사는 주로 중성(das)이에요',
    examples: 'Reichtum, Eigentum',
  },
  {
    suffixes: ['ment'],
    article: 'das',
    rule: '~ment로 끝나는 명사는 대부분 중성(das)이에요',
    examples: 'Instrument, Dokument',
  },
  {
    suffixes: ['um'],
    article: 'das',
    rule: '~um으로 끝나는 명사는 주로 중성(das)이에요',
    examples: 'Museum, Datum',
  },
  {
    suffixes: ['er'],
    article: 'der',
    rule: '직업/행위자를 나타내는 ~er 명사는 남성(der)이에요',
    examples: 'Lehrer, Bäcker, Fahrer',
  },
  {
    suffixes: ['ismus', 'ist'],
    article: 'der',
    rule: '~ismus / ~ist로 끝나는 명사는 남성(der)이에요',
    examples: 'Optimismus, Tourist',
  },
  {
    suffixes: ['ling'],
    article: 'der',
    rule: '~ling으로 끝나는 명사는 남성(der)이에요',
    examples: 'Frühling, Lehrling',
  },
];

/**
 * 단어 어미를 기반으로 관사 패턴 규칙을 찾아 반환
 */
export function findArticlePattern(word: string): ArticlePattern | null {
  const lower = word.toLowerCase();
  for (const pattern of ARTICLE_PATTERNS) {
    if (pattern.suffixes.some((s) => lower.endsWith(s))) {
      return pattern;
    }
  }
  return null;
}

// ── 복수형 패턴 ────────────────────────────────────────────────────────────────

export interface PluralPattern {
  id: string;
  name: string;
  rule: string;
  examples: string;
}

export const PLURAL_PATTERNS: PluralPattern[] = [
  {
    id: 'e',
    name: '어미 -e',
    rule: '단어 뒤에 -e를 붙여 복수형을 만들어요',
    examples: 'Tag → Tage, Hund → Hunde',
  },
  {
    id: 'umlaut_e',
    name: '움라우트 + -e',
    rule: '어간 모음에 움라우트를 추가하고 -e를 붙여요',
    examples: 'Nacht → Nächte, Hand → Hände',
  },
  {
    id: 'er',
    name: '어미 -er',
    rule: '단어 뒤에 -er를 붙여 복수형을 만들어요',
    examples: 'Kind → Kinder, Buch → Bücher',
  },
  {
    id: 'en',
    name: '어미 -en / -n',
    rule: '단어 뒤에 -en 또는 -n을 붙여요. 여성 명사에 많아요',
    examples: 'Frau → Frauen, Schule → Schulen',
  },
  {
    id: 's',
    name: '어미 -s',
    rule: '외래어나 약어에 자주 사용해요',
    examples: 'Auto → Autos, Hotel → Hotels',
  },
  {
    id: 'same',
    name: '변화 없음',
    rule: '단수와 복수 형태가 동일해요',
    examples: 'Lehrer → Lehrer, Zimmer → Zimmer',
  },
];

// ── 동사 패턴 ─────────────────────────────────────────────────────────────────

export interface VerbPattern {
  id: string;
  name: string;
  rule: string;
  examples: string;
}

export const VERB_PATTERNS: VerbPattern[] = [
  {
    id: 'regular_prasens',
    name: '규칙 현재형 변화',
    rule: '어간 + ich -e, du -st, er -t, wir -en, ihr -t, sie -en',
    examples: 'machen: ich mache, du machst, er macht',
  },
  {
    id: 'irregular_prasens',
    name: '불규칙 현재형 변화',
    rule: 'du/er 인칭에서 어간 모음이 바뀌어요 (e→i, a→ä 등)',
    examples: 'fahren: du fährst, er fährt',
  },
  {
    id: 'sein',
    name: 'sein (be) 변화',
    rule: 'sein은 완전히 불규칙해요: ich bin, du bist, er ist',
    examples: 'sein: ich bin, du bist, er ist, wir sind',
  },
  {
    id: 'haben',
    name: 'haben (have) 변화',
    rule: 'haben은 du/er에서 b가 탈락해요',
    examples: 'haben: ich habe, du hast, er hat',
  },
];
