import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { getReviewWords, createSession, completeSession, mapWord } from '../lib/api.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { Question } from '../types/word.ts';
import styles from './SessionPage.module.css';

const MAX_LIVES = 5;
const SESSION_QUESTION_COUNT = 12;

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
  const [showQuitModal, setShowQuitModal] = useState(false);

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
  }, []);

  const current: Question | undefined = questions[currentIndex];
  const progress = questions.length > 0 ? currentIndex / questions.length : 0;

  const handleSelectOption = useCallback(
    (option: string) => {
      if (answerState !== 'idle' || !current) return;

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
      } else {
        generateHapticFeedback({ type: 'error' });
        setLives((prev) => prev - 1);
      }
    },
    [answerState, current]
  );

  const handleNext = useCallback(async () => {
    if (lives <= 0) {
      navigate('/session/recovery', { state: { fromSession: true } });
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      const sessionId = sessionIdRef.current;
      let xpEarned = correctCount * 10;

      if (sessionId) {
        try {
          const result = await completeSession(sessionId, resultsRef.current);
          xpEarned = result.xpEarned;
        } catch {
          // API 실패해도 결과 화면은 표시
        }
      }

      navigate('/session/result', {
        state: { total: questions.length, correct: correctCount, xpEarned },
      });
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswerState('idle');
  }, [lives, currentIndex, questions.length, correctCount, navigate]);

  const handleClosePress = () => setShowQuitModal(true);
  const handleConfirmQuit = () => navigate('/home');

  const feedbackVisible = answerState !== 'idle';
  const isCorrectAnswer = answerState === 'correct';

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
        <button className={styles.nextButton} onClick={() => navigate('/home')}>홈으로</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={handleClosePress} aria-label="세션 종료">✕</button>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.hearts} aria-label={`남은 목숨: ${lives}`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`${styles.heart} ${i >= lives ? styles.heartLost : ''}`}>❤️</span>
          ))}
        </div>
      </header>

      <div className={styles.cardArea}>
        <div className={`${styles.wordCard} ${answerState !== 'idle' ? styles[answerState] : ''}`}>
          <span className={styles.wordText}>{current.word.word}</span>
          <span className={styles.wordMeaning}>{current.word.meaningKo}</span>
        </div>
      </div>

      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>
          {current.type === 'article' ? '이 단어의 성(관사)은?' : '복수형은?'}
        </p>

        {current.type === 'article' ? (
          <div className={styles.articleOptions}>
            {current.options.map((option) => (
              <OptionButton key={option} option={option} selected={selectedOption === option}
                answerState={answerState} correctAnswer={current.answer} onSelect={handleSelectOption} />
            ))}
          </div>
        ) : (
          <div className={styles.pluralOptions}>
            {current.options.map((option) => (
              <OptionButton key={option} option={option} selected={selectedOption === option}
                answerState={answerState} correctAnswer={current.answer} onSelect={handleSelectOption} />
            ))}
          </div>
        )}
      </div>

      <div className={`${styles.feedbackPanel} ${feedbackVisible ? styles.visible : ''} ${answerState !== 'idle' ? styles[answerState] : ''}`}>
        <div className={styles.feedbackContent}>
          <span className={styles.feedbackTitle}>{isCorrectAnswer ? '정답!' : '오답'}</span>
          <span className={styles.feedbackDesc}>
            {isCorrectAnswer
              ? `${current.type === 'article' ? current.answer : ''} ${current.word.word}`
              : `정답: ${current.answer}`}
          </span>
        </div>
        <button className={styles.nextButton} onClick={handleNext}>다음</button>
      </div>

      {showQuitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQuitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>정말 그만할까요?</p>
            <p className={styles.modalDesc}>진행 중인 세션이 저장되지 않아요.</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalQuitButton} onClick={handleConfirmQuit}>그만하기</button>
              <button className={styles.modalContinueButton} onClick={() => setShowQuitModal(false)}>계속하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  let className = styles.optionButton;
  if (selected) {
    className += ` ${styles.selected} ${styles[answerState]}`;
  } else if (isAnswered && isCorrect) {
    className += ` ${styles.showAnswer}`;
  }

  return (
    <button className={className} onClick={() => onSelect(option)} disabled={isAnswered}>
      {option}
    </button>
  );
}
