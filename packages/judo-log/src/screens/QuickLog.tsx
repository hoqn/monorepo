import { useMemo, useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { TextInput } from '@astryxdesign/core/TextInput';
import type { Technique } from '../types';
import { TECHNIQUES, searchTechniques } from '../data/techniques';
import { formatKoreanDate, todayISO } from '../lib/date';

interface QuickLogProps {
  /** 최근에 태그한 기술 — 검색 전 기본 목록으로 띄운다 */
  recentTechniqueIds: string[];
  onSave: (techniqueIds: string[], unknownNotes: string[]) => void;
  onExit: () => void;
}

/** 목표는 30초. 도장 탈의실에서 땀 닦으며 끝나야 한다. */
export default function QuickLog({ recentTechniqueIds, onSave, onExit }: QuickLogProps) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Technique[]>([]);
  const [unknownNotes, setUnknownNotes] = useState<string[]>([]);
  const [unknownDraft, setUnknownDraft] = useState('');

  const hits = useMemo(() => {
    if (query.trim() === '') {
      const recent = recentTechniqueIds
        .map((id) => TECHNIQUES.find((t) => t.id === id))
        .filter((t): t is Technique => t !== undefined);
      return (recent.length > 0 ? recent : TECHNIQUES).slice(0, 6);
    }
    return searchTechniques(query).slice(0, 6);
  }, [query, recentTechniqueIds]);

  const isPicked = (tech: Technique) => picked.some((t) => t.id === tech.id);
  const toggle = (tech: Technique) =>
    setPicked((prev) => (isPicked(tech) ? prev.filter((t) => t.id !== tech.id) : [...prev, tech]));

  const addUnknown = () => {
    const note = unknownDraft.trim();
    if (note === '') return;
    setUnknownNotes((prev) => [...prev, note]);
    setUnknownDraft('');
  };

  const hasSomething = picked.length > 0 || unknownNotes.length > 0;

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <HStack justify="between" vAlign="center">
          <Button label="취소" variant="ghost" size="sm" onClick={onExit} />
          <Text size="sm" color="secondary">
            {formatKoreanDate(todayISO())}
          </Text>
        </HStack>

        <Heading level={1}>오늘 뭐 배웠어</Heading>

        <TextInput
          label="기술 검색"
          isLabelHidden
          placeholder="밭다리 · 오소토 · osoto"
          value={query}
          onChange={(value) => setQuery(value)}
          hasClear
          width="100%"
        />

        {hits.length > 0 ? (
          <List
            hasDividers
            header={
              <Text size="sm" color="secondary">
                {query.trim() === '' ? '최근 배운 것' : '검색 결과'}
              </Text>
            }
          >
            {hits.map((tech) => (
              <ListItem
                key={tech.id}
                label={tech.ko}
                description={tech.jp}
                isSelected={isPicked(tech)}
                onClick={() => toggle(tech)}
              />
            ))}
          </List>
        ) : (
          <Text color="secondary">
            공식 명칭이든 도장에서 부르는 말이든 다 찾아져. 그래도 안 나오면 아래에 그냥 적어둬.
          </Text>
        )}

        {picked.length > 0 ? (
          <HStack gap={1} wrap="wrap">
            {picked.map((tech) => (
              <Badge key={tech.id} variant="info" label={tech.ko} />
            ))}
          </HStack>
        ) : null}

        {/* 입문자는 기술 이름을 모르는 상태다. 이게 없으면 기록 자체를 포기한다. */}
        <VStack gap={2}>
          <TextInput
            label="이름 몰라도 괜찮아"
            description="“발로 상대 발 걸었음”처럼 적어두면 정리할 때 맞춰줄게."
            placeholder="기억나는 대로"
            value={unknownDraft}
            onChange={(value) => setUnknownDraft(value)}
            onEnter={addUnknown}
            width="100%"
          />
          <Button
            label="이대로 담기"
            variant="secondary"
            width="100%"
            isDisabled={unknownDraft.trim() === ''}
            onClick={addUnknown}
          />
          {unknownNotes.length > 0 ? (
            <List hasDividers density="compact">
              {unknownNotes.map((note, i) => (
                <ListItem
                  key={note}
                  label={note}
                  endContent={
                    <Button
                      label="빼기"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUnknownNotes((prev) => prev.filter((_, j) => j !== i))}
                    />
                  }
                />
              ))}
            </List>
          ) : null}
        </VStack>

        <Button
          label="저장"
          variant="primary"
          width="100%"
          isDisabled={!hasSomething}
          onClick={() =>
            onSave(
              picked.map((t) => t.id),
              unknownNotes,
            )
          }
        />
      </VStack>
    </Section>
  );
}
