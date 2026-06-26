import { generateHapticFeedback, tdsEvent } from '@apps-in-toss/web-framework';
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAIT } from '../lib/ait.ts';
import { getProfile } from '../lib/local-profile.ts';
import type { LocalProfile } from '../lib/local-profile.ts';
import styles from './HomePage.module.css';

const SESSION_COUNT_KEY = 'vocabin_session_count';
const SESSION_COUNTS = [6, 12, 24] as const;
type SessionCount = (typeof SESSION_COUNTS)[number];
const SESSION_COUNT_LABELS: Record<SessionCount, { label: string; desc: string; time: string }> = {
  6: { label: '6문제', desc: '가볍게', time: '~3분' },
  12: { label: '12문제', desc: '적당히', time: '~6분' },
  24: { label: '24문제', desc: '집중적으로', time: '~12분' },
};

const XP_PER_LEVEL = 500;

function AnimatedXpBar({ percent }: { percent: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const scaleX = useTransform(spring, (v) => v / 100);

  useEffect(() => {
    const t = setTimeout(() => spring.set(percent), 120);
    return () => clearTimeout(t);
  }, [percent, spring]);

  return (
    <div className={styles.progressBarTrack}>
      <motion.div className={styles.progressBarFill} style={{ scaleX, transformOrigin: 'left' }} />
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<LocalProfile>(() => getProfile());
  const [showSessionSheet, setShowSessionSheet] = useState(false);
  const [selectedCount, setSelectedCount] = useState<SessionCount>(
    () => (parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? '12') as SessionCount) || 12,
  );
  const [localCount, setLocalCount] = useState<SessionCount>(selectedCount);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  useEffect(() => {
    if (!isAIT) {
      return;
    }

    const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === 'profile') navigate('/profile');
      },
    });
    return () => {
      cleanup();
    };
  }, [navigate]);

  const totalXp = profile.totalXp;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpPercent = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const streak = profile.currentStreak;

  const handleSessionStart = (count: SessionCount) => {
    localStorage.setItem(SESSION_COUNT_KEY, String(count));
    setSelectedCount(count);
    setShowSessionSheet(false);
    navigate('/session', { state: { sessionCount: count } });
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 22 } },
  };

  return (
    <div className={styles.page}>
      {!isAIT && (
        <header className={styles.header}>
          <span className={styles.logo}>VocaBin</span>
          <button className={styles.profileButton} onClick={() => navigate('/profile')} aria-label="프로필">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </header>
      )}

      <motion.div className={styles.content} variants={containerVariants} initial="hidden" animate="visible">
        {/* 스트릭 + XP 칩 행 */}
        <motion.div className={styles.chipsRow} variants={itemVariants}>
          <StreakChip streak={streak} />
          <LevelChip level={level} xpInLevel={xpInLevel} xpPercent={xpPercent} />
        </motion.div>

        {/* 세션 CTA 카드 */}
        <motion.div variants={itemVariants}>
          <motion.div
            className={styles.sessionCard}
            whileTap={{ scale: 0.95, y: 3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, mass: 0.6 }}
            onClick={() => {
              generateHapticFeedback({ type: 'softMedium' });
              setLocalCount(selectedCount);
              setShowSessionSheet(true);
            }}
          >
            <div className={styles.sessionCardBg} />
            <div className={styles.sessionCardContent}>
              <p className={styles.sessionCardLabel}>오늘의 채집</p>
              <p className={styles.sessionCardTitle}>채집 시작하기</p>
              <p className={styles.sessionCardSub}>
                {SESSION_COUNT_LABELS[selectedCount].desc} · {SESSION_COUNT_LABELS[selectedCount].label}
              </p>
            </div>
            <div className={styles.sessionCardArrow}>→</div>
          </motion.div>
        </motion.div>

        {/* 패턴 도감 진입점 */}
        <motion.div variants={itemVariants}>
          <motion.div className={styles.patternCard} onClick={() => navigate('/patterns')} whileTap={{ scale: 0.97 }}>
            <div className={styles.patternCardContent}>
              <span className={styles.patternCardIcon}>📖</span>
              <div>
                <p className={styles.patternCardTitle}>독일어 패턴 도감</p>
                <p className={styles.patternCardSub}>관사·복수형·동사 규칙 한눈에 보기</p>
              </div>
            </div>
            <span className={styles.patternCardArrow}>›</span>
          </motion.div>
        </motion.div>

      </motion.div>

      <AnimatePresence>
        {showSessionSheet && (
          <>
            <motion.div
              className={styles.darkSheetBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setShowSessionSheet(false)}
            />
            <motion.div
              className={styles.darkSheet}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            >
              <div className={styles.darkSheetBg} />
              <div className={styles.darkSheetInner}>
                <div className={styles.sessionCardRow}>
                  <div className={styles.sessionCardContent}>
                    <p className={styles.sessionCardLabel}>오늘의 채집</p>
                    <p className={styles.sessionCardTitle}>문제 수 선택</p>
                  </div>
                  <button className={styles.sessionCardClose} onClick={() => setShowSessionSheet(false)}>
                    ✕
                  </button>
                </div>
                <div className={styles.darkSheetTiles}>
                  {SESSION_COUNTS.map((count) => {
                    const info = SESSION_COUNT_LABELS[count];
                    const isSelected = localCount === count;
                    return (
                      <motion.button
                        key={count}
                        className={`${styles.darkSheetTile} ${isSelected ? styles.darkSheetTileSelected : ''}`}
                        whileTap={{ scale: 0.94 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onClick={() => {
                          generateHapticFeedback({ type: 'softMedium' });
                          setLocalCount(count);
                        }}
                      >
                        <span className={styles.darkSheetTileNum}>{count}</span>
                        <span className={styles.darkSheetTileUnit}>문제</span>
                        <span className={styles.darkSheetTileSub}>{info.time}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <motion.button
                  className={styles.darkSheetStart}
                  whileTap={{ scale: 0.97, y: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  onClick={() => handleSessionStart(localCount)}
                >
                  시작하기
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────
   StreakChip
───────────────────── */
function StreakChip({ streak }: { streak: number }) {
  const isActive = streak > 0;
  return (
    <motion.div className={`${styles.chip} ${isActive ? styles.chipStreak : ''}`} whileTap={{ scale: 0.94 }}>
      <motion.span
        className={styles.chipIcon}
        animate={isActive ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        🔥
      </motion.span>
      <span className={styles.chipText}>
        <span className={styles.chipBold}>{streak}일</span> 스트릭
      </span>
    </motion.div>
  );
}

/* ─────────────────────
   LevelChip
───────────────────── */
function LevelChip({ level, xpInLevel, xpPercent }: { level: number; xpInLevel: number; xpPercent: number }) {
  return (
    <div className={styles.chipLevel}>
      <div className={styles.chipLevelTop}>
        <span className={styles.levelBadge}>Lv.{level}</span>
        <span className={styles.xpCount}>
          {xpInLevel} / {XP_PER_LEVEL} XP
        </span>
      </div>
      <AnimatedXpBar percent={xpPercent} />
    </div>
  );
}
