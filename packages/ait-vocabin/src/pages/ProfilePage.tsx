import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.css';

const MOCK_USER = {
  name: '홍길동',
  level: 7,
  totalXp: 2840,
  totalWords: 156,
  maxStreak: 21,
  currentStreak: 12,
};

const MOCK_BADGES = [
  { id: 'first_session', emoji: '🎉', name: '첫 세션', earned: true },
  { id: 'streak_7', emoji: '🔥', name: '7일 스트릭', earned: true },
  { id: 'words_100', emoji: '📚', name: '100단어', earned: true },
  { id: 'streak_30', emoji: '⚡️', name: '30일 스트릭', earned: false },
  { id: 'words_500', emoji: '🏆', name: '500단어', earned: false },
  { id: 'level_10', emoji: '⭐️', name: 'Lv.10', earned: false },
  { id: 'perfect', emoji: '💯', name: '완벽한 세션', earned: false },
  { id: 'comeback', emoji: '💪', name: '재기', earned: false },
];

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* 다크 히어로 — 유저 정보 */}
      <div className={styles.heroArea}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="뒤로가기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className={styles.heroContent}>
          <div className={styles.avatar}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <span className={styles.userName}>{MOCK_USER.name}</span>
          <span className={styles.levelBadge}>Lv.{MOCK_USER.level}</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* 통계 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.totalWords}</span>
            <span className={styles.statLabel}>수집 단어</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.currentStreak}</span>
            <span className={styles.statLabel}>현재 스트릭</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.maxStreak}</span>
            <span className={styles.statLabel}>최장 스트릭</span>
          </div>
        </div>

        {/* 배지 */}
        <span className={styles.sectionTitle}>배지</span>
        <div className={styles.badgesCard}>
          {MOCK_BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`${styles.badgeItem} ${!badge.earned ? styles.badgeLocked : ''}`}
            >
              <span className={styles.badgeEmoji}>{badge.emoji}</span>
              <span className={styles.badgeName}>{badge.name}</span>
            </div>
          ))}
        </div>

        {/* 설정 */}
        <span className={styles.sectionTitle}>설정</span>
        <div className={styles.settingsCard}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>알림 시간</span>
            <span className={styles.settingValue}>저녁</span>
            <span className={styles.settingChevron}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>하루 목표</span>
            <span className={styles.settingValue}>1 세션</span>
            <span className={styles.settingChevron}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>학습 레벨</span>
            <span className={styles.settingValue}>A1</span>
            <span className={styles.settingChevron}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
