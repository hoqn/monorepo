import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutPanel } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { Slider } from '@astryxdesign/core/Slider';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { Line } from '@react-three/drei';
import { Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Vector3 } from 'three';
import type { Contact } from '../body/contact';
import { BalanceMap } from '../components/BalanceMap';
import { BalanceReadout, formatMargin } from '../components/BalanceReadout';
import { StabilityChart } from '../components/StabilityChart';
import { BalanceOverlay, ComTrail } from '../scene/BalanceOverlay';
import { Figure } from '../scene/Figure';
import { Stage, VIEW_LABEL, type ViewPreset } from '../scene/Stage';
import { TECHNIQUES } from '../techniques';
import { analyzeFrame, sampleTimeline, type ActorFrame, type Frame } from '../techniques/analyze';
import { duration as techDuration, phaseAt, type TechniqueAnimation } from '../techniques/timeline';
import { cssVar, GI_COLOR, useResolvedColors } from '../ui/tokens';

const SPEEDS = ['0.1', '0.25', '0.5', '1'] as const;
type Speed = (typeof SPEEDS)[number];

const VIEW_OPTIONS = (Object.keys(VIEW_LABEL) as (keyof typeof VIEW_LABEL)[]).map((v) => ({
  value: v,
  label: VIEW_LABEL[v],
}));

const TOGGLES = [
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
] as const;
type ToggleKey = (typeof TOGGLES)[number][0];
const DEFAULT_ON: ToggleKey[] = ['tori', 'uke', 'com', 'support', 'xcom', 'trail', 'contacts', 'contactMarks'];

function initialTime(): number {
  const q = new URLSearchParams(location.search).get('t');
  return q ? Number(q) || 0 : 0;
}

function initialTech() {
  const id = new URLSearchParams(location.search).get('tech');
  return TECHNIQUES.find((x) => x.id === id) ?? TECHNIQUES[0]!;
}

/**
 * 반응형 계약
 *   >1024  가운데 3D | 오른쪽 분석 패널 360
 *   <=1024 분석 패널이 BottomSheet로 (useMediaQuery), 툴바의 "분석" 버튼으로 연다.
 *          툴바의 기술·시점 SegmentedControl은 폭이 모자라므로 Selector로 바뀐다
 *   타임라인(footer)은 모든 폭에서 3D 아래에 고정
 */
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
  const [isSheetOpen, setSheetOpen] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 1024px)');
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

  const selectTech = (id: string) => {
    setTech(TECHNIQUES.find((x) => x.id === id)!);
    setT(0);
    setPlaying(false);
  };
  const selectView = (v: string) => {
    setView(v as ViewPreset);
    setViewNonce((n) => n + 1);
  };

  const panel = (
    <AnalysisPanel
      tech={tech}
      frame={frame}
      phaseIndex={phase ? tech.phases.indexOf(phase) : -1}
      shown={shown}
      onShownChange={setShown}
    />
  );

  // BottomSheet는 Layout의 content 슬롯과 섞이지 않게 Layout 바깥 형제로 둔다
  return (
    <>
      <Layout
        header={
          <LayoutHeader hasDivider>
            <Toolbar
              label="기술과 시점"
              startContent={
                isNarrow ? (
                  <Selector
                    label="기술 선택"
                    size="sm"
                    value={tech.id}
                    onChange={selectTech}
                    options={TECHNIQUES.map((x) => ({ value: x.id, label: x.koreanName }))}
                  />
                ) : (
                  <SegmentedControl label="기술 선택" value={tech.id} onChange={selectTech}>
                    {TECHNIQUES.map((x) => (
                      <SegmentedControlItem key={x.id} value={x.id} label={x.koreanName} />
                    ))}
                  </SegmentedControl>
                )
              }
              endContent={
                <>
                  {isNarrow ? (
                    <Selector label="카메라 시점" size="sm" value={view} onChange={selectView} options={VIEW_OPTIONS} />
                  ) : (
                    <SegmentedControl label="카메라 시점" value={view} onChange={selectView}>
                      {VIEW_OPTIONS.map((o) => (
                        <SegmentedControlItem key={o.value} value={o.value} label={o.label} />
                      ))}
                    </SegmentedControl>
                  )}
                  {isNarrow && <Button label="분석" size="sm" variant="primary" onClick={() => setSheetOpen(true)} />}
                </>
              }
            />
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={0} isScrollable={false}>
            <TechniqueScene frame={frame} samples={samples} show={show} view={view} viewNonce={viewNonce} />
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
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
                {!isNarrow && (
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
                )}
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
          </LayoutFooter>
        }
        end={
          isNarrow ? undefined : (
            <LayoutPanel width={360} hasDivider label="분석">
              {panel}
            </LayoutPanel>
          )
        }
      />
      {isNarrow && (
        <BottomSheet label="분석" isOpen={isSheetOpen} onOpenChange={setSheetOpen}>
          {panel}
        </BottomSheet>
      )}
    </>
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
  onShownChange,
}: {
  tech: TechniqueAnimation;
  frame: Frame;
  phaseIndex: number;
  shown: string[];
  onShownChange: (v: string[]) => void;
}) {
  const phase = tech.phases[phaseIndex];
  const showTori = shown.includes('tori');
  const showUke = shown.includes('uke');
  return (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text type="supporting">
          {tech.category} · {tech.japaneseName} · {tech.romaji}
        </Text>
        <Heading level={2}>{tech.koreanName}</Heading>
        <Text color="secondary">{tech.summary}</Text>
      </Stack>

      {phase && (
        <Card variant="muted">
          <Stack gap={2}>
            <Text type="supporting">
              {phase.name} · {phaseIndex + 1}/{tech.phases.length}
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

      {frame.contact && (
        <List header={<Text type="label">지금 맞닿은 곳 (토리 ↔ 우케)</Text>} density="compact" hasDividers>
          {frame.contact.contacts.length === 0 ? (
            <ListItem label="손 외에는 닿은 곳 없음" isDisabled />
          ) : (
            frame.contact.contacts.map((c, i) => <ListItem key={i} label={c.label} />)
          )}
        </List>
      )}

      <Grid columns={2} gap={2}>
        <ActorCard label="토리" color={cssVar('tori')} frame={frame.tori} />
        <ActorCard label="우케" color={cssVar('uke')} frame={frame.uke} />
      </Grid>

      <BalanceMap
        entries={[
          ...(showTori ? [{ id: 'tori', label: '토리', color: cssVar('tori'), balance: frame.tori.balance }] : []),
          ...(showUke ? [{ id: 'uke', label: '우케', color: cssVar('uke'), balance: frame.uke.balance }] : []),
        ]}
        extent={1.6}
        center={tech.mapCenter ?? { x: 0.15, y: 0.25 }}
      />

      <CheckboxList label="표시" value={shown} onChange={onShownChange} density="compact">
        {TOGGLES.map(([k, label]) => (
          <CheckboxListItem key={k} value={k} label={label} />
        ))}
      </CheckboxList>
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
