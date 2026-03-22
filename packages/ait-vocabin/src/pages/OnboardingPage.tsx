import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateHapticFeedback, appLogin } from '@apps-in-toss/web-framework';

const IS_DEV = import.meta.env.DEV;

async function resolveAuthCode(): Promise<{ authorizationCode?: string; devUserId?: string }> {
  if (IS_DEV) return { devUserId: 'local' };
  const { authorizationCode } = await appLogin();
  return { authorizationCode };
}
import { ONBOARDING_DONE_KEY } from '../App.tsx';
import { login } from '../lib/api.ts';
import styles from './OnboardingPage.module.css';

const TOTAL_STEPS = 4;

// 진단 테스트용 단어 샘플 (5문항)
const DIAG_WORDS = [
  { word: 'Hund', meaning: '개', answer: 'der' },
  { word: 'Katze', meaning: '고양이', answer: 'die' },
  { word: 'Haus', meaning: '집', answer: 'das' },
  { word: 'Frau', meaning: '여자', answer: 'die' },
  { word: 'Kind', meaning: '아이', answer: 'das' },
];

const GOAL_OPTIONS = [
  { count: 1, label: '세션/일' },
  { count: 2, label: '세션/일' },
  { count: 3, label: '세션/일' },
];

const TIME_OPTIONS = [
  { id: 'dawn', emoji: '🌙', label: '새벽', range: '6시 이전' },
  { id: 'morning', emoji: '☀️', label: '아침', range: '7–9시' },
  { id: 'lunch', emoji: '🥗', label: '점심', range: '12–13시' },
  { id: 'afternoon', emoji: '🌤', label: '낮', range: '15–17시' },
  { id: 'evening', emoji: '🌇', label: '저녁', range: '18–20시' },
  { id: 'night', emoji: '🌃', label: '밤', range: '21–23시' },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [notifyTime, setNotifyTime] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 진단 테스트 상태
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
      setStep((s) => s + 1);
    } else {
      // 온보딩 완료 → 로그인 후 홈으로
      setIsLoggingIn(true);
      try {
        const authParams = await resolveAuthCode();
        await login({
          ...authParams,
          cefrLevel: level === 'intermediate' ? 'A2' : 'A1',
          dailyGoal: goal ?? 1,
          notifyTime: notifyTime ?? undefined,
        });
      } catch {
        // 로그인 실패해도 온보딩은 완료로 처리 (오프라인 등)
      } finally {
        setIsLoggingIn(false);
      }
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
        // 진단 완료 → 레벨 결정
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
          <div
            key={i}
            className={`${styles.stepDot} ${i === step ? styles.stepDotActive : ''}`}
          />
        ))}
      </div>

      {/* 각 스텝 컨텐츠 */}
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
      {step === 2 && (
        <StepGoal goal={goal} onSelect={setGoal} />
      )}
      {step === 3 && (
        <StepNotify notifyTime={notifyTime} onSelect={setNotifyTime} />
      )}

      {/* 하단 버튼 */}
      <div className={styles.footer}>
        <button
          className={styles.nextButton}
          onClick={handleNext}
          disabled={!canProceed() || isLoggingIn}
        >
          {isLoggingIn ? '잠깐만요...' : step === TOTAL_STEPS - 1 ? '시작하기' : '다음'}
        </button>
        {step === 3 && !isLoggingIn && (
          <button
            className={styles.skipButton}
            onClick={async () => {
              try {
                const authParams = await resolveAuthCode();
                await login({ ...authParams });
              } catch {
                // ignore
              }
              localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
              navigate('/home', { replace: true });
            }}
          >
            나중에 설정할게요
          </button>
        )}
      </div>
    </div>
  );
}

function StepIntro() {
  return (
    <div className={styles.content}>
      <div className={styles.illustArea}>🇩🇪</div>
      <h1 className={styles.title}>독일어 단어를{'\n'}매일 조금씩</h1>
      <p className={styles.desc}>
        스페이스드 리피티션으로 딱 필요한 타이밍에 복습해요.{'\n'}
        5개의 목숨으로 집중력 있게 학습해보세요.
      </p>
    </div>
  );
}

function StepDiag({
  diagIndex,
  diagSelected,
  diagDone,
  level,
  onSelect,
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
        <div className={styles.illustArea}>{level === 'intermediate' ? '🌟' : '🌱'}</div>
        <h2 className={styles.title}>
          {level === 'intermediate' ? '중급 단어도\n포함해드릴게요!' : '초보 코스로\n시작해요!'}
        </h2>
        <p className={styles.desc}>
          {level === 'intermediate'
            ? 'A2 수준 단어도 함께 학습해요.'
            : 'A1 기초 단어부터 차근차근 시작해요.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <p className={styles.desc}>독일어를 얼마나 알고 있는지 확인해볼게요.</p>
      <div className={styles.diagCard}>
        <p className={styles.diagProgress}>{diagIndex + 1} / {DIAG_WORDS.length}</p>
        <span className={styles.diagWord}>{current.word}</span>
        <span className={styles.diagMeaning}>{current.meaning}</span>
        <div className={styles.diagArticleOptions}>
          {['der', 'die', 'das'].map((opt) => {
            let cls = styles.diagOptionButton;
            if (diagSelected === opt) {
              cls += ` ${opt === current.answer ? styles.diagOptionCorrect : styles.diagOptionIncorrect}`;
            } else if (diagSelected !== null && opt === current.answer) {
              cls += ` ${styles.diagOptionCorrect}`;
            }
            return (
              <button key={opt} className={cls} onClick={() => onSelect(opt)} disabled={diagSelected !== null}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StepGoal({ goal, onSelect }: { goal: number | null; onSelect: (v: number) => void }) {
  return (
    <div className={styles.content}>
      <div className={styles.illustArea}>🎯</div>
      <h2 className={styles.title}>하루 목표를\n설정해요</h2>
      <p className={styles.desc}>언제든 바꿀 수 있어요.</p>
      <div className={styles.goalOptions}>
        {GOAL_OPTIONS.map((opt) => (
          <button
            key={opt.count}
            className={`${styles.goalCard} ${goal === opt.count ? styles.goalCardSelected : ''}`}
            onClick={() => onSelect(opt.count)}
          >
            <span className={styles.goalCount}>{opt.count}</span>
            <span className={styles.goalLabel}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepNotify({ notifyTime, onSelect }: { notifyTime: string | null; onSelect: (v: string) => void }) {
  return (
    <div className={styles.content}>
      <div className={styles.illustArea}>🔔</div>
      <h2 className={styles.title}>언제 알려드릴까요?</h2>
      <p className={styles.desc}>스트릭을 유지할 수 있도록 알림을 보내드려요.</p>
      <div className={styles.timeOptions}>
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`${styles.timeCard} ${notifyTime === opt.id ? styles.timeCardSelected : ''}`}
            onClick={() => onSelect(opt.id)}
          >
            <span className={styles.timeEmoji}>{opt.emoji}</span>
            <span className={styles.timeLabel}>{opt.label}</span>
            <span className={styles.timeRange}>{opt.range}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
