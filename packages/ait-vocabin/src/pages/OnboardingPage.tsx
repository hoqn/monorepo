import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { updateProfile } from '../lib/local-profile.ts';
import styles from './OnboardingPage.module.css';

// 5문제 진단
const DIAG_WORDS = [
  { word: 'Hund', meaning: '개', answer: 'der' },
  { word: 'Katze', meaning: '고양이', answer: 'die' },
  { word: 'Haus', meaning: '집', answer: 'das' },
  { word: 'Frau', meaning: '여자', answer: 'die' },
  { word: 'Kind', meaning: '아이', answer: 'das' },
];

// TODO: 하루 목표·알림 설정은 AIT 알림 API 연동 후 온보딩 step 2·3으로 부활 예정
// const GOAL_OPTIONS = [
//   { count: 1, label: '세션/일', desc: '가볍게' },
//   { count: 2, label: '세션/일', desc: '꾸준히' },
//   { count: 3, label: '세션/일', desc: '집중적으로' },
// ];
// const TIME_OPTIONS = [
//   { id: 'dawn',      emoji: '🌙', label: '새벽',   range: '6시 이전' },
//   { id: 'morning',   emoji: '☀️', label: '아침',   range: '7–9시' },
//   { id: 'lunch',     emoji: '🥗', label: '점심',   range: '12–13시' },
//   { id: 'afternoon', emoji: '🌤', label: '낮',     range: '15–17시' },
//   { id: 'evening',   emoji: '🌇', label: '저녁',   range: '18–20시' },
//   { id: 'night',     emoji: '🌃', label: '밤',     range: '21–23시' },
// ];

// steps: 0=hook, 1=diag
const LIGHT_STEPS = 1; // step 1 only

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
  const [diagDone, setDiagDone] = useState(false);

  const canProceed = () => {
    if (step === 1) return diagDone;
    return true;
  };

  const handleNext = () => {
    if (step < 1) {
      generateHapticFeedback({ type: 'softMedium' });
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      doComplete();
    }
  };

  const doComplete = () => {
    updateProfile({
      cefrLevel: level === 'intermediate' ? 'A2' : 'A1',
      // dailyGoal, notifyTime은 설정 화면 구현 후 여기서 저장 예정
    });
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    navigate('/home', { replace: true });
  };

  return (
    <div className={styles.page}>
      {/* 다크 훅 — position absolute로 light 레이아웃 위를 덮음 */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            key="hook"
            className={styles.hookOverlay}
            initial={{ x: 0 }}
            exit={{ x: '-100%', transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } }}
          >
            <StepHook onStart={() => { setDirection(1); setStep(1); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스텝 인디케이터 (steps 1-3) */}
      <div className={styles.stepIndicator}>
        {Array.from({ length: LIGHT_STEPS }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.stepDot}
            animate={{
              width: i === step - 1 ? 20 : 6,
              backgroundColor: i < step - 1
                ? 'var(--color-primary)'
                : i === step - 1
                  ? 'var(--color-primary)'
                  : 'var(--color-progress-track)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        ))}
      </div>

      {/* 슬라이드 콘텐츠 영역 */}
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
            {step === 1 && (
              <StepDiag
                onDiagComplete={(lv) => { setLevel(lv); setDiagDone(true); }}
              />
            )}
            {/* step 2: StepGoal, step 3: StepNotify — AIT 알림 API 연동 후 복구 예정 */}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 버튼 */}
      <div className={styles.footer}>
        <motion.button
          className={styles.nextButton}
          onClick={handleNext}
          disabled={!canProceed()}
          whileTap={canProceed() ? { scale: 0.97 } : undefined}
        >
          {step === 1 ? '시작하기 →' : '다음'}
        </motion.button>
        {/* 알림 설정 스킵 버튼 — StepNotify 복구 시 step === 3 조건으로 되살릴 것 */}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   StepHook — 다크 시네마틱 인트로 (from origin/main)
──────────────────────────────────────────────── */
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
        <div className={`${styles.hookWord} ${styles.visible}`}>
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

/* ────────────────────────────────────────────────
   StepDiag — 5문제 진단 (from HPS-10)
──────────────────────────────────────────────── */
function StepDiag({
  onDiagComplete,
}: {
  onDiagComplete: (level: 'beginner' | 'intermediate') => void;
}) {
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagCorrect, setDiagCorrect] = useState(0);
  const [diagSelected, setDiagSelected] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [resultLevel, setResultLevel] = useState<'beginner' | 'intermediate' | null>(null);

  const current = DIAG_WORDS[diagIndex];

  const handleSelect = (option: string) => {
    if (diagSelected !== null) return;
    const isCorrect = option === current.answer;
    setDiagSelected(option);
    generateHapticFeedback({ type: isCorrect ? 'success' : 'error' });
    const newCorrect = diagCorrect + (isCorrect ? 1 : 0);
    setDiagCorrect(newCorrect);

    setTimeout(() => {
      if (diagIndex + 1 >= DIAG_WORDS.length) {
        const lv = newCorrect >= 3 ? 'intermediate' : 'beginner';
        setResultLevel(lv);
        setIsDone(true);
        onDiagComplete(lv);
      } else {
        setDiagIndex((i) => i + 1);
        setDiagSelected(null);
      }
    }, 700);
  };

  if (isDone && resultLevel) {
    return (
      <div className={styles.content}>
        <motion.div
          className={styles.illustArea}
          initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18 }}
        >
          {resultLevel === 'intermediate' ? '🌟' : '🌱'}
        </motion.div>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {resultLevel === 'intermediate' ? '중급 단어도\n포함해드릴게요!' : '초보 코스로\n시작해요!'}
        </motion.h2>
        <motion.p
          className={styles.desc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
        >
          {resultLevel === 'intermediate'
            ? 'A2 수준 단어도 함께 채집해요.'
            : 'A1 기초 단어부터 차근차근 채집해요.'}
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
                  onClick={() => handleSelect(opt)}
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

// TODO: AIT 알림 API 연동 후 아래 두 컴포넌트를 온보딩 step 2·3으로 복구할 것
// StepGoal — 하루 목표 선택 (GOAL_OPTIONS 참고)
// StepNotify — 알림 시간 선택 (TIME_OPTIONS 참고)
