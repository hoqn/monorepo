import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { getReviewWords, createSession, completeSession, mapWord } from '../lib/api.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { Question } from '../types/word.ts';
import styles from './SessionPage.module.css';

const MAX_LIVES = 5;
const SESSION_QUESTION_COUNT = 12;
const AUTO_ADVANCE_DELAY = 1400;

type AnswerState = 'idle' | 'correct' | 'incorrect';

export function SessionPage() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const resultsRef = useRef<Array<{ wordId: string; questionType: 'article' | 'plural'; correct: boolean }>>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [comboCount, setComboCount] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ words }, { sessionId }] = await Promise.all([
          getReviewWords(SESSION_QUESTION_COUNT),
          createSession(),
        ]);

        if (words.length === 0) {
          setError('복습할 단어가 없어요. 잠시 후 다시 시도해주세요.');
          return;
        }

        sessionIdRef.current = sessionId;
        setQuestions(generateQuestions(words.map(mapWord), SESSION_QUESTION_COUNT));
      } catch {
        setError('단어를 불러오지 못했어요. 네트워크를 확인해주세요.');
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const current: Question | undefined = questions[currentIndex];
  const progress = questions.length > 0 ? currentIndex / questions.length : 0;

  const goNext = useCallback(async () => {
    if (currentIndex + 1 >= questions.length) {
      const sessionId = sessionIdRef.current;
      let xpEarned = correctCount * 10;

      if (sessionId) {
        try {
          const result = await completeSession(sessionId, resultsRef.current);
          xpEarned = result.xpEarned;
        } catch { /* ignore */ }
      }

      navigate('/session/result', {
        state: { total: questions.length, correct: correctCount, xpEarned },
      });
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswerState('idle');
  }, [currentIndex, questions.length, correctCount, navigate]);

  const handleSelectOption = useCallback(
    (option: string) => {
      if (answerState !== 'idle' || !current) return;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

      const isCorrect = option === current.answer;
      setSelectedOption(option);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');

      resultsRef.current.push({
        wordId: current.word.id,
        questionType: current.type,
        correct: isCorrect,
      });

      if (isCorrect) {
        generateHapticFeedback({ type: 'success' });
        setCorrectCount((c) => c + 1);
        setComboCount((c) => c + 1);
        autoTimerRef.current = setTimeout(goNext, AUTO_ADVANCE_DELAY);
      } else {
        generateHapticFeedback({ type: 'error' });
        setComboCount(0);
        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          setTimeout(() => setShowGameOver(true), 900);
        } else {
          autoTimerRef.current = setTimeout(goNext, AUTO_ADVANCE_DELAY);
        }
      }
    },
    [answerState, current, lives, goNext]
  );

  const handleManualNext = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    goNext();
  }, [goNext]);

  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>단어 불러오는 중...</p>
      </div>
    );
  }

  if (error || !current) {
    return (
      <div className={styles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0 24px' }}>
          {error ?? '준비된 단어가 없어요.'}
        </p>
        <button className={styles.primaryButton} onClick={() => navigate('/home')}>홈으로</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={() => setShowQuitModal(true)} aria-label="세션 종료">
          ✕
        </button>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.hearts} aria-label={`남은 목숨: ${lives}`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} isLost={i >= lives} />
          ))}
        </div>
      </header>

      {/* Question counter */}
      <div className={styles.questionCounter}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={currentIndex}
            className={styles.questionCounterCurrent}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
          >
            {currentIndex + 1}
          </motion.span>
        </AnimatePresence>
        <span className={styles.questionCounterTotal}> / {questions.length}</span>
      </div>

      {/* Combo chip — lives outside cardArea to avoid clipping, persists across questions */}
      <div className={styles.comboChipArea}>
        <AnimatePresence>
          {comboCount >= 2 && (
            <motion.div
              key={comboCount >= 5 ? 'hot' : 'normal'}
              className={`${styles.comboChip} ${comboCount >= 5 ? styles.comboChipHot : ''}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            >
              {comboCount >= 5
                ? `🔥🔥 ${comboCount} COMBO!`
                : comboCount >= 3
                  ? `🔥 ${comboCount} 콤보!`
                  : `✨ ${comboCount} 콤보`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card area — slide transitions happen here */}
      <div className={styles.cardArea}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentIndex}
            className={styles.cardSlide}
            initial={{ x: '60%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-60%', opacity: 0 }}
            transition={{
              x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.8 },
              opacity: { duration: 0.2 },
            }}
          >
            <QuizCard
              question={current}
              answerState={answerState}
              selectedOption={selectedOption}
              onSelect={handleSelectOption}
              onNext={handleManualNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Game Over Sheet */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverSheet
            correctCount={correctCount}
            totalCount={questions.length}
            onContinue={() => navigate('/session/recovery', { state: { fromSession: true } })}
            onQuit={() => navigate('/home')}
          />
        )}
      </AnimatePresence>

      {/* Quit Confirmation Sheet */}
      <AnimatePresence>
        {showQuitModal && (
          <QuitSheet
            onConfirm={() => navigate('/home')}
            onCancel={() => setShowQuitModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   QuizCard
───────────────────────────────────────────── */

interface QuizCardProps {
  question: Question;
  answerState: AnswerState;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
}

function QuizCard({ question, answerState, selectedOption, onSelect, onNext }: QuizCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isAnswered = answerState !== 'idle';
  const isCorrect = answerState === 'correct';

  useEffect(() => {
    const el = cardRef.current;
    if (!el || answerState === 'idle') return;

    if (answerState === 'correct') {
      el.animate(
        [
          { transform: 'translateY(0) scale(1)' },
          { transform: 'translateY(-14px) scale(1.03)' },
          { transform: 'translateY(0) scale(1)' },
        ],
        { duration: 480, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'none' }
      );
    } else {
      el.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-10px)' },
          { transform: 'translateX(10px)' },
          { transform: 'translateX(-7px)' },
          { transform: 'translateX(7px)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 440, easing: 'ease-in-out', fill: 'none' }
      );
    }
  }, [answerState]);

  return (
    <div className={styles.quizCardInner}>
      <div className={styles.wordCardWrapper}>
        <div
          ref={cardRef}
          className={`${styles.wordCard} ${isAnswered ? styles[`wordCard_${answerState}`] : ''}`}
        >
          <AnimatePresence>
            {isCorrect && (
              <motion.span
                className={styles.correctMark}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.08 }}
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
          <span className={styles.wordText}>{question.word.word}</span>
          <span className={styles.wordMeaning}>{question.word.meaningKo}</span>
        </div>
      </div>

      {/* Quiz area */}
      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>
          {question.type === 'article' ? '이 단어의 성(관사)은?' : '복수형은?'}
        </p>

        <div className={question.type === 'article' ? styles.articleOptions : styles.pluralOptions}>
          {question.options.map((option) => (
            <OptionButton
              key={option}
              option={option}
              selected={selectedOption === option}
              answerState={answerState}
              correctAnswer={question.answer}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Inline feedback row */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              className={`${styles.feedbackRow} ${styles[`feedbackRow_${answerState}`]}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className={styles.feedbackText}>
                <span className={styles.feedbackIcon}>{isCorrect ? '✓' : '✕'}</span>
                <span>
                  {isCorrect
                    ? '정답이에요!'
                    : `정답: ${question.answer}${question.type === 'article' ? ` ${question.word.word}` : ''}`}
                </span>
              </div>
              <motion.button
                className={styles.nextButton}
                onClick={onNext}
                whileTap={{ scale: 0.96 }}
              >
                다음 →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   OptionButton
───────────────────────────────────────────── */

interface OptionButtonProps {
  option: string;
  selected: boolean;
  answerState: AnswerState;
  correctAnswer: string;
  onSelect: (option: string) => void;
}

function OptionButton({ option, selected, answerState, correctAnswer, onSelect }: OptionButtonProps) {
  const isAnswered = answerState !== 'idle';
  const isCorrect = option === correctAnswer;

  let stateClass = '';
  if (selected && answerState === 'correct') stateClass = styles.optionCorrect;
  else if (selected && answerState === 'incorrect') stateClass = styles.optionIncorrect;
  else if (isAnswered && isCorrect) stateClass = styles.optionReveal;

  return (
    <motion.button
      className={`${styles.optionButton} ${stateClass}`}
      onClick={() => onSelect(option)}
      disabled={isAnswered}
      whileTap={!isAnswered ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {option}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────
   Heart
───────────────────────────────────────────── */

function Heart({ isLost }: { isLost: boolean }) {
  return (
    <motion.span
      className={`${styles.heart} ${isLost ? styles.heartLost : ''}`}
      animate={
        isLost
          ? { scale: [1, 1.35, 0.7, 1], transition: { duration: 0.38, ease: 'easeInOut' } }
          : { scale: 1 }
      }
    >
      ❤️
    </motion.span>
  );
}

/* ─────────────────────────────────────────────
   GameOverSheet
───────────────────────────────────────────── */

interface GameOverSheetProps {
  correctCount: number;
  totalCount: number;
  onContinue: () => void;
  onQuit: () => void;
}

function GameOverSheet({ correctCount, totalCount, onContinue, onQuit }: GameOverSheetProps) {
  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      >
        <div className={styles.sheetHandle} />

        <div className={styles.gameOverHearts}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <motion.span
              key={i}
              className={styles.gameOverHeart}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
              transition={{ delay: i * 0.1, duration: 0.35, ease: 'easeIn' }}
            >
              🤍
            </motion.span>
          ))}
        </div>

        <p className={styles.sheetTitle}>아쉬워요!</p>
        <p className={styles.sheetDesc}>
          {totalCount}문제 중 <strong>{correctCount}개</strong> 맞췄어요
        </p>

        <div className={styles.sheetButtons}>
          <motion.button
            className={styles.continueButton}
            onClick={onContinue}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileTap={{ scale: 0.97 }}
          >
            계속하기
          </motion.button>
          <motion.button
            className={styles.quitTextButton}
            onClick={onQuit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            whileTap={{ scale: 0.97 }}
          >
            포기하고 나가기
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ─────────────────────────────────────────────
   QuitSheet
───────────────────────────────────────────── */

interface QuitSheetProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function QuitSheet({ onConfirm, onCancel }: QuitSheetProps) {
  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24 }}
        onClick={onCancel}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className={styles.sheetHandle} />
        <p className={styles.sheetTitle}>정말 그만할까요?</p>
        <p className={styles.sheetDesc}>진행 중인 세션이 저장되지 않아요.</p>
        <div className={styles.sheetButtons}>
          <motion.button className={styles.quitButton} onClick={onConfirm} whileTap={{ scale: 0.97 }}>
            그만하기
          </motion.button>
          <motion.button className={styles.continueButton} onClick={onCancel} whileTap={{ scale: 0.97 }}>
            계속하기
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
