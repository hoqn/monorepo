export type TechniqueCategory =
  | 'te-waza'
  | 'koshi-waza'
  | 'ashi-waza'
  | 'ma-sutemi-waza'
  | 'yoko-sutemi-waza'
  | 'osaekomi-waza'
  | 'shime-waza'
  | 'kansetsu-waza';

export interface Technique {
  id: string;
  koreanName: string;
  japaneseName: string;
  romaji: string;
  englishName: string;
  category: TechniqueCategory;
  videoId: string;
  description: string;
  isCore?: boolean;
  /** 누르기 기술에 한해, 그 누르기에서 빠져나오는 방법을 보여주는 영상 */
  escapeVideoId?: string;
  /** 현재 시합 규정상 금지된 기술 (형·연구 목적으로만 남아 있음) */
  isForbidden?: boolean;
}

export const TECHNIQUE_CATEGORY_LABEL: Record<TechniqueCategory, string> = {
  'te-waza': '손기술 (手技)',
  'koshi-waza': '허리기술 (腰技)',
  'ashi-waza': '발기술 (足技)',
  'ma-sutemi-waza': '누워메치기 · 뒤구르기 (真捨身技)',
  'yoko-sutemi-waza': '누워메치기 · 옆구르기 (横捨身技)',
  'osaekomi-waza': '누르기 (抑込技)',
  'shime-waza': '조르기 (絞技)',
  'kansetsu-waza': '꺾기 (関節技)',
};

export const TECHNIQUE_CATEGORY_DESC: Record<TechniqueCategory, string> = {
  'te-waza': '주로 팔과 손의 힘으로 상대를 무너뜨리고 던지는 기술군',
  'koshi-waza': '허리를 상대의 몸 아래로 넣어 들어 올려 던지는 기술군',
  'ashi-waza': '다리로 상대의 다리를 걸거나 후려서 던지는 기술군',
  'ma-sutemi-waza': '자기 몸을 상대 정면으로 던지며(뒤로 눕듯) 상대를 넘기는 기술군',
  'yoko-sutemi-waza': '자기 몸을 옆으로 눕히며 상대를 넘기는 기술군',
  'osaekomi-waza': '넘어진 상대의 등을 다다미에 붙여 움직이지 못하게 누르는 기술군',
  'shime-waza': '옷깃이나 팔로 상대의 목을 졸라 항복을 받아내는 기술군',
  'kansetsu-waza':
    '관절을 꺾어 항복을 받아내는 기술군. 현재 성인 시합에서는 팔꿈치 관절기만 허용되며, 부상 위험이 커서 지도자 없이 따라 하면 안 됩니다.',
};
