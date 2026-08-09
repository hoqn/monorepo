// YouTube IFrame Player API 로더. postMessage를 직접 손으로 다루는 대신
// 공식 JS API(YT.Player)를 써야 준비 상태(onReady)를 확실히 알 수 있어
// 음소거·탐색(seekTo)·반복재생 같은 제어가 안정적으로 먹힌다.
let apiPromise: Promise<typeof YT> | null = null;

export function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}
