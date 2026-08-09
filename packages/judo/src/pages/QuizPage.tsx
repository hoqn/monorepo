import { useCallback, useState } from 'react';
import { CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { TECHNIQUES } from '../data/techniques';
import { TECHNIQUE_CATEGORY_LABEL, type Technique } from '../types/technique';
import { shuffle } from '../lib/array';
import VideoEmbed from '../components/VideoEmbed';
import styles from './QuizPage.module.css';

interface Question {
  correct: Technique;
  choices: Technique[];
}

function makeQuestion(excludeId?: string): Question {
  const pool = excludeId ? TECHNIQUES.filter((t) => t.id !== excludeId) : TECHNIQUES;
  const correct = pool[Math.floor(Math.random() * pool.length)];
  const sameCategory = shuffle(TECHNIQUES.filter((t) => t.category === correct.category && t.id !== correct.id));
  const others = shuffle(TECHNIQUES.filter((t) => t.category !== correct.category));
  const distractors = [...sameCategory, ...others].slice(0, 3);
  return { correct, choices: shuffle([correct, ...distractors]) };
}

export default function QuizPage() {
  const [question, setQuestion] = useState<Question>(() => makeQuestion());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const answered = selectedId !== null;
  const isCorrect = selectedId === question.correct.id;

  const handleAnswer = useCallback(
    (choice: Technique) => {
      if (answered) return;
      setSelectedId(choice.id);
      setTotal((t) => t + 1);
      if (choice.id === question.correct.id) setScore((s) => s + 1);
    },
    [answered, question.correct.id],
  );

  const handleNext = useCallback(() => {
    setQuestion(makeQuestion(question.correct.id));
    setSelectedId(null);
  }, [question.correct.id]);

  const handleRestart = useCallback(() => {
    setScore(0);
    setTotal(0);
    setSelectedId(null);
    setQuestion(makeQuestion());
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div>
          <h1>기술 이름 맞히기</h1>
          <p>영상을 보고 어떤 기술인지 맞혀보세요. 반복할수록 눈에 익습니다.</p>
        </div>
        <div className={styles.scoreBox}>
          <span className={styles.scoreLabel}>정답</span>
          <span className={styles.scoreValue}>
            {score} / {total}
          </span>
          <button className={styles.restart} onClick={handleRestart}>
            다시 시작
          </button>
        </div>
      </div>

      <VideoEmbed videoId={question.correct.videoId} title="기술 시연 영상" />

      <p className={styles.prompt}>이 영상 속 기술의 이름은 무엇일까요?</p>

      <div className={styles.choices}>
        {question.choices.map((choice) => {
          let state = '';
          if (answered) {
            if (choice.id === question.correct.id) state = styles.choiceCorrect;
            else if (choice.id === selectedId) state = styles.choiceWrong;
            else state = styles.choiceMuted;
          }
          return (
            <button
              key={choice.id}
              className={`${styles.choice} ${state}`}
              onClick={() => handleAnswer(choice)}
              disabled={answered}
            >
              {choice.koreanName}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={styles.feedback}>
          <p className={styles.feedbackTitle}>
            {isCorrect ? (
              <CheckCircle2 size={20} className={styles.feedbackIconCorrect} />
            ) : (
              <XCircle size={20} className={styles.feedbackIconWrong} />
            )}
            {isCorrect ? '정답이에요!' : '아쉬워요, 다시 확인해볼까요?'}
          </p>
          <p className={styles.feedbackName}>
            {question.correct.koreanName} · {question.correct.japaneseName} · {question.correct.romaji}
          </p>
          <p className={styles.feedbackCategory}>{TECHNIQUE_CATEGORY_LABEL[question.correct.category]}</p>
          <p className={styles.feedbackDesc}>{question.correct.description}</p>
          <button className={styles.next} onClick={handleNext}>
            다음 문제
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
