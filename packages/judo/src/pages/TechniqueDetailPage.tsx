import { Link, Navigate, useParams } from 'react-router-dom';
import { TECHNIQUES } from '../data/techniques';
import { TECHNIQUE_CATEGORY_LABEL } from '../types/technique';
import { buildEmbedUrl, INTRO_SKIP_SECONDS } from '../lib/youtube';
import styles from './TechniqueDetailPage.module.css';

export default function TechniqueDetailPage() {
  const { id } = useParams();
  const index = TECHNIQUES.findIndex((t) => t.id === id);

  if (index === -1) {
    return <Navigate to="/techniques" replace />;
  }

  const technique = TECHNIQUES[index];
  const prev = TECHNIQUES[(index - 1 + TECHNIQUES.length) % TECHNIQUES.length];
  const next = TECHNIQUES[(index + 1) % TECHNIQUES.length];

  return (
    <div className={styles.page}>
      <Link to="/techniques" className={styles.back}>
        ← 기술 도감으로
      </Link>

      <div className={styles.videoWrap}>
        <iframe
          key={technique.id}
          src={buildEmbedUrl(technique.videoId, {
            autoplay: true,
            hideControls: true,
            startSeconds: INTRO_SKIP_SECONDS,
          })}
          title={`${technique.japaneseName} / ${technique.romaji} 시연 영상`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className={styles.video}
        />
      </div>
      <p className={styles.autoplayHint}>영상은 무음으로 자동재생돼요.</p>

      <div className={styles.header}>
        <span className={styles.category}>{TECHNIQUE_CATEGORY_LABEL[technique.category]}</span>
        <h1 className={styles.title}>{technique.koreanName ?? technique.romaji}</h1>
        <p className={styles.origin}>
          {technique.japaneseName} · {technique.romaji} · {technique.englishName}
        </p>
      </div>

      <p className={styles.description}>{technique.description}</p>

      <div className={styles.nav}>
        <Link to={`/techniques/${prev.id}`} className={styles.navItem}>
          <span className={styles.navLabel}>← 이전 기술</span>
          <span className={styles.navName}>{prev.koreanName ?? prev.romaji}</span>
        </Link>
        <Link to={`/techniques/${next.id}`} className={`${styles.navItem} ${styles.navItemRight}`}>
          <span className={styles.navLabel}>다음 기술 →</span>
          <span className={styles.navName}>{next.koreanName ?? next.romaji}</span>
        </Link>
      </div>
    </div>
  );
}
