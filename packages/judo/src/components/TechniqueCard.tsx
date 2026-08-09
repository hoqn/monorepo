import { Play } from 'lucide-react';
import type { Technique } from '../types/technique';
import { TECHNIQUE_CATEGORY_LABEL } from '../types/technique';
import { techniqueMediaTransitionName } from '../lib/view-transition-names';
import TransitionLink from './TransitionLink';
import styles from './TechniqueCard.module.css';

export default function TechniqueCard({ technique }: { technique: Technique }) {
  return (
    <TransitionLink to={`/techniques/${technique.id}`} className={styles.card}>
      <div className={styles.thumbWrap}>
        <img
          className={styles.thumb}
          src={`https://i.ytimg.com/vi/${technique.videoId}/hqdefault.jpg`}
          alt={`${technique.japaneseName} 시연 영상 썸네일`}
          loading="lazy"
          style={{ viewTransitionName: techniqueMediaTransitionName(technique.id) }}
        />
        <span className={styles.playBadge} aria-hidden>
          <Play size={12} fill="currentColor" />
        </span>
        {technique.isCore && <span className={styles.coreBadge}>필수</span>}
      </div>
      <div className={styles.body}>
        <p className={styles.category}>{TECHNIQUE_CATEGORY_LABEL[technique.category]}</p>
        <h3 className={styles.name}>{technique.koreanName ?? technique.romaji}</h3>
        <p className={styles.sub}>
          {technique.japaneseName} · {technique.romaji}
        </p>
      </div>
    </TransitionLink>
  );
}
