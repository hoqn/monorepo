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

    loadYouTubeIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;

      const startSeconds = introSkipPreference.get() ? INTRO_SKIP_SECONDS : 0;

      player = new YT.Player(containerRef.current, {
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
            event.target.playVideo();
          },
          onStateChange: (event) => {
            // 반복재생: 끝나면 준비 동작을 건너뛰는 설정을 그대로 반영해 다시 시작한다.
            if (event.data === YT.PlayerState.ENDED) {
              const restartAt = introSkipPreference.get() ? INTRO_SKIP_SECONDS : 0;
              event.target.seekTo(restartAt, true);
              event.target.playVideo();
            }
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      player?.destroy();
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
    <div className={styles.videoWrap}>
      <div ref={containerRef} title={title} className={styles.video} />
      <div className={styles.controls}>
        <button
          type="button"
          className={introSkip ? `${styles.controlButton} ${styles.controlButtonActive}` : styles.controlButton}
          onClick={toggleIntroSkip}
          title="인트로(준비 동작) 건너뛰기"
          aria-label={introSkip ? '인트로 건너뛰기 켜짐' : '인트로 건너뛰기 꺼짐'}
          aria-pressed={introSkip}
        >
          <SkipForward size={16} />
          인트로 건너뛰기
        </button>
        <button
          type="button"
          className={muted ? styles.controlButton : `${styles.controlButton} ${styles.controlButtonActive}`}
          onClick={toggleMute}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          aria-pressed={!muted}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          소리
        </button>
      </div>
    </div>
  );
}
