import { Lightbulb } from 'lucide-react';
import { FUNDAMENTALS } from '../data/fundamentals';
import VideoEmbed from '../components/VideoEmbed';
import styles from './BasicsPage.module.css';

export default function BasicsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1>기본기</h1>
        <p>
          던지기를 배우기 전에 먼저 익히는 것들입니다. 특히 낙법은 유도에서 가장 먼저, 가장 오래 배우는 기술이에요.
        </p>
      </div>

      {FUNDAMENTALS.map((item) => (
        <section key={item.id} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.name}>{item.koreanName}</h2>
            <p className={styles.origin}>
              {item.japaneseName ? `${item.japaneseName} · ` : ''}
              {item.romaji}
            </p>
          </div>

          <VideoEmbed videoId={item.videoId} title={`${item.koreanName} 시연 영상`} />

          <p className={styles.description}>{item.description}</p>

          <ol className={styles.segments}>
            {item.segments.map((seg, i) => (
              <li key={seg.romaji} className={styles.segment}>
                <span className={styles.segmentIndex}>{i + 1}</span>
                <div>
                  <p className={styles.segmentName}>
                    {seg.koreanName} <span className={styles.segmentRomaji}>{seg.romaji}</span>
                  </p>
                  <p className={styles.segmentNote}>{seg.note}</p>
                </div>
              </li>
            ))}
          </ol>

          {item.tips && item.tips.length > 0 && (
            <div className={styles.tips}>
              <p className={styles.tipsTitle}>
                <Lightbulb size={15} className={styles.tipsIcon} />
                연습할 때 이것만은
              </p>
              <ul className={styles.tipsList}>
                {item.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      <p className={styles.footnote}>
        영상은 하나에 여러 동작이 이어서 나옵니다. 위 목록 순서대로 진행되니 참고해서 보세요.
      </p>
    </div>
  );
}
