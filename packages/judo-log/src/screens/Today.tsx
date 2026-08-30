import { VStack } from '@astryxdesign/core/VStack';
import { Section } from '@astryxdesign/core/Section';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import type { Session } from '../types';
import { byId } from '../data/techniques';
import { estimateMinutes, type Queue } from '../lib/scheduler';
import { formatRelativeDate, formatKoreanDate, nextTrainingDate, todayISO, diffDays } from '../lib/date';

interface TodayProps {
  queue: Queue;
  pendingSessions: Session[];
  trainingWeekdays: number[];
  onStart: () => void;
  onLog: () => void;
  onOpenSettings: () => void;
}

function sessionSummary(session: Session): string {
  const named = session.techniqueIds.map((id) => byId(id)?.ko ?? id);
  const unknown = session.unknownNotes.length;
  if (named.length === 0) return `이름 못 붙인 것 ${unknown}개`;
  return unknown > 0 ? `${named.join(', ')} 외 ${unknown}개` : named.join(', ');
}

/** 앱 켜고 1탭 안에 복습이 시작돼야 한다. 지하철에서 메뉴 뒤지게 하면 안 쓴다. */
export default function Today({
  queue,
  pendingSessions,
  trainingWeekdays,
  onStart,
  onLog,
  onOpenSettings,
}: TodayProps) {
  const today = todayISO();
  const training = nextTrainingDate(today, trainingWeekdays);
  const daysUntilTraining = training === null ? null : diffDays(today, training);
  const toOrganize = pendingSessions.length;
  const total = toOrganize + queue.cards.length;

  return (
    <Section padding={4}>
      <VStack gap={5}>
        <Heading level={1}>오늘</Heading>

        <List
          hasDividers
          header={
            <Text size="sm" color="secondary">
              할 일
            </Text>
          }
        >
          {pendingSessions.map((session) => (
            <ListItem
              key={session.id}
              label="정리"
              description={`${formatRelativeDate(session.date, today)} · ${sessionSummary(session)}`}
              endContent={
                <Badge variant="info" label={String(session.techniqueIds.length + session.unknownNotes.length)} />
              }
            />
          ))}
          <ListItem
            label="복습"
            description={queue.cards.length > 0 ? `약 ${estimateMinutes(queue.cards.length)}분` : '밀린 카드 없음'}
            endContent={<Badge variant="neutral" label={String(queue.cards.length)} />}
          />
        </List>

        {/* 카드 수보다 예상 소요 시간이 착수 장벽을 낮춘다 */}
        <Button
          label={total > 0 ? '시작' : '오늘 몫 끝냈어'}
          variant="primary"
          width="100%"
          isDisabled={total === 0}
          onClick={onStart}
        />

        <List
          header={
            <Text size="sm" color="secondary">
              다음 수련
            </Text>
          }
        >
          {training === null ? (
            <ListItem
              label="수련 요일을 알려줘"
              description="등록해두면 수련 1~2일 전에 그 기술 카드를 앞당겨 꺼내줄게"
              onClick={onOpenSettings}
            />
          ) : (
            <ListItem
              label={daysUntilTraining === 0 ? '오늘이 도장 가는 날' : formatKoreanDate(training)}
              description={
                queue.boostedCount > 0
                  ? `수련이 가까워서 ${queue.boostedCount}장을 앞당겨 넣었어`
                  : formatRelativeDate(training, today)
              }
              onClick={onOpenSettings}
            />
          )}
        </List>

        {queue.deferredCount > 0 ? (
          <Text size="sm" color="secondary">
            밀린 게 많아서 오늘은 중요한 것부터 {queue.cards.length}장만. 나머지 {queue.deferredCount}장은 내일.
          </Text>
        ) : null}

        <Button label="도장 다녀왔어" variant="secondary" width="100%" onClick={onLog} />
      </VStack>
    </Section>
  );
}
