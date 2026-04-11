import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAITBackHandler } from '../hooks/useAITBackHandler.ts';
import { getReviewWords, getReviewVerbs, createSession, completeSession, mapWord, mapVerb, mapVerbForm } from '../lib/api.ts';
import { generateQuestions } from '../utils/quiz.ts';
import { playCorrect, playIncorrect, playCombo, playGameOver } from '../lib/sound.ts';
import { Question, VerbQuestion } from '../types/word.ts';
import { findArticlePattern } from '../data/grammar-patterns.ts';
import styles from './SessionPage.module.css';

const MAX_LIVES = 5;
const SESSION_QUESTION_COUNT = 12;
const AUTO_ADVANCE_DELAY = 1400;


type AnswerState = 'idle' | 'correct' | 'incorrect';

// der=파랑, die=빨강, das=초록
const ARTICLE_COLOR: Record<string, string> = {
  der: 'blue',
  die: 'red',
  das: 'green',
};

export function SessionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 리뷰 모드: 결과 화면에서 오답 목록을 state로 전달받은 경우
  const reviewQuestions = (location.state as { reviewQuestions?: Question[]; sessionCount?: number } | null)?.reviewQuestions;
  const isReviewMode = !!reviewQuestions?.length;
  const sessionCount = (location.state as { sessionCount?: number } | null)?.sessionCount ?? SESSION_QUESTION_COUNT;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const resultsRef = useRef<Array<{ wordId?: string; verbId?: string; questionType: 'article' | 'plural' | 'verb_conjugation'; correct: boolean }>>([]);
  const wrongQuestionsRef = useRef<Question[]>([]);
  // wordId → repetitions 맵 (생산형 입력 모드 판단용)
  const progressMapRef = useRef<Map<string, number>>(new Map());

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [comboCount, setComboCount] = useState(0);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [completing, setCompleting] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintLevel, setHintLevel] = useState(0);       // 현재 문제 힌트 단계 (0=미사용, 1, 2)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0); // 세션 전체 힌트 사용 횟수
  const MAX_HINTS_PER_SESSION = 3;

  useAITBackHandler(useCallback(() => setShowQuitModal(true), []));

  useEffect(() => {
    // 리뷰 모드: API 호출 없이 전달받은 오답 목록 사용
    if (isReviewMode) {
      setQuestions(reviewQuestions!);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const verbLimit = Math.max(1, Math.floor(sessionCount / 3));
        const [wordsData, verbsResponse, { sessionId }] = await Promise.all([
          getReviewWords(sessionCount),
          getReviewVerbs(verbLimit).catch(() => ({ verbs: [] })),
          createSession(),
        ]);
        const { words } = wordsData;

        if (words.length === 0) {
          setError('복습할 단어가 없어요. 잠시 후 다시 시도해주세요.');
          return;
        }

        const verbPool = verbsResponse.verbs.map((v) => ({
          verb: mapVerb(v),
          forms: v.forms.map(mapVerbForm),
        }));

        // progress 맵 구성 (wordId → repetitions)
        for (const p of wordsData.progress) {
          progressMapRef.current.set(p.word_id, p.repetitions);
        }

        sessionIdRef.current = sessionId;
        setQuestions(generateQuestions(words.map(mapWord), sessionCount, verbPool));
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
      setCompleting(true);
      const sessionId = sessionIdRef.current;
      let xpEarned = correctCount * 10;

      if (sessionId) {
        try {
          const result = await completeSession(sessionId, resultsRef.current);
          xpEarned = result.xpEarned;
        } catch { /* ignore */ }
      }

      navigate('/session/result', {
        state: {
          total: questions.length,
          correct: correctCount,
          xpEarned,
          // 리뷰 모드가 아닐 때만 wrongQuestions 전달 (중복 복습 방지)
          wrongQuestions: isReviewMode ? undefined : wrongQuestionsRef.current,
        },
      });
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setAnswerState('idle');
    setHintLevel(0);
  }, [currentIndex, questions.length, correctCount, navigate]);

  const handleUseHint = useCallback(() => {
    if (answerState !== 'idle' || totalHintsUsed >= MAX_HINTS_PER_SESSION || hintLevel >= 2) return;
    generateHapticFeedback({ type: 'softMedium' });
    setHintLevel((prev) => prev + 1);
    setTotalHintsUsed((prev) => prev + 1);
  }, [answerState, totalHintsUsed, hintLevel]);

  const handleSelectOption = useCallback(
    (option: string) => {
      if (answerState !== 'idle' || !current) return;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

      const isCorrect = option === current.answer;
      setSelectedOption(option);
      setAnswerState(isCorrect ? 'correct' : 'incorrect');

      resultsRef.current.push(
        current.kind === 'noun'
          ? { wordId: current.word.id, questionType: current.type, correct: isCorrect }
          : { verbId: current.verb.id, questionType: 'verb_conjugation', correct: isCorrect }
      );

      if (!isCorrect) {
        wrongQuestionsRef.current.push(current);
      }

      if (isCorrect) {
        generateHapticFeedback({ type: 'success' });
        playCorrect();
        setCorrectCount((c) => c + 1);
        setComboCount((c) => {
          const next = c + 1;
          if (next >= 2) playCombo(next);
          return next;
        });
        autoTimerRef.current = setTimeout(goNext, AUTO_ADVANCE_DELAY);
      } else {
        generateHapticFeedback({ type: 'error' });
        playIncorrect();
        setComboCount(0);
        const newLives = lives - 1;
        setLives(newLives);

        if (newLives <= 0) {
          setTimeout(() => {
            playGameOver();
            setShowGameOver(true);
          }, 900);
        }
        // 오답 시에는 자동 진행하지 않음 — 문맥 카드를 읽을 시간을 줌
      }
    },
    [answerState, current, lives, goNext]
  );

  const handleManualNext = useCallback(() => {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    goNext();
  }, [goNext]);

  if (loading) {
    return <SessionLoadingScreen />;
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
      <header className={styles.header}>
        <button className={styles.closeButton} onClick={() => setShowQuitModal(true)} aria-label="세션 종료">
          ✕
        </button>
        {isReviewMode && (
          <span className={styles.reviewModeBadge}>복습 중</span>
        )}
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
        <div className={styles.hearts} aria-label={`남은 목숨: ${lives}`}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} isLost={i >= lives} />
          ))}
        </div>
      </header>

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

      <div className={styles.comboChipArea}>
        <AnimatePresence>
          {comboCount >= 2 && (
            <motion.div
              key="combo"
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
              hintLevel={hintLevel}
              hintsRemaining={MAX_HINTS_PER_SESSION - totalHintsUsed}
              onUseHint={handleUseHint}
              productionMode={
                current.kind === 'noun' && current.type !== 'article'
                  ? (progressMapRef.current.get(current.word.id) ?? 0) >= 3
                  : false
              }
            />
          </motion.div>
        </AnimatePresence>
      </div>

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

      <AnimatePresence>
        {showQuitModal && (
          <QuitSheet
            onConfirm={() => navigate('/home')}
            onCancel={() => setShowQuitModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completing && <CompletingOverlay />}
      </AnimatePresence>
    </div>
  );
}

const TENSE_KO: Record<string, string> = {
  'Präsens':     '현재형',
  'Präteritum':  '과거형',
  'Perfekt':     '현재완료',
};

/** ___ 를 강조된 빈칸 span으로 변환 */
function renderSentenceWithBlank(sentence: string, filled?: string) {
  const parts = sentence.split('___');
  if (parts.length === 1) return <span>{sentence}</span>;
  return (
    <>
      {parts[0]}
      <span style={{ borderBottom: '2.5px solid currentColor', paddingBottom: 1, minWidth: 32, display: 'inline-block', textAlign: 'center', fontWeight: 700 }}>
        {filled ?? ''}
      </span>
      {parts[1]}
    </>
  );
}

interface QuizCardProps {
  question: Question;
  answerState: AnswerState;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
  hintLevel: number;
  hintsRemaining: number;
  onUseHint: () => void;
  productionMode: boolean;
}

function QuizCard({ question, answerState, selectedOption, onSelect, onNext, hintLevel, hintsRemaining, onUseHint, productionMode }: QuizCardProps) {
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

  if (question.kind === 'verb') {
    return <VerbQuizCard question={question} answerState={answerState} selectedOption={selectedOption} onSelect={onSelect} onNext={onNext} cardRef={cardRef} hintLevel={hintLevel} hintsRemaining={hintsRemaining} onUseHint={onUseHint} />;
  }

  // 생산형 입력 모드 (복수형, repetitions >= 3)
  if (productionMode && question.type === 'plural') {
    return <ProductionQuizCard question={question} answerState={answerState} selectedOption={selectedOption} onSelect={onSelect} onNext={onNext} cardRef={cardRef} />;
  }

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

      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>
          {question.type === 'article' ? '이 단어의 성(관사)은?' : '복수형은?'}
        </p>

        {/* 힌트 표시 */}
        <AnimatePresence>
          {hintLevel > 0 && (
            <motion.div
              className={styles.hintBox}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              {question.type === 'article' && hintLevel === 1 && (
                <span>이 단어는 <strong>{question.answer === 'der' ? '남성' : question.answer === 'die' ? '여성' : '중성'}</strong> 명사예요</span>
              )}
              {question.type === 'article' && hintLevel === 2 && (() => {
                const pattern = findArticlePattern(question.word.word);
                return pattern ? <span>{pattern.rule}</span> : <span>정답은 <strong>{question.answer}</strong>이에요</span>;
              })()}
              {question.type === 'plural' && hintLevel === 1 && (
                <span>복수형은 <strong>{question.answer[0]}</strong>로 시작해요</span>
              )}
              {question.type === 'plural' && hintLevel === 2 && (
                <span>복수형: <strong>{question.answer.slice(0, Math.ceil(question.answer.length / 2))}...</strong></span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={question.type === 'article' ? styles.articleOptions : styles.pluralOptions}>
          {question.options.map((option) => (
            <OptionButton
              key={option}
              option={option}
              selected={selectedOption === option}
              answerState={answerState}
              correctAnswer={question.answer}
              isArticle={question.type === 'article'}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* 힌트 버튼 */}
        {!isAnswered && hintsRemaining > 0 && hintLevel < 2 && (
          <button className={styles.hintButton} onClick={onUseHint}>
            💡 힌트 보기 <span className={styles.hintRemaining}>({hintsRemaining}회 남음)</span>
          </button>
        )}

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              className={styles.feedbackArea}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* 기본 피드백 행 */}
              <div className={`${styles.feedbackRow} ${styles[`feedbackRow_${answerState}`]}`}>
                <div className={styles.feedbackText}>
                  <span className={styles.feedbackIcon}>{isCorrect ? '✓' : '✕'}</span>
                  <span>
                    {isCorrect
                      ? '정답이에요!'
                      : `정답: ${question.answer}${question.type === 'article' ? ` ${question.word.word}` : ''}`}
                  </span>
                </div>
                {isCorrect && (
                  <motion.button className={styles.nextButton} onClick={onNext} whileTap={{ scale: 0.96 }}>
                    다음 →
                  </motion.button>
                )}
              </div>

              {/* 오답 시: 관사 패턴 문맥 카드 */}
              {!isCorrect && question.type === 'article' && (() => {
                const pattern = findArticlePattern(question.word.word);
                return pattern ? (
                  <motion.div
                    className={styles.contextCard}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.28, delay: 0.15 }}
                  >
                    <span className={styles.contextCardIcon}>💡</span>
                    <div className={styles.contextCardBody}>
                      <p className={styles.contextCardRule}>{pattern.rule}</p>
                      <p className={styles.contextCardExamples}>{pattern.examples}</p>
                    </div>
                  </motion.div>
                ) : null;
              })()}

              {/* 예문 카드 (정답/오답 모두, exampleSentence 있는 경우) */}
              {question.word.exampleSentence && (
                <motion.div
                  className={styles.exampleCard}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.28, delay: isCorrect ? 0.1 : 0.3 }}
                >
                  <p className={styles.exampleSentence}>{question.word.exampleSentence}</p>
                </motion.div>
              )}

              {/* 오답 시 수동 다음 버튼 */}
              {!isCorrect && (
                <motion.button
                  className={styles.nextButtonFull}
                  onClick={onNext}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  다음 →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── 생산형 입력 카드 (복수형 직접 입력) ────────────────────────────────────────
interface ProductionQuizCardProps {
  question: import('../types/word.ts').NounQuestion;
  answerState: AnswerState;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

function ProductionQuizCard({ question, answerState, selectedOption: _selectedOption, onSelect, onNext, cardRef }: ProductionQuizCardProps) {
  const [inputValue, setInputValue] = useState('');
  const isAnswered = answerState !== 'idle';
  const isCorrect = answerState === 'correct';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAnswered) {
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAnswered, question]);

  const handleSubmit = () => {
    if (!inputValue.trim() || isAnswered) return;
    const normalized = inputValue.trim();
    // 오타 허용: 대소문자 무시 + Levenshtein distance 1 이하
    const correct = question.answer;
    const isMatch = normalized.toLowerCase() === correct.toLowerCase() || levenshtein(normalized, correct) <= 1;
    onSelect(isMatch ? correct : normalized);
  };

  useEffect(() => {
    const el = cardRef.current;
    if (!el || answerState === 'idle') return;
    if (answerState === 'correct') {
      el.animate([{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-14px) scale(1.03)' }, { transform: 'translateY(0) scale(1)' }], { duration: 480, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
    } else {
      el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(0)' }], { duration: 440, easing: 'ease-in-out' });
    }
  }, [answerState]);

  return (
    <div className={styles.quizCardInner}>
      <div className={styles.wordCardWrapper}>
        <div ref={cardRef as React.RefObject<HTMLDivElement>} className={`${styles.wordCard} ${isAnswered ? styles[`wordCard_${answerState}`] : ''}`}>
          <AnimatePresence>
            {isCorrect && (
              <motion.span className={styles.correctMark} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 22, delay: 0.08 }}>✓</motion.span>
            )}
          </AnimatePresence>
          <span className={styles.wordText}>{question.word.word}</span>
          <span className={styles.wordMeaning}>{question.word.meaningKo}</span>
          <span className={styles.productionBadge}>직접 입력</span>
        </div>
      </div>

      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>복수형을 직접 입력하세요</p>

        <div className={styles.productionInputRow}>
          <input
            ref={inputRef}
            className={`${styles.productionInput} ${isAnswered ? (isCorrect ? styles.productionInputCorrect : styles.productionInputIncorrect) : ''}`}
            value={isAnswered ? (isCorrect ? question.answer : inputValue) : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            disabled={isAnswered}
            placeholder="복수형 입력..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {!isAnswered && (
            <motion.button
              className={styles.productionSubmitButton}
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              whileTap={{ scale: 0.95 }}
            >
              확인
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div className={styles.feedbackArea} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
              <div className={`${styles.feedbackRow} ${styles[`feedbackRow_${answerState}`]}`}>
                <div className={styles.feedbackText}>
                  <span className={styles.feedbackIcon}>{isCorrect ? '✓' : '✕'}</span>
                  <span>{isCorrect ? '정답이에요!' : `정답: ${question.answer}`}</span>
                </div>
                {isCorrect && <motion.button className={styles.nextButton} onClick={onNext} whileTap={{ scale: 0.96 }}>다음 →</motion.button>}
              </div>
              {!isCorrect && question.word.exampleSentence && (
                <motion.div className={styles.exampleCard} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.28, delay: 0.15 }}>
                  <p className={styles.exampleSentence}>{question.word.exampleSentence}</p>
                </motion.div>
              )}
              {!isCorrect && <motion.button className={styles.nextButtonFull} onClick={onNext} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} whileTap={{ scale: 0.97 }}>다음 →</motion.button>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 간단한 Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  }
  return dp[m][n];
}

interface VerbQuizCardProps {
  question: VerbQuestion;
  answerState: AnswerState;
  selectedOption: string | null;
  onSelect: (option: string) => void;
  onNext: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
  hintLevel: number;
  hintsRemaining: number;
  onUseHint: () => void;
}

function VerbQuizCard({ question, answerState, selectedOption, onSelect, onNext, cardRef, hintLevel, hintsRemaining, onUseHint }: VerbQuizCardProps) {
  const isAnswered = answerState !== 'idle';
  const isCorrect = answerState === 'correct';

  return (
    <div className={styles.quizCardInner}>
      <div className={styles.wordCardWrapper}>
        <div
          ref={cardRef as React.RefObject<HTMLDivElement>}
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
          <span className={styles.wordText}>{question.verb.infinitive}</span>
          <span className={styles.wordMeaning}>{question.verb.meaningKo}</span>
        </div>
      </div>

      <div className={styles.quizArea}>
        <p className={styles.questionLabel}>
          <span className={styles.verbPronounBadge}>{question.verbForm.pronoun}</span>
          {' '}— {TENSE_KO[question.verbForm.tense] ?? question.verbForm.tense}
        </p>
        <p className={styles.contextSentence}>
          {renderSentenceWithBlank(
            question.contextSentence,
            isAnswered ? question.answer : undefined
          )}
        </p>
        {question.verbForm.exampleSentenceKo && (
          <p className={styles.contextSentenceKo}>{question.verbForm.exampleSentenceKo}</p>
        )}

        {/* 힌트 표시 */}
        <AnimatePresence>
          {hintLevel > 0 && (
            <motion.div
              className={styles.hintBox}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              {hintLevel === 1 && (
                <span>{question.verb.isIrregular ? '불규칙 변화 동사예요' : '규칙 변화 동사예요'}</span>
              )}
              {hintLevel === 2 && (
                <span>답의 첫 글자: <strong>{question.answer[0]}</strong></span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.pluralOptions}>
          {question.options.map((option) => (
            <OptionButton
              key={option}
              option={option}
              selected={selectedOption === option}
              answerState={answerState}
              correctAnswer={question.answer}
              isArticle={false}
              onSelect={onSelect}
            />
          ))}
        </div>

        {!isAnswered && hintsRemaining > 0 && hintLevel < 2 && (
          <button className={styles.hintButton} onClick={onUseHint}>
            💡 힌트 보기 <span className={styles.hintRemaining}>({hintsRemaining}회 남음)</span>
          </button>
        )}

        <AnimatePresence>
          {isAnswered && (
            <motion.div
              className={styles.feedbackArea}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className={`${styles.feedbackRow} ${styles[`feedbackRow_${answerState}`]}`}>
                <div className={styles.feedbackText}>
                  <span className={styles.feedbackIcon}>{isCorrect ? '✓' : '✕'}</span>
                  <span>{isCorrect ? '정답이에요!' : `정답: ${question.answer}`}</span>
                </div>
                {isCorrect && (
                  <motion.button className={styles.nextButton} onClick={onNext} whileTap={{ scale: 0.96 }}>
                    다음 →
                  </motion.button>
                )}
              </div>

              {/* 오답 시: 동사 패턴 힌트 */}
              {!isCorrect && (
                <motion.div
                  className={styles.contextCard}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.28, delay: 0.15 }}
                >
                  <span className={styles.contextCardIcon}>💡</span>
                  <div className={styles.contextCardBody}>
                    <p className={styles.contextCardRule}>
                      {question.verb.isIrregular
                        ? '이 동사는 불규칙 변화를 해요. 각 인칭형을 따로 외워두세요.'
                        : `이 동사는 규칙 변화를 해요. 어간 + 인칭 어미를 붙이면 돼요.`}
                    </p>
                    <p className={styles.contextCardExamples}>
                      {question.verbForm.pronoun} → {question.answer}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* 예문 카드 */}
              {question.verbForm.exampleSentenceKo && (
                <motion.div
                  className={styles.exampleCard}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.28, delay: isCorrect ? 0.1 : 0.3 }}
                >
                  <p className={styles.exampleSentence}>
                    {question.contextSentence.replace('___', question.answer)}
                  </p>
                  <p className={styles.exampleSentenceKo}>{question.verbForm.exampleSentenceKo}</p>
                </motion.div>
              )}

              {!isCorrect && (
                <motion.button
                  className={styles.nextButtonFull}
                  onClick={onNext}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  다음 →
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface OptionButtonProps {
  option: string;
  selected: boolean;
  answerState: AnswerState;
  correctAnswer: string;
  isArticle: boolean;
  onSelect: (option: string) => void;
}

function OptionButton({ option, selected, answerState, correctAnswer, isArticle, onSelect }: OptionButtonProps) {
  const isAnswered = answerState !== 'idle';
  const isCorrect = option === correctAnswer;
  const colorKey = isArticle ? (ARTICLE_COLOR[option] ?? '') : '';

  let stateClass = '';
  if (selected && answerState === 'correct') stateClass = styles.optionCorrect;
  else if (selected && answerState === 'incorrect') stateClass = styles.optionIncorrect;
  else if (isAnswered && isCorrect) stateClass = styles.optionReveal;

  return (
    <motion.button
      className={`${styles.optionButton} ${colorKey ? styles[`article_${colorKey}`] : ''} ${stateClass}`}
      onClick={() => onSelect(option)}
      disabled={isAnswered}
      whileTap={!isAnswered ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {option}
    </motion.button>
  );
}

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

interface QuitSheetProps {
  onConfirm: () => void;
  onCancel: () => void;
}

// 흩어진 위치/각도 → 0 스냅 → 다시 흩어지는 루프
const DOCS = [
  { dx: -28, dy: 18, dr: -22, color: '#f5f5f5', accent: '#d4d4d440' },
  { dx:   6, dy: -6, dr:   8, color: '#efefef', accent: '#c8c8c840' },
  { dx:  24, dy: 14, dr:  18, color: '#e8e8e8', accent: '#bcbcbc40' },
] as const;

const SPARKLE_POS = [
  { x: -48, y: -18 },
  { x:  50, y: -22 },
  { x: -42, y:  22 },
  { x:  44, y:  18 },
];

const C = 3.2; // 사이클 길이(초)
// keyframe 타이밍: [흩어짐 유지, 스냅 시작, 정렬 완료, 정렬 유지, 복귀]
const T = [0, 0.08, 0.46, 0.72, 1.0] as const;

function SessionLoadingScreen() {
  return (
    <div className={styles.page} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div className={styles.completingDocs}>
        {DOCS.map((doc, i) => (
          <motion.div
            key={i}
            className={styles.completingDoc}
            style={{ background: doc.color, borderColor: doc.accent, zIndex: i }}
            animate={{
              x:      [doc.dx, doc.dx, 0,       0,       doc.dx],
              y:      [doc.dy, doc.dy, -i * 5,  -i * 5,  doc.dy],
              rotate: [doc.dr, doc.dr, 0,       0,       doc.dr],
            }}
            transition={{
              duration: C,
              times: [...T],
              ease: ['linear', [0.2, 1.6, 0.3, 1], 'linear', 'easeIn'],
              repeat: Infinity,
              delay: i * 0.055,
            }}
          >
            <div className={styles.docLine} />
            <div className={styles.docLine} />
            <div className={styles.docLineShort} />
          </motion.div>
        ))}
        {SPARKLE_POS.map((pos, i) => (
          <motion.span
            key={`spark-${i}`}
            className={styles.sparkle}
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            animate={{
              scale:   [0, 0, 1.4, 0, 0],
              opacity: [0, 0, 1,   0, 0],
              rotate:  [0, 0, 30, 60, 60],
            }}
            transition={{
              duration: C,
              times: [0, 0.38, 0.52, 0.64, 1.0],
              repeat: Infinity,
              delay: i * 0.06,
            }}
          >
            ✦
          </motion.span>
        ))}
      </div>
      <motion.div
        className={styles.completingTextGroup}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className={styles.completingText}>준비하는 중...</p>
        <p className={styles.completingSubText}>Einen Moment, bitte...</p>
      </motion.div>
    </div>
  );
}

function CompletingOverlay() {
  return (
    <motion.div
      className={styles.completingOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.completingDocs}>
        {DOCS.map((doc, i) => (
          <motion.div
            key={i}
            className={styles.completingDoc}
            style={{ background: doc.color, borderColor: doc.accent, zIndex: i }}
            animate={{
              x:      [doc.dx, doc.dx, 0,       0,       doc.dx],
              y:      [doc.dy, doc.dy, -i * 5,  -i * 5,  doc.dy],
              rotate: [doc.dr, doc.dr, 0,       0,       doc.dr],
            }}
            transition={{
              duration: C,
              times: [...T],
              ease: ['linear', [0.2, 1.6, 0.3, 1], 'linear', 'easeIn'],
              repeat: Infinity,
              delay: i * 0.055,
            }}
          >
            <div className={styles.docLine} />
            <div className={styles.docLine} />
            <div className={styles.docLineShort} />
          </motion.div>
        ))}

        {/* 정렬되는 순간에 반짝이는 별 */}
        {SPARKLE_POS.map((pos, i) => (
          <motion.span
            key={`spark-${i}`}
            className={styles.sparkle}
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            animate={{
              scale:   [0, 0, 1.4, 0, 0],
              opacity: [0, 0, 1,   0, 0],
              rotate:  [0, 0, 30, 60, 60],
            }}
            transition={{
              duration: C,
              times: [0, 0.38, 0.52, 0.64, 1.0],
              repeat: Infinity,
              delay: i * 0.06,
            }}
          >
            ✦
          </motion.span>
        ))}
      </div>

      <motion.div
        className={styles.completingTextGroup}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <p className={styles.completingText}>꼼꼼히 확인 중...</p>
        <p className={styles.completingSubText}>Einen Moment, bitte...</p>
      </motion.div>
    </motion.div>
  );
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
