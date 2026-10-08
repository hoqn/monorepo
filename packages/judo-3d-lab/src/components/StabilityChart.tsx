import { useEffect, useRef, useState } from 'react';
import type { Phase } from '../techniques/timeline';
import type { TimelineSample } from '../techniques/analyze';

interface Props {
  samples: TimelineSample[];
  phases: Phase[];
  duration: number;
  t: number;
  colors: { tori: string; uke: string };
  onSeek: (t: number) => void;
}

const H = 110;
const PAD = { l: 34, r: 8, t: 10, b: 18 };
const MIN = -0.25;
const MAX = 0.15;

/**
 * 시간에 따른 동적 안정 여유(XCoM → 기저면 경계 거리).
 * 0 아래로 내려가면 그 순간 스스로는 균형을 되찾을 수 없는 상태(무너짐)다.
 */
export function StabilityChart({ samples, phases, duration, t, colors, onSeek }: Props) {
  // 글자가 늘어나지 않도록 viewBox 폭을 실제 픽셀 폭에 맞춘다
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setW(Math.max(200, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const x = (time: number) => PAD.l + (time / duration) * (W - PAD.l - PAD.r);
  const y = (m: number) => PAD.t + ((MAX - Math.max(MIN, Math.min(MAX, m))) / (MAX - MIN)) * (H - PAD.t - PAD.b);

  const path = (key: 'toriMargin' | 'ukeMargin') => {
    let d = '';
    let pen = false;
    for (const s of samples) {
      const m = s[key];
      if (m === null) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${x(s.t).toFixed(1)},${y(m).toFixed(1)} `;
      pen = true;
    }
    return d;
  };

  const handle = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    onSeek(Math.max(0, Math.min(duration, ((px - PAD.l) / (W - PAD.l - PAD.r)) * duration)));
  };

  return (
    <figure className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} onPointerDown={handle} onPointerMove={handle} role="img" aria-label="동적 안정 여유 그래프">
        {phases.map((p, i) => (
          <rect key={p.name} x={x(p.start)} y={PAD.t} width={x(p.end) - x(p.start)} height={H - PAD.t - PAD.b} fill={i % 2 ? 'var(--band)' : 'transparent'} />
        ))}
        <rect x={PAD.l} y={y(0)} width={W - PAD.l - PAD.r} height={y(MIN) - y(0)} fill="var(--danger)" fillOpacity={0.07} />
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--danger)" strokeWidth={1} strokeDasharray="4 3" />
        {[0.1, -0.1, -0.2].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="var(--grid)" strokeWidth={0.6} />
            <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" className="chart__tick">
              {Math.round(v * 100)}
            </text>
          </g>
        ))}
        <text x={PAD.l - 4} y={y(0) + 3} textAnchor="end" className="chart__tick">
          0
        </text>
        <path d={path('toriMargin')} fill="none" stroke={colors.tori} strokeWidth={2.2} />
        <path d={path('ukeMargin')} fill="none" stroke={colors.uke} strokeWidth={2.2} />
        <line x1={x(t)} x2={x(t)} y1={PAD.t - 4} y2={H - PAD.b + 2} stroke="var(--ink)" strokeWidth={1.5} />
        {phases.map((p) => (
          <text key={p.name} x={(x(p.start) + x(p.end)) / 2} y={H - 4} textAnchor="middle" className="chart__phase">
            {p.label.split(' · ')[0]}
          </text>
        ))}
      </svg>
      <figcaption>
        동적 안정 여유 (cm) — XCoM이 기저면 안쪽으로 얼마나 들어와 있는가. <b className="danger-text">0 아래 = 무너짐</b>, 선이 끊긴 구간은
        지면 접촉 없음
      </figcaption>
    </figure>
  );
}
