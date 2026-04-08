import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import styles from './SessionResultPage.module.css';

const XP_PER_CORRECT = 10;

function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let rafId: number;
    let start: number | null = null;
    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (start === null) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay]);

  return value;
}

export function SessionResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { total = 12, correct = 10, xpEarned: xpFromApi } =
    (location.state as { total: number; correct: number; xpEarned?: number }) ?? {};
  const xpEarned = xpFromApi ?? correct * XP_PER_CORRECT;
  const accuracy = Math.round((correct / total) * 100);
  const isPerfect = correct === total;

  const animatedCorrect = useCountUp(correct, 900, 400);
  const animatedAccuracy = useCountUp(accuracy, 900, 500);
  const animatedXp = useCountUp(xpEarned, 1000, 600);

  // confetti
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

    const shoot = (delay: number, angle: number, origin: { x: number; y: number }) => {
      setTimeout(() => {
        myConfetti({
          angle,
          spread: 55,
          particleCount: isPerfect ? 60 : 40,
          origin,
          colors: ['#3182F6', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'],
          ticks: 200,
          gravity: 1.2,
          scalar: 0.9,
        });
      }, delay);
    };

    shoot(100, 60, { x: 0.1, y: 0.6 });
    shoot(100, 120, { x: 0.9, y: 0.6 });
    if (isPerfect) {
      shoot(400, 90, { x: 0.5, y: 0.4 });
      shoot(700, 60, { x: 0.2, y: 0.5 });
      shoot(700, 120, { x: 0.8, y: 0.5 });
    }

    return () => myConfetti.reset();
  }, [isPerfect]);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
  };

  return (
    <div className={styles.page}>
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className={styles.confettiCanvas} />

      <div className={styles.content}>
        <motion.div
          className={styles.titleArea}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.05 }}
        >
          <span className={styles.titleEmoji}>{isPerfect ? '🎉' : '✅'}</span>
          <p className={styles.title}>{isPerfect ? '퍼펙트!' : '세션 완료!'}</p>
        </motion.div>

        <motion.div
          className={styles.statsGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className={styles.statCard} variants={cardVariants}>
            <span className={styles.statValue}>{animatedAccuracy}%</span>
            <span className={styles.statLabel}>정답률</span>
          </motion.div>

          <motion.div className={styles.statCard} variants={cardVariants}>
            <span className={styles.statValue}>
              {animatedCorrect}<span className={styles.statValueSmall}>/{total}</span>
            </span>
            <span className={styles.statLabel}>정답</span>
          </motion.div>

          <motion.div className={`${styles.statCard} ${styles.statCardXp}`} variants={cardVariants}>
            <span className={`${styles.statValue} ${styles.statValueXp}`}>
              +{animatedXp}
            </span>
            <span className={styles.statLabel}>획득 XP</span>
            <div className={styles.shimmer} />
          </motion.div>
        </motion.div>
      </div>

      <div className={styles.footer}>
        <motion.button
          className={styles.retryButton}
          onClick={() => navigate('/session')}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.97 }}
        >
          다시 학습하기
        </motion.button>
        <motion.button
          className={styles.homeButton}
          onClick={() => navigate('/home')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          whileTap={{ scale: 0.97 }}
        >
          오늘 그만할래요
        </motion.button>
      </div>
    </div>
  );
}
