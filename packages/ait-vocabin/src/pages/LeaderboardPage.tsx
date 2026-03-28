import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { isAIT } from '../lib/ait.ts';
import styles from './LeaderboardPage.module.css';

const MY_ID = 'me';

const MOCK_LEADERBOARD = [
  { id: '1', rank: 1, name: '김민준', xp: 1240 },
  { id: '2', rank: 2, name: '이서연', xp: 980 },
  { id: MY_ID, rank: 3, name: '나', xp: 420 },
  { id: '4', rank: 4, name: '박지호', xp: 310 },
  { id: '5', rank: 5, name: '최유나', xp: 290 },
  { id: '6', rank: 6, name: '정하준', xp: 240 },
  { id: '7', rank: 7, name: '강소희', xp: 180 },
  { id: '8', rank: 8, name: '윤도현', xp: 120 },
];

function getDaysUntilMonday() {
  const day = new Date().getDay();
  return day === 0 ? 1 : 8 - day;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const me = MOCK_LEADERBOARD.find((item) => item.id === MY_ID)!;

  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));
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
            <span className={styles.myRankNumber}>{me.rank}위</span>
            <span className={styles.myRankXp}>{me.xp.toLocaleString()} XP</span>
          </div>
          <p className={styles.resetNote}>{daysLeft}일 후 초기화</p>
        </div>
      </div>

      {/* 전체 랭킹 리스트 */}
      <ul className={styles.list}>
        {MOCK_LEADERBOARD.map((item) => (
          <li
            key={item.id}
            className={`${styles.rankItem} ${item.id === MY_ID ? styles.rankItemMe : ''}`}
          >
            <span className={styles.rankCell}>
              {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
            </span>
            <span className={styles.rankName}>
              {item.id === MY_ID ? '나' : item.name}
            </span>
            <span className={styles.rankXp}>{item.xp.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
