/**
 * CEFR 레벨업 도전 세션
 * 상위 레벨 단어 10문제, 7/10 이상 정답 시 승급
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { getMe, updateMe, getReviewWords, mapWord } from '../lib/api.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { playCorrect, playIncorrect, playPerfect, playComplete } from '../lib/sound.ts';
import { Question } from '../types/word.ts';
import confetti from 'canvas-confetti';
import styles from './SessionLevelupPage.module.css';

const QUESTION_COUNT = 10;
const PASS_COUNT = 7; // 10문제 중 7개 이상 정답
const AUTO_ADVANCE_DELAY = 1200;

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type CefrLevel = typeof CEFR_LEVELS[number];

const CEFR_NEXT: Record<string, CefrLevel | null> = {
  A1: 'A2', A2: 'B1', B1: 'B2', B2: null,
};

type Phase = 'loading' | 'quiz' | 'pass' | 'fail';
type AnswerState = 'idle' | 'correct' | 'incorrect';

export function SessionLevelupPage() {
  const navigate = useNavigate();
  useAITBackHandler(useCallback(() => navigate(-1), [navigate]));

  const [currentLevel, setCurrentLevel] = useState<string>('A1');
  const [targetLevel, setTargetLevel] = useState<CefrLevel>('A2');
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { user } = await getMe();
        const lvl = user.cefr_level as string;
        setCurrentLevel(lvl);
        const next = CEFR_NEXT[lvl];
        if (!next) {
          navigate(-1);
          return;
        }
        setTargetLevel(next);

        // 상위 레벨 단어로 문제 생성
        const { words } = await getReviewWords(QUESTION_COUNT);
        if (words.length === 0) {
          navigate(-1);
          return;
        }
        setQuestions(generateQuestions(words.map(mapWord), QUESTION_COUNT));
        setPhase('quiz');
      } catch {
        navigate(-1);
      }
    })();
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const current = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) : 0;

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      const passed = correctCount >= PASS_COUNT || (answerState === 'correct' && correctCount + 1 >= PASS_COUNT);
      const finalCorrect = answerState === 'correct' ? correctCount + 1 : correctCount;
      if (finalCorrect >= PASS_COUNT) {
        // 승급!
        updateMe({ cefrLevel: targetLevel }).catch(() => {});
        setPhase('pass');
        playPerfect();
      } else {
        setPhase('fail');
        playComplete();
      }
      return;
    }
    setCurrentIndex((p) => p + 1);
    setSelectedOption(null);
    setAnswerState('idle');
  }, [currentIndex, questions.length, correctCount, answerState, targetLevel]);

  const handleSelect = useCallback((option: string) => {
    if (answerState !== 'idle' || !current) return;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    const isCorrect = option === current.answer;
    setSelectedOption(option);
    setAnswerState(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      generateHapticFeedback({ type: 'success' });
      playCorrect();
      setCorrectCount((c) => c + 1);
      autoTimerRef.current = setTimeout(goNext, AUTO_ADVANCE_DELAY);
    } else {
      generateHapticFeedback({ type: 'error' });
      playIncorrect();
      // 오답 시 자동 진행 없음
    }
  }, [answerState, current, goNext]);

  // 승급 시 컨페티
  useEffect(() => {
    if (phase !== 'pass' || !canvasRef.current) return;
    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    const shoot = (delay: number, angle: number, origin: { x: number; y: number }) => {
      setTimeout(() => {
        myConfetti({ angle, spread: 60, particleCount: 70, origin, colors: ['#3182F6', '#22C55E', '#F59E0B', '#8B5CF6'], ticks: 250, gravity: 1.1, scalar: 0.95 });
      }, delay);
    };
    shoot(100, 60, { x: 0.1, y: 0.6 });
    shoot(100, 120, { x: 0.9, y: 0.6 });
    shoot(400, 90, { x: 0.5, y: 0.4 });
    shoot(700, 60, { x: 0.2, y: 0.5 });
    shoot(700, 120, { x: 0.8, y: 0.5 });
    return () => myConfetti.reset();
  }, [phase]);

  if (phase === 'loading' || !current) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>준비 중...</p>
      </div>
    );
  }

  if (phase === 'pass') {
    return (
      <div className={styles.page}>
        <canvas ref={canvasRef} className={styles.confettiCanvas} />
        <div className={styles.resultArea}>
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
          >
            <div className={styles.levelupBadge}>
              <span className={styles.levelupFrom}>{currentLevel}</span>
              <span className={styles.levelupArrow}>→</span>
              <span className={styles.levelupTo}>{targetLevel}</span>
            </div>
          </motion.div>
          <motion.p className={styles.resultTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            레벨업 성공!
          </motion.p>
          <motion.p className={styles.resultDesc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {correctCount}/{questions.length}문제 정답 · {targetLevel} 단어도 함께 학습해요
          </motion.p>
          <motion.button
            className={styles.resultButton}
            onClick={() => navigate('/home')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            whileTap={{ scale: 0.97 }}
          >
            홈으로
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === 'fail') {
    return (
      <div className={styles.page}>
        <div className={styles.resultArea}>
          <motion.span className={styles.failEmoji} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 20 }}>
            💪
          </motion.span>
          <motion.p className={styles.resultTitle} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            아직 조금 어려웠어요
          </motion.p>
          <motion.p className={styles.resultDesc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            {correctCount}/{questions.length}문제 정답 · {targetLevel} 레벨까지 {PASS_COUNT - correctCount}문제 더 필요해요
          </motion.p>
          <motion.p className={styles.resultHint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            현재 레벨 단어를 더 연습하면 다시 도전할 수 있어요
          </motion.p>
          <motion.button
            className={styles.resultButton}
            onClick={() => navigate('/home')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileTap={{ scale: 0.97 }}
          >
            홈으로
          </motion.button>
        </div>
      </div>
    );
  }

  // quiz phase
  const isAnswered = answerState !== 'idle';
  const isCorrect = answerState === 'correct';

  return (
    <div className={styles.page}>
      {/* 헤더 */}
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={() => navigate(-1)}>✕</button>
        <div className={styles.levelupChip}>{currentLevel} → {targetLevel} 도전</div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <span className={styles.passIndicator}>{correctCount}/{PASS_COUNT}</span>
      </header>

      <div className={styles.questionCounter}>
        {currentIndex + 1} / {questions.length}
      </div>

      {/* 문제 카드 */}
      <div className={styles.cardArea}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            className={styles.cardSlide}
            initial={{ x: '60%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-60%', opacity: 0 }}
            transition={{ x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }, opacity: { duration: 0.2 } }}
          >
            <div className={styles.quizCardInner}>
              {/* 단어 카드 */}
              <div className={styles.wordCard}>
                <span className={styles.wordText}>
                  {current.kind === 'noun' ? current.word.word : current.verb.infinitive}
                </span>
                <span className={styles.wordMeaning}>
                  {current.kind === 'noun' ? current.word.meaningKo : current.verb.meaningKo}
                </span>
              </div>

              {/* 문제 & 선택지 */}
              <div className={styles.quizArea}>
                <p className={styles.questionLabel}>
                  {current.kind === 'noun'
                    ? current.type === 'article' ? '관사는?' : '복수형은?'
                    : `${current.verbForm.pronoun} — ${current.verbForm.tense}`}
                </p>
                {current.kind === 'verb' && (
                  <p className={styles.contextSentence}>
                    {current.contextSentence.replace('___', isAnswered ? current.answer : '___')}
                  </p>
                )}
                <div className={current.kind === 'noun' && current.type === 'article' ? styles.articleOptions : styles.pluralOptions}>
                  {current.options.map((opt) => {
                    let stateClass = '';
                    if (selectedOption === opt && isCorrect) stateClass = styles.optionCorrect;
                    else if (selectedOption === opt && !isCorrect) stateClass = styles.optionIncorrect;
                    else if (isAnswered && opt === current.answer) stateClass = styles.optionReveal;
                    return (
                      <motion.button
                        key={opt}
                        className={`${styles.optionButton} ${stateClass}`}
                        onClick={() => handleSelect(opt)}
                        disabled={isAnswered}
                        whileTap={!isAnswered ? { scale: 0.94 } : undefined}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && (
                    <motion.div
                      className={`${styles.feedbackRow} ${isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className={styles.feedbackText}>
                        <span>{isCorrect ? '✓ 정답이에요!' : `✕ 정답: ${current.answer}`}</span>
                      </div>
                      {isCorrect
                        ? null
                        : (
                          <motion.button className={styles.nextButton} onClick={goNext} whileTap={{ scale: 0.96 }}>
                            다음 →
                          </motion.button>
                        )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
