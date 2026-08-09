const STORAGE_KEY = 'judo:video-muted';

// 기본값은 무음 — 브라우저 자동재생 정책상 무음 자동재생만 안정적으로 통과한다.
// 사용자가 한 번이라도 소리를 켜면 다음 영상부터도 이어서 소리가 나오도록 기억한다.
export function getMutePreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setMutePreference(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch {
    // 프라이빗 브라우징 등으로 localStorage를 쓸 수 없어도 앱 동작에는 지장이 없다.
  }
}
