// localStorage에 저장하는 단순 불리언 설정값들. 프라이빗 브라우징 등으로
// localStorage를 쓸 수 없어도 기본값으로 조용히 폴백해 앱 동작에는 지장이 없다.
function createBooleanPreference(key: string, defaultValue: boolean) {
  return {
    get(): boolean {
      try {
        const stored = localStorage.getItem(key);
        return stored === null ? defaultValue : stored === 'true';
      } catch {
        return defaultValue;
      }
    },
    set(value: boolean) {
      try {
        localStorage.setItem(key, String(value));
      } catch {
        // no-op
      }
    },
  };
}

// 기본값은 무음 — 브라우저 자동재생 정책상 무음 자동재생만 안정적으로 통과한다.
// 사용자가 한 번이라도 소리를 켜면 다음 영상부터도 이어서 소리가 나오도록 기억한다.
export const mutePreference = createBooleanPreference('judo:video-muted', true);

// 인사·그립 등 준비 동작 구간을 건너뛸지 여부. 기본값은 켜짐이다.
export const introSkipPreference = createBooleanPreference('judo:intro-skip-enabled', true);
