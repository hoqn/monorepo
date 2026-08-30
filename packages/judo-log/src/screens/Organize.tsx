import { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { Card as XCard } from '@astryxdesign/core/Card';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { Session, Technique } from '../types';
import { byId, searchTechniques } from '../data/techniques';
import type { OrganizeEntry } from '../lib/use-app-state';
import { formatKoreanDate } from '../lib/date';

interface OrganizeProps {
  session: Session;
  onMatchUnknown: (noteIndex: number, techniqueId: string) => void;
  onDone: (entries: OrganizeEntry[]) => void;
  onExit: () => void;
}

/**
 * 이름을 몰라 자유 텍스트로 남긴 기록을 실제 기술과 맞추는 단계.
 * 정리 화면 앞에 두는 이유는, 여기서 맞춰야 그 기술도 이번 정리 대상에 들어오기 때문이다.
 */
function UnknownMatcher({ note, onMatch }: { note: string; onMatch: (techniqueId: string) => void }) {
  const [query, setQuery] = useState('');
  const hits = searchTechniques(query).slice(0, 5);

  return (
    <XCard variant="muted">
      <VStack gap={3}>
        <VStack gap={1}>
          <Text size="sm" color="secondary">
            이름 없이 적어둔 것
          </Text>
          <Text>{note}</Text>
        </VStack>
        <TextInput
          label="이게 무슨 기술이었어?"
          placeholder="밭다리 · 오소토 · osoto"
          value={query}
          onChange={(value) => setQuery(value)}
          width="100%"
        />
        {hits.length > 0 ? (
          <List hasDividers density="compact">
            {hits.map((tech) => (
              <ListItem key={tech.id} label={tech.ko} description={tech.jp} onClick={() => onMatch(tech.id)} />
            ))}
          </List>
        ) : null}
      </VStack>
    </XCard>
  );
}

export default function Organize({ session, onMatchUnknown, onDone, onExit }: OrganizeProps) {
  const [index, setIndex] = useState(0);
  const [memo, setMemo] = useState('');
  // 표준 설명은 기본으로 접혀 있다. 먼저 보여주면 베껴 쓰고 끝나서 인출 연습이 사라진다.
  // 이 기본값을 true로 바꾸지 말 것.
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [collected, setCollected] = useState<OrganizeEntry[]>([]);

  const techniqueIds = session.techniqueIds;
  const tech: Technique | undefined = byId(techniqueIds[index] ?? '');

  if (session.unknownNotes.length > 0) {
    return (
      <Section padding={4}>
        <VStack gap={4}>
          <HStack justify="between" vAlign="center">
            <Button label="취소" variant="ghost" size="sm" onClick={onExit} />
            <Text size="sm" color="secondary">
              {formatKoreanDate(session.date)}
            </Text>
          </HStack>
          <VStack gap={1}>
            <Heading level={1}>먼저 이름부터 맞추자</Heading>
            <Text color="secondary">이름 없이 적어둔 게 {session.unknownNotes.length}개 있어</Text>
          </VStack>
          {session.unknownNotes.map((note, i) => (
            <UnknownMatcher key={note} note={note} onMatch={(id) => onMatchUnknown(i, id)} />
          ))}
        </VStack>
      </Section>
    );
  }

  if (tech === undefined) {
    return (
      <Section padding={4}>
        <VStack gap={4} hAlign="center" paddingBlock={10}>
          <Heading level={2}>정리할 기술이 없어</Heading>
          <Button label="돌아가기" variant="primary" width="100%" onClick={onExit} />
        </VStack>
      </Section>
    );
  }

  const isLast = index === techniqueIds.length - 1;

  const advance = () => {
    const all = [...collected, { techniqueId: tech.id, memo: memo.trim() }];
    if (isLast) {
      onDone(all);
      return;
    }
    setCollected(all);
    setIndex(index + 1);
    setMemo('');
    setIsStandardOpen(false);
  };

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <HStack justify="between" vAlign="center">
          <Button label="취소" variant="ghost" size="sm" onClick={onExit} />
          <Text size="sm" color="secondary">
            정리 {index + 1} / {techniqueIds.length}
          </Text>
        </HStack>

        {/* 정리 화면은 여유가 있어서, 일본어 병기를 자연스럽게 눈에 익히는 몇 안 되는 자리다 */}
        <VStack gap={1}>
          <Heading level={1}>{tech.ko}</Heading>
          <Text size="sm" color="secondary">
            {tech.kanji} · {tech.jp}
          </Text>
        </VStack>

        <TextArea
          label="기억나는 대로"
          description="여기 쓴 문장이 그대로 복습 카드가 돼."
          value={memo}
          onChange={(value) => setMemo(value)}
          rows={6}
          width="100%"
        />

        <VStack gap={2}>
          <Button
            label={isStandardOpen ? '표준 설명 숨기기' : '표준 설명 보기'}
            variant="secondary"
            width="100%"
            isDisabled={tech.steps.length === 0}
            tooltip={tech.steps.length === 0 ? '이 기술은 아직 표준 설명이 준비되지 않았어' : ''}
            onClick={() => setIsStandardOpen(!isStandardOpen)}
          />
          {isStandardOpen && tech.steps.length > 0 ? (
            <XCard variant="muted">
              <VStack gap={3}>
                <List listStyle="decimal" density="compact">
                  {tech.steps.map((step) => (
                    <ListItem key={step} label={step} />
                  ))}
                </List>
                <Divider />
                <VStack gap={1}>
                  <Text size="sm" color="secondary">
                    자주 하는 실수
                  </Text>
                  <Text size="sm">{tech.mistakes.join(' · ')}</Text>
                </VStack>
              </VStack>
            </XCard>
          ) : null}
        </VStack>

        <Button
          label={isLast ? '정리 끝내기' : '다음 기술'}
          variant="primary"
          width="100%"
          isDisabled={memo.trim() === ''}
          onClick={advance}
        />
      </VStack>
    </Section>
  );
}
