import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { ARTICLE_PATTERNS, PLURAL_PATTERNS, VERB_PATTERNS, ArticlePattern, PluralPattern, VerbPattern } from '../data/grammar-patterns.ts';
import styles from './PatternPage.module.css';

type Category = 'article' | 'plural' | 'verb';

const CATEGORY_LABELS: Record<Category, string> = {
  article: '관사 규칙',
  plural: '복수형 패턴',
  verb: '동사 변화',
};

const ARTICLE_ICON: Record<string, string> = { der: '🔵', die: '🔴', das: '🟢' };

type AnyPattern = ArticlePattern | PluralPattern | VerbPattern;

function getPatternId(p: AnyPattern, i: number): string {
  if ('id' in p) return p.id;
  return `article-${i}`;
}

function getPatternDetail(p: AnyPattern): { title: string; rule: string; examples: string } {
  if ('suffixes' in p) {
    return {
      title: p.suffixes.map((s) => `~${s}`).join(' / ') + ` → ${p.article}`,
      rule: p.rule,
      examples: p.examples,
    };
  }
  return { title: p.name, rule: p.rule, examples: p.examples };
}

export function PatternPage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [activeCategory, setActiveCategory] = useState<Category>('article');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  // 카테고리 전환 시 확장 닫기
  const handleCategoryChange = (cat: Category) => {
    setActiveCategory(cat);
    setExpandedId(null);
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="뒤로">
          ‹
        </button>
        <span className={styles.headerTitle}>패턴 도감</span>
        <span className={styles.headerSub}>
          {ARTICLE_PATTERNS.length + PLURAL_PATTERNS.length + VERB_PATTERNS.length}개 패턴
        </span>
      </header>

      {/* 카테고리 탭 */}
      <div className={styles.categoryTabs}>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            className={`${styles.categoryTab} ${activeCategory === cat ? styles.categoryTabActive : ''}`}
            onClick={() => handleCategoryChange(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 패턴 리스트 */}
      <div className={styles.listArea}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className={styles.patternList}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
          >
            {activeCategory === 'article' && ARTICLE_PATTERNS.map((p, i) => {
              const id = getPatternId(p, i);
              return (
                <motion.div key={id} variants={itemVariants}>
                  <PatternItem
                    id={id}
                    pattern={p}
                    expanded={expandedId === id}
                    onToggle={toggle}
                    renderCard={(onClick, expanded) => (
                      <ArticlePatternCard pattern={p} onClick={onClick} expanded={expanded} />
                    )}
                  />
                </motion.div>
              );
            })}
            {activeCategory === 'plural' && PLURAL_PATTERNS.map((p) => {
              const id = getPatternId(p, 0);
              return (
                <motion.div key={id} variants={itemVariants}>
                  <PatternItem
                    id={id}
                    pattern={p}
                    expanded={expandedId === id}
                    onToggle={toggle}
                    renderCard={(onClick, expanded) => (
                      <PluralPatternCard pattern={p} onClick={onClick} expanded={expanded} />
                    )}
                  />
                </motion.div>
              );
            })}
            {activeCategory === 'verb' && VERB_PATTERNS.map((p) => {
              const id = getPatternId(p, 0);
              return (
                <motion.div key={id} variants={itemVariants}>
                  <PatternItem
                    id={id}
                    pattern={p}
                    expanded={expandedId === id}
                    onToggle={toggle}
                    renderCard={(onClick, expanded) => (
                      <VerbPatternCard pattern={p} onClick={onClick} expanded={expanded} />
                    )}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── 패턴 아이템 (카드 + 인라인 확장) ── */
interface PatternItemProps {
  id: string;
  pattern: AnyPattern;
  expanded: boolean;
  onToggle: (id: string) => void;
  renderCard: (onClick: () => void, expanded: boolean) => React.ReactNode;
}

function PatternItem({ id, pattern, expanded, onToggle, renderCard }: PatternItemProps) {
  const { title, rule, examples } = getPatternDetail(pattern);

  return (
    <div className={styles.patternItem}>
      {renderCard(() => onToggle(id), expanded)}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={styles.patternDetail}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
          >
            <div className={styles.patternDetailInner}>
              <p className={styles.detailTitle}>{title}</p>

              <div className={styles.detailSection}>
                <span className={styles.detailSectionLabel}>규칙</span>
                <p className={styles.detailRule}>{rule}</p>
              </div>

              <div className={styles.detailSection}>
                <span className={styles.detailSectionLabel}>예시</span>
                <div className={styles.detailExamples}>
                  {examples.split(',').map((ex, i) => (
                    <span key={i} className={styles.detailExampleChip}>{ex.trim()}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 관사 패턴 카드 ── */
function ArticlePatternCard({ pattern, onClick, expanded }: { pattern: ArticlePattern; onClick: () => void; expanded: boolean }) {
  return (
    <motion.button className={`${styles.patternCard} ${expanded ? styles.patternCardExpanded : ''}`} onClick={onClick} whileTap={{ scale: 0.97 }}>
      <div className={styles.patternCardLeft}>
        <span className={styles.patternArticleIcon}>{ARTICLE_ICON[pattern.article]}</span>
        <div className={styles.patternCardBody}>
          <span className={styles.patternCardTitle}>
            {pattern.suffixes.map((s) => `~${s}`).join(' / ')}
          </span>
          <span className={styles.patternCardDesc}>{pattern.article} (
            {pattern.article === 'der' ? '남성' : pattern.article === 'die' ? '여성' : '중성'}
          )</span>
        </div>
      </div>
      <motion.span
        className={styles.patternCardChevron}
        animate={{ rotate: expanded ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >›</motion.span>
    </motion.button>
  );
}

/* ── 복수형 패턴 카드 ── */
function PluralPatternCard({ pattern, onClick, expanded }: { pattern: PluralPattern; onClick: () => void; expanded: boolean }) {
  return (
    <motion.button className={`${styles.patternCard} ${expanded ? styles.patternCardExpanded : ''}`} onClick={onClick} whileTap={{ scale: 0.97 }}>
      <div className={styles.patternCardLeft}>
        <span className={styles.patternPluralIcon}>📝</span>
        <div className={styles.patternCardBody}>
          <span className={styles.patternCardTitle}>{pattern.name}</span>
          <span className={styles.patternCardDesc}>{pattern.examples.split(',')[0]}...</span>
        </div>
      </div>
      <motion.span
        className={styles.patternCardChevron}
        animate={{ rotate: expanded ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >›</motion.span>
    </motion.button>
  );
}

/* ── 동사 패턴 카드 ── */
function VerbPatternCard({ pattern, onClick, expanded }: { pattern: VerbPattern; onClick: () => void; expanded: boolean }) {
  return (
    <motion.button className={`${styles.patternCard} ${expanded ? styles.patternCardExpanded : ''}`} onClick={onClick} whileTap={{ scale: 0.97 }}>
      <div className={styles.patternCardLeft}>
        <span className={styles.patternVerbIcon}>🔤</span>
        <div className={styles.patternCardBody}>
          <span className={styles.patternCardTitle}>{pattern.name}</span>
          <span className={styles.patternCardDesc}>{pattern.examples.split(':')[0].trim()}...</span>
        </div>
      </div>
      <motion.span
        className={styles.patternCardChevron}
        animate={{ rotate: expanded ? 90 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      >›</motion.span>
    </motion.button>
  );
}
