import { Link } from 'react-router-dom';
import TechniqueCard from '../components/TechniqueCard';
import { TECHNIQUES } from '../data/techniques';
import { TERMS } from '../data/terms';
import styles from './HomePage.module.css';

const CORE_TECHNIQUES = TECHNIQUES.filter((t) => t.isCore).slice(0, 6);

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>왕초보를 위한 유도 입문 가이드</p>
        <h1 className={styles.heroTitle}>
          낯선 유도 용어와 기술,
          <br />
          영상으로 눈에 익혀요
        </h1>
        <p className={styles.heroDesc}>
          한판, 굳히기, 업어치기… 처음 듣는 말이 많아 막막하셨죠. 강도관(KODOKAN)과 국제유도연맹 아카데미(IJF ACADEMY)의
          공식 시연 영상과 함께, 한국어로 핵심만 정리했습니다.
        </p>
        <div className={styles.heroActions}>
          <Link to="/glossary" className={styles.ctaPrimary}>
            용어집 보러가기
          </Link>
          <Link to="/techniques" className={styles.ctaSecondary}>
            기술 도감 보러가기
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div>
            <strong>{TERMS.length}</strong>
            <span>핵심 용어</span>
          </div>
          <div>
            <strong>{TECHNIQUES.length}</strong>
            <span>대표 기술</span>
          </div>
          <div>
            <strong>7</strong>
            <span>기술 분류</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>먼저 알아두면 좋은 대표 기술</h2>
          <Link to="/techniques" className={styles.sectionLink}>
            전체 보기 →
          </Link>
        </div>
        <div className={styles.grid}>
          {CORE_TECHNIQUES.map((technique) => (
            <TechniqueCard key={technique.id} technique={technique} />
          ))}
        </div>
      </section>

      <section className={styles.guideSection}>
        <h2>이렇게 시작해보세요</h2>
        <ol className={styles.guideList}>
          <li>
            <strong>① 용어집에서 기본기부터.</strong> 도복·낙법·잡기 같은 기초 용어와 한판·절반 같은 경기 용어를 먼저
            훑어보세요.
          </li>
          <li>
            <strong>② 기술 도감에서 영상으로 확인.</strong> 손기술·허리기술·발기술 등 분류별로 정리된 공식 시연
            영상을 반복해서 눈에 익히세요.
          </li>
          <li>
            <strong>③ 도장 수업과 함께 복습.</strong> 실제 수련 중 들은 용어를 검색해 다시 확인하면 훨씬 오래
            기억됩니다.
          </li>
        </ol>
      </section>
    </div>
  );
}
