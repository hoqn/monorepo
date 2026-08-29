/** 날짜는 전부 로컬 기준 'YYYY-MM-DD' 문자열로 다룬다. 시각은 쓸 일이 없다. */
export type DateString = string;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateString(d: Date): DateString {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDate(date: DateString): Date {
  const [y, m, d] = date.split('-').map(Number);
  // 로컬 자정으로 고정. UTC로 파싱하면 시간대에 따라 하루가 밀린다.
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): DateString {
  return toDateString(new Date());
}

export function addDays(date: DateString, days: number): DateString {
  const d = toDate(date);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

/** b - a 를 일 단위로. 문자열 비교가 아니라 실제 날짜 차이가 필요할 때 쓴다. */
export function diffDays(a: DateString, b: DateString): number {
  const ms = toDate(b).getTime() - toDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0=일 … 6=토 */
export function weekdayOf(date: DateString): number {
  return toDate(date).getDay();
}

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABEL[weekday] ?? '';
}

/** "8월 27일 (화)" — 화면에 그대로 쓰는 표기 */
export function formatKoreanDate(date: DateString): string {
  const d = toDate(date);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdayLabel(d.getDay())})`;
}

/** "오늘" / "어제" / "3일 전" — 목록에서 상대 시점을 빠르게 읽히게 한다. */
export function formatRelativeDate(date: DateString, today: DateString): string {
  const gap = diffDays(date, today);
  if (gap === 0) return '오늘';
  if (gap === 1) return '어제';
  if (gap > 1) return `${gap}일 전`;
  if (gap === -1) return '내일';
  return `${-gap}일 후`;
}

/**
 * 등록된 수련 요일 중 가장 가까운 다음 수련일. 오늘이 수련일이면 오늘을 돌려준다.
 * 요일이 하나도 등록돼 있지 않으면 null.
 */
export function nextTrainingDate(from: DateString, weekdays: number[]): DateString | null {
  if (weekdays.length === 0) return null;
  for (let i = 0; i < 7; i += 1) {
    const candidate = addDays(from, i);
    if (weekdays.includes(weekdayOf(candidate))) return candidate;
  }
  return null;
}
