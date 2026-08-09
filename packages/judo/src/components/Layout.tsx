import { Outlet } from 'react-router-dom';
import TransitionNavLink from './TransitionNavLink';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/', label: '홈', end: true },
  { to: '/basics', label: '기본기' },
  { to: '/glossary', label: '용어집' },
  { to: '/techniques', label: '기술 도감' },
  { to: '/quiz', label: '퀴즈' },
];

export default function Layout() {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <TransitionNavLink to="/" className={styles.brand}>
            <span className={styles.brandMark}>柔</span>
            유도 첫걸음
          </TransitionNavLink>
          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <TransitionNavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink)}
              >
                {item.label}
              </TransitionNavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>모든 기술 영상은 KODOKAN × IJF ACADEMY 공식 유튜브 재생목록 "100 Techniques"를 인용합니다.</p>
          <p className={styles.footerSub}>유도 첫걸음은 초보자의 학습을 돕기 위한 비공식 팬 제작 정리 자료입니다.</p>
        </div>
      </footer>
    </>
  );
}
