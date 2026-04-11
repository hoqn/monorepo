import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';

import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { getMe, MeResponse } from '../lib/api.ts';
import styles from './ProfilePage.module.css';

const IS_DEV_BUILD = !!import.meta.env.VITE_DEV_USER;

const XP_PER_LEVEL = 500;

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

function formatNotifyTime(t: string | null): string {
  if (!t) return '없음';
  const [h] = t.split(':').map(Number);
  if (h < 6) return '새벽';
  if (h < 12) return '아침';
  if (h < 18) return '오후';
  return '저녁';
}

export function ProfilePage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    getMe().then(setData).catch(() => {});
  }, []);

  const user = data?.user;
  const stats = data?.stats;

  const totalXp = user?.total_xp ?? 0;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_DONE_KEY);
    localStorage.removeItem('vocabin_token');
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* 다크 히어로 — 유저 정보 */}
      <div className={styles.heroArea}>

        <div className={styles.heroContent}>
          <div className={styles.avatar}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <span className={styles.userName}>{user?.display_name ?? '사용자'}</span>
          <span className={styles.levelBadge}>Lv.{level}</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* 통계 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats?.totalWords ?? 0}</span>
            <span className={styles.statLabel}>수집 단어</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{user?.current_streak ?? 0}</span>
            <span className={styles.statLabel}>현재 스트릭</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{user?.max_streak ?? 0}</span>
            <span className={styles.statLabel}>최장 스트릭</span>
          </div>
        </div>

        {/* 패턴 도감 */}
        <motion.div
          className={styles.patternEntry}
          onClick={() => navigate('/patterns')}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 20 }}>📖</span>
          <div style={{ flex: 1 }}>
            <p className={styles.patternEntryTitle}>패턴 도감</p>
            <p className={styles.patternEntrySub}>관사·복수형·동사 규칙 정리</p>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 20 }}>›</span>
        </motion.div>

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
            <span className={styles.settingValue}>{formatNotifyTime(user?.notify_time ?? null)}</span>
            <span className={styles.settingChevron}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>하루 목표</span>
            <span className={styles.settingValue}>{user?.daily_goal ?? 1} 세션</span>
            <span className={styles.settingChevron}>›</span>
          </div>
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>학습 레벨</span>
            <span className={styles.settingValue}>{user?.cefr_level ?? '—'}</span>
            <span className={styles.settingChevron}>›</span>
          </div>
        </div>

        {IS_DEV_BUILD && (
          <button className={styles.devResetButton} onClick={resetOnboarding}>
            [DEV] 온보딩 초기화
          </button>
        )}
      </div>
    </div>
  );
}
