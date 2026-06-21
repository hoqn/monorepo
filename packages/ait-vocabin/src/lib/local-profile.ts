/**
 * 서버 없이 localStorage에 유저 프로필과 진행 상황을 저장하는 모듈.
 */

const PROFILE_KEY = 'vocabin_profile';

export interface LocalProfile {
  displayName: string | null;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  dailyGoal: number;
  notifyTime: string | null;
  totalXp: number;
  currentStreak: number;
  maxStreak: number;
  lastActiveDate: string | null; // ISO date 'YYYY-MM-DD'
  sessionsToday: number;
  lastSessionDate: string | null;
}

const DEFAULT_PROFILE: LocalProfile = {
  displayName: null,
  cefrLevel: 'A1',
  dailyGoal: 1,
  notifyTime: null,
  totalXp: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastActiveDate: null,
  sessionsToday: 0,
  lastSessionDate: null,
};

export function getProfile(): LocalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: LocalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function updateProfile(patch: Partial<LocalProfile>): LocalProfile {
  const profile = { ...getProfile(), ...patch };
  saveProfile(profile);
  return profile;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 세션 완료 후 XP, 스트릭 등을 업데이트한다.
 */
export function recordSessionComplete(xpEarned: number): LocalProfile {
  const profile = getProfile();
  const today = todayStr();

  let { currentStreak, maxStreak, sessionsToday, lastSessionDate, lastActiveDate } = profile;

  // 세션 수 (오늘)
  if (lastSessionDate !== today) {
    sessionsToday = 0;
  }
  sessionsToday += 1;
  lastSessionDate = today;

  // 스트릭 계산
  if (lastActiveDate === null) {
    currentStreak = 1;
  } else {
    const last = new Date(lastActiveDate);
    const todayDate = new Date(today);
    const diffDays = Math.round((todayDate.getTime() - last.getTime()) / 86400000);
    if (diffDays === 0) {
      // 오늘 이미 활동 — 스트릭 유지
    } else if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentStreak);

  return updateProfile({
    totalXp: profile.totalXp + xpEarned,
    currentStreak,
    maxStreak,
    lastActiveDate: today,
    sessionsToday,
    lastSessionDate,
  });
}
