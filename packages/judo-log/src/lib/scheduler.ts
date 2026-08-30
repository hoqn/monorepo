import type { Card, Grade } from '../types';
import { addDays, diffDays, nextTrainingDate, type DateString } from './date';

/** 기획서 8장의 기본 간격. step은 이 배열의 인덱스(0-based)다. */
export const INTERVALS = [1, 3, 7, 14, 30];

/** 하루 상한. 밀린 카드가 50장이면 앱을 아예 안 열기 때문에 잘라준다. */
export const DAILY_LIMIT = 20;

/** 다음 수련 며칠 전부터 카드를 앞당길지 (기획서 8장: 1~2일 전) */
const BOOST_WINDOW_DAYS = 2;

function clampStep(step: number): number {
  return Math.min(Math.max(step, 0), INTERVALS.length - 1);
}

/**
 * 이 평가를 주면 다음 복습이 며칠 뒤가 되는지.
 * 「까먹음」 간격 초기화 / 「애매하다」 같은 간격 한 번 더 / 「기억남」 다음 단계.
 * 평가 버튼 밑에 미리 보여줘서 사용자가 시스템을 신뢰하게 만드는 값이기도 하다.
 */
export function nextIntervalDays(step: number, grade: Grade): number {
  if (grade === 0) return INTERVALS[0] ?? 1;
  const nextStep = clampStep(grade === 1 ? step : step + 1);
  return INTERVALS[nextStep] ?? 1;
}

/** 평가 결과를 카드에 실제로 반영한다. 프로토타입과 달리 배열에서 빼지 않고 dueDate를 옮긴다. */
export function applyGrade(card: Card, grade: Grade, today: DateString): Card {
  const nextStep = grade === 0 ? 0 : clampStep(grade === 1 ? card.step : card.step + 1);
  return { ...card, step: nextStep, dueDate: addDays(today, nextIntervalDays(card.step, grade)) };
}

export interface QueueOptions {
  today: DateString;
  trainingWeekdays: number[];
  /** 최근 세션에서 태그한 기술. 다음 수련에 또 나올 가능성이 높다고 본다. */
  recentTechniqueIds: string[];
}

export interface Queue {
  cards: Card[];
  /** 간격을 무시하고 앞당겨 넣은 카드 수 (화면에서 이유를 설명하기 위해) */
  boostedCount: number;
  /** 상한에 걸려 오늘 큐에서 잘린 카드 수 */
  deferredCount: number;
}

/**
 * 오늘 복습할 카드를 고른다.
 *
 * 1. 다음 수련이 1~2일 앞이면, 최근 배운 기술의 카드를 간격 무시하고 앞당겨 넣는다
 * 2. 이어서 dueDate가 오늘 이하인 카드 (연체가 오래된 것, 덜 익은 것 순)
 * 3. 20장에서 자름
 *
 * 앞당긴 카드를 앞에 두는 이유: 목적이 시험 통과가 아니라 매트 위에서의 수행이라
 * 실전 직전 복습의 가치가 가장 높다(기획서 8장). 밀린 카드가 상한을 다 채워서
 * 정작 내일 쓸 기술이 잘려나가면 보정이 있으나 마나가 된다. 앞당김은 최근 세션에
 * 태그한 기술로만 좁혀져 있어 밀린 카드를 통째로 밀어내지도 않는다.
 */
export function buildQueue(cards: Card[], options: QueueOptions): Queue {
  const { today, trainingWeekdays, recentTechniqueIds } = options;

  const due = cards.filter((c) => c.dueDate <= today);
  const notDue = cards.filter((c) => c.dueDate > today);

  due.sort((a, b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return a.step - b.step;
  });

  const training = nextTrainingDate(today, trainingWeekdays);
  const daysUntilTraining = training === null ? null : diffDays(today, training);
  const isBoostWindow = daysUntilTraining !== null && daysUntilTraining > 0 && daysUntilTraining <= BOOST_WINDOW_DAYS;

  const boosted = isBoostWindow
    ? notDue
        .filter((c) => c.techniqueId !== undefined && recentTechniqueIds.includes(c.techniqueId))
        .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    : [];

  const combined = [...boosted, ...due];
  const cut = combined.slice(0, DAILY_LIMIT);

  return {
    cards: cut,
    boostedCount: cut.filter((c) => boosted.includes(c)).length,
    deferredCount: combined.length - cut.length,
  };
}

/** 큐를 다 도는 데 걸리는 대략의 시간(분). "12장"보다 "4분"이 착수 장벽을 낮춘다. */
export function estimateMinutes(cardCount: number): number {
  // 심상 카드 30초를 포함해 장당 평균 20초쯤으로 잡는다.
  return Math.max(1, Math.round((cardCount * 20) / 60));
}
