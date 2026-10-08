import { Card } from '@astryxdesign/core/Card';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import type { BalanceResult, P2 } from '../body/balance';
import { cssVar } from '../ui/tokens';

export interface BalanceMapEntry {
  id: string;
  label: string;
  /** CSS 색 값 (토큰 var) */
  color: string;
  balance: BalanceResult;
}

interface Props {
  entries: BalanceMapEntry[];
  /** 화면에 담을 범위 (m). 지정하지 않으면 데이터에 맞춘다 */
  extent?: number;
  /** 화면 중심 (지정하지 않으면 데이터에 맞춘다). 애니메이션 중 지도가 흔들리지 않게 고정할 때 */
  center?: P2;
  title?: string;
}

const SIZE = 220;

/**
 * 위에서 내려다본 기저면 지도. 3D 화면보다 "질량중심이 기저면 안에 있는가"를 읽기 쉽다.
 * 화면 위쪽 = +Z(토리가 바라보는 방향), 오른쪽 = −X(토리의 오른쪽).
 */
export function BalanceMap({ entries, extent, center, title = '위에서 본 기저면' }: Props) {
  const pts: P2[] = entries.flatMap((e) => [...e.balance.hull, e.balance.comGround, ...(e.balance.xcom ? [e.balance.xcom] : [])]);
  const cx = center ? center.x : pts.length ? (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2 : 0;
  const cy = center ? center.y : pts.length ? (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2 : 0;
  const span = extent ?? Math.max(0.9, ...pts.map((p) => Math.max(Math.abs(p.x - cx), Math.abs(p.y - cy)) * 2 + 0.25));
  const k = SIZE / span;
  // 토리 뒤 위에서 내려다본 방향: 화면 오른쪽 = −X, 화면 위 = +Z
  const sx = (p: P2) => SIZE / 2 - (p.x - cx) * k;
  const sy = (p: P2) => SIZE / 2 - (p.y - cy) * k;
  const danger = cssVar('danger');

  return (
    <Card>
      <Stack gap={2}>
        <Text type="label">{title}</Text>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title} style={{ width: '100%', aspectRatio: '1' }}>
          <defs>
            <pattern id="bm-grid" width={k * 0.1} height={k * 0.1} patternUnits="userSpaceOnUse" x={sx({ x: 0, y: 0 })} y={sy({ x: 0, y: 0 })}>
              <path d={`M ${k * 0.1} 0 L 0 0 0 ${k * 0.1}`} fill="none" stroke={cssVar('grid')} strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width={SIZE} height={SIZE} fill="url(#bm-grid)" />
          {entries.map((e) => {
            const b = e.balance;
            const bad = b.state === 'unstable' || b.state === 'airborne' || b.state === 'down';
            return (
              <g key={e.id}>
                {b.hull.length >= 3 && (
                  <polygon
                    points={b.hull.map((h) => `${sx(h)},${sy(h)}`).join(' ')}
                    fill={e.color}
                    fillOpacity={0.18}
                    stroke={e.color}
                    strokeWidth={1.5}
                  />
                )}
                {b.hull.length === 2 && <polyline points={b.hull.map((h) => `${sx(h)},${sy(h)}`).join(' ')} stroke={e.color} strokeWidth={2} />}
                {b.xcom && (
                  <>
                    <line x1={sx(b.comGround)} y1={sy(b.comGround)} x2={sx(b.xcom)} y2={sy(b.xcom)} stroke={e.color} strokeWidth={1.5} />
                    <circle cx={sx(b.xcom)} cy={sy(b.xcom)} r={3} fill={(b.xcomMargin ?? 0) < 0 ? danger : e.color} />
                  </>
                )}
                <circle cx={sx(b.comGround)} cy={sy(b.comGround)} r={5.5} fill={cssVar('surface')} stroke={bad ? danger : e.color} strokeWidth={2.5} />
                <circle cx={sx(b.comGround)} cy={sy(b.comGround)} r={2} fill={bad ? danger : e.color} />
              </g>
            );
          })}
        </svg>
        <Text type="supporting">○ 질량중심 투영 · ● XCoM(속도 반영) · 한 칸 = 10cm</Text>
      </Stack>
    </Card>
  );
}
