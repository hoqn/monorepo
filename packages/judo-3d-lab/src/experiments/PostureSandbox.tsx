import { Banner } from '@astryxdesign/core/Banner';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Layout, LayoutContent, LayoutHeader, LayoutPanel } from '@astryxdesign/core/Layout';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Slider } from '@astryxdesign/core/Slider';
import { Stack } from '@astryxdesign/core/Stack';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { useMemo, useState } from 'react';
import { computeCom } from '../body/anthropometry';
import { analyzeBalance } from '../body/balance';
import { resolveSolo, type ActorDef, type PoseSpec } from '../body/rig';
import { BalanceMap } from '../components/BalanceMap';
import { BalanceReadout, formatMargin } from '../components/BalanceReadout';
import { BalanceOverlay } from '../scene/BalanceOverlay';
import { Figure } from '../scene/Figure';
import { Stage, VIEW_LABEL, type ViewPreset } from '../scene/Stage';
import { cssVar, GI_COLOR, useResolvedColors } from '../ui/tokens';

const ACTOR: ActorDef = { id: 'me', name: '나', height: 1.75, mass: 75, color: GI_COLOR.tori };

interface Params {
  /** 골반 높이 (m) — 낮출수록 무릎이 굽는다 */
  pelvisHeight: number;
  /** 골반 앞뒤 이동 (m, + 앞) */
  shiftForward: number;
  /** 골반 좌우 이동 (m, + 왼쪽) */
  shiftSide: number;
  /** 상체 숙임 (도) */
  torsoFlex: number;
  /** 골반 기울임 (도) */
  pelvisPitch: number;
  /** 보폭: 좌우 발 간격 (m) */
  stanceWidth: number;
  /** 보폭: 오른발을 앞으로 (m) */
  stanceDepth: number;
  /** 팔을 앞으로 뻗은 정도 (m) */
  armReach: number;
  /** 오른발 들기 (m) */
  liftRight: number;
}

const PRESETS: Record<string, { label: string; note: string; p: Params }> = {
  shizentai: {
    label: '자연체 (自然体)',
    note: '두 발을 어깨너비로, 무릎을 살짝 굽힌 기본자세. 질량중심이 기저면 한가운데에 있어 어느 방향으로든 움직이기 쉽다.',
    p: {
      pelvisHeight: 0.89,
      shiftForward: 0,
      shiftSide: 0,
      torsoFlex: 3,
      pelvisPitch: 3,
      stanceWidth: 0.3,
      stanceDepth: 0.12,
      armReach: 0.3,
      liftRight: 0,
    },
  },
  jigotai: {
    label: '자호체 (自護体)',
    note: '보폭을 넓히고 허리를 낮춘 방어 자세. 기저면이 넓어지고 질량중심이 낮아져 잘 넘어가지 않지만, 움직임은 둔해진다.',
    p: {
      pelvisHeight: 0.72,
      shiftForward: -0.02,
      shiftSide: 0,
      torsoFlex: 12,
      pelvisPitch: 12,
      stanceWidth: 0.6,
      stanceDepth: 0.05,
      armReach: 0.35,
      liftRight: 0,
    },
  },
  frontBreak: {
    label: '앞으로 무너짐',
    note: '상대에게 끌려 상체와 골반이 앞으로 쏠린 상태. 질량중심 투영이 발끝 밖으로 나가 한 발을 내딛지 않으면 넘어진다 — 업어치기 등 앞으로 던지는 기술의 쿠즈시.',
    p: {
      pelvisHeight: 0.84,
      shiftForward: 0.16,
      shiftSide: 0,
      torsoFlex: 38,
      pelvisPitch: 22,
      stanceWidth: 0.3,
      stanceDepth: 0,
      armReach: 0.55,
      liftRight: 0,
    },
  },
  backHeel: {
    label: '뒤꿈치에 실림',
    note: '상체가 뒤로 젖혀져 체중이 뒤꿈치에 실린 상태. 밭다리후리기·안다리후리기 같은 뒤로 넘기는 기술이 노리는 순간이다.',
    p: {
      pelvisHeight: 0.88,
      shiftForward: -0.09,
      shiftSide: 0,
      torsoFlex: -10,
      pelvisPitch: -12,
      stanceWidth: 0.3,
      stanceDepth: 0,
      armReach: 0.3,
      liftRight: 0,
    },
  },
  oneLeg: {
    label: '외발 서기',
    note: '오른발을 들면 기저면이 왼발 하나로 줄어든다. 골반을 왼쪽으로 옮겨 질량중심을 왼발 위에 올려야 버틸 수 있다 — 후리기 기술에서 토리가 해야 하는 일.',
    p: {
      pelvisHeight: 0.88,
      shiftForward: 0,
      shiftSide: 0.1,
      torsoFlex: 5,
      pelvisPitch: 5,
      stanceWidth: 0.25,
      stanceDepth: 0,
      armReach: 0.3,
      liftRight: 0.25,
    },
  },
};

const SLIDERS: { key: keyof Params; label: string; min: number; max: number; step: number; unit: 'cm' | '°' }[] = [
  { key: 'pelvisHeight', label: '골반 높이', min: 0.55, max: 0.92, step: 0.005, unit: 'cm' },
  { key: 'shiftForward', label: '골반 앞(+)/뒤(−)', min: -0.25, max: 0.25, step: 0.005, unit: 'cm' },
  { key: 'shiftSide', label: '골반 왼(+)/오른(−)', min: -0.25, max: 0.25, step: 0.005, unit: 'cm' },
  { key: 'pelvisPitch', label: '골반 기울임', min: -25, max: 45, step: 1, unit: '°' },
  { key: 'torsoFlex', label: '상체 숙임', min: -25, max: 60, step: 1, unit: '°' },
  { key: 'stanceWidth', label: '발 좌우 간격', min: 0.1, max: 0.8, step: 0.01, unit: 'cm' },
  { key: 'stanceDepth', label: '오른발 앞(+)/뒤(−)', min: -0.4, max: 0.4, step: 0.01, unit: 'cm' },
  { key: 'armReach', label: '팔 뻗기', min: 0.15, max: 0.6, step: 0.01, unit: 'cm' },
  { key: 'liftRight', label: '오른발 들기', min: 0, max: 0.5, step: 0.01, unit: 'cm' },
];

function toPose(p: Params): PoseSpec {
  const w = p.stanceWidth / 2;
  return {
    root: { pos: [p.shiftSide, p.pelvisHeight, p.shiftForward], yaw: 0, pitch: p.pelvisPitch, roll: 0 },
    torso: { flex: p.torsoFlex, side: 0, twist: 0 },
    head: { flex: Math.max(0, 10 - p.torsoFlex * 0.5), twist: 0 },
    feet: {
      L: { at: [w, 0.07, -p.stanceDepth / 2] },
      R: { at: [-w, 0.07 + p.liftRight, p.stanceDepth / 2 + p.liftRight * 0.3] },
    },
    hands: {
      L: { local: [0.2, 0.3, p.shiftForward + p.armReach] },
      R: { local: [-0.2, 0.3, p.shiftForward + p.armReach] },
    },
  };
}

/**
 * 반응형 계약
 *   >1024  가운데 3D | 오른쪽 조절 패널 360
 *   <=1024 조절 패널이 BottomSheet로 (useMediaQuery), 툴바의 "자세 조절" 버튼으로 연다
 */
export function PostureSandbox() {
  const [params, setParams] = useState<Params>(PRESETS.shizentai!.p);
  const [preset, setPreset] = useState<string | null>('shizentai');
  const [view, setView] = useState<ViewPreset>('side');
  const [viewNonce, setViewNonce] = useState(0);
  const [xray, setXray] = useState(true);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const isNarrow = useMediaQuery('(max-width: 1024px)');
  const { tori: comColor } = useResolvedColors(['tori'] as const);

  const result = useMemo(() => {
    const body = resolveSolo(ACTOR, toPose(params));
    const com = computeCom(body.points, ACTOR.mass);
    const balance = analyzeBalance(body.points, com.com, null);
    return { body, com, balance };
  }, [params]);

  const set = (k: keyof Params, v: number) => {
    setPreset(null);
    setParams((p) => ({ ...p, [k]: v }));
  };

  const worstReach = Math.max(...Object.values(result.body.reachError));

  const panel = (
    <Stack gap={4}>
      <Stack gap={1}>
        <Text type="supporting">실험 2</Text>
        <Heading level={2}>자세와 무게중심</Heading>
        <Text color="secondary">
          슬라이더로 자세를 바꾸면 분절 질량 분포(de Leva 1996)로 계산한 질량중심과 기저면이 즉시 갱신됩니다. 발은
          바닥에 고정되고 무릎·팔꿈치는 IK로 따라옵니다.
        </Text>
      </Stack>

      <Stack gap={2}>
        <Text type="label">자세 프리셋</Text>
        <Stack direction="horizontal" gap={1.5} wrap="wrap">
          {Object.entries(PRESETS).map(([id, pr]) => (
            <Button
              key={id}
              size="sm"
              label={pr.label}
              variant={preset === id ? 'primary' : 'secondary'}
              onClick={() => {
                setPreset(id);
                setParams(pr.p);
              }}
            />
          ))}
        </Stack>
        {preset && (
          <Card variant="muted">
            <Text>{PRESETS[preset]!.note}</Text>
          </Card>
        )}
      </Stack>

      <BalanceReadout
        label="균형"
        color={cssVar('tori')}
        state={result.balance.state}
        rows={[
          ['안정 여유', formatMargin(result.balance.margin)],
          [
            'CoM 높이',
            `${(result.com.com.y * 100).toFixed(0)}cm (키의 ${((result.com.com.y / ACTOR.height) * 100).toFixed(0)}%)`,
          ],
        ]}
      />
      {worstReach > 0.005 && (
        <Banner
          status="warning"
          title="발이 지정 위치에 닿지 않습니다"
          description="골반이 너무 높거나 보폭이 너무 넓습니다."
          collapsible={false}
        />
      )}

      <BalanceMap
        entries={[{ id: 'me', label: '나', color: cssVar('tori'), balance: result.balance }]}
        extent={1.0}
        center={{ x: 0, y: 0 }}
      />

      <Stack gap={3}>
        <Text type="label">자세 조절</Text>
        {SLIDERS.map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            min={s.min}
            max={s.max}
            step={s.step}
            value={params[s.key]}
            valueDisplay="text"
            formatValue={(v) => (s.unit === 'cm' ? `${(v * 100).toFixed(0)}cm` : `${v.toFixed(0)}°`)}
            onChange={(v: number) => set(s.key, v)}
            width="100%"
          />
        ))}
        <Switch label="반투명 몸 + 분절별 질량중심" value={xray} onChange={setXray} />
      </Stack>
    </Stack>
  );

  // BottomSheet는 Layout의 content 슬롯과 섞이지 않게 Layout 바깥 형제로 둔다
  return (
    <>
      <Layout
        header={
          <LayoutHeader hasDivider>
            <Toolbar
              label="시점"
              endContent={
                <>
                  <SegmentedControl
                    label="카메라 시점"
                    value={view}
                    onChange={(v) => {
                      setView(v as ViewPreset);
                      setViewNonce((n) => n + 1);
                    }}
                  >
                    {(['side', 'front', 'top'] as const).map((v) => (
                      <SegmentedControlItem key={v} value={v} label={v === 'front' ? '뒤' : VIEW_LABEL[v]} />
                    ))}
                  </SegmentedControl>
                  {isNarrow && <Button label="자세 조절" variant="primary" onClick={() => setSheetOpen(true)} />}
                </>
              }
            />
          </LayoutHeader>
        }
        content={
          <LayoutContent padding={0} isScrollable={false}>
            <Stage view={view} viewNonce={viewNonce}>
              <Figure points={result.body.points} color={ACTOR.color} xray={xray} />
              <BalanceOverlay
                com={result.com}
                balance={result.balance}
                color={comColor}
                showSegments={xray}
                showXcom={false}
              />
            </Stage>
          </LayoutContent>
        }
        end={
          isNarrow ? undefined : (
            <LayoutPanel width={360} hasDivider label="자세 조절">
              {panel}
            </LayoutPanel>
          )
        }
      />
      {isNarrow && (
        <BottomSheet label="자세 조절" isOpen={isSheetOpen} onOpenChange={setSheetOpen}>
          {panel}
        </BottomSheet>
      )}
    </>
  );
}
