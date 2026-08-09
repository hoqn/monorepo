export interface Fundamental {
  id: string;
  koreanName: string;
  japaneseName?: string;
  romaji: string;
  videoId: string;
  description: string;
  /** 영상 안에 순서대로 담긴 세부 동작들 */
  segments: FundamentalSegment[];
  /** 연습할 때 특히 신경 써야 하는 점 */
  tips?: string[];
}

export interface FundamentalSegment {
  koreanName: string;
  romaji: string;
  note: string;
}
