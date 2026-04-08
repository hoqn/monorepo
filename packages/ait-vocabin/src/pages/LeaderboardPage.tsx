import { motion } from 'framer-motion';
import styles from './LeaderboardPage.module.css';

const MY_ID = 'me';

const MOCK_LEADERBOARD = [
  { id: '1',  rank: 1, name: '김민준', xp: 1240 },
  { id: '2',  rank: 2, name: '이서연', xp: 980 },
  { id: MY_ID, rank: 3, name: '홍길동', xp: 420 },
  { id: '4',  rank: 4, name: '박지호', xp: 310 },
  { id: '5',  rank: 5, name: '최유나', xp: 290 },
  { id: '6',  rank: 6, name: '정하준', xp: 240 },
  { id: '7',  rank: 7, name: '강소희', xp: 180 },
  { id: '8',  rank: 8, name: '윤도현', xp: 120 },
];

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['#F59E0B', '#94A3B8', '#D97706'];
const PODIUM_HEIGHTS = ['110px', '80px', '64px'];
const PODIUM_ORDER = [1, 0, 2]; // 2위·1위·3위 순서로 배치

function getDaysUntilMonday() {
  const now = new Date();
  const day = now.getDay();
  return day === 0 ? 1 : 8 - day;
}

export function LeaderboardPage() {
  const top3 = MOCK_LEADERBOARD.slice(0, 3);
  const rest = MOCK_LEADERBOARD.slice(3);
  const me = MOCK_LEADERBOARD.find((item) => item.id === MY_ID)!;
  const daysLeft = getDaysUntilMonday();

  return (
    <div className={styles.page}>
      {/* 포디움 */}
      <div className={styles.podiumArea}>
        {PODIUM_ORDER.map((rankIndex, i) => {
          const item = top3[rankIndex];
          const isMe = item.id === MY_ID;
          return (
            <motion.div
              key={item.id}
              className={styles.podiumEntry}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.1,
                type: 'spring',
                stiffness: 260,
                damping: 22,
              }}
            >
              <span className={styles.podiumMedal}>{MEDALS[rankIndex]}</span>
              <span className={`${styles.podiumName} ${isMe ? styles.podiumNameMe : ''}`}>
                {isMe ? '나' : item.name}
              </span>
              <span className={styles.podiumXp}>{item.xp.toLocaleString()}</span>
              <motion.div
                className={styles.podiumBlock}
                style={{ backgroundColor: PODIUM_COLORS[rankIndex] }}
                initial={{ height: 0 }}
                animate={{ height: PODIUM_HEIGHTS[rankIndex] }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <span className={styles.podiumRank}>{rankIndex + 1}</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 내 순위 고정 배너 */}
      <motion.div
        className={styles.myRankBanner}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <span className={styles.myRankNumber}>{me.rank}위</span>
        <span className={styles.myRankName}>나</span>
        <span className={styles.myRankXp}>{me.xp.toLocaleString()} XP</span>
      </motion.div>

      {/* 나머지 리스트 */}
      <ul className={styles.list}>
        {rest.map((item, i) => (
          <motion.li
            key={item.id}
            className={`${styles.rankItem} ${item.id === MY_ID ? styles.rankItemMe : ''}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 280, damping: 24 }}
          >
            <span className={styles.rankNumber}>{item.rank}</span>
            <span className={styles.rankName}>{item.id === MY_ID ? '나' : item.name}</span>
            <span className={styles.rankXp}>{item.xp.toLocaleString()} XP</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
