import { useEffect, useRef, useState } from 'react';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { INTRO_SKIP_SECONDS, YOUTUBE_NOCOOKIE_HOST } from '../lib/youtube';
import { loadYouTubeIframeApi } from '../lib/youtube-player';
import { introSkipPreference, mutePreference } from '../lib/preferences';
import styles from './VideoEmbed.module.css';

interface VideoEmbedProps {
  videoId: string;
  title: string;
}

export default function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const [muted, setMuted] = useState(() => mutePreference.get());
  const [introSkip, setIntroSkip] = useState(() => introSkipPreference.get());

  // 공식 IFrame Player API로 플레이어를 만들어 준비 상태(onReady)를 확실히
  // 알고 나서 음소거·탐색·반복재생을 제어한다. postMessage를 직접 다루면
  // 플레이어가 아직 준비되기 전에 명령이 씹히는 경우가 있어 신뢰할 수 없었다.
  useEffect(() => {
    let cancelled = false;
    let player: YT.Player | null = null;
    let observer: IntersectionObserver | null = null;
    const wrap = wrapRef.current;

    // 한 페이지에 영상이 여러 개 있을 때 전부 동시에 재생되면 산만하고
    // 데이터도 낭비되므로, 화면에 보이는 영상만 재생하고 벗어나면 멈춘다.
    const observeVisibility = (target: YT.Player) => {
      if (!wrap) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) target.playVideo();
          else target.pauseVideo();
        },
        { threshold: 0.5 },
      );
      observer.observe(wrap);
    };

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      const startSeconds = introSkipPreference.get() ? INTRO_SKIP_SECONDS : 0;

      // YT.Player는 넘겨받은 노드를 iframe으로 "교체"해버린다. React가 관리하는
      // 노드를 그대로 넘기면 언마운트 때 React가 이미 사라진 노드를 지우려다
      // NotFoundError를 낸다. 그래서 React가 모르는 자식 노드를 직접 만들어 넘긴다.
      const host = document.createElement('div');
      containerRef.current.appendChild(host);

      player = new YT.Player(host, {
        videoId,
        host: YOUTUBE_NOCOOKIE_HOST,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          playsinline: 1,
          start: startSeconds,
        },
        events: {
          onReady: (event) => {
            if (mutePreference.get()) {
              event.target.mute();
            } else {
              event.target.unMute();
            }
            // playerVars.start만 믿으면 방금 로드돼 아직 버퍼링이 안 된 상태라
            // 자동재생과 경합해 씹히는 경우가 있어, seekTo로 한 번 더 확정한다.
            if (startSeconds > 0) {
              event.target.seekTo(startSeconds, true);
            }
            observeVisibility(event.target);
          },
          onStateChange: (event) => {
            // 반복재생: 끝나면 준비 동작을 건너뛰는 설정을 그대로 반영해 다시 시작한다.
            if (event.data === YT.PlayerState.ENDED) {
              const restartAt = introSkipPreference.get() ? INTRO_SKIP_SECONDS : 0;
              event.target.seekTo(restartAt, true);
              event.target.playVideo();
            }
          },
          // 소리 켜기를 기억해둔 상태로 새 영상을 열면, 브라우저가 소리 있는
          // 자동재생 자체를 막아버려 영상이 멈춰있는 경우가 있다. 그럴 땐
          // 무음으로라도 자동재생되도록 즉시 폴백하고 버튼 상태도 맞춘다.
          onAutoplayBlocked: (event) => {
            event.target.mute();
            event.target.playVideo();
            setMuted(true);
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      try {
        player?.destroy();
      } catch {
        // 이미 DOM에서 사라진 뒤라면 destroy가 실패할 수 있는데, 어차피 정리 중이라 무시해도 된다.
      }
      playerRef.current = null;
    };
  }, [videoId]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutePreference.set(next);
    if (next) playerRef.current?.mute();
    else playerRef.current?.unMute();
  };

  const toggleIntroSkip = () => {
    const next = !introSkip;
    setIntroSkip(next);
    introSkipPreference.set(next);
    playerRef.current?.seekTo(next ? INTRO_SKIP_SECONDS : 0, true);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.videoWrap}>
        <div ref={containerRef} title={title} className={styles.video} />
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={introSkip ? `${styles.chip} ${styles.chipActive}` : styles.chip}
          onClick={toggleIntroSkip}
          title="인트로(준비 동작) 건너뛰기"
          aria-label={introSkip ? '인트로 건너뛰기 켜짐' : '인트로 건너뛰기 꺼짐'}
          aria-pressed={introSkip}
        >
          <SkipForward size={14} />
          인트로 건너뛰기
        </button>
        <button
          type="button"
          className={muted ? styles.chip : `${styles.chip} ${styles.chipActive}`}
          onClick={toggleMute}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          aria-pressed={!muted}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          소리
        </button>
      </div>
    </div>
  );
}
