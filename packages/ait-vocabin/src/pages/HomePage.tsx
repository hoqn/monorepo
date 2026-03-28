import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, getLeaderboard, MeResponse, LeaderboardEntry } from '../lib/api.ts';
import styles from './HomePage.module.css';

const XP_PER_LEVEL = 500;

export function HomePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [meData, lbData] = await Promise.all([getMe(), getLeaderboard()]);
        setMe(meData);
        setLeaderboard(lbData.entries.slice(0, 4));
      } catch {
        // 실패해도 UI는 빈 값으로 표시
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
  const todayWords = me?.stats.totalWords ?? 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>VocaBin</span>
        <button className={styles.profileButton} onClick={() => navigate('/profile')} aria-label="프로필">
          👤
        </button>
      </header>

      <div className={styles.content}>
        {/* 스트릭 + XP */}
        <div className={styles.statsCard}>
          <div className={styles.streakRow}>
            <span className={styles.streakIcon}>🔥</span>
            <span className={styles.streakText}>
              <span className={styles.streakDays}>{streak}일</span> 스트릭
            </span>
          </div>

          <div className={styles.xpRow}>
            <div className={styles.xpLabel}>
              <span className={styles.levelBadge}>Lv.{level}</span>
              <span className={styles.xpCount}>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div className={styles.progressBarFill} style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        {/* 세션 시작 */}
        <div className={styles.sessionCard}>
          <button className={styles.sessionStartButton} onClick={() => navigate('/session')}>
            세션 시작하기
          </button>
        </div>

        {/* 리더보드 미리보기 */}
        <div className={styles.leaderboardCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>이번 주 리더보드</span>
            <button className={styles.sectionMore} onClick={() => navigate('/leaderboard')}>
              전체보기 →
            </button>
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', padding: '8px 0' }}>불러오는 중...</p>
          ) : leaderboard.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', padding: '8px 0' }}>아직 순위가 없어요</p>
          ) : (
            <ul className={styles.leaderboardList}>
              {leaderboard.map((item) => (
                <li key={item.rank} className={styles.leaderboardItem}>
                  <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ''}`}>
                    {item.rank}
                  </span>
                  <span className={`${styles.leaderboardName} ${item.is_me ? styles.leaderboardNameMe : ''}`}>
                    {item.is_me ? '나' : (item.display_name ?? '익명')}
                  </span>
                  <span className={styles.leaderboardXp}>{item.xp_total.toLocaleString()} XP</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 오늘 통계 */}
        <div className={styles.todayStats}>
          <span className={styles.todayStatsText}>누적 학습 단어</span>
          <span className={styles.todayStatsCount}>{todayWords}개</span>
        </div>
      </div>
    </div>
  );
}
