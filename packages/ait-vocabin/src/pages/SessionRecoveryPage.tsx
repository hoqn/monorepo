import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SessionRecoveryPage.module.css';

type Step = 'intro' | 'ad' | 'quiz' | 'complete';

export function SessionRecoveryPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');

  if (step === 'intro') {
    return <RecoveryIntro onStart={() => setStep('ad')} onQuit={() => navigate('/home')} />;
  }

  if (step === 'ad') {
    return <RecoveryAd onDone={() => setStep('quiz')} />;
  }

  if (step === 'quiz') {
    // 복습 퀴즈는 SessionPage와 동일한 구조 — 이후 공통 컴포넌트로 분리 예정
    return <RecoveryQuiz onComplete={() => setStep('complete')} />;
  }

  return <RecoveryComplete onContinue={() => navigate('/session')} />;
}

// 서브세션 진입 안내
function RecoveryIntro({ onStart, onQuit }: { onStart: () => void; onQuit: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.illustArea}>💡</div>
        <h2 className={styles.title}>조금 어려웠나요?</h2>
        <p className={styles.desc}>틀린 단어를 빠르게 복습하면 목숨이 돌아와요.</p>
      </div>
      <div className={styles.footer}>
        <button className={styles.primaryButton} onClick={onStart}>복습 시작하기</button>
        <button className={styles.ghostButton} onClick={onQuit}>그냥 끝내기</button>
      </div>
    </div>
  );
}

// 풀스크린 광고
function RecoveryAd({ onDone }: { onDone: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.adFullscreen}>
          <p className={styles.adText}>광고 영역</p>
          <button className={styles.adSkip} onClick={onDone}>건너뛰기</button>
        </div>
      </div>
    </div>
  );
}

// 복습 퀴즈 (placeholder — 이후 공통 SessionQuiz 컴포넌트로 분리)
function RecoveryQuiz({ onComplete }: { onComplete: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.recoveryBadge}>복습 중</p>
        <p className={styles.desc}>복습 퀴즈 (구현 예정)</p>
        <button className={styles.primaryButton} onClick={onComplete}>완료</button>
      </div>
    </div>
  );
}

// 목숨 회복 안내
function RecoveryComplete({ onContinue }: { onContinue: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.illustArea}>❤️</div>
        <h2 className={styles.title}>목숨 회복!</h2>
        <p className={styles.desc}>다시 도전해볼까요?</p>
      </div>
      <div className={styles.footer}>
        <button className={styles.primaryButton} onClick={onContinue}>계속하기</button>
      </div>
    </div>
  );
}
