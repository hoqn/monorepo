/** 기술 분류. 기획서 3장 표기 정책에 따라 한국어를 주(主)로 쓴다. */
export type TechniqueCategory = '손기술' | '허리기술' | '발기술' | '굳히기';

export interface Technique {
  id: string;
  /** 한국어 정식 명칭 (주 표기) */
  ko: string;
  kanji: string;
  /** 일본어 발음 (보조 표기) */
  jp: string;
  romaji: string;
  /**
   * 도장에서 실제로 부르는 말. 공식 명칭과 다른 경우가 흔해서
   * (예: 허벅다리걸기 → "허벅다리후리기") 검색이 한쪽만 물면 이탈한다.
   */
  aliases: string[];
  cat: TechniqueCategory;
  steps: string[];
  mistakes: string[];
}

/**
 * 카드 유형. 유도는 절차 기억이라 단어장식 앞뒤 뒤집기로는 안 되고,
 * 기획서 5장의 네 갈래 + 사용자가 직접 쓴 "내 메모"로 나눈다.
 */
export type CardType = '명칭' | '순서' | '상황' | '심상' | '내 메모';

/** 복습 자기평가. 지하철에서 고민하지 않도록 3단계로만 받는다. */
export type Grade = 0 | 1 | 2;

export interface Card {
  id: string;
  /** 소속 기술. 심판 용어·예법처럼 기술에 안 붙는 카드는 비어 있다. */
  techniqueId?: string;
  type: CardType;
  front: string;
  /**
   * 뒷면 본문. '순서' 카드는 기술의 표준 단계를, '심상' 카드는 자기평가만
   * 보여주므로 본문이 없다.
   */
  back?: string;
  /** 간격 단계. INTERVALS 배열의 인덱스(0-based). */
  step: number;
  /** 다음 복습일 'YYYY-MM-DD'. 이 날짜가 오늘 이하일 때만 큐에 들어간다. */
  dueDate: string;
  /** '내 메모' 카드에서, 그 메모를 쓴 날짜 표시용 */
  memoDate?: string;
  /** 콜드 스타트용 기본 제공 카드인지. 서랍 통계에서 내 기록과 구분한다. */
  isSeed?: boolean;
}

export interface Session {
  id: string;
  /** 'YYYY-MM-DD' */
  date: string;
  techniqueIds: string[];
  /**
   * 기술 이름을 몰라 자유 텍스트로 남긴 것. 입문자는 이름을 못 외운 상태라
   * 이게 없으면 기록 자체를 포기한다. 정리 단계에서 기술과 맞춘다.
   */
  unknownNotes: string[];
  /**
   * 정리를 끝낸 날짜 'YYYY-MM-DD'. 세션은 지우지 않고 남겨 두는데,
   * 기술 상세의 '이력' 탭이 이 기록들로 성장을 보여주기 때문이다.
   */
  organizedAt?: string;
}

export interface ReviewLogEntry {
  cardId: string;
  /** 'YYYY-MM-DD' */
  date: string;
  grade: Grade;
}

export interface TechniqueNote {
  /** 사용자가 정리 단계에서 쓴 메모. 그대로 '내 메모' 카드 뒷면이 된다. */
  memo: string;
  /** 'YYYY-MM-DD' */
  date: string;
}

export interface Settings {
  /** 수련 요일 (0=일 … 6=토). 다음 수련 직전에 카드를 앞당기는 데 쓴다. */
  trainingWeekdays: number[];
}

/** 복습 도중 앱을 껐을 때 그 자리부터 이어가기 위한 진행 상태 */
export interface ReviewProgress {
  /** 오늘 큐에 올랐던 카드 순서 */
  queue: string[];
  index: number;
  /** 'YYYY-MM-DD' — 날짜가 바뀌면 큐를 새로 만든다. */
  date: string;
}

export interface AppState {
  cards: Card[];
  sessions: Session[];
  notes: Record<string, TechniqueNote[]>;
  reps: Record<string, number>;
  reviewLog: ReviewLogEntry[];
  settings: Settings;
  reviewProgress: ReviewProgress | null;
}
