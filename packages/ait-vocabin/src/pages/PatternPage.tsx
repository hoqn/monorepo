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

export function PatternPage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [activeCategory, setActiveCategory] = useState<Category>('article');
  const [selectedPattern, setSelectedPattern] = useState<ArticlePattern | PluralPattern | VerbPattern | null>(null);

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
            onClick={() => setActiveCategory(cat)}
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
            {activeCategory === 'article' && ARTICLE_PATTERNS.map((p, i) => (
              <motion.div key={i} variants={itemVariants}>
                <ArticlePatternCard pattern={p} onClick={() => setSelectedPattern(p)} />
              </motion.div>
            ))}
            {activeCategory === 'plural' && PLURAL_PATTERNS.map((p) => (
              <motion.div key={p.id} variants={itemVariants}>
                <PluralPatternCard pattern={p} onClick={() => setSelectedPattern(p)} />
              </motion.div>
            ))}
            {activeCategory === 'verb' && VERB_PATTERNS.map((p) => (
              <motion.div key={p.id} variants={itemVariants}>
                <VerbPatternCard pattern={p} onClick={() => setSelectedPattern(p)} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 상세 바텀시트 */}
      <AnimatePresence>
        {selectedPattern && (
          <PatternDetailSheet
            pattern={selectedPattern}
            onClose={() => setSelectedPattern(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── 관사 패턴 카드 ── */
function ArticlePatternCard({ pattern, onClick }: { pattern: ArticlePattern; onClick: () => void }) {
  return (
    <motion.button className={styles.patternCard} onClick={onClick} whileTap={{ scale: 0.97 }}>
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
      <span className={styles.patternCardChevron}>›</span>
    </motion.button>
  );
}

/* ── 복수형 패턴 카드 ── */
function PluralPatternCard({ pattern, onClick }: { pattern: PluralPattern; onClick: () => void }) {
  return (
    <motion.button className={styles.patternCard} onClick={onClick} whileTap={{ scale: 0.97 }}>
      <div className={styles.patternCardLeft}>
        <span className={styles.patternPluralIcon}>📝</span>
        <div className={styles.patternCardBody}>
          <span className={styles.patternCardTitle}>{pattern.name}</span>
          <span className={styles.patternCardDesc}>{pattern.examples.split(',')[0]}...</span>
        </div>
      </div>
      <span className={styles.patternCardChevron}>›</span>
    </motion.button>
  );
}

/* ── 동사 패턴 카드 ── */
function VerbPatternCard({ pattern, onClick }: { pattern: VerbPattern; onClick: () => void }) {
  return (
    <motion.button className={styles.patternCard} onClick={onClick} whileTap={{ scale: 0.97 }}>
      <div className={styles.patternCardLeft}>
        <span className={styles.patternVerbIcon}>🔤</span>
        <div className={styles.patternCardBody}>
          <span className={styles.patternCardTitle}>{pattern.name}</span>
          <span className={styles.patternCardDesc}>{pattern.examples.split(':')[0].trim()}...</span>
        </div>
      </div>
      <span className={styles.patternCardChevron}>›</span>
    </motion.button>
  );
}

/* ── 상세 바텀시트 ── */
type AnyPattern = ArticlePattern | PluralPattern | VerbPattern;

function isArticlePattern(p: AnyPattern): p is ArticlePattern {
  return 'suffixes' in p;
}
function isPluralPattern(p: AnyPattern): p is PluralPattern {
  return 'id' in p && !('suffixes' in p) && !('rule' in p && 'examples' in p && 'name' in p && 'suffixes' in p);
}

function PatternDetailSheet({ pattern, onClose }: { pattern: AnyPattern; onClose: () => void }) {
  let title = '';
  let rule = '';
  let examples = '';

  if (isArticlePattern(pattern)) {
    title = pattern.suffixes.map((s) => `~${s}`).join(' / ') + ` → ${pattern.article}`;
    rule = pattern.rule;
    examples = pattern.examples;
  } else {
    title = pattern.name;
    rule = pattern.rule;
    examples = pattern.examples;
  }

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.detailSheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className={styles.sheetHandle} />
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

        <button className={styles.closeButton} onClick={onClose}>닫기</button>
      </motion.div>
    </>
  );
}
