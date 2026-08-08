import { Link } from 'react-router-dom';
import type { Technique } from '../types/technique';
import { TECHNIQUE_CATEGORY_LABEL } from '../types/technique';
import styles from './TechniqueCard.module.css';

export default function TechniqueCard({ technique }: { technique: Technique }) {
  return (
    <Link to={`/techniques/${technique.id}`} className={styles.card}>
      <div className={styles.thumbWrap}>
        <img
          className={styles.thumb}
          src={`https://i.ytimg.com/vi/${technique.videoId}/hqdefault.jpg`}
          alt={`${technique.japaneseName} 시연 영상 썸네일`}
          loading="lazy"
        />
        <span className={styles.playBadge} aria-hidden>
          ▶
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
    </Link>
  );
}
