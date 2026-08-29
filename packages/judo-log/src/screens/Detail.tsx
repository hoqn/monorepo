import { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import type { Technique, TechniqueNote } from '../types';
import { formatKoreanDate } from '../lib/date';

interface DetailProps {
  tech: Technique;
  reps: number;
  notes: TechniqueNote[];
  onBack: () => void;
}

export default function Detail({ tech, reps, notes, onBack }: DetailProps) {
  const [tab, setTab] = useState('내 메모');
  const latest = notes[0];

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <HStack>
          <Button label="서랍" variant="ghost" size="sm" onClick={onBack} />
        </HStack>

        {/* 일본어 명칭을 정면으로 보여주는 유일한 자리 — 한국어 → 한자 → 발음 → 로마자 순 */}
        <VStack gap={1}>
          <Heading level={1}>{tech.ko}</Heading>
          <Text size="sm" color="secondary">
            {tech.kanji} · {tech.jp} · {tech.romaji}
          </Text>
          <Text size="sm" color="secondary">
            {tech.cat === '굳히기' ? '굳히기' : `메치기 · ${tech.cat}`}
            {tech.aliases.length > 0 ? ` · 도장에선 “${tech.aliases[0]}”` : ''}
          </Text>
          <Text size="sm" color="secondary">
            {reps}회 연습
          </Text>
        </VStack>

        <TabList value={tab} onChange={setTab}>
          <Tab value="내 메모" label="내 메모" />
          <Tab value="표준" label="표준" />
          <Tab value="이력" label="이력" />
        </TabList>

        {tab === '내 메모' ? (
          <Text color={latest === undefined ? 'secondary' : 'primary'}>{latest?.memo ?? '아직 없음'}</Text>
        ) : null}

        {tab === '표준' ? (
          tech.steps.length > 0 ? (
            <VStack gap={4}>
              <List listStyle="decimal" density="compact">
                {tech.steps.map((step) => (
                  <ListItem key={step} label={step} />
                ))}
              </List>
              <List
                hasDividers
                header={
                  <Text size="sm" color="secondary">
                    자주 하는 실수
                  </Text>
                }
              >
                {tech.mistakes.map((mistake) => (
                  <ListItem key={mistake} label={mistake} />
                ))}
              </List>
            </VStack>
          ) : (
            // 표준 설명은 공신력 있는 출처 기반으로만 싣는다. 없으면 없다고 말한다.
            <Text color="secondary">이 기술은 아직 표준 설명이 없어. 내 메모로 채워두면 그게 카드가 된다.</Text>
          )
        ) : null}

        {/* 3개월 전 메모와 지금 메모를 나란히 보면 성장이 체감된다 — 재방문 이유 */}
        {tab === '이력' ? (
          <List hasDividers>
            {notes.length > 0 ? (
              notes.map((note) => (
                <ListItem
                  key={`${note.date}-${note.memo}`}
                  label={note.memo}
                  description={formatKoreanDate(note.date)}
                />
              ))
            ) : (
              <ListItem label="아직 없음" isDisabled />
            )}
          </List>
        ) : null}
      </VStack>
    </Section>
  );
}
