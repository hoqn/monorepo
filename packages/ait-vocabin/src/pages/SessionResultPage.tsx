import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SessionResultPage.module.css';

const XP_PER_CORRECT = 10;

export function SessionResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // SessionPage에서 state로 전달받은 결과 (없으면 mock)
  const { total = 12, correct = 10 } = (location.state as { total: number; correct: number }) ?? {};
  const accuracy = Math.round((correct / total) * 100);
  const xpEarned = correct * XP_PER_CORRECT;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.title}>세션 완료!</p>

        {/* 광고 영역 — 광고 미노출 시 일러스트 placeholder */}
        <div className={styles.adArea}>
          <span className={styles.adPlaceholder}>광고 또는 일러스트</span>
        </div>

        {/* 결과 통계 */}
        <div className={styles.statsCard}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{accuracy}%</span>
            <span className={styles.statLabel}>정답률</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{correct}/{total}</span>
            <span className={styles.statLabel}>정답</span>
          </div>
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.xpEarned}`}>+{xpEarned}</span>
            <span className={styles.statLabel}>획득 XP</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.closeButton} onClick={() => navigate('/home')}>
          닫기
        </button>
      </div>
    </div>
  );
}
