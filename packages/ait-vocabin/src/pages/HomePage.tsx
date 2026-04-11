import { generateHapticFeedback, tdsEvent } from '@apps-in-toss/web-framework';
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAIT } from '../lib/ait.ts';
import {
  getLeaderboard,
  getMe,
  getTodayMissions,
  LeaderboardEntry,
  MeResponse,
  DailyMission,
  MissionType,
} from '../lib/api.ts';
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

  const [me, setMe] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pressed, setPressed] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSessionSheet, setShowSessionSheet] = useState(false);
  const [selectedCount, setSelectedCount] = useState<SessionCount>(
    () => (parseInt(localStorage.getItem(SESSION_COUNT_KEY) ?? '12') as SessionCount) || 12,
  );

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

  useEffect(() => {
    (async () => {
      try {
        const [meData, lbData, missionsData] = await Promise.all([
          getMe(),
          getLeaderboard(),
          getTodayMissions().catch(() => ({ missions: [] })),
        ]);
        setMe(meData);
        setLeaderboard(lbData.entries.slice(0, 4));
        setMissions(missionsData.missions);
      } catch {
        /* 실패해도 빈 값으로 */
      } finally {
        setLoading(false);
      }
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
    setShowSessionSheet(true);
  };

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

        {/* 스마트 복습 CTA — 복습 대기 단어가 있을 때만 표시 */}
        {(me?.stats?.reviewPending ?? 0) > 0 && (
          <motion.div variants={itemVariants}>
            <motion.div
              className={styles.reviewCta}
              onClick={() => navigate('/session', { state: { sessionCount: 6, reviewMode: true } })}
              whileTap={{ scale: 0.97 }}
            >
              <span className={styles.reviewCtaIcon}>📖</span>
              <span className={styles.reviewCtaText}>
                복습 대기 <strong>{me?.stats?.reviewPending}단어</strong> — 지금 복습하기
              </span>
              <span className={styles.reviewCtaArrow}>→</span>
            </motion.div>
          </motion.div>
        )}

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
            onPointerUp={() => {
              setPressed(false);
              handleSessionPress();
            }}
            onPointerCancel={() => setPressed(false)}
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

        {/* 데일리 미션 */}
        {missions.length > 0 && (
          <motion.div className={styles.missionsCard} variants={itemVariants}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>오늘의 미션</span>
              <span className={styles.missionsComplete}>
                {missions.filter((m) => m.completed_at).length}/{missions.length}
              </span>
            </div>
            <ul className={styles.missionsList}>
              {missions.map((mission) => (
                <MissionItem key={mission.id} mission={mission} />
              ))}
            </ul>
          </motion.div>
        )}

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

        {/* 리더보드 카드 */}
        <motion.div className={styles.leaderboardCard} variants={itemVariants}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>이번 주 리더보드</span>
            <button className={styles.sectionMore} onClick={() => navigate('/leaderboard')}>
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
                  <span className={styles.rank}>{item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : item.rank}</span>
                  <span className={styles.leaderboardName}>{item.is_me ? '나' : (item.display_name ?? '익명')}</span>
                  <span className={styles.leaderboardXp}>{item.xp_total.toLocaleString()} XP</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>

        {/* 숙련도 분포 바 */}
        {totalWords > 0 && (
          <motion.div className={styles.progressDistCard} variants={itemVariants}>
            <div className={styles.progressDistHeader}>
              <span className={styles.progressDistTitle}>단어 숙련도</span>
              <span className={styles.progressDistTotal}>{totalWords.toLocaleString()}개</span>
            </div>
            <ProgressDistBar
              learning={me?.stats?.progressDistribution?.learning ?? 0}
              mastered={me?.stats?.progressDistribution?.mastered ?? 0}
              total={totalWords}
            />
            <div className={styles.progressDistLegend}>
              <span className={styles.progressDistLegendLearning}>
                학습중 {me?.stats?.progressDistribution?.learning ?? 0}
              </span>
              <span className={styles.progressDistLegendMastered}>
                숙련 {me?.stats?.progressDistribution?.mastered ?? 0}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>
      <AnimatePresence>
        {showSessionSheet && (
          <SessionSetupSheet
            selectedCount={selectedCount}
            onSelect={handleSessionStart}
            onClose={() => setShowSessionSheet(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────
   SessionSetupSheet
───────────────────── */
interface SessionSetupSheetProps {
  selectedCount: SessionCount;
  onSelect: (count: SessionCount) => void;
  onClose: () => void;
}

function SessionSetupSheet({ selectedCount, onSelect, onClose }: SessionSetupSheetProps) {
  const [localCount, setLocalCount] = useState<SessionCount>(selectedCount);

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
        className={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className={styles.sheetHandle} />
        <p className={styles.sheetTitle}>오늘의 채집</p>
        <p className={styles.sheetDesc}>문제 수를 선택하세요</p>

        <div className={styles.sessionCountOptions}>
          {SESSION_COUNTS.map((count) => {
            const info = SESSION_COUNT_LABELS[count];
            const isSelected = localCount === count;
            return (
              <button
                key={count}
                className={`${styles.sessionCountOption} ${isSelected ? styles.sessionCountOptionSelected : ''}`}
                onClick={() => {
                  generateHapticFeedback({ type: 'softMedium' });
                  setLocalCount(count);
                }}
              >
                <span className={styles.sessionCountLabel}>{info.label}</span>
                <span className={styles.sessionCountDesc}>{info.desc}</span>
                <span className={styles.sessionCountTime}>{info.time}</span>
              </button>
            );
          })}
        </div>

        <motion.button className={styles.startButton} onClick={() => onSelect(localCount)} whileTap={{ scale: 0.97 }}>
          시작하기
        </motion.button>
      </motion.div>
    </>
  );
}

/* ─────────────────────
   ProgressDistBar
───────────────────── */
function ProgressDistBar({ learning, mastered, total }: { learning: number; mastered: number; total: number }) {
  const learningPct = total > 0 ? Math.round((learning / total) * 100) : 0;
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  return (
    <div className={styles.progressDistBar}>
      <motion.div
        className={styles.progressDistLearning}
        initial={{ width: 0 }}
        animate={{ width: `${learningPct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
      />
      <motion.div
        className={styles.progressDistMastered}
        initial={{ width: 0 }}
        animate={{ width: `${masteredPct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  );
}

/* ─────────────────────
   MissionItem
───────────────────── */
const MISSION_LABELS: Record<MissionType, (target: number) => string> = {
  correct_count: (t) => `정답 ${t}개 맞추기`,
  combo_streak: (t) => `콤보 ${t} 이상 달성`,
  question_count: (t) => `문제 ${t}개 풀기`,
};

function MissionItem({ mission }: { mission: DailyMission }) {
  const isCompleted = !!mission.completed_at;
  const progressPercent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const label = MISSION_LABELS[mission.type]?.(mission.target) ?? mission.type;

  return (
    <li className={`${styles.missionItem} ${isCompleted ? styles.missionItemDone : ''}`}>
      <span className={styles.missionCheck}>{isCompleted ? '✓' : '○'}</span>
      <div className={styles.missionBody}>
        <span className={styles.missionLabel}>{label}</span>
        {!isCompleted && (
          <div className={styles.missionProgressTrack}>
            <div className={styles.missionProgressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>
      <span className={styles.missionCount}>
        {isCompleted ? mission.target : mission.progress}/{mission.target}
      </span>
    </li>
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
