import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';

import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { getProfile, type LocalProfile } from '../lib/local-profile.ts';
import { sampleWords } from '../data/sample-words.ts';
import styles from './ProfilePage.module.css';

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

// TODO: AIT 알림 API 연동 후 알림 시간 설정 행 복구 시 아래 함수도 함께 사용
// function formatNotifyTime(t: string | null): string { ... }

export function ProfilePage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [profile, setProfile] = useState<LocalProfile>(() => getProfile());

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const totalXp = profile.totalXp;
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_DONE_KEY);
    localStorage.removeItem('vocabin_profile');
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
          <span className={styles.userName}>{profile.displayName ?? '사용자'}</span>
          <span className={styles.levelBadge}>Lv.{level}</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* 통계 */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{sampleWords.length}</span>
            <span className={styles.statLabel}>수집 단어</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{profile.currentStreak}</span>
            <span className={styles.statLabel}>현재 스트릭</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={styles.statValue}>{profile.maxStreak}</span>
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
          {/* TODO: 알림 시간·하루 목표 설정은 AIT 알림 API 연동 후 복구 예정 */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>학습 레벨</span>
            <span className={styles.settingValue}>{profile.cefrLevel}</span>
            <span className={styles.settingChevron}>›</span>
          </div>
        </div>

        <button className={styles.devResetButton} onClick={resetOnboarding}>
          초기화
        </button>
      </div>
    </div>
  );
}
