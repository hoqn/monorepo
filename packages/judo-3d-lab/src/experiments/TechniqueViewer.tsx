import { Line } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { BALANCE_STATE_LABEL } from '../body/balance';
import type { Contact } from '../body/contact';
import { BalanceMap } from '../components/BalanceMap';
import { StabilityChart } from '../components/StabilityChart';
import { BalanceOverlay, ComTrail } from '../scene/BalanceOverlay';
import { Figure } from '../scene/Figure';
import { Stage, VIEW_LABEL, type ViewPreset } from '../scene/Stage';
import { analyzeFrame, sampleTimeline, type ActorFrame } from '../techniques/analyze';
import { TECHNIQUES } from '../techniques';
import { duration as techDuration, phaseAt } from '../techniques/timeline';

/** 질량중심·기저면 표시 색 (도복 색과 구분되게) */
const ANALYSIS_COLOR = { tori: '#e8590c', uke: '#7048e8' };
const PAIR_COLOR = '#2b8a3e';
const CONTACT_COLOR = '#f59f00';
const SPEEDS = [0.1, 0.25, 0.5, 1] as const;

function initialTime(): number {
  const q = new URLSearchParams(location.search).get('t');
  return q ? Number(q) || 0 : 0;
}

function initialTech() {
  const id = new URLSearchParams(location.search).get('tech');
  return TECHNIQUES.find((x) => x.id === id) ?? TECHNIQUES[0]!;
}

export function TechniqueViewer() {
  const [TECH, setTech] = useState(initialTech);
  const duration = techDuration(TECH);
  const [t, setT] = useState(initialTime);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(0.25);
  const [view, setView] = useState<ViewPreset>(() => (new URLSearchParams(location.search).get('view') as ViewPreset) || 'side');
  const [viewNonce, setViewNonce] = useState(0);
  const [show, setShow] = useState({ tori: true, uke: true, com: true, support: true, xcom: true, segments: false, trail: true, xray: false, pair: false, contacts: true, contactMarks: true });

  const opts = useMemo(() => ({ contacts: show.contacts }), [show.contacts]);
  const samples = useMemo(() => sampleTimeline(TECH, 180, opts), [TECH, opts]);
  const frame = useMemo(() => analyzeFrame(TECH, t, opts), [TECH, t, opts]);
  const phase = phaseAt(TECH, t);

  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * speed;
        return next > duration + 0.6 ? 0 : next; // 끝에서 잠깐 멈췄다가 처음부터
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      last.current = null;
    };
  }, [playing, speed, duration]);

  const shownT = Math.min(t, duration);
  const toggle = (k: keyof typeof show) => setShow((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="viewer">
      <section className="viewer__stage">
        <Stage view={view} viewNonce={viewNonce}>
          {show.tori && <Figure points={frame.tori.body.points} color={TECH.actors.tori.color} xray={show.xray} />}
          {show.uke && <Figure points={frame.uke.body.points} color={TECH.actors.uke.color} xray={show.xray} />}
          {show.com &&
            (['tori', 'uke'] as const)
              .filter((k) => show[k])
              .map((k) => (
                <BalanceOverlay
                  key={k}
                  com={frame[k].com}
                  balance={frame[k].balance}
                  color={ANALYSIS_COLOR[k]}
                  showSupport={show.support}
                  showSegments={show.segments}
                  showXcom={show.xcom}
                />
              ))}
          {show.com && show.trail && (
            <>
              {show.tori && <ComTrail points={samples.map((s) => s.toriCom)} color={ANALYSIS_COLOR.tori} />}
              {show.uke && <ComTrail points={samples.map((s) => s.ukeCom)} color={ANALYSIS_COLOR.uke} />}
            </>
          )}
          {show.pair && <PairCom position={frame.pairCom} />}
          {show.contactMarks && frame.contact && <ContactMarks contacts={frame.contact.contacts} />}
        </Stage>
        <div className="tech-switch" role="group" aria-label="기술 선택">
          {TECHNIQUES.map((x) => (
            <button
              key={x.id}
              className={x === TECH ? 'is-active' : ''}
              onClick={() => {
                setTech(x);
                setT(0);
                setPlaying(false);
              }}
            >
              {x.koreanName}
            </button>
          ))}
        </div>
        <div className="view-switch" role="group" aria-label="카메라 시점">
          {(Object.keys(VIEW_LABEL) as (keyof typeof VIEW_LABEL)[]).map((v) => (
            <button
              key={v}
              className={view === v ? 'is-active' : ''}
              onClick={() => {
                setView(v);
                setViewNonce((n) => n + 1);
              }}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <p className="stage-hint">드래그: 회전 · 휠/핀치: 확대 · 우클릭 드래그: 이동</p>
      </section>

      <aside className="viewer__panel">
        <header className="tech-head">
          <p className="eyebrow">
            {TECH.category} · {TECH.japaneseName} · {TECH.romaji}
          </p>
          <h2>{TECH.koreanName}</h2>
          <p className="muted">{TECH.summary}</p>
        </header>

        {phase && (
          <article className="phase-card">
            <p className="eyebrow">
              {phase.name} · {TECH.phases.indexOf(phase) + 1}/{TECH.phases.length}
            </p>
            <h3>{phase.label}</h3>
            <p>{phase.description}</p>
            <ul>
              {phase.cues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </article>
        )}

        {frame.contact && (
          <div className="contact-list">
            <b>지금 맞닿은 곳</b> <span className="muted small">(토리 ↔ 우케)</span>
            {frame.contact.contacts.length === 0 ? (
              <p className="muted small">손 외에는 닿은 곳 없음</p>
            ) : (
              <ul>
                {frame.contact.contacts.map((c, i) => (
                  <li key={i}>{c.label}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="readouts">
          <ActorReadout label="토리" color={ANALYSIS_COLOR.tori} frame={frame.tori} />
          <ActorReadout label="우케" color={ANALYSIS_COLOR.uke} frame={frame.uke} />
        </div>

        <BalanceMap
          entries={[
            ...(show.tori ? [{ id: 'tori', label: '토리', color: ANALYSIS_COLOR.tori, balance: frame.tori.balance }] : []),
            ...(show.uke ? [{ id: 'uke', label: '우케', color: ANALYSIS_COLOR.uke, balance: frame.uke.balance }] : []),
          ]}
          extent={1.6}
          center={TECH.mapCenter ?? { x: 0.15, y: 0.25 }}
        />

        <fieldset className="toggles">
          <legend>표시</legend>
          {(
            [
              ['tori', '토리'],
              ['uke', '우케'],
              ['xray', '반투명 몸'],
              ['com', '질량중심'],
              ['support', '기저면'],
              ['xcom', 'XCoM'],
              ['trail', '질량중심 궤적'],
              ['segments', '분절별 질량중심'],
              ['pair', '두 사람 합성 질량중심'],
              ['contacts', '겹침 보정'],
              ['contactMarks', '접촉 지점'],
            ] as const
          ).map(([k, label]) => (
            <label key={k}>
              <input type="checkbox" checked={show[k]} onChange={() => toggle(k)} /> {label}
            </label>
          ))}
        </fieldset>
      </aside>

      <section className="viewer__timeline">
        <div className="transport">
          <button className="play" onClick={() => setPlaying((p) => !p)} aria-label={playing ? '일시정지' : '재생'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <div className="speed" role="group" aria-label="재생 속도">
            {SPEEDS.map((s) => (
              <button key={s} className={speed === s ? 'is-active' : ''} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </div>
          <div className="phase-jump" role="group" aria-label="단계로 이동">
            {TECH.phases.map((p) => (
              <button
                key={p.name}
                className={phase === p ? 'is-active' : ''}
                onClick={() => {
                  setPlaying(false);
                  setT((p.start + p.end) / 2);
                }}
              >
                {p.label.split(' · ')[0]}
              </button>
            ))}
          </div>
          <span className="time">
            {shownT.toFixed(2)}s / {duration.toFixed(1)}s
          </span>
        </div>
        <input
          className="scrubber"
          type="range"
          min={0}
          max={duration}
          step={0.005}
          value={shownT}
          onChange={(e) => {
            setPlaying(false);
            setT(Number(e.target.value));
          }}
          aria-label="시간"
        />
        <StabilityChart
          samples={samples}
          phases={TECH.phases}
          duration={duration}
          t={shownT}
          colors={ANALYSIS_COLOR}
          onSeek={(v) => {
            setPlaying(false);
            setT(v);
          }}
        />
      </section>
    </div>
  );
}

/** 두 사람이 맞닿은 지점 */
function ContactMarks({ contacts }: { contacts: Contact[] }) {
  return (
    <group>
      {contacts.map((c, i) => (
        <mesh key={i} position={c.position} renderOrder={11}>
          <sphereGeometry args={[0.026, 16, 12]} />
          <meshBasicMaterial color={CONTACT_COLOR} depthTest={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** 잡기로 묶인 두 사람을 한 덩어리로 본 질량중심 (업어치기처럼 상대를 업을 때 중요) */
function PairCom({ position }: { position: Vector3 }) {
  return (
    <group>
      <mesh position={position} renderOrder={10}>
        <octahedronGeometry args={[0.045]} />
        <meshBasicMaterial color={PAIR_COLOR} depthTest={false} transparent />
      </mesh>
      <Line points={[position, new Vector3(position.x, 0.004, position.z)]} color={PAIR_COLOR} lineWidth={1.5} dashed dashSize={0.04} gapSize={0.03} depthTest={false} renderOrder={8} />
      <mesh position={[position.x, 0.005, position.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <ringGeometry args={[0.03, 0.05, 4]} />
        <meshBasicMaterial color={PAIR_COLOR} depthTest={false} transparent />
      </mesh>
    </group>
  );
}

function ActorReadout({ label, color, frame }: { label: string; color: string; frame: ActorFrame }) {
  const b = frame.balance;
  const fmt = (m: number | null) => (m === null || !Number.isFinite(m) ? '—' : `${m >= 0 ? '+' : ''}${(m * 100).toFixed(1)}cm`);
  const speed = Math.hypot(frame.velocity.x, frame.velocity.z);
  return (
    <div className="readout" style={{ '--actor': color } as React.CSSProperties}>
      <div className="readout__head">
        <span className="dot" />
        <b>{label}</b>
        <span className={`state state--${b.state}`}>{BALANCE_STATE_LABEL[b.state]}</span>
      </div>
      <dl>
        <dt>정적 여유</dt>
        <dd>{fmt(b.margin)}</dd>
        <dt>동적 여유</dt>
        <dd>{fmt(b.xcomMargin)}</dd>
        <dt>CoM 높이</dt>
        <dd>{(frame.com.com.y * 100).toFixed(0)}cm</dd>
        <dt>수평 속도</dt>
        <dd>{speed.toFixed(2)}m/s</dd>
      </dl>
    </div>
  );
}
