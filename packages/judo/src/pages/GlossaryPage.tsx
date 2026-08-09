import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TERMS } from '../data/terms';
import { TERM_CATEGORY_LABEL, type TermCategory } from '../types/glossary';
import styles from './GlossaryPage.module.css';

const CATEGORIES = Object.keys(TERM_CATEGORY_LABEL) as TermCategory[];

export default function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<TermCategory | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TERMS.filter((term) => {
      const matchesCategory = activeCategory === 'all' || term.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        term.term.toLowerCase().includes(q) ||
        term.romaji?.toLowerCase().includes(q) ||
        term.japanese?.includes(q) ||
        term.shortDefinition.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>용어집</h1>
        <p>도장에서 자주 듣지만 낯선 유도 용어를 카테고리별로 정리했습니다.</p>
      </div>

      <input
        className={styles.search}
        placeholder="용어 검색 (예: 낙법, 한판, obi...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className={styles.chips}>
        <button
          className={activeCategory === 'all' ? `${styles.chip} ${styles.chipActive}` : styles.chip}
          onClick={() => setActiveCategory('all')}
        >
          전체
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            onClick={() => setActiveCategory(cat)}
          >
            {TERM_CATEGORY_LABEL[cat]}
          </button>
        ))}
      </div>

      <p className={styles.count}>{filtered.length}개 용어</p>

      <ul className={styles.list}>
        {filtered.map((term) => {
          const isOpen = openId === term.id;
          return (
            <li key={term.id} className={styles.item}>
              <button className={styles.itemHead} onClick={() => setOpenId(isOpen ? null : term.id)}>
                <div>
                  <span className={styles.itemCategory}>{TERM_CATEGORY_LABEL[term.category]}</span>
                  <h3 className={styles.itemTerm}>{term.term}</h3>
                  {(term.japanese || term.romaji) && (
                    <p className={styles.itemOrigin}>
                      {term.japanese}
                      {term.japanese && term.romaji ? ' · ' : ''}
                      {term.romaji}
                    </p>
                  )}
                </div>
                <span className={styles.chevron} data-open={isOpen}>
                  <ChevronDown size={18} />
                </span>
              </button>
              <p className={styles.shortDef}>{term.shortDefinition}</p>
              {isOpen && <p className={styles.longDef}>{term.longDefinition}</p>}
            </li>
          );
        })}
        {filtered.length === 0 && <li className={styles.empty}>검색 결과가 없습니다.</li>}
      </ul>
    </div>
  );
}
