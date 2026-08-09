// 인사·그립 등 준비 동작 구간을 대략적으로 건너뛰기 위한 공통 시작 지점(초).
// 영상마다 정확한 길이가 달라 완벽하지는 않지만, 대부분의 클립에서 기술
// 동작이 바로 보이도록 하는 무난한 값이다.
export const INTRO_SKIP_SECONDS = 2;

export const YOUTUBE_EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

interface EmbedOptions {
  autoplay?: boolean;
  /** 하단 컨트롤바를 숨긴다. YouTube IFrame Player가 공식으로 지원하는 파라미터로,
   * 커스텀 UI를 얹어 쓰라고 제공되는 기능이라 숨겨도 임베드 이용약관에 어긋나지 않는다. */
  hideControls?: boolean;
  /** 인사·그립 등 준비 동작을 건너뛰고 기술이 바로 보이도록 시작 지점(초)을 조정한다. */
  startSeconds?: number;
}

// 무음 자동재생만 대부분의 브라우저 자동재생 정책을 통과하므로 mute=1을 함께 전달한다.
// 컨트롤을 숨기는 경우 postMessage로 소리를 켜고 끌 수 있도록 enablejsapi를 함께 켠다.
export function buildEmbedUrl(
  videoId: string,
  { autoplay = false, hideControls = false, startSeconds = 0 }: EmbedOptions = {},
) {
  const params = new URLSearchParams({ rel: '0' });
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }
  if (hideControls) {
    params.set('controls', '0');
    params.set('disablekb', '1');
    params.set('fs', '0');
    params.set('enablejsapi', '1');
    params.set('origin', window.location.origin);
  }
  if (startSeconds > 0) {
    params.set('start', String(startSeconds));
  }
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${videoId}?${params.toString()}`;
}

// YouTube IFrame Player postMessage API. enablejsapi=1로 임베드된 플레이어에
// 재생/음소거 등을 명령한다. 공식 문서화된 메시지 포맷을 그대로 사용하므로
// 별도의 iframe_api 스크립트 로딩 없이도 동작한다.
export function postPlayerCommand(iframe: HTMLIFrameElement | null, func: 'mute' | 'unMute') {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), YOUTUBE_EMBED_ORIGIN);
}
