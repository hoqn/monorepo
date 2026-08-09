// 인사·그립 등 준비 동작 구간을 대략적으로 건너뛰기 위한 공통 시작 지점(초).
// 영상마다 정확한 길이가 달라 완벽하지는 않지만, 대부분의 클립에서 기술
// 동작이 바로 보이도록 하는 무난한 값이다.
export const INTRO_SKIP_SECONDS = 2;

interface EmbedOptions {
  autoplay?: boolean;
  /** 하단 컨트롤바를 숨긴다. YouTube IFrame Player가 공식으로 지원하는 파라미터로,
   * 커스텀 UI를 얹어 쓰라고 제공되는 기능이라 숨겨도 임베드 이용약관에 어긋나지 않는다. */
  hideControls?: boolean;
  /** 인사·그립 등 준비 동작을 건너뛰고 기술이 바로 보이도록 시작 지점(초)을 조정한다. */
  startSeconds?: number;
}

// 무음 자동재생만 대부분의 브라우저 자동재생 정책을 통과하므로 mute=1을 함께 전달한다.
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
  }
  if (startSeconds > 0) {
    params.set('start', String(startSeconds));
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
