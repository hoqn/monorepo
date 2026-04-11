import { useEffect } from 'react';
import { graniteEvent } from '@apps-in-toss/web-framework';
import { isAIT } from '../lib/ait';

/**
 * AIT 환경의 시스템 뒤로가기 버튼 이벤트를 처리합니다.
 * 독립 실행 환경에서는 동작하지 않으며, 커스텀 헤더의 뒤로가기 버튼이 대신 동작합니다.
 */
export function useAITBackHandler(handler: () => void) {
  useEffect(() => {
    if (!isAIT) {
      return;
    }
    const cleanup = graniteEvent.addEventListener('backEvent', {
      onEvent: handler,
    });
    return cleanup;
  }, [handler]);
}
