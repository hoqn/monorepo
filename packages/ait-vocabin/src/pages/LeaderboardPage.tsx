import { useNavigate } from 'react-router-dom';
import styles from './LeaderboardPage.module.css';

const MY_ID = 'me';

const MOCK_LEADERBOARD = [
  { id: '1', rank: 1, name: '김민준', xp: 1240 },
  { id: '2', rank: 2, name: '이서연', xp: 980 },
  { id: MY_ID, rank: 3, name: '홍길동', xp: 420 },
  { id: '4', rank: 4, name: '박지호', xp: 310 },
  { id: '5', rank: 5, name: '최유나', xp: 290 },
  { id: '6', rank: 6, name: '정하준', xp: 240 },
  { id: '7', rank: 7, name: '강소희', xp: 180 },
  { id: '8', rank: 8, name: '윤도현', xp: 120 },
];

const MEDALS = ['🥇', '🥈', '🥉'];

function getDaysUntilMonday() {
  const now = new Date();
  const day = now.getDay(); // 0=일, 1=월 ...
  const daysLeft = day === 0 ? 1 : 8 - day;
  return daysLeft;
}

export function LeaderboardPage() {
  const navigate = useNavigate();
  const me = MOCK_LEADERBOARD.find((item) => item.id === MY_ID)!;
  const daysLeft = getDaysUntilMonday();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <span className={styles.headerTitle}>이번 주 리더보드</span>
        <span className={styles.resetTimer}>{daysLeft}일 후 초기화</span>
      </header>

      {/* 내 순위 고정 */}
      <div className={styles.myRankBanner}>
        <span className={styles.myRankNumber}>{me.rank}</span>
        <span className={styles.myRankName}>나</span>
        <span className={styles.myRankXp}>{me.xp.toLocaleString()} XP</span>
      </div>

      {/* 전체 랭킹 */}
      <ul className={styles.list}>
        {MOCK_LEADERBOARD.map((item) => (
          <li key={item.id} className={styles.rankItem}>
            {item.rank <= 3 ? (
              <span className={styles.rankMedal}>{MEDALS[item.rank - 1]}</span>
            ) : (
              <span className={styles.rankNumber}>{item.rank}</span>
            )}
            <span className={styles.rankName}>
              {item.id === MY_ID ? '나' : item.name}
            </span>
            <span className={styles.rankXp}>{item.xp.toLocaleString()} XP</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
