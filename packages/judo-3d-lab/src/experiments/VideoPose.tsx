import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible } from '@astryxdesign/core/Collapsible';
import { FileInput } from '@astryxdesign/core/FileInput';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Slider } from '@astryxdesign/core/Slider';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { computeCom } from '../body/anthropometry';
import { analyzeBalance } from '../body/balance';
import { estimateLateralOffsets, SKELETON_EDGES, worldLandmarksToBody, type Landmark } from '../body/fromMediapipe';
import type { BodyPoints } from '../body/points';
import { BalanceMap } from '../components/BalanceMap';
import { BalanceReadout, formatMargin } from '../components/BalanceReadout';
import { Workspace } from '../components/Workspace';
import { BalanceOverlay } from '../scene/BalanceOverlay';
import { Figure } from '../scene/Figure';
import { Stage, type ViewPreset } from '../scene/Stage';
import { cssVar, GI_COLOR, useResolvedColors } from '../ui/tokens';

const MODELS = {
  lite: {
    label: 'Lite · 빠름',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  },
  full: {
    label: 'Full · 균형',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
  },
  heavy: {
    label: 'Heavy · 정확',
    url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
  },
} as const;
type ModelId = keyof typeof MODELS;

/** 첫 번째·두 번째로 감지된 사람의 도복 색과 분석 색(토큰) */
const PERSON = [
  { gi: GI_COLOR.tori, token: 'tori' },
  { gi: GI_COLOR.uke, token: 'uke' },
] as const;

interface DetectedFrame {
  time: number;
  image: Landmark[][];
  bodies: BodyPoints[];
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'running'; progress: number }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

const landmarkerCache = new Map<string, Promise<PoseLandmarker>>();

function getLandmarker(model: ModelId, mode: 'IMAGE' | 'VIDEO'): Promise<PoseLandmarker> {
  const key = `${model}:${mode}`;
  let p = landmarkerCache.get(key);
  if (!p) {
    const create = (delegate: 'GPU' | 'CPU') =>
      PoseLandmarker.createFromOptions(
        { wasmLoaderPath, wasmBinaryPath },
        {
          baseOptions: { modelAssetPath: MODELS[model].url, delegate },
          runningMode: mode,
          numPoses: 2,
          minPoseDetectionConfidence: 0.4,
          minPosePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        },
      );
    p = create('GPU').catch(() => create('CPU'));
    p.catch(() => landmarkerCache.delete(key));
    landmarkerCache.set(key, p);
  }
  return p;
}

function toBodies(image: Landmark[][], world: Landmark[][], aspect: number): BodyPoints[] {
  const offsets = estimateLateralOffsets(image, world, aspect);
  return world.map((w, i) => worldLandmarksToBody(w, offsets[i]));
}

export function VideoPose() {
  const [file, setFile] = useState<{ url: string; kind: 'image' | 'video'; name: string } | null>(null);
  const [model, setModel] = useState<ModelId>('full');
  const [fps, setFps] = useState(10);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [frames, setFrames] = useState<DetectedFrame[]>([]);
  const [index, setIndex] = useState(0);
  // MediaPipe 좌표에서 사람은 카메라(+Z)를 바라보므로 'back' 프리셋(+Z에서 보는 시점)이 카메라 시점이다
  const [view, setView] = useState<ViewPreset>('back');
  const [mass, setMass] = useState(70);
  const [picked, setPicked] = useState<File | null>(null);
  const resolved = useResolvedColors(['tori', 'uke'] as const);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => () => void (file && URL.revokeObjectURL(file.url)), [file]);

  const onFile = (f: File | null) => {
    setPicked(f);
    if (!f) {
      setFile(null);
      return;
    }
    cancelRef.current = true;
    setFrames([]);
    setIndex(0);
    setStatus({ kind: 'idle' });
    setFile({ url: URL.createObjectURL(f), kind: f.type.startsWith('video') ? 'video' : 'image', name: f.name });
  };

  const run = async () => {
    if (!file) return;
    cancelRef.current = false;
    setFrames([]);
    try {
      setStatus({ kind: 'loading', message: '모델과 WASM 런타임을 불러오는 중…' });
      if (file.kind === 'image') {
        const img = imgRef.current!;
        if (!img.complete) await new Promise((r) => img.addEventListener('load', r, { once: true }));
        const lm = await getLandmarker(model, 'IMAGE');
        setStatus({ kind: 'running', progress: 0 });
        const res = lm.detect(img);
        const aspect = img.naturalWidth / img.naturalHeight;
        setFrames([{ time: 0, image: res.landmarks, bodies: toBodies(res.landmarks, res.worldLandmarks, aspect) }]);
      } else {
        const video = videoRef.current!;
        if (video.readyState < 1) await new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true }));
        const lm = await getLandmarker(model, 'VIDEO');
        const aspect = video.videoWidth / video.videoHeight;
        const out: DetectedFrame[] = [];
        const total = Math.max(1, Math.floor(video.duration * fps));
        video.pause();
        for (let i = 0; i <= total; i++) {
          if (cancelRef.current) break;
          const time = Math.min(video.duration, i / fps);
          video.currentTime = time;
          await new Promise((r) => video.addEventListener('seeked', r, { once: true }));
          const res = lm.detectForVideo(video, Math.round(time * 1000) + 1);
          out.push({ time, image: res.landmarks, bodies: toBodies(res.landmarks, res.worldLandmarks, aspect) });
          if (i % 3 === 0) setStatus({ kind: 'running', progress: i / total });
        }
        setFrames(out);
        setIndex(0);
        video.currentTime = 0;
      }
      setStatus({ kind: 'done' });
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  };

  const frame = frames[index];

  const analysis = useMemo(() => {
    if (!frame) return [];
    return frame.bodies.map((points, i) => {
      const com = computeCom(points, mass);
      // 단안 추정은 프레임마다 떨림이 커서 ±2프레임 중앙 차분으로 속도를 구한다
      const a = frames[Math.max(0, index - 2)];
      const b = frames[Math.min(frames.length - 1, index + 2)];
      let velocity: Vector3 | null = null;
      if (a && b && a !== b && a.bodies[i] && b.bodies[i]) {
        velocity = new Vector3()
          .subVectors(computeCom(b.bodies[i]!, mass).com, computeCom(a.bodies[i]!, mass).com)
          .divideScalar(b.time - a.time);
      }
      return { points, com, balance: analyzeBalance(points, com.com, velocity) };
    });
  }, [frame, frames, index, mass]);

  // 2D 오버레이
  useEffect(() => {
    const canvas = overlayRef.current;
    const media = file?.kind === 'video' ? videoRef.current : imgRef.current;
    if (!canvas || !media) return;
    const rect = media.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!frame) return;
    // object-fit: contain 영역 계산
    const natW = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth;
    const natH = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
    const scale = Math.min(canvas.width / natW, canvas.height / natH);
    const ox = (canvas.width - natW * scale) / 2;
    const oy = (canvas.height - natH * scale) / 2;
    frame.image.forEach((lms, pi) => {
      ctx.strokeStyle = resolved[PERSON[pi % 2]!.token];
      ctx.lineWidth = 3 * devicePixelRatio;
      for (const [a, b] of SKELETON_EDGES) {
        ctx.beginPath();
        ctx.moveTo(ox + lms[a]!.x * natW * scale, oy + lms[a]!.y * natH * scale);
        ctx.lineTo(ox + lms[b]!.x * natW * scale, oy + lms[b]!.y * natH * scale);
        ctx.stroke();
      }
    });
  }, [frame, file, resolved]);

  useEffect(() => {
    const v = videoRef.current;
    if (frame && v && file?.kind === 'video' && Math.abs(v.currentTime - frame.time) > 0.01) v.currentTime = frame.time;
  }, [frame, file]);

  const isBusy = status.kind === 'loading' || status.kind === 'running';
  // 미디어 위에 2D 골격 캔버스를 겹친다. 둘 다 같은 상자를 꽉 채우고 object-fit: contain으로 맞춘다
  const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' } as const;

  return (
    <Workspace
      controls={
        <Stack direction="horizontal" justify="end">
          <SegmentedControl label="카메라 시점" value={view} onChange={(v) => setView(v as ViewPreset)}>
            <SegmentedControlItem value="back" label="카메라 쪽" />
            <SegmentedControlItem value="side" label="측면" />
            <SegmentedControlItem value="top" label="위" />
          </SegmentedControl>
        </Stack>
      }
      stage={
        <Stage view={view}>
          {analysis.map((a, i) => (
            <group key={i}>
              <Figure points={a.points} color={PERSON[i % 2]!.gi} xray />
              <BalanceOverlay com={a.com} balance={a.balance} color={resolved[PERSON[i % 2]!.token]} showXcom={false} />
            </group>
          ))}
        </Stage>
      }
      panel={
        <Stack gap={4}>
          <Stack gap={1}>
            <Text type="supporting">실험 3</Text>
            <Heading level={2}>영상 → 3D 자세 추출</Heading>
            <Text color="secondary">
              Google MediaPipe Pose Landmarker로 사진·영상에서 3D 관절 좌표를 추정하고, 실험 1·2와 같은 무게중심 분석을
              돌립니다. 모든 처리는 브라우저 안에서만 이루어지며 파일은 업로드되지 않습니다.
            </Text>
          </Stack>

          <FileInput
            label="사진 또는 영상"
            description="한 사람 또는 두 사람이 전신으로 나오는 사진이나 짧은 영상(10초 이내 권장)"
            accept="video/*,image/*"
            value={picked}
            onChange={(f) => onFile(Array.isArray(f) ? (f[0] ?? null) : f)}
          />
          <Stack gap={1}>
            <Text type="label">모델</Text>
            <SegmentedControl label="모델" layout="fill" value={model} onChange={(v) => setModel(v as ModelId)}>
              {Object.entries(MODELS).map(([value, m]) => (
                <SegmentedControlItem key={value} value={value} label={m.label} />
              ))}
            </SegmentedControl>
          </Stack>
          {file?.kind === 'video' && (
            <Stack gap={1}>
              <Text type="label">샘플링</Text>
              <SegmentedControl label="샘플링" layout="fill" value={String(fps)} onChange={(v) => setFps(Number(v))}>
                {[5, 10, 15, 30].map((f) => (
                  <SegmentedControlItem key={f} value={String(f)} label={`${f} fps`} />
                ))}
              </SegmentedControl>
            </Stack>
          )}
          <Button label="분석" variant="primary" isDisabled={!file} isLoading={isBusy} onClick={run} width="100%" />
          <StatusLine status={status} />

          {file && (
            <Card padding={0}>
              <Stack height={file.kind === 'video' ? 260 : 300} style={{ position: 'relative' }}>
                {file.kind === 'video' && (
                  <video ref={videoRef} src={file.url} muted playsInline preload="auto" style={fill} />
                )}
                {file.kind === 'image' && <img ref={imgRef} src={file.url} alt={file.name} style={fill} />}
                <canvas ref={overlayRef} style={{ ...fill, pointerEvents: 'none' }} />
              </Stack>
            </Card>
          )}

          {frames.length > 1 && (
            <Slider
              label="프레임"
              min={0}
              max={frames.length - 1}
              value={index}
              onChange={(v: number) => setIndex(v)}
              valueDisplay="text"
              formatValue={(v) => `${v + 1} / ${frames.length}`}
              width="100%"
            />
          )}
          {frames.length > 0 && <Text type="supporting">감지된 사람 {frame?.bodies.length ?? 0}명</Text>}

          {analysis.length > 0 && (
            <Grid columns={2} gap={2}>
              {analysis.map((a, i) => (
                <BalanceReadout
                  key={i}
                  label={`사람 ${i + 1}`}
                  color={cssVar(PERSON[i % 2]!.token)}
                  state={a.balance.state}
                  rows={[
                    ['정적 여유', formatMargin(a.balance.margin)],
                    ['CoM 높이', `${(a.com.com.y * 100).toFixed(0)}cm`],
                  ]}
                />
              ))}
            </Grid>
          )}
          {analysis.length > 0 && (
            <BalanceMap
              entries={analysis.map((a, i) => ({
                id: String(i),
                label: `사람 ${i + 1}`,
                color: cssVar(PERSON[i % 2]!.token),
                balance: a.balance,
              }))}
            />
          )}
          <NumberInput
            label="체중(kg)"
            description="질량중심 위치는 체중과 무관하고, 분절 비율만 사용합니다."
            value={mass}
            onChange={(v) => setMass(v || 70)}
          />

          <Collapsible trigger={<Text type="label">이 실험의 한계 (중요)</Text>} defaultIsOpen={false}>
            <Stack gap={1}>
              {LIMITS.map((l) => (
                <Text key={l} as="p" color="secondary">
                  · {l}
                </Text>
              ))}
            </Stack>
          </Collapsible>
        </Stack>
      }
      panelLabel="입력"
      panelSide="start"
      panelWidth={460}
      narrowFirst="panel"
    />
  );
}

const LIMITS = [
  '카메라 한 대로 깊이를 "추측"하므로 앞뒤 방향 오차가 큽니다. 무게중심의 앞뒤 위치는 특히 믿기 어렵습니다.',
  'MediaPipe는 사람마다 자기 골반을 원점으로 좌표를 주기 때문에, 두 사람의 앞뒤 거리 관계가 사라집니다(좌우만 2D로 추정해 벌려 놓음).',
  '유도처럼 두 사람이 엉켜 가려지는 장면에서는 관절이 뒤바뀌거나 사라지기 쉽습니다.',
  '바닥 높이를 모르므로 가장 낮은 발을 매트에 붙입니다. 공중 동작에서는 높이가 틀립니다.',
];

function StatusLine({ status }: { status: Status }) {
  switch (status.kind) {
    case 'idle':
      return null;
    case 'loading':
      return <ProgressBar label={status.message} isIndeterminate />;
    case 'running':
      return <ProgressBar label="분석 중" value={status.progress * 100} hasValueLabel />;
    case 'done':
      return <Banner status="success" title="분석 완료" collapsible={false} />;
    case 'error':
      return <Banner status="error" title="분석하지 못했습니다" description={status.message} collapsible={false} />;
  }
}
