import { useLayoutEffect, useState } from 'react';

/**
 * 화면에서 쓰는 의미별 색. 모두 Astryx 토큰이며, 값은 테마가 정한다.
 *
 * - 토리·우케·합성 질량중심은 차트 계열 색(data-categorical)을 쓴다.
 *   3D 마커, 그래프 선, 기저면 지도, 수치 카드가 같은 색으로 사람을 구분한다.
 */
export const TOKENS = {
  tori: '--color-data-categorical-orange',
  uke: '--color-data-categorical-purple',
  pair: '--color-data-categorical-green',
  contact: '--color-warning',
  danger: '--color-error',
  reference: '--color-data-neutral',
  grid: '--color-border',
  band: '--color-background-muted',
  textSecondary: '--color-text-secondary',
  ink: '--color-text-primary',
  surface: '--color-background-surface',
  stage: '--color-background-body',
} as const;

export type TokenKey = keyof typeof TOKENS;

/** SVG·CSS 속성에 바로 넣는 값: `var(--color-…)` */
export const cssVar = (key: TokenKey) => `var(${TOKENS[key]})`;

/** 도복 색은 실제 도복(흰색·파란색)을 흉내 내는 3D 재질이라 UI 토큰이 아니다 */
export const GI_COLOR = { tori: '#f3f1ea', uke: '#2f63b5' } as const;

/**
 * three.js 재질은 CSS 변수를 읽지 못하므로, 토큰을 현재 테마·색 모드에서 계산된 실제 색으로 바꾼다.
 * 첫 렌더에는 아직 DOM이 없어 회색으로 시작하고, 마운트 직후 실제 값으로 바뀐다.
 */
export function useResolvedColors<K extends TokenKey>(keys: readonly K[]): Record<K, string> {
  const [colors, setColors] = useState(() => Object.fromEntries(keys.map((k) => [k, '#888888'])) as Record<K, string>);
  const signature = keys.join(',');
  useLayoutEffect(() => {
    const probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    const next = {} as Record<K, string>;
    for (const k of signature.split(',') as K[]) {
      probe.style.color = `var(${TOKENS[k]})`;
      next[k] = getComputedStyle(probe).color;
    }
    probe.remove();
    setColors(next);
  }, [signature]);
  return colors;
}
