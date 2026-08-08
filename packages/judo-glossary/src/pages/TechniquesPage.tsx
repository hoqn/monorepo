import { useMemo, useState } from 'react';
import TechniqueCard from '../components/TechniqueCard';
import { TECHNIQUES } from '../data/techniques';
import { TECHNIQUE_CATEGORY_DESC, TECHNIQUE_CATEGORY_LABEL, type TechniqueCategory } from '../types/technique';
import styles from './TechniquesPage.module.css';

const CATEGORIES = Object.keys(TECHNIQUE_CATEGORY_LABEL) as TechniqueCategory[];

export default function TechniquesPage() {
  const [activeCategory, setActiveCategory] = useState<TechniqueCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return TECHNIQUES;
    return TECHNIQUES.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>기술 도감</h1>
        <p>KODOKAN × IJF ACADEMY 공식 영상으로 정리한 유도 대표 기술입니다. 카드를 눌러 영상과 설명을 확인하세요.</p>
      </div>

      <div className={styles.chips}>
        <button
          className={activeCategory === 'all' ? `${styles.chip} ${styles.chipActive}` : styles.chip}
          onClick={() => setActiveCategory('all')}
        >
          전체 {TECHNIQUES.length}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            onClick={() => setActiveCategory(cat)}
          >
            {TECHNIQUE_CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      {activeCategory !== 'all' && <p className={styles.categoryDesc}>{TECHNIQUE_CATEGORY_DESC[activeCategory]}</p>}

      <div className={styles.grid}>
        {filtered.map((technique) => (
          <TechniqueCard key={technique.id} technique={technique} />
        ))}
      </div>
    </div>
  );
}
