import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useSpring, useTransform } from 'motion/react';
import { generateHapticFeedback, partner, tdsEvent } from '@apps-in-toss/web-framework';
import { getMe, getLeaderboard, MeResponse, LeaderboardEntry } from '../lib/api.ts';
import { isAIT } from '../lib/ait.ts';
import styles from './HomePage.module.css';

const XP_PER_LEVEL = 500;

function AnimatedXpBar({ percent }: { percent: number }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const width = useTransform(spring, (v) => `${v}%`);

  useEffect(() => {
    const t = setTimeout(() => spring.set(percent), 120);
    return () => clearTimeout(t);
  }, [percent, spring]);

  return (
    <div className={styles.progressBarTrack}>
      <motion.div className={styles.progressBarFill} style={{ width }} />
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pressed, setPressed] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === 'profile') navigate('/profile');
      },
    });
    return () => {
      cleanup();
    };
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const [meData, lbData] = await Promise.all([getMe(), getLeaderboard()]);
        setMe(meData);
        setLeaderboard(lbData.entries.slice(0, 4));
      } catch { /* 실패해도 빈 값으로 */ }
      finally { setLoading(false); }
    })();
  }, []);

  const totalXp = me?.user.total_xp ?? 0;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % XP_PER_LEVEL;
  const xpPercent = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const streak = me?.user.current_streak ?? 0;
  const totalWords = me?.stats.totalWords ?? 0;

  const handleSessionPress = () => {
    generateHapticFeedback({ type: 'softMedium' });
    navigate('/session');
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </button>
        </header>
      )}

      <motion.div
        className={styles.content}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 스트릭 + XP 칩 행 */}
        <motion.div className={styles.chipsRow} variants={itemVariants}>
          <StreakChip streak={streak} />
          <LevelChip level={level} xpInLevel={xpInLevel} xpPercent={xpPercent} />
        </motion.div>

        {/* 세션 CTA 카드 */}
        <motion.div variants={itemVariants}>
          <motion.div
            className={styles.sessionCard}
            animate={pressed ? { scale: 0.97 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onPointerDown={() => {
              setPressed(true);
              pressTimerRef.current = setTimeout(() => setPressed(false), 300);
            }}
            onPointerUp={() => { setPressed(false); handleSessionPress(); }}
            onPointerCancel={() => setPressed(false)}
          >
            <div className={styles.sessionCardBg} />
            <div className={styles.sessionCardContent}>
              <p className={styles.sessionCardLabel}>오늘의 채집</p>
              <p className={styles.sessionCardTitle}>채집 시작하기</p>
              <p className={styles.sessionCardSub}>단어가 기다리고 있어요</p>
            </div>
            <div className={styles.sessionCardArrow}>→</div>
          </motion.div>
        </motion.div>

        {/* 리더보드 카드 */}
        <motion.div className={styles.leaderboardCard} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>이번 주 리더보드</span>
            <button
              className={styles.sectionMore}
              onClick={() => navigate('/leaderboard')}
            >
              전체보기 →
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingRows}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonRow} />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className={styles.emptyText}>아직 순위가 없어요</p>
          ) : (
            <ul className={styles.leaderboardList}>
              {leaderboard.map((item, i) => (
                <motion.li
                  key={item.rank}
                  className={`${styles.leaderboardItem} ${item.is_me ? styles.leaderboardItemMe : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                >
                  <span className={styles.rank}>
                    {item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : item.rank}
                  </span>
                  <span className={styles.leaderboardName}>
                    {item.is_me ? '나' : (item.display_name ?? '익명')}
                  </span>
                  <span className={styles.leaderboardXp}>{item.xp_total.toLocaleString()} XP</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* 누적 학습 단어 */}
        <motion.div className={styles.todayStats} variants={itemVariants}>
          <span className={styles.todayStatsText}>수집한 단어</span>
          <span className={styles.todayStatsCount}>{totalWords.toLocaleString()}개</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────
   StreakChip
───────────────────── */
function StreakChip({ streak }: { streak: number }) {
  const isActive = streak > 0;
  return (
    <motion.div
      className={`${styles.chip} ${isActive ? styles.chipStreak : ''}`}
      whileTap={{ scale: 0.94 }}
    >
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
        <span className={styles.xpCount}>{xpInLevel} / {XP_PER_LEVEL} XP</span>
      </div>
      <AnimatedXpBar percent={xpPercent} />
    </div>
  );
}
