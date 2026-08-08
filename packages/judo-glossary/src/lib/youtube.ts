// 무음 자동재생만 대부분의 브라우저 자동재생 정책을 통과하므로 mute=1을 함께 전달한다.
export function buildEmbedUrl(videoId: string, { autoplay = false }: { autoplay?: boolean } = {}) {
  const params = new URLSearchParams({ rel: '0' });
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
