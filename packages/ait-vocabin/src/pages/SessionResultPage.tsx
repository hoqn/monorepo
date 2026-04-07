import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SessionResultPage.module.css';

const XP_PER_CORRECT = 10;

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export function SessionResultPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { total = 12, correct = 10, xpEarned: xpFromApi } =
    (location.state as { total: number; correct: number; xpEarned?: number }) ?? {};

  const xpEarned = xpFromApi ?? correct * XP_PER_CORRECT;
  const accuracy = Math.round((correct / total) * 100);

  const animatedCorrect = useCountUp(correct, 700);
  const animatedXp = useCountUp(xpEarned, 800);

  return (
    <div className={styles.page}>
      {/* 상단 다크 영역 */}
      <div className={styles.heroArea}>
        <p className={styles.heroSub}>오늘의 채집</p>
        <div className={styles.heroCount}>
          <span className={styles.heroNumber}>{animatedCorrect}</span>
          <span className={styles.heroTotal}>/ {total}</span>
        </div>
        <p className={styles.heroLabel}>단어 채집 완료</p>
      </div>

      {/* 통계 + 메시지 */}
      <div className={styles.content}>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{accuracy}%</span>
            <span className={styles.statLabel}>정답률</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <span className={`${styles.statValue} ${styles.xpValue}`}>+{animatedXp}</span>
            <span className={styles.statLabel}>획득 XP</span>
          </div>
        </div>

        <div className={styles.tomorrowNote}>
          <span className={styles.tomorrowIcon}>📅</span>
          <span className={styles.tomorrowText}>오늘 만난 단어, 내일 다시 볼게요</span>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className={styles.footer}>
        <button className={styles.homeButton} onClick={() => navigate('/home', { replace: true })}>
          오늘 끝내기
        </button>
      </div>
    </div>
  );
}
