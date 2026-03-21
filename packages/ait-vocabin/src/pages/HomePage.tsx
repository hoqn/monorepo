import { useNavigate } from 'react-router-dom';
import styles from './HomePage.module.css';

// 임시 mock 데이터 — 나중에 API/상태관리로 교체
const MOCK_USER = {
  name: '홍길동',
  level: 7,
  xp: 420,
  xpToNextLevel: 500,
  streak: 12,
  todayWords: 24,
};

const MOCK_LEADERBOARD = [
  { rank: 1, name: '김민준', xp: 1240, isMe: false },
  { rank: 2, name: '이서연', xp: 980, isMe: false },
  { rank: 3, name: '홍길동', xp: 420, isMe: true },
  { rank: 4, name: '박지호', xp: 310, isMe: false },
];

const MOCK_REVIEW_DUE = 8;

export function HomePage() {
  const navigate = useNavigate();
  const xpPercent = Math.round((MOCK_USER.xp / MOCK_USER.xpToNextLevel) * 100);

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <span className={styles.logo}>VocaBin</span>
        <button
          className={styles.profileButton}
          onClick={() => navigate('/profile')}
          aria-label="프로필"
        >
          👤
        </button>
      </header>

      <div className={styles.content}>
        {/* 스트릭 + XP */}
        <div className={styles.statsCard}>
          <div className={styles.streakRow}>
            <span className={styles.streakIcon}>🔥</span>
            <span className={styles.streakText}>
              <span className={styles.streakDays}>{MOCK_USER.streak}일</span> 스트릭
            </span>
          </div>

          <div className={styles.xpRow}>
            <div className={styles.xpLabel}>
              <span className={styles.levelBadge}>Lv.{MOCK_USER.level}</span>
              <span className={styles.xpCount}>{MOCK_USER.xp} / {MOCK_USER.xpToNextLevel} XP</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 세션 시작 */}
        <div className={styles.sessionCard}>
          <button
            className={styles.sessionStartButton}
            onClick={() => navigate('/session')}
          >
            세션 시작하기
          </button>
          {MOCK_REVIEW_DUE > 0 && (
            <div className={styles.reviewHint}>
              <div className={styles.reviewDot} />
              <span>복습 예정 단어 {MOCK_REVIEW_DUE}개 포함</span>
            </div>
          )}
        </div>

        {/* 리더보드 미리보기 */}
        <div className={styles.leaderboardCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>이번 주 리더보드</span>
            <button
              className={styles.sectionMore}
              onClick={() => navigate('/leaderboard')}
            >
              전체보기 →
            </button>
          </div>

          <ul className={styles.leaderboardList}>
            {MOCK_LEADERBOARD.map((item) => (
              <li key={item.rank} className={styles.leaderboardItem}>
                <span className={`${styles.rank} ${item.rank <= 3 ? styles.rankTop : ''}`}>
                  {item.rank}
                </span>
                <span className={`${styles.leaderboardName} ${item.isMe ? styles.leaderboardNameMe : ''}`}>
                  {item.isMe ? '나' : item.name}
                </span>
                <span className={styles.leaderboardXp}>{item.xp.toLocaleString()} XP</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 오늘 통계 */}
        <div className={styles.todayStats}>
          <span className={styles.todayStatsText}>오늘 학습한 단어</span>
          <span className={styles.todayStatsCount}>{MOCK_USER.todayWords}개</span>
        </div>
      </div>
    </div>
  );
}
