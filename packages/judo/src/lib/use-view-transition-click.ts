import type { MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, type To } from 'react-router-dom';

// react-router-dom의 <Link viewTransition>은 데이터 라우터(RouterProvider)
// 모드에서만 동작해, 그걸 쓰려면 번들을 키우는 데이터 라우터 전체를
// 들여야 한다. 대신 네이티브 View Transitions API를 클릭 핸들러에서
// 직접 호출해 선언적 <HashRouter> 그대로 가볍게 구현한다.
export function useViewTransitionClick(to: To, userOnClick?: (event: MouseEvent<HTMLAnchorElement>) => void) {
  const navigate = useNavigate();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    userOnClick?.(event);
    if (event.defaultPrevented) return;
    // 새 탭으로 열기, 수정 클릭 등은 브라우저 기본 동작에 맡긴다.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (typeof document.startViewTransition !== 'function') return;

    event.preventDefault();
    document.startViewTransition(() => {
      flushSync(() => {
        navigate(to);
      });
    });
  };
}
