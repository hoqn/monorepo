import { Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react';
import { TECHNIQUES } from '../data/techniques';
import { TECHNIQUE_CATEGORY_LABEL } from '../types/technique';
import VideoEmbed from '../components/VideoEmbed';
import TransitionLink from '../components/TransitionLink';
import { techniqueMediaTransitionName } from '../lib/view-transition-names';
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
      <TransitionLink to="/techniques" className={styles.back}>
        <ChevronLeft size={16} />
        기술 도감으로
      </TransitionLink>

      <div style={{ viewTransitionName: techniqueMediaTransitionName(technique.id) }}>
        <VideoEmbed videoId={technique.videoId} title={`${technique.japaneseName} / ${technique.romaji} 시연 영상`} />
      </div>

      <div className={styles.header}>
        <span className={styles.category}>{TECHNIQUE_CATEGORY_LABEL[technique.category]}</span>
        <h1 className={styles.title}>{technique.koreanName}</h1>
        <p className={styles.origin}>
          {technique.japaneseName} · {technique.romaji} · {technique.englishName}
        </p>
      </div>

      <p className={styles.description}>{technique.description}</p>

      {technique.category === 'kansetsu-waza' && (
        <p className={styles.warning}>
          <TriangleAlert size={16} className={styles.warningIcon} />
          {technique.isForbidden
            ? '현재 시합에서 금지된 기술입니다. 눈으로만 익히고 절대 따라 하지 마세요.'
            : '관절을 다치기 쉬운 기술입니다. 반드시 지도자의 지도 아래에서만 연습하세요.'}
        </p>
      )}

      {technique.escapeVideoId && (
        <section className={styles.escape}>
          <h2 className={styles.escapeTitle}>이 누르기에서 빠져나오려면</h2>
          <p className={styles.escapeDesc}>눌린 쪽에서 어떻게 탈출하는지 보여주는 영상입니다.</p>
          <VideoEmbed
            videoId={technique.escapeVideoId}
            title={`${technique.japaneseName} 탈출법 영상`}
          />
        </section>
      )}

      <div className={styles.nav}>
        <TransitionLink to={`/techniques/${prev.id}`} className={styles.navItem}>
          <span className={styles.navLabel}>
            <ChevronLeft size={14} />
            이전 기술
          </span>
          <span className={styles.navName}>{prev.koreanName}</span>
        </TransitionLink>
        <TransitionLink to={`/techniques/${next.id}`} className={`${styles.navItem} ${styles.navItemRight}`}>
          <span className={styles.navLabel}>
            다음 기술
            <ChevronRight size={14} />
          </span>
          <span className={styles.navName}>{next.koreanName}</span>
        </TransitionLink>
      </div>
    </div>
  );
}
