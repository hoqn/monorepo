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

const TIME_LABEL: Record<string, string> = {
  dawn: '새벽',
  morning: '아침',
  lunch: '점심',
  afternoon: '낮',
  evening: '저녁',
  night: '밤',
};

export function ProfilePage() {
  const navigate = useNavigate();

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
        <span className={styles.headerTitle}>프로필</span>
      </header>

      <div className={styles.content}>
        {/* 유저 정보 */}
        <div className={styles.userCard}>
          <div className={styles.avatar}>👤</div>
          <span className={styles.userName}>{MOCK_USER.name}</span>
          <span className={styles.levelBadge}>Lv.{MOCK_USER.level}</span>
        </div>

        {/* 누적 통계 */}
        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.totalWords}</span>
            <span className={styles.statLabel}>학습 단어</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.maxStreak}</span>
            <span className={styles.statLabel}>최장 스트릭</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{MOCK_USER.totalXp.toLocaleString()}</span>
            <span className={styles.statLabel}>누적 XP</span>
          </div>
        </div>

        {/* 배지 */}
        <span className={styles.sectionTitle}>배지</span>
        <div className={styles.badgesCard}>
          <div className={styles.badgesGrid}>
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
        </div>

        {/* 설정 */}
        <span className={styles.sectionTitle}>설정</span>
        <div className={styles.settingsCard}>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>알림 시간</span>
            <span className={styles.settingValue}>{TIME_LABEL['evening']}</span>
            <span className={styles.settingArrow}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>하루 목표</span>
            <span className={styles.settingValue}>2 세션</span>
            <span className={styles.settingArrow}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>학습 레벨</span>
            <span className={styles.settingValue}>초보</span>
            <span className={styles.settingArrow}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
