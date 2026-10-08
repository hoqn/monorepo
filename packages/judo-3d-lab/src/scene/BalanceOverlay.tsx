import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import { DoubleSide, Shape, ShapeGeometry, Vector2, Vector3 } from 'three';
import type { ComResult } from '../body/anthropometry';
import type { BalanceResult } from '../body/balance';
import { useResolvedColors } from '../ui/tokens';

interface Props {
  com: ComResult;
  balance: BalanceResult;
  color: string;
  showSupport?: boolean;
  showSegments?: boolean;
  showXcom?: boolean;
}

const GROUND = 0.004;

/** 질량중심(구) · 수직선 · 바닥 투영점 · 기저면 다각형 · XCoM */
export function BalanceOverlay({ com, balance, color, showSupport = true, showSegments = false, showXcom = true }: Props) {
  const theme = useResolvedColors(['danger', 'surface', 'ink'] as const);
  const c = com.com;
  const ground = new Vector3(c.x, GROUND, c.z);
  const outside = balance.state === 'unstable' || balance.state === 'airborne' || balance.state === 'down';

  const hullGeometry = useMemo(() => {
    if (balance.hull.length < 3) return null;
    const shape = new Shape(balance.hull.map((h) => new Vector2(h.x, -h.y)));
    const g = new ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [balance.hull]);

  const hullOutline = balance.hull.length >= 2 ? [...balance.hull, balance.hull[0]!].map((h) => new Vector3(h.x, GROUND, h.y)) : null;

  return (
    <group>
      {/* 질량중심 */}
      <mesh position={c} renderOrder={10}>
        <sphereGeometry args={[0.035, 24, 16]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
      <mesh position={c} renderOrder={9}>
        <sphereGeometry args={[0.05, 24, 16]} />
        <meshBasicMaterial color={theme.surface} depthTest={false} transparent opacity={0.6} />
      </mesh>
      <Line points={[c, ground]} color={color} lineWidth={1.5} dashed dashSize={0.04} gapSize={0.03} depthTest={false} renderOrder={8} />
      {/* 바닥 투영점 */}
      <mesh position={ground} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <ringGeometry args={[0.022, 0.04, 32]} />
        <meshBasicMaterial color={outside ? theme.danger : color} side={DoubleSide} depthTest={false} transparent />
      </mesh>

      {showSupport && hullGeometry && (
        <mesh geometry={hullGeometry} position={[0, GROUND - 0.001, 0]} renderOrder={1}>
          <meshBasicMaterial color={color} transparent opacity={0.22} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {showSupport && hullOutline && <Line points={hullOutline} color={color} lineWidth={2} />}

      {showXcom && balance.xcom && (
        <>
          <Line
            points={[ground, new Vector3(balance.xcom.x, GROUND, balance.xcom.y)]}
            color={color}
            lineWidth={2.5}
            depthTest={false}
            renderOrder={8}
          />
          <mesh position={[balance.xcom.x, GROUND, balance.xcom.y]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
            <circleGeometry args={[0.018, 20]} />
            <meshBasicMaterial color={(balance.xcomMargin ?? 0) < 0 ? theme.danger : color} depthTest={false} transparent />
          </mesh>
        </>
      )}

      {showSegments &&
        com.segments.map((s) => (
          <mesh key={s.def.id} position={s.position} renderOrder={7}>
            <sphereGeometry args={[0.008 + Math.cbrt(s.def.massFraction) * 0.03, 12, 8]} />
            <meshBasicMaterial color={theme.ink} depthTest={false} transparent opacity={0.85} />
          </mesh>
        ))}
    </group>
  );
}

/** 질량중심 궤적 */
export function ComTrail({ points, color }: { points: Vector3[]; color: string }) {
  if (points.length < 2) return null;
  return <Line points={points} color={color} lineWidth={1.5} transparent opacity={0.7} depthTest={false} renderOrder={6} />;
}
