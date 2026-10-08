import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { useEffect, useRef, useState } from 'react';
import type { TimelineSample } from '../techniques/analyze';
import type { Phase } from '../techniques/timeline';
import { cssVar } from '../ui/tokens';

interface Props {
  samples: TimelineSample[];
  phases: Phase[];
  duration: number;
  t: number;
  /** CSS 색 값 (토큰 var) */
  colors: { tori: string; uke: string };
  onSeek: (t: number) => void;
}

const H = 110;
const PAD = { l: 34, r: 8, t: 10, b: 18 };
const MIN = -0.25;
const MAX = 0.15;
const TICK_STYLE = { fontSize: 'var(--font-size-xs)', fill: cssVar('textSecondary') } as const;

/**
 * 시간에 따른 동적 안정 여유(XCoM → 기저면 경계 거리).
 * 0 아래로 내려가면 그 순간 스스로는 균형을 되찾을 수 없는 상태(무너짐)다.
 */
export function StabilityChart({ samples, phases, duration, t, colors, onSeek }: Props) {
  // 글자가 늘어나지 않도록 viewBox 폭을 실제 픽셀 폭에 맞춘다
  const ref = useRef<SVGSVGElement>(null);
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

  const danger = cssVar('danger');
  return (
    <Stack gap={1}>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        onPointerDown={handle}
        onPointerMove={handle}
        role="img"
        aria-label="동적 안정 여유 그래프"
        style={{ width: '100%', height: H, display: 'block', cursor: 'pointer', touchAction: 'none' }}
      >
        {phases.map((p, i) => (
          <rect key={p.name} x={x(p.start)} y={PAD.t} width={x(p.end) - x(p.start)} height={H - PAD.t - PAD.b} fill={i % 2 ? cssVar('band') : 'transparent'} />
        ))}
        <rect x={PAD.l} y={y(0)} width={W - PAD.l - PAD.r} height={y(MIN) - y(0)} fill={danger} fillOpacity={0.07} />
        <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke={danger} strokeWidth={1} strokeDasharray="4 3" />
        {[0.1, -0.1, -0.2].map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke={cssVar('grid')} strokeWidth={0.6} />
            <text x={PAD.l - 4} y={y(v) + 3} textAnchor="end" style={TICK_STYLE}>
              {Math.round(v * 100)}
            </text>
          </g>
        ))}
        <text x={PAD.l - 4} y={y(0) + 3} textAnchor="end" style={TICK_STYLE}>
          0
        </text>
        <path d={path('toriMargin')} fill="none" stroke={colors.tori} strokeWidth={2.2} />
        <path d={path('ukeMargin')} fill="none" stroke={colors.uke} strokeWidth={2.2} />
        <line x1={x(t)} x2={x(t)} y1={PAD.t - 4} y2={H - PAD.b + 2} stroke={cssVar('reference')} strokeWidth={1.5} />
        {phases.map((p) => (
          <text key={p.name} x={(x(p.start) + x(p.end)) / 2} y={H - 4} textAnchor="middle" style={{ ...TICK_STYLE, fontWeight: 600 }}>
            {p.label.split(' · ')[0]}
          </text>
        ))}
      </svg>
      <Text type="supporting">
        동적 안정 여유(cm): XCoM이 기저면 안쪽으로 얼마나 들어와 있는지. 0 아래면 무너진 상태이고, 선이 끊긴 구간은 지면 접촉이 없는 때입니다.
      </Text>
    </Stack>
  );
}
