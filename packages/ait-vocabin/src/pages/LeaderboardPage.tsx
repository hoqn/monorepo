import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { isAIT } from '../lib/ait.ts';
import styles from './LeaderboardPage.module.css';

export function LeaderboardPage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  return (
    <div className={styles.page}>
      <div className={styles.heroArea}>
        {!isAIT && (
          <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="뒤로가기">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className={styles.heroContent}>
          <p className={styles.heroSub}>이번 주 순위</p>
          <div className={styles.myRankRow}>
            <span className={styles.myRankNumber}>—</span>
          </div>
        </div>
      </div>
      <p style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
        리더보드는 현재 준비 중이에요
      </p>
    </div>
  );
}
