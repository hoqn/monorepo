import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateHapticFeedback, appLogin } from '@apps-in-toss/web-framework';
import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { login } from '../lib/api.ts';
import styles from './OnboardingPage.module.css';

const IS_DEV = import.meta.env.DEV;
const DEV_USER = import.meta.env.VITE_DEV_USER as string | undefined;

async function resolveAuthCode(): Promise<{ authorizationCode?: string; devUserId?: string }> {
  if (IS_DEV || DEV_USER) return { devUserId: DEV_USER || 'local' };
  const { authorizationCode } = await appLogin();
  return { authorizationCode };
}

// 진단 단어 — 1문제
const DIAG_WORD = { word: 'Hund', meaning: '개', answer: 'der' };

// 컬렉션 예고용 단어들
const PREVIEW_WORDS = [
  'Haus', 'Frau', 'Kind', 'Auto', 'Stadt',
  'Buch', 'Zeit', 'Mann', 'Arbeit', 'Schule',
  'Wasser', 'Tisch', 'Straße', 'Jahr', 'Uhr',
];

const slideVariants = (direction: 1 | -1) => ({
  enter: { x: direction * 60, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
  exit: { x: direction * -60, opacity: 0, transition: { duration: 0.18 } },
});

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [level, setLevel] = useState<'beginner' | 'intermediate'>('beginner');
  const [isLoading, setIsLoading] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const authParams = await resolveAuthCode();
      await login({
        ...authParams,
        cefrLevel: level === 'intermediate' ? 'A2' : 'A1',
        dailyGoal: 1,
      });
    } catch {
      // 오프라인 등 실패 시에도 온보딩 완료 처리
    } finally {
      setIsLoading(false);
    }
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    navigate('/home', { replace: true });
  };

  const handleDiagSelect = (option: string) => {
    const isCorrect = option === DIAG_WORD.answer;
    generateHapticFeedback({ type: isCorrect ? 'success' : 'error' });
    setLevel(isCorrect ? 'intermediate' : 'beginner');
    setTimeout(goNext, 700);
  };

  return (
    <div className={styles.page}>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={step}
          className={styles.stepFill}
          custom={direction}
          variants={slideVariants(direction)}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {step === 0 && <StepHook onStart={goNext} />}
          {step === 1 && <StepDiag onSelect={handleDiagSelect} />}
          {step === 2 && <StepPreview onStart={handleComplete} isLoading={isLoading} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Step 0: Hook ─────────────────────────────────────────────────────────────

function StepHook({ onStart }: { onStart: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={styles.hookPage}>
      <div className={styles.hookCenter}>
        <div className={`${styles.hookWord} ${phase >= 0 ? styles.visible : ''}`}>
          <span className={styles.hookArticle}>der</span>
          <span className={styles.hookNoun}>Hund</span>
          <span className={styles.hookMeaning}>개</span>
        </div>

        <div className={styles.hookLines}>
          <p className={`${styles.hookLine} ${phase >= 1 ? styles.visible : ''}`}>
            독일어는 모든 명사에 성별이 있다.
          </p>
          <p className={`${styles.hookLine} ${styles.hookLineSecondary} ${phase >= 2 ? styles.visible : ''}`}>
            der, die, das — 이걸 느낌으로 익히는 앱이에요.
          </p>
        </div>
      </div>

      <div className={`${styles.hookFooter} ${phase >= 3 ? styles.visible : ''}`}>
        <button className={styles.startButton} onClick={onStart}>
          시작하기
        </button>
      </div>
    </div>
  );
}

// ─── Step 1: 진단 (1문제) ──────────────────────────────────────────────────────

function StepDiag({ onSelect }: { onSelect: (v: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (opt: string) => {
    if (selected !== null) return;
    setSelected(opt);
    onSelect(opt);
  };

  const isCorrect = (opt: string) => opt === DIAG_WORD.answer;

  return (
    <div className={styles.diagPage}>
      <p className={styles.diagHint}>딱 한 문제만요.</p>

      <div className={styles.diagCard}>
        <span className={styles.diagWord}>{DIAG_WORD.word}</span>
        <span className={styles.diagMeaning}>{DIAG_WORD.meaning}</span>
      </div>

      <div className={styles.articleButtons}>
        {['der', 'die', 'das'].map((opt) => {
          let cls = styles.articleButton;
          if (selected === opt) {
            cls += ` ${isCorrect(opt) ? styles.articleCorrect : styles.articleIncorrect}`;
          } else if (selected !== null && isCorrect(opt)) {
            cls += ` ${styles.articleCorrect}`;
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: 컬렉션 예고 ───────────────────────────────────────────────────────

function StepPreview({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className={styles.previewPage}>
      <div className={styles.previewWordGrid} aria-hidden="true">
        {PREVIEW_WORDS.map((word) => (
          <span key={word} className={styles.previewWord}>{word}</span>
        ))}
      </div>

      <div className={styles.previewCenter}>
        <p className={styles.previewText}>
          여기 있는 단어들,<br />
          전부 당신 거예요.
        </p>
      </div>

      <div className={`${styles.hookFooter} ${styles.visible}`}>
        <button className={styles.startButton} onClick={onStart} disabled={isLoading}>
          {isLoading ? '잠깐만요...' : '첫 단어 채집하기'}
        </button>
        <p className={styles.previewSub}>언제든 설정 변경 가능</p>
      </div>
    </div>
  );
}
