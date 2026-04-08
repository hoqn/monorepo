import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { partner, tdsEvent } from '@apps-in-toss/web-framework';
import { getMe, getLeaderboard, MeResponse, LeaderboardEntry } from '../lib/api.ts';
import { isAIT } from '../lib/ait.ts';
import styles from './HomePage.module.css';

const XP_PER_LEVEL = 500;

export function HomePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    partner.addAccessoryButton({
      id: 'profile',
      title: '프로필',
      icon: { name: 'icon-person-mono' },
    });
    const cleanup = tdsEvent.addEventListener('navigationAccessoryEvent', {
      onEvent: ({ id }) => {
        if (id === 'profile') navigate('/profile');
      },
    });
    return () => {
      partner.removeAccessoryButton();
      cleanup();
    };
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const [meData, lbData] = await Promise.all([getMe(), getLeaderboard()]);
        setMe(meData);
        setLeaderboard(lbData.entries.slice(0, 3));
      } catch {
        // 실패해도 빈 값으로 표시
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalXp = me?.user.total_xp ?? 0;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const streak = me?.user.current_streak ?? 0;
  const totalWords = me?.stats.totalWords ?? 0;

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

      <div className={styles.content}>
        {/* 채집 히어로 카드 */}
        <motion.div
          className={styles.heroCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className={styles.heroTop}>
            <span className={styles.heroLabel}>오늘의 채집</span>
            <span className={styles.heroTime}>약 3분</span>
          </div>

          <div className={styles.streakArea}>
            <span className={`${styles.flame} ${streak >= 3 ? styles.flameBig : ''}`}>
              {streak >= 3 ? '🔥' : '🌱'}
            </span>
            <div className={styles.streakInfo}>
              {streak > 0 ? (
                <>
                  <span className={styles.streakDays}>{streak}일</span>
                  <span className={styles.streakLabel}>연속 학습 중</span>
                </>
              ) : (
                <>
                  <span className={styles.streakDays}>오늘부터</span>
                  <span className={styles.streakLabel}>스트릭 시작해요</span>
                </>
              )}
            </div>
          </div>

          <button className={styles.sessionButton} onClick={() => navigate('/session')}>
            채집 시작하기
          </button>
        </motion.div>

        {/* 내 현황 */}
        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.08 }}
        >
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalWords.toLocaleString()}</span>
            <span className={styles.statLabel}>수집한 단어</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>Lv.{level}</span>
            <span className={styles.statLabel}>현재 레벨</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalXp.toLocaleString()}</span>
            <span className={styles.statLabel}>총 XP</span>
          </div>
        </motion.div>

        {/* 리더보드 미리보기 */}
        <motion.div
          className={styles.leaderboardCard}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.16 }}
        >
          <div className={styles.leaderboardHeader}>
            <span className={styles.leaderboardTitle}>이번 주 순위</span>
            <button className={styles.leaderboardMore} onClick={() => navigate('/leaderboard')}>
              전체 →
            </button>
          </div>

          {loading ? (
            <p className={styles.leaderboardEmpty}>불러오는 중...</p>
          ) : leaderboard.length === 0 ? (
            <p className={styles.leaderboardEmpty}>아직 순위가 없어요</p>
          ) : (
            <ul className={styles.leaderboardList}>
              {leaderboard.map((item, i) => (
                <motion.li
                  key={item.rank}
                  className={`${styles.leaderboardItem} ${item.is_me ? styles.leaderboardItemMe : ''}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 + i * 0.07 }}
                >
                  <span className={styles.rank}>
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                  </span>
                  <span className={styles.leaderboardName}>
                    {item.is_me ? '나' : (item.display_name ?? '익명')}
                  </span>
                  <span className={styles.leaderboardXp}>{item.xp_total.toLocaleString()}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
