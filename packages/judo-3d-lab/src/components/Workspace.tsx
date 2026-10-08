import { useMediaQuery } from '@astryxdesign/core/hooks';
import { Layout, LayoutContent, LayoutFooter, LayoutHeader, LayoutPanel } from '@astryxdesign/core/Layout';
import { Stack } from '@astryxdesign/core/Stack';
import type { ReactNode } from 'react';

interface Props {
  /** 항상 위에 고정되는 컨트롤(툴바). 자주 바꾸는 것은 모두 여기에 */
  controls: ReactNode;
  /** 3D 화면 */
  stage: ReactNode;
  /** 3D 바로 아래 붙는 영역(타임라인 등) */
  footer?: ReactNode;
  /** 읽는 정보(설명·수치·지도) */
  panel: ReactNode;
  panelLabel: string;
  /** 넓은 화면에서 패널을 어느 쪽에 둘지 */
  panelSide?: 'start' | 'end';
  panelWidth?: number;
  /** 좁은 화면에서 3D와 패널 중 무엇을 먼저 둘지. 입력부터 해야 하는 화면은 'panel' */
  narrowFirst?: 'stage' | 'panel';
}

/**
 * 실험 화면 공통 틀.
 *
 * 원칙: 바로바로 바꿔 가며 보는 컨트롤은 숨기지 않는다. 드롭다운·서랍(시트)에 넣지 않고 항상 위에 고정한다.
 *
 * 반응형 계약
 *   >1024  controls(고정) / 3D | 패널 / footer
 *   <=1024 controls(고정) / 한 줄로 스크롤: 3D(화면 높이의 55%) → footer → 패널
 *          패널을 서랍으로 숨기지 않고 아래로 이어 붙여, 스크롤만으로 모두 볼 수 있게 한다
 */
export function Workspace({
  controls,
  stage,
  footer,
  panel,
  panelLabel,
  panelSide = 'end',
  panelWidth = 360,
  narrowFirst = 'stage',
}: Props) {
  const isNarrow = useMediaQuery('(max-width: 1024px)');
  const header = <LayoutHeader hasDivider>{controls}</LayoutHeader>;

  const panelBlock = (
    <Stack padding={4} as="section" aria-label={panelLabel}>
      {panel}
    </Stack>
  );

  if (isNarrow) {
    return (
      <Layout
        header={header}
        content={
          <LayoutContent padding={0}>
            <Stack>
              {narrowFirst === 'panel' && panelBlock}
              <Stack height="55vh">{stage}</Stack>
              {footer && (
                <Stack padding={4} paddingBlockEnd={2}>
                  {footer}
                </Stack>
              )}
              {narrowFirst === 'stage' && panelBlock}
            </Stack>
          </LayoutContent>
        }
      />
    );
  }

  const side = (
    <LayoutPanel width={panelWidth} hasDivider label={panelLabel}>
      {panel}
    </LayoutPanel>
  );
  return (
    <Layout
      header={header}
      content={
        <LayoutContent padding={0} isScrollable={false}>
          {stage}
        </LayoutContent>
      }
      footer={footer && <LayoutFooter hasDivider>{footer}</LayoutFooter>}
      start={panelSide === 'start' ? side : undefined}
      end={panelSide === 'end' ? side : undefined}
    />
  );
}
