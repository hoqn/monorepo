import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { buildEmbedUrl, INTRO_SKIP_SECONDS, postPlayerCommand } from '../lib/youtube';
import { getMutePreference, setMutePreference } from '../lib/mute-preference';
import styles from './VideoEmbed.module.css';

interface VideoEmbedProps {
  videoId: string;
  title: string;
}

export default function VideoEmbed({ videoId, title }: VideoEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);

  // 영상이 바뀌면 iframe이 통째로 새로 로드되어 무음(mute=1)으로 다시 시작하므로,
  // 로드가 끝나는 시점에 이전에 소리를 켜둔 적이 있다면 이어서 소리를 켠다.
  useEffect(() => {
    setMuted(true);
  }, [videoId]);

  const handleLoad = () => {
    if (!getMutePreference()) {
      postPlayerCommand(iframeRef.current, 'unMute');
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    postPlayerCommand(iframeRef.current, next ? 'unMute' : 'mute');
    setMuted(next);
    setMutePreference(next);
  };

  return (
    <div className={styles.videoWrap}>
      <iframe
        ref={iframeRef}
        key={videoId}
        src={buildEmbedUrl(videoId, { autoplay: true, hideControls: true, startSeconds: INTRO_SKIP_SECONDS })}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={styles.video}
        onLoad={handleLoad}
      />
      <button
        type="button"
        className={styles.muteButton}
        onClick={toggleMute}
        aria-label={muted ? '소리 켜기' : '소리 끄기'}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}
