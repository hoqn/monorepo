import { motion } from 'motion/react';
import styles from './Dialog.module.css';

interface DialogProps {
  /** 백드롭 클릭 시 호출. undefined면 백드롭 탭으로 닫히지 않음 */
  onClose?: () => void;
  children: React.ReactNode;
  /**
   * 트리거 요소의 viewport 중심 좌표.
   * 지정하면 해당 지점에서 카드가 펼쳐지는 효과를 냄.
   */
  origin?: { x: number; y: number };
}

export function Dialog({ onClose, children, origin }: DialogProps) {
  // 뷰포트 중심 대비 트리거의 오프셋 — 카드는 거기서 출발해 중앙으로 이동
  const ox = origin ? origin.x - window.innerWidth / 2 : 0;
  const oy = origin ? origin.y - window.innerHeight / 2 : 0;

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <div className={styles.centerWrapper}>
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.2, x: ox, y: oy }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.2, x: ox, y: oy }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}
