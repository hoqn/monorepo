import { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Section } from '@astryxdesign/core/Section';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import type { Technique, TechniqueCategory } from '../types';
import { TECHNIQUES } from '../data/techniques';

const CATEGORIES: Array<TechniqueCategory | '전체'> = ['전체', '손기술', '허리기술', '발기술', '굳히기'];

interface DrawerProps {
  reps: Record<string, number>;
  onOpen: (tech: Technique) => void;
}

/**
 * 기술을 태그하며 세션을 쌓으면 그게 자동으로 개인 백과가 된다.
 * 별도의 노트 기능이나 백과 기능을 따로 만들 필요가 없다.
 */
export default function Drawer({ reps, onOpen }: DrawerProps) {
  const [cat, setCat] = useState<string>('전체');

  const inCat = (list: Technique[]) => list.filter((t) => cat === '전체' || t.cat === cat);
  const learned = inCat(TECHNIQUES.filter((t) => (reps[t.id] ?? 0) > 0));
  const rest = inCat(TECHNIQUES.filter((t) => (reps[t.id] ?? 0) === 0));

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <Heading level={1}>서랍</Heading>

        {/* 분류 탭도 한국어 기준. 일본어 분류는 상세에서만 보여준다. */}
        <TabList value={cat} onChange={setCat} overflow="auto">
          {CATEGORIES.map((c) => (
            <Tab key={c} value={c} label={c} />
          ))}
        </TabList>

        {learned.length > 0 ? (
          <List
            hasDividers
            header={
              <Text size="sm" color="secondary">
                배운 기술 {learned.length}
              </Text>
            }
          >
            {learned.map((tech) => (
              <ListItem
                key={tech.id}
                label={tech.ko}
                description={tech.jp}
                endContent={
                  <Text size="sm" color="secondary">
                    {reps[tech.id] ?? 0}회
                  </Text>
                }
                onClick={() => onOpen(tech)}
              />
            ))}
          </List>
        ) : (
          <Text color="secondary">아직 비어 있어. 도장 다녀와서 기록하면 여기부터 채워진다.</Text>
        )}

        {rest.length > 0 ? (
          <List
            hasDividers
            header={
              <Text size="sm" color="secondary">
                아직
              </Text>
            }
          >
            {rest.map((tech) => (
              <ListItem key={tech.id} label={tech.ko} description={tech.jp} onClick={() => onOpen(tech)} />
            ))}
          </List>
        ) : null}
      </VStack>
    </Section>
  );
}
