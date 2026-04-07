import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { isAIT } from '../lib/ait.ts';
import { getLeaderboard, LeaderboardEntry } from '../lib/api.ts';
import styles from './LeaderboardPage.module.css';

function getDaysUntilMonday() {
  const day = new Date().getDay();
  return day === 0 ? 1 : 8 - day;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then((data) => setEntries(data.entries))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const me = entries.find((e) => e.is_me);
  const daysLeft = getDaysUntilMonday();

  return (
    <div className={styles.page}>
      {/* 다크 히어로 — 내 순위 */}
      <div className={styles.heroArea}>
        {!isAIT && <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>}

        <div className={styles.heroContent}>
          <p className={styles.heroSub}>이번 주 순위</p>
          <div className={styles.myRankRow}>
            <span className={styles.myRankNumber}>{me ? `${me.rank}위` : '—'}</span>
            <span className={styles.myRankXp}>{me ? `${me.xp_total.toLocaleString()} XP` : ''}</span>
          </div>
          <p className={styles.resetNote}>{daysLeft}일 후 초기화</p>
        </div>
      </div>

      {/* 전체 랭킹 리스트 */}
      {loading ? (
        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>불러오는 중...</p>
      ) : entries.length === 0 ? (
        <p style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>아직 순위가 없어요</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((item) => (
            <li
              key={item.rank}
              className={`${styles.rankItem} ${item.is_me ? styles.rankItemMe : ''}`}
            >
              <span className={styles.rankCell}>
                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
              </span>
              <span className={styles.rankName}>
                {item.is_me ? '나' : (item.display_name ?? '익명')}
              </span>
              <span className={styles.rankXp}>{item.xp_total.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
