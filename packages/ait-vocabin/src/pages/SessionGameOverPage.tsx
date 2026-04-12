import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import styles from './SessionGameOverPage.module.css';

const MAX_LIVES = 5;

export function SessionGameOverPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { correctCount = 0, totalCount = 0 } =
    (location.state as { correctCount?: number; totalCount?: number }) ?? {};

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.heartsRow}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <motion.span
              key={i}
              className={styles.heart}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
              transition={{ delay: i * 0.1, duration: 0.35, ease: 'easeIn' }}
            >
              🤍
            </motion.span>
          ))}
        </div>

        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, type: 'spring', stiffness: 260, damping: 24 }}
        >
          아쉬워요!
        </motion.h2>

        <motion.p
          className={styles.desc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.54 }}
        >
          {totalCount}문제 중 <strong>{correctCount}개</strong> 맞췄어요
        </motion.p>

        <div className={styles.buttons}>
          <motion.button
            className={styles.continueButton}
            onClick={() => navigate('/session/recovery', { state: { fromSession: true } })}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            whileTap={{ scale: 0.97 }}
          >
            계속하기
          </motion.button>
          <motion.button
            className={styles.quitButton}
            onClick={() => navigate('/home')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.74 }}
            whileTap={{ scale: 0.97 }}
          >
            포기하고 나가기
          </motion.button>
        </div>
      </div>
    </div>
  );
}
