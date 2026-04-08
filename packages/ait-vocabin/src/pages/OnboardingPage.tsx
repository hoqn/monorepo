import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateHapticFeedback, appLogin } from '@apps-in-toss/web-framework';
import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { login } from '../lib/api.ts';
import styles from './OnboardingPage.module.css';

const IS_DEV = import.meta.env.DEV;

async function resolveAuthCode(): Promise<{ authorizationCode?: string; devUserId?: string }> {
  if (IS_DEV) return { devUserId: 'local' };
  const { authorizationCode } = await appLogin();
  return { authorizationCode };
}

const TOTAL_STEPS = 4;

const DIAG_WORDS = [
  { word: 'Hund', meaning: '개', answer: 'der' },
  { word: 'Katze', meaning: '고양이', answer: 'die' },
  { word: 'Haus', meaning: '집', answer: 'das' },
  { word: 'Frau', meaning: '여자', answer: 'die' },
  { word: 'Kind', meaning: '아이', answer: 'das' },
];

const GOAL_OPTIONS = [
  { count: 1, label: '세션/일', desc: '가볍게' },
  { count: 2, label: '세션/일', desc: '꾸준히' },
  { count: 3, label: '세션/일', desc: '집중적으로' },
];

const TIME_OPTIONS = [
  { id: 'dawn',      emoji: '🌙', label: '새벽',   range: '6시 이전' },
  { id: 'morning',   emoji: '☀️', label: '아침',   range: '7–9시' },
  { id: 'lunch',     emoji: '🥗', label: '점심',   range: '12–13시' },
  { id: 'afternoon', emoji: '🌤', label: '낮',     range: '15–17시' },
  { id: 'evening',   emoji: '🌇', label: '저녁',   range: '18–20시' },
  { id: 'night',     emoji: '🌃', label: '밤',     range: '21–23시' },
];

// 방향에 따른 슬라이드 variants
const slideVariants = (direction: 1 | -1) => ({
  enter: { x: direction * 60, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
  exit: { x: direction * -60, opacity: 0, transition: { duration: 0.18 } },
});

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [notifyTime, setNotifyTime] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [diagIndex, setDiagIndex] = useState(0);
  const [diagCorrect, setDiagCorrect] = useState(0);
  const [diagSelected, setDiagSelected] = useState<string | null>(null);
  const [diagDone, setDiagDone] = useState(false);

  const canProceed = () => {
    if (step === 1) return diagDone;
    if (step === 2) return goal !== null;
    if (step === 3) return notifyTime !== null;
    return true;
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      generateHapticFeedback({ type: 'softMedium' });
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      setIsLoggingIn(true);
      try {
        const authParams = await resolveAuthCode();
        await login({
          ...authParams,
          cefrLevel: level === 'intermediate' ? 'A2' : 'A1',
          dailyGoal: goal ?? 1,
          notifyTime: notifyTime ?? undefined,
        });
      } catch { /* ignore */ }
      finally { setIsLoggingIn(false); }
      localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
      navigate('/home', { replace: true });
    }
  };

  const handleDiagSelect = (option: string) => {
    if (diagSelected !== null) return;
    const current = DIAG_WORDS[diagIndex];
    const isCorrect = option === current.answer;
    setDiagSelected(option);
    generateHapticFeedback({ type: isCorrect ? 'success' : 'error' });
    if (isCorrect) setDiagCorrect((c) => c + 1);

    setTimeout(() => {
      if (diagIndex + 1 >= DIAG_WORDS.length) {
        const score = diagCorrect + (isCorrect ? 1 : 0);
        setLevel(score >= 3 ? 'intermediate' : 'beginner');
        setDiagDone(true);
      } else {
        setDiagIndex((i) => i + 1);
        setDiagSelected(null);
      }
    }, 700);
  };

  return (
    <div className={styles.page}>
      {/* 스텝 인디케이터 */}
      <div className={styles.stepIndicator}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.stepDot}
            animate={{
              width: i === step ? 20 : 6,
              backgroundColor: i <= step ? 'var(--color-primary)' : 'var(--color-progress-track)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        ))}
      </div>

      {/* 스텝 콘텐츠 슬라이드 */}
      <div className={styles.stepArea}>
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={step}
            className={styles.stepContent}
            custom={direction}
            variants={slideVariants(direction)}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {step === 0 && <StepIntro />}
            {step === 1 && (
              <StepDiag
                diagIndex={diagIndex}
                diagSelected={diagSelected}
                diagDone={diagDone}
                level={level}
                onSelect={handleDiagSelect}
              />
            )}
            {step === 2 && <StepGoal goal={goal} onSelect={setGoal} />}
            {step === 3 && <StepNotify notifyTime={notifyTime} onSelect={setNotifyTime} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 버튼 */}
      <div className={styles.footer}>
        <motion.button
          className={styles.nextButton}
          onClick={handleNext}
          disabled={!canProceed() || isLoggingIn}
          whileTap={canProceed() ? { scale: 0.97 } : undefined}
        >
          {isLoggingIn
            ? '잠깐만요...'
            : step === TOTAL_STEPS - 1
              ? '시작하기 →'
              : '다음'}
        </motion.button>
        {step === 3 && !isLoggingIn && (
          <motion.button
            className={styles.skipButton}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={async () => {
              try {
                const authParams = await resolveAuthCode();
                await login({ ...authParams });
              } catch { /* ignore */ }
              localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
              navigate('/home', { replace: true });
            }}
          >
            나중에 설정할게요
          </motion.button>
        )}
      </div>
    </div>
  );
}

/* ────────────── StepIntro ────────────── */
function StepIntro() {
  return (
    <div className={styles.content}>
      <motion.div
        className={styles.illustArea}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
      >
        🇩🇪
      </motion.div>
      <motion.h1
        className={styles.title}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        독일어 단어를{'\n'}매일 조금씩
      </motion.h1>
      <motion.p
        className={styles.desc}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        스페이스드 리피티션으로 딱 필요한 타이밍에 복습해요.{'\n'}
        5개의 목숨으로 집중력 있게 학습해보세요.
      </motion.p>
    </div>
  );
}

/* ────────────── StepDiag ────────────── */
function StepDiag({
  diagIndex, diagSelected, diagDone, level, onSelect,
}: {
  diagIndex: number;
  diagSelected: string | null;
  diagDone: boolean;
  level: 'beginner' | 'intermediate' | null;
  onSelect: (v: string) => void;
}) {
  const current = DIAG_WORDS[diagIndex];

  if (diagDone && level) {
    return (
      <div className={styles.content}>
        <motion.div
          className={styles.illustArea}
          initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        >
          {level === 'intermediate' ? '🌟' : '🌱'}
        </motion.div>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {level === 'intermediate' ? '중급 단어도\n포함해드릴게요!' : '초보 코스로\n시작해요!'}
        </motion.h2>
        <motion.p
          className={styles.desc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          {level === 'intermediate' ? 'A2 수준 단어도 함께 학습해요.' : 'A1 기초 단어부터 차근차근 시작해요.'}
        </motion.p>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <p className={styles.desc}>독일어를 얼마나 알고 있는지 확인해볼게요.</p>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={diagIndex}
          className={styles.diagCard}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <div className={styles.diagProgressDots}>
            {DIAG_WORDS.map((_, i) => (
              <motion.span
                key={i}
                className={styles.diagDot}
                animate={{
                  backgroundColor: i < diagIndex
                    ? 'var(--color-correct)'
                    : i === diagIndex
                      ? 'var(--color-primary)'
                      : 'var(--color-progress-track)',
                  scale: i === diagIndex ? 1.3 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
          <span className={styles.diagWord}>{current.word}</span>
          <span className={styles.diagMeaning}>{current.meaning}</span>
          <div className={styles.diagArticleOptions}>
            {['der', 'die', 'das'].map((opt) => {
              const isSelected = diagSelected === opt;
              const isCorrect = opt === current.answer;
              let stateClass = '';
              if (isSelected) stateClass = isCorrect ? styles.diagOptionCorrect : styles.diagOptionIncorrect;
              else if (diagSelected !== null && isCorrect) stateClass = styles.diagOptionCorrect;

              return (
                <motion.button
                  key={opt}
                  className={`${styles.diagOptionButton} ${stateClass}`}
                  onClick={() => onSelect(opt)}
                  disabled={diagSelected !== null}
                  whileTap={diagSelected === null ? { scale: 0.93 } : undefined}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ────────────── StepGoal ────────────── */
function StepGoal({ goal, onSelect }: { goal: number | null; onSelect: (v: number) => void }) {
  return (
    <div className={styles.content}>
      <div className={styles.illustArea}>🎯</div>
      <h2 className={styles.title}>하루 목표를{'\n'}설정해요</h2>
      <p className={styles.desc}>언제든 바꿀 수 있어요.</p>
      <div className={styles.goalOptions}>
        {GOAL_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.count}
            className={`${styles.goalCard} ${goal === opt.count ? styles.goalCardSelected : ''}`}
            onClick={() => { generateHapticFeedback({ type: 'tickWeak' }); onSelect(opt.count); }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={styles.goalCount}>{opt.count}</span>
            <span className={styles.goalLabel}>{opt.label}</span>
            <span className={styles.goalDesc}>{opt.desc}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ────────────── StepNotify ────────────── */
function StepNotify({ notifyTime, onSelect }: { notifyTime: string | null; onSelect: (v: string) => void }) {
  return (
    <div className={styles.content}>
      <div className={styles.illustArea}>🔔</div>
      <h2 className={styles.title}>언제 알려드릴까요?</h2>
      <p className={styles.desc}>스트릭을 유지할 수 있도록 알림을 보내드려요.</p>
      <div className={styles.timeOptions}>
        {TIME_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            className={`${styles.timeCard} ${notifyTime === opt.id ? styles.timeCardSelected : ''}`}
            onClick={() => { generateHapticFeedback({ type: 'tickWeak' }); onSelect(opt.id); }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
            whileTap={{ scale: 0.94 }}
          >
            <span className={styles.timeEmoji}>{opt.emoji}</span>
            <span className={styles.timeLabel}>{opt.label}</span>
            <span className={styles.timeRange}>{opt.range}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
