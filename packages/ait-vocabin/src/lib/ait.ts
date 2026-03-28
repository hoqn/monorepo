import { getAppsInTossGlobals } from '@apps-in-toss/web-framework';

/**
 * 현재 앱인토스(Toss 앱 WebView) 환경에서 실행 중인지 여부.
 * AIT 환경: true → 시스템 NavigationBar가 존재하므로 커스텀 헤더를 숨겨요.
 * 독립 실행: false → 커스텀 헤더가 대신 동작해요.
 */
export const isAIT: boolean = (() => {
  try {
    return !!getAppsInTossGlobals().deploymentId;
  } catch {
    return false;
  }
})();
