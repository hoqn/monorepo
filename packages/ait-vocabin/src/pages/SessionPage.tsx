import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { getReviewWords, createSession, completeSession, mapWord } from '../lib/api.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { Question } from '../types/word.ts';
import styles from './SessionPage.module.css';

const MAX_LIVES = 5;
const SESSION_QUESTION_COUNT = 12;

type AnswerState = 'idle' | 'correct' | 'incorrect';

// der=파랑, die=빨강, das=초록
const ARTICLE_COLOR: Record<string, string> = {
  der: 'blue',
  die: 'red',
  das: 'green',
};

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
      } catch (e) {
        setError('단어를 불러오지 못했어요. 네트워크를 확인해주세요.\n\n' + (e instanceof Error ? e.message : ''));
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

  const feedbackVisible = answerState !== 'idle';
  const isCorrectAnswer = answerState === 'correct';

  useAITBackHandler(useCallback(() => setShowQuitModal(true), []));

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
        <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '0 24px' , whiteSpace: 'pre-wrap' }}>
          {error ?? '준비된 단어가 없어요.'}
        </p>
        <button className={styles.errorBackButton} onClick={() => navigate('/home')}>홈으로</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* 상단 헤더 */}
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={() => setShowQuitModal(true)} aria-label="세션 종료">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.livesRow} aria-label={`남은 목숨: ${lives}`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className={`${styles.liveDot} ${i >= lives ? styles.liveDotLost : ''}`} />
          ))}
        </div>
      </header>

      {/* 단어 카드 + 선택지 */}
      <div className={styles.cardArea}>
        <div
          key={currentIndex}
          className={`${styles.wordCard} ${answerState !== 'idle' ? styles[answerState] : ''}`}
        >
          <span className={styles.wordText}>{current.word.word}</span>
          <span key={`meaning-${currentIndex}`} className={styles.wordMeaning}>
            {current.word.meaningKo}
          </span>
        </div>

        <div className={styles.optionsArea}>
          {current.type === 'article' ? (
            <div className={styles.articleOptions}>
              {current.options.map((option) => (
                <ArticleButton
                  key={option}
                  option={option}
                  selected={selectedOption === option}
                  answerState={answerState}
                  correctAnswer={current.answer}
                  onSelect={handleSelectOption}
                />
              ))}
            </div>
          ) : (
            <div className={styles.pluralOptions}>
              {current.options.map((option) => (
                <PluralButton
                  key={option}
                  option={option}
                  selected={selectedOption === option}
                  answerState={answerState}
                  correctAnswer={current.answer}
                  onSelect={handleSelectOption}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 피드백 패널 */}
      <div className={`${styles.feedbackWrapper} ${feedbackVisible ? styles.open : ''} ${answerState !== 'idle' ? styles[answerState] : ''}`}>
        <div className={styles.feedbackPanel}>
          <div className={styles.feedbackInner}>
            <div className={styles.feedbackContent}>
              <span className={styles.feedbackTitle}>{isCorrectAnswer ? '정답!' : '오답'}</span>
              <span className={styles.feedbackDesc}>
                {isCorrectAnswer
                  ? `${current.type === 'article' ? current.answer + ' ' : ''}${current.word.word}`
                  : `정답: ${current.answer}`}
              </span>
            </div>
            <button className={styles.nextButton} onClick={handleNext}>다음</button>
          </div>
        </div>
      </div>

      {/* 종료 확인 모달 */}
      {showQuitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQuitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>정말 그만할까요?</p>
            <p className={styles.modalDesc}>진행 중인 세션이 저장되지 않아요.</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalQuitButton} onClick={() => navigate('/home')}>그만하기</button>
              <button className={styles.modalContinueButton} onClick={() => setShowQuitModal(false)}>계속하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 아티클 버튼 (der/die/das 색상 코딩) ─────────────────────────────────────

interface ArticleButtonProps {
  option: string;
  selected: boolean;
  answerState: AnswerState;
  correctAnswer: string;
  onSelect: (option: string) => void;
}

function ArticleButton({ option, selected, answerState, correctAnswer, onSelect }: ArticleButtonProps) {
  const isAnswered = answerState !== 'idle';
  const isCorrect = option === correctAnswer;
  const colorKey = ARTICLE_COLOR[option] ?? '';

  let cls = `${styles.articleButton} ${styles[`article_${colorKey}`] ?? ''}`;
  if (selected) {
    cls += isCorrect ? ` ${styles.articleSelected_correct}` : ` ${styles.articleSelected_incorrect}`;
  } else if (isAnswered && isCorrect) {
    cls += ` ${styles.articleSelected_correct}`;
  }

  return (
    <button className={cls} onClick={() => onSelect(option)} disabled={isAnswered}>
      {option}
    </button>
  );
}

// ── 복수형 버튼 ──────────────────────────────────────────────────────────────

interface PluralButtonProps {
  option: string;
  selected: boolean;
  answerState: AnswerState;
  correctAnswer: string;
  onSelect: (option: string) => void;
}

function PluralButton({ option, selected, answerState, correctAnswer, onSelect }: PluralButtonProps) {
  const isAnswered = answerState !== 'idle';
  const isCorrect = option === correctAnswer;

  let cls = styles.pluralButton;
  if (selected) {
    cls += isCorrect ? ` ${styles.pluralCorrect}` : ` ${styles.pluralIncorrect}`;
  } else if (isAnswered && isCorrect) {
    cls += ` ${styles.pluralCorrect}`;
  }

  return (
    <button className={cls} onClick={() => onSelect(option)} disabled={isAnswered}>
      {option}
    </button>
  );
}
