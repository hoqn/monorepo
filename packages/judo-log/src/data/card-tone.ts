import type { CardType } from '../types';

/** 카드 유형별 배지 색. Badge가 실제로 받는 값만 쓴다 (accent 같은 값은 없다). */
export const CARD_TONE: Record<CardType, 'blue' | 'orange' | 'green' | 'purple' | 'pink'> = {
  명칭: 'blue',
  순서: 'orange',
  상황: 'green',
  심상: 'purple',
  '내 메모': 'pink',
};
