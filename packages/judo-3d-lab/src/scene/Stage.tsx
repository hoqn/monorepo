import { CameraControls, Grid } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useState, type ReactNode } from 'react';
import { PerspectiveCamera } from 'three';

export type ViewPreset = 'side' | 'front' | 'back' | 'top' | 'free';

export const VIEW_LABEL: Record<Exclude<ViewPreset, 'free'>, string> = {
  side: '측면',
  front: '토리 뒤',
  back: '우케 뒤',
  top: '위',
};

/** [카메라 위치, 바라볼 점] */
const VIEWS: Record<Exclude<ViewPreset, 'free'>, [number, number, number, number, number, number]> = {
  side: [3.2, 1.3, 0.2, 0.1, 0.8, 0.2],
  front: [0.4, 1.5, -3.0, 0.1, 0.85, 0.3],
  back: [-0.3, 1.5, 3.4, 0.1, 0.85, 0.1],
  top: [0.1, 4.2, 0.25, 0.1, 0, 0.2],
};

interface Props {
  children: ReactNode;
  view: ViewPreset;
  /** view가 같아도 다시 이동시키고 싶을 때 바꾸는 값 */
  viewNonce?: number;
}

export function Stage({ children, view, viewNonce = 0 }: Props) {
  // CameraControls는 Canvas 내부(별도 리컨실러)에서 마운트되므로 ref 대신 state로 받아
  // 마운트된 뒤에 첫 시점을 적용한다.
  const [controls, setControls] = useState<CameraControls | null>(null);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (view === 'free' || !controls) return;
    const [px, py, pz, tx, ty, tz] = VIEWS[view];
    // 세로로 긴 화면(모바일)에서는 두 사람이 잘리지 않게 더 멀리서 본다
    const k = controls.camera instanceof PerspectiveCamera && controls.camera.aspect < 1 ? 1.6 : 1;
    void controls.setLookAt(tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k, tx, ty, tz, placed);
    setPlaced(true);
  }, [view, viewNonce, controls]);

  return (
    <Canvas shadows camera={{ position: VIEWS.side.slice(0, 3) as [number, number, number], fov: 40, near: 0.05, far: 100 }}>
      <color attach="background" args={['#eef0f2']} />
      <hemisphereLight args={['#ffffff', '#b7b1a3', 1.1]} />
      <directionalLight
        position={[2.5, 5, 2]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <Mat />
      {children}
      <CameraControls ref={setControls} makeDefault minDistance={0.8} maxDistance={10} maxPolarAngle={Math.PI / 2 - 0.02} />
    </Canvas>
  );
}

/** 다다미 매트: 1m × 2m 칸 */
function Mat() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#cfd8c4" roughness={1} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[8, 8]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#b6c1aa"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#97a58a"
        fadeDistance={14}
        infiniteGrid={false}
      />
    </group>
  );
}
