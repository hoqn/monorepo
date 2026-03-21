import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { sampleWords } from '../data/sample-words.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { Question } from '../types/word.ts';
import styles from './SessionPage.module.css';

const MAX_LIVES = 5;
const SESSION_QUESTION_COUNT = 12;

type AnswerState = 'idle' | 'correct' | 'incorrect';

export function SessionPage() {
  const navigate = useNavigate();

  const questions = useMemo(
    () => generateQuestions(sampleWords, SESSION_QUESTION_COUNT),
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [showQuitModal, setShowQuitModal] = useState(false);

  const current: Question = questions[currentIndex];
  const progress = currentIndex / questions.length;

  const handleSelectOption = useCallback(
    (option: string) => {
      if (answerState !== 'idle') return;

      const isCorrect = option === current.answer;
      setSelectedOption(option);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');

      if (isCorrect) {
        generateHapticFeedback({ type: 'success' });
      } else {
        generateHapticFeedback({ type: 'error' });
        setLives((prev) => prev - 1);
      }
    },
    [answerState, current.answer]
  );

  const handleNext = useCallback(() => {
    const newLives = answerState === 'incorrect' ? lives : lives;

    if (newLives <= 0) {
      // 목숨 소진 → 복습 서브세션
      navigate('/session/recovery', { state: { fromSession: true } });
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      // 세션 완료
      navigate('/session/result', {
        state: {
          total: questions.length,
          correct: questions.reduce((acc, _, i) => {
            // 간소화: 실제로는 각 문항 결과를 추적해야 함
            return acc;
          }, 0),
        },
      });
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswerState('idle');
  }, [answerState, lives, currentIndex, questions.length, navigate]);

  const handleClosePress = () => {
    setShowQuitModal(true);
  };

  const handleConfirmQuit = () => {
    navigate('/');
  };

  const feedbackVisible = answerState !== 'idle';
  const isCorrectAnswer = answerState === 'correct';

  return (
    <div className={styles.page}>
      {/* 헤더: 닫기 + 프로그레스 바 + 목숨 */}
      <header className={styles.header}>
        <button
          className={styles.closeButton}
          onClick={handleClosePress}
          aria-label="세션 종료"
        >
          ✕
        </button>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className={styles.hearts} aria-label={`남은 목숨: ${lives}`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span
              key={i}
              className={`${styles.heart} ${i >= lives ? styles.heartLost : ''}`}
            >
              ❤️
            </span>
          ))}
        </div>
      </header>

      {/* 단어 카드 */}
      <div className={styles.cardArea}>
        <div
          className={`${styles.wordCard} ${
            answerState !== 'idle' ? styles[answerState] : ''
          }`}
        >
          <span className={styles.wordText}>{current.word.word}</span>
          <span className={styles.wordMeaning}>{current.word.meaningKo}</span>
        </div>
      </div>

      {/* 답안 영역 */}
      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>
          {current.type === 'article' ? '이 단어의 성(관사)은?' : '복수형은?'}
        </p>

        {current.type === 'article' ? (
          <div className={styles.articleOptions}>
            {current.options.map((option) => (
              <OptionButton
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
              <OptionButton
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

      {/* 피드백 패널 */}
      <div
        className={`${styles.feedbackPanel} ${feedbackVisible ? styles.visible : ''} ${
          answerState !== 'idle' ? styles[answerState] : ''
        }`}
      >
        <div className={styles.feedbackContent}>
          <span className={styles.feedbackTitle}>
            {isCorrectAnswer ? '정답!' : '오답'}
          </span>
          <span className={styles.feedbackDesc}>
            {isCorrectAnswer
              ? `${current.type === 'article' ? current.answer : ''} ${current.word.word}`
              : `정답: ${current.answer}`}
          </span>
        </div>
        <button className={styles.nextButton} onClick={handleNext}>
          다음
        </button>
      </div>

      {/* 종료 확인 모달 */}
      {showQuitModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQuitModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>정말 그만할까요?</p>
            <p className={styles.modalDesc}>진행 중인 세션이 저장되지 않아요.</p>
            <div className={styles.modalButtons}>
              <button className={styles.modalQuitButton} onClick={handleConfirmQuit}>
                그만하기
              </button>
              <button
                className={styles.modalContinueButton}
                onClick={() => setShowQuitModal(false)}
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 답안 버튼 컴포넌트
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
    <button
      className={className}
      onClick={() => onSelect(option)}
      disabled={isAnswered}
    >
      {option}
    </button>
  );
}
