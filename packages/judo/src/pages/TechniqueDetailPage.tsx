import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TECHNIQUES } from '../data/techniques';
import { TECHNIQUE_CATEGORY_LABEL } from '../types/technique';
import VideoEmbed from '../components/VideoEmbed';
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
        <ChevronLeft size={16} />
        기술 도감으로
      </Link>

      <VideoEmbed videoId={technique.videoId} title={`${technique.japaneseName} / ${technique.romaji} 시연 영상`} />

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
          <span className={styles.navLabel}>
            <ChevronLeft size={14} />
            이전 기술
          </span>
          <span className={styles.navName}>{prev.koreanName ?? prev.romaji}</span>
        </Link>
        <Link to={`/techniques/${next.id}`} className={`${styles.navItem} ${styles.navItemRight}`}>
          <span className={styles.navLabel}>
            다음 기술
            <ChevronRight size={14} />
          </span>
          <span className={styles.navName}>{next.koreanName ?? next.romaji}</span>
        </Link>
      </div>
    </div>
  );
}
