import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Slider } from '@astryxdesign/core/Slider';
import { Stack } from '@astryxdesign/core/Stack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Text } from '@astryxdesign/core/Text';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import { Line } from '@react-three/drei';
import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import type { Contact } from '../body/contact';
import { BalanceMap } from '../components/BalanceMap';
import { BalanceReadout, formatMargin } from '../components/BalanceReadout';
import { StabilityChart } from '../components/StabilityChart';
import { Workspace } from '../components/Workspace';
import { BalanceOverlay, ComTrail } from '../scene/BalanceOverlay';
import { Figure } from '../scene/Figure';
import { Stage, VIEW_LABEL, type ViewPreset } from '../scene/Stage';
import { TECHNIQUES } from '../techniques';
import { analyzeFrame, sampleTimeline, type ActorFrame, type Frame } from '../techniques/analyze';
import { duration as techDuration, phaseAt, type TechniqueAnimation } from '../techniques/timeline';
import { cssVar, GI_COLOR, useResolvedColors } from '../ui/tokens';

const SPEEDS = ['0.1', '0.25', '0.5', '1'] as const;
type Speed = (typeof SPEEDS)[number];

/** 표시 토글. 자주 켜고 끄므로 3D 바로 위 툴바에 묶음별로 항상 보이게 둔다 */
const TOGGLE_GROUPS = [
  {
    label: '사람',
    items: [
      ['tori', '토리'],
      ['uke', '우케'],
      ['xray', '반투명'],
    ],
  },
  {
    label: '균형 분석',
    items: [
      ['com', '질량중심'],
      ['support', '기저면'],
      ['xcom', 'XCoM'],
      ['trail', '궤적'],
      ['segments', '분절'],
      ['pair', '두 사람 합성'],
    ],
  },
  {
    label: '접촉',
    items: [
      ['contacts', '겹침 보정'],
      ['contactMarks', '접촉점'],
    ],
  },
] as const;
type ToggleKey = (typeof TOGGLE_GROUPS)[number]['items'][number][0];
const DEFAULT_ON: ToggleKey[] = ['tori', 'uke', 'com', 'support', 'xcom', 'trail', 'contacts', 'contactMarks'];

function initialTime(): number {
  const q = new URLSearchParams(location.search).get('t');
  return q ? Number(q) || 0 : 0;
}

function initialTech() {
  const id = new URLSearchParams(location.search).get('tech');
  return TECHNIQUES.find((x) => x.id === id) ?? TECHNIQUES[0]!;
}

export function TechniqueViewer() {
  const [tech, setTech] = useState(initialTech);
  const duration = techDuration(tech);
  const [t, setT] = useState(initialTime);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('0.25');
  const [view, setView] = useState<ViewPreset>(
    () => (new URLSearchParams(location.search).get('view') as ViewPreset) || 'side',
  );
  const [viewNonce, setViewNonce] = useState(0);
  const [shown, setShown] = useState<string[]>(DEFAULT_ON);
  const show = (k: ToggleKey) => shown.includes(k);

  const opts = useMemo(() => ({ contacts: shown.includes('contacts') }), [shown]);
  const samples = useMemo(() => sampleTimeline(tech, 180, opts), [tech, opts]);
  const frame = useMemo(() => analyzeFrame(tech, t, opts), [tech, t, opts]);
  const phase = phaseAt(tech, t);

  const last = useRef<number | null>(null);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = (now: number) => {
      const dt = last.current === null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setT((prev) => {
        const next = prev + dt * Number(speed);
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
  const seek = (v: number) => {
    setPlaying(false);
    setT(v);
  };

  const controls = (
    <Stack gap={2}>
      {/* 1행: 기술(탭) · 시점. 좁으면 줄바꿈되고, 탭은 가로로 스크롤된다 */}
      <Stack direction="horizontal" gap={3} align="center" justify="between" wrap="wrap">
        <TabList
          value={tech.id}
          onChange={(id) => {
            setTech(TECHNIQUES.find((x) => x.id === id)!);
            setT(0);
            setPlaying(false);
          }}
        >
          {TECHNIQUES.map((x) => (
            <Tab key={x.id} value={x.id} label={x.koreanName} />
          ))}
        </TabList>
        <SegmentedControl
          label="카메라 시점"
          size="sm"
          value={view}
          onChange={(v) => {
            setView(v as ViewPreset);
            setViewNonce((n) => n + 1);
          }}
        >
          {(Object.keys(VIEW_LABEL) as (keyof typeof VIEW_LABEL)[]).map((v) => (
            <SegmentedControlItem key={v} value={v} label={VIEW_LABEL[v]} />
          ))}
        </SegmentedControl>
      </Stack>
      {/* 2행: 표시 토글. 묶음 사이에 세로 구분선, 좁으면 가로 스크롤 */}
      <Stack direction="horizontal" gap={2} align="center" isScrollable>
        {TOGGLE_GROUPS.map((g, i) => (
          <Stack key={g.label} direction="horizontal" gap={2} align="center">
            {i > 0 && <Divider orientation="vertical" />}
            <ToggleButtonGroup
              label={g.label}
              type="multiple"
              size="sm"
              value={shown.filter((k) => g.items.some(([key]) => key === k))}
              onChange={(v) => {
                const inGroup = new Set<string>(g.items.map(([key]) => key));
                setShown([...shown.filter((k) => !inGroup.has(k)), ...(v as string[])]);
              }}
            >
              {g.items.map(([key, label]) => (
                <ToggleButton key={key} value={key} label={label}>
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );

  const timeline = (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={3} align="center" wrap="wrap">
        <IconButton
          label={playing ? '일시정지' : '재생'}
          variant="primary"
          icon={playing ? <Pause size={16} /> : <Play size={16} />}
          onClick={() => setPlaying((p) => !p)}
        />
        <SegmentedControl label="재생 속도" size="sm" value={speed} onChange={(v) => setSpeed(v as Speed)}>
          {SPEEDS.map((s) => (
            <SegmentedControlItem key={s} value={s} label={`${s}×`} />
          ))}
        </SegmentedControl>
        <SegmentedControl
          label="단계로 이동"
          size="sm"
          value={phase?.name ?? ''}
          onChange={(name) => {
            const p = tech.phases.find((x) => x.name === name);
            if (p) seek((p.start + p.end) / 2);
          }}
        >
          {tech.phases.map((p) => (
            <SegmentedControlItem key={p.name} value={p.name} label={p.label.split(' · ')[0]!} />
          ))}
        </SegmentedControl>
        <Text type="supporting" hasTabularNumbers>
          {shownT.toFixed(2)}s / {duration.toFixed(1)}s
        </Text>
      </Stack>
      <Slider
        label="시간"
        isLabelHidden
        min={0}
        max={duration}
        step={0.005}
        value={shownT}
        valueDisplay="none"
        onChange={(v: number) => seek(v)}
        width="100%"
      />
      <StabilityChart
        samples={samples}
        phases={tech.phases}
        duration={duration}
        t={shownT}
        colors={{ tori: cssVar('tori'), uke: cssVar('uke') }}
        onSeek={seek}
      />
    </Stack>
  );

  return (
    <Workspace
      controls={controls}
      stage={<TechniqueScene frame={frame} samples={samples} show={show} view={view} viewNonce={viewNonce} />}
      footer={timeline}
      panel={
        <AnalysisPanel tech={tech} frame={frame} phaseIndex={phase ? tech.phases.indexOf(phase) : -1} shown={shown} />
      }
      panelLabel="분석"
    />
  );
}

// ---------------------------------------------------------------------------
// 3D 장면
// ---------------------------------------------------------------------------

function TechniqueScene({
  frame,
  samples,
  show,
  view,
  viewNonce,
}: {
  frame: Frame;
  samples: ReturnType<typeof sampleTimeline>;
  show: (k: ToggleKey) => boolean;
  view: ViewPreset;
  viewNonce: number;
}) {
  const color = useResolvedColors(['tori', 'uke', 'pair', 'contact'] as const);
  return (
    <Stage view={view} viewNonce={viewNonce}>
      {show('tori') && <Figure points={frame.tori.body.points} color={GI_COLOR.tori} xray={show('xray')} />}
      {show('uke') && <Figure points={frame.uke.body.points} color={GI_COLOR.uke} xray={show('xray')} />}
      {show('com') &&
        (['tori', 'uke'] as const)
          .filter((k) => show(k))
          .map((k) => (
            <BalanceOverlay
              key={k}
              com={frame[k].com}
              balance={frame[k].balance}
              color={color[k]}
              showSupport={show('support')}
              showSegments={show('segments')}
              showXcom={show('xcom')}
            />
          ))}
      {show('com') && show('trail') && (
        <>
          {show('tori') && <ComTrail points={samples.map((s) => s.toriCom)} color={color.tori} />}
          {show('uke') && <ComTrail points={samples.map((s) => s.ukeCom)} color={color.uke} />}
        </>
      )}
      {show('pair') && <PairCom position={frame.pairCom} color={color.pair} />}
      {show('contactMarks') && frame.contact && (
        <ContactMarks contacts={frame.contact.contacts} color={color.contact} />
      )}
    </Stage>
  );
}

/** 두 사람이 맞닿은 지점 */
function ContactMarks({ contacts, color }: { contacts: Contact[]; color: string }) {
  return (
    <group>
      {contacts.map((c, i) => (
        <mesh key={i} position={c.position} renderOrder={11}>
          <sphereGeometry args={[0.026, 16, 12]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** 잡기로 묶인 두 사람을 한 덩어리로 본 질량중심 (업어치기처럼 상대를 업을 때 중요) */
function PairCom({ position, color }: { position: Vector3; color: string }) {
  return (
    <group>
      <mesh position={position} renderOrder={10}>
        <octahedronGeometry args={[0.045]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
      <Line
        points={[position, new Vector3(position.x, 0.004, position.z)]}
        color={color}
        lineWidth={1.5}
        dashed
        dashSize={0.04}
        gapSize={0.03}
        depthTest={false}
        renderOrder={8}
      />
      <mesh position={[position.x, 0.005, position.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8}>
        <ringGeometry args={[0.03, 0.05, 4]} />
        <meshBasicMaterial color={color} depthTest={false} transparent />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 분석 패널
// ---------------------------------------------------------------------------

function AnalysisPanel({
  tech,
  frame,
  phaseIndex,
  shown,
}: {
  tech: TechniqueAnimation;
  frame: Frame;
  phaseIndex: number;
  shown: string[];
}) {
  const phase = tech.phases[phaseIndex];
  const showTori = shown.includes('tori');
  const showUke = shown.includes('uke');
  return (
    <Stack gap={4}>
      {/* 재생·탐색 중 가장 자주 읽는 순서로: 지금 단계 → 두 사람 수치 → 맞닿은 곳 → 지도 → 기술 소개 */}
      {phase && (
        <Card variant="muted">
          <Stack gap={2}>
            <Text type="supporting">
              {tech.koreanName} · {phase.name} · {phaseIndex + 1}/{tech.phases.length}
            </Text>
            <Heading level={3}>{phase.label}</Heading>
            <Text>{phase.description}</Text>
            {/* ListItem 라벨은 한 줄로 잘리므로, 긴 요점은 줄바꿈되는 Text로 적는다 */}
            <Stack gap={1}>
              {phase.cues.map((c) => (
                <Text key={c} as="p" color="secondary">
                  · {c}
                </Text>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      <Grid columns={2} gap={2}>
        <ActorCard label="토리" color={cssVar('tori')} frame={frame.tori} />
        <ActorCard label="우케" color={cssVar('uke')} frame={frame.uke} />
      </Grid>

      {frame.contact && (
        <List header={<Text type="label">지금 맞닿은 곳 (토리 ↔ 우케)</Text>} density="compact" hasDividers>
          {frame.contact.contacts.length === 0 ? (
            <ListItem label="손 외에는 닿은 곳 없음" isDisabled />
          ) : (
            frame.contact.contacts.map((c, i) => <ListItem key={i} label={c.label} />)
          )}
        </List>
      )}

      <BalanceMap
        entries={[
          ...(showTori ? [{ id: 'tori', label: '토리', color: cssVar('tori'), balance: frame.tori.balance }] : []),
          ...(showUke ? [{ id: 'uke', label: '우케', color: cssVar('uke'), balance: frame.uke.balance }] : []),
        ]}
        extent={1.6}
        center={tech.mapCenter ?? { x: 0.15, y: 0.25 }}
      />

      <Stack gap={1}>
        <Text type="supporting">
          {tech.category} · {tech.japaneseName} · {tech.romaji}
        </Text>
        <Heading level={2}>{tech.koreanName}</Heading>
        <Text color="secondary">{tech.summary}</Text>
      </Stack>
    </Stack>
  );
}

function ActorCard({ label, color, frame }: { label: string; color: string; frame: ActorFrame }) {
  const b = frame.balance;
  const speed = Math.hypot(frame.velocity.x, frame.velocity.z);
  return (
    <BalanceReadout
      label={label}
      color={color}
      state={b.state}
      rows={[
        ['정적 여유', formatMargin(b.margin)],
        ['동적 여유', formatMargin(b.xcomMargin)],
        ['CoM 높이', `${(frame.com.com.y * 100).toFixed(0)}cm`],
        ['수평 속도', `${speed.toFixed(2)}m/s`],
      ]}
    />
  );
}
