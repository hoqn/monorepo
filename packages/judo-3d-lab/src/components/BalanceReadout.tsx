import { Card } from '@astryxdesign/core/Card';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { BALANCE_STATE_LABEL, type BalanceState } from '../body/balance';

const STATE_COLOR: Record<BalanceState, 'green' | 'yellow' | 'red' | 'gray'> = {
  stable: 'green',
  edge: 'yellow',
  unstable: 'red',
  airborne: 'gray',
  down: 'gray',
};

/** 사람(토리·우케 등)을 그래프·3D와 같은 색으로 구분하는 작은 점 */
export function ActorSwatch({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <circle cx="5" cy="5" r="5" fill={color} />
    </svg>
  );
}

export const formatMargin = (m: number | null) =>
  m === null || !Number.isFinite(m) ? '—' : `${m >= 0 ? '+' : ''}${(m * 100).toFixed(1)}cm`;

interface Props {
  label: string;
  color: string;
  state: BalanceState;
  /** [라벨, 값] 목록 */
  rows: [string, string][];
}

/** 한 사람의 균형 상태 카드 */
export function BalanceReadout({ label, color, state, rows }: Props) {
  return (
    <Card>
      <Stack gap={2}>
        <Stack direction="horizontal" gap={2} align="center" justify="between">
          <Stack direction="horizontal" gap={1.5} align="center">
            <ActorSwatch color={color} />
            <Text type="label" weight="semibold">
              {label}
            </Text>
          </Stack>
          <Token size="sm" color={STATE_COLOR[state]} label={BALANCE_STATE_LABEL[state]} />
        </Stack>
        <MetadataList>
          {rows.map(([k, v]) => (
            <MetadataListItem key={k} label={k}>
              <Text hasTabularNumbers weight="medium">
                {v}
              </Text>
            </MetadataListItem>
          ))}
        </MetadataList>
      </Stack>
    </Card>
  );
}
