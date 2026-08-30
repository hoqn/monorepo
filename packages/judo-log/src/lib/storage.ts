import type { AppState } from '../types';
import { createSeedCards } from '../data/seed-cards';
import { addDays, todayISO } from './date';

const STORAGE_KEY = 'judo-log:state:v1';

/**
 * 기록은 전부 이 브라우저 localStorage에만 남는다 (기획서 10장 v1 범위: 로그인·서버 없음).
 * 프라이빗 브라우징 등으로 접근이 막혀도 앱이 죽지 않도록, 읽기는 초기 상태로
 * 쓰기는 무시로 조용히 폴백한다. 그 경우 앱은 그 세션 동안만 정상 동작한다.
 */
export function createInitialState(today = todayISO()): AppState {
  return {
    cards: createSeedCards(today, addDays),
    sessions: [],
    notes: {},
    reps: {},
    reviewLog: [],
    settings: { trainingWeekdays: [] },
    reviewProgress: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 저장된 JSON은 예전 버전의 앱이 썼거나 사용자가 직접 건드렸을 수 있어 신뢰하지 않는다.
 * 최상위 키 단위로 형태를 확인하고, 어긋나면 그 키만 초기값으로 되돌린다.
 */
function reconcile(raw: unknown, fallback: AppState): AppState {
  if (!isRecord(raw)) return fallback;

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const weekdays = Array.isArray(settings.trainingWeekdays)
    ? settings.trainingWeekdays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
    : [];

  return {
    cards: Array.isArray(raw.cards) ? (raw.cards as AppState['cards']) : fallback.cards,
    sessions: Array.isArray(raw.sessions) ? (raw.sessions as AppState['sessions']) : fallback.sessions,
    notes: isRecord(raw.notes) ? (raw.notes as AppState['notes']) : fallback.notes,
    reps: isRecord(raw.reps) ? (raw.reps as AppState['reps']) : fallback.reps,
    reviewLog: Array.isArray(raw.reviewLog) ? (raw.reviewLog as AppState['reviewLog']) : fallback.reviewLog,
    settings: { trainingWeekdays: weekdays },
    reviewProgress: isRecord(raw.reviewProgress) ? (raw.reviewProgress as unknown as AppState['reviewProgress']) : null,
  };
}

export function loadState(): AppState {
  const fallback = createInitialState();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return fallback;
    return reconcile(JSON.parse(stored), fallback);
  } catch {
    return fallback;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 공간이 없거나 접근이 막힌 경우 — 화면의 상태는 그대로 두고 넘어간다.
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

let counter = 0;

export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}
