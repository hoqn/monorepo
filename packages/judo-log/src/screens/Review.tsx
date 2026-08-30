import { useEffect, useMemo, useRef, useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { Card as XCard } from '@astryxdesign/core/Card';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import type { Card, Grade } from '../types';
import { byId } from '../data/techniques';
import { nextIntervalDays } from '../lib/scheduler';
import { CARD_TONE } from '../data/card-tone';

/** 기획서 5장 — 심상 카드는 30초. 프로토타입의 10초는 데모용이었다. */
const MENTAL_SECONDS = 30;

const GRADES: Array<{ label: string; variant: 'destructive' | 'secondary' | 'primary'; value: Grade }> = [
  { label: '까먹음', variant: 'destructive', value: 0 },
  { label: '애매', variant: 'secondary', value: 1 },
  { label: '기억남', variant: 'primary', value: 2 },
];

interface ReviewProps {
  cards: Card[];
  index: number;
  onGrade: (card: Card, grade: Grade) => void;
  onExit: () => void;
}

export default function Review({ cards, index, onGrade, onExit }: ReviewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [seconds, setSeconds] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = cards[index];
  const tech = useMemo(() => (card?.techniqueId === undefined ? undefined : byId(card.techniqueId)), [card]);
  const isMental = card?.type === '심상';

  useEffect(() => {
    setIsRevealed(false);
    setSeconds(isMental ? MENTAL_SECONDS : null);
  }, [index, isMental]);

  useEffect(() => {
    if (seconds === null) return undefined;
    if (seconds <= 0) {
      setIsRevealed(true);
      return undefined;
    }
    timer.current = setTimeout(() => setSeconds((v) => (v === null ? null : v - 1)), 1000);
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, [seconds]);

  if (card === undefined) {
    return (
      <Section padding={4}>
        <VStack gap={4} hAlign="center" paddingBlock={10}>
          <Heading level={2}>오늘 몫 끝</Heading>
          <Text color="secondary" justify="center">
            머리로 굴린 만큼 매트 위에서 덜 헤맨다
          </Text>
          <Button label="돌아가기" variant="primary" width="100%" onClick={onExit} />
        </VStack>
      </Section>
    );
  }

  const grade = (value: Grade) => {
    onGrade(card, value);
  };

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <VStack gap={2}>
          <HStack justify="between" vAlign="center">
            <Button label="중단" variant="ghost" size="sm" onClick={onExit} />
            <Text size="sm" color="secondary">
              {index + 1} / {cards.length}
            </Text>
          </HStack>
          <ProgressBar label="복습 진행" isLabelHidden value={index} max={cards.length} />
        </VStack>

        <XCard minHeight={300}>
          <VStack gap={4}>
            <HStack justify="between" vAlign="center">
              <Badge variant={CARD_TONE[card.type]} label={card.type} />
              {tech !== undefined ? (
                <Text size="sm" color="secondary">
                  {tech.kanji}
                </Text>
              ) : null}
            </HStack>

            {isMental && !isRevealed ? (
              // 눈 감으라고 시켰으니 볼 게 없어야 한다 — 남은 시간만 크게 띄운다.
              <VStack gap={6} hAlign="center" paddingBlock={6}>
                <Text justify="center">{card.front}</Text>
                <Heading level={2}>{seconds}</Heading>
                <Text size="sm" color="secondary">
                  눈 감고 그려보기
                </Text>
              </VStack>
            ) : (
              <VStack gap={4}>
                <Heading level={2}>{card.front}</Heading>

                {isRevealed ? (
                  <VStack gap={3}>
                    <Divider />
                    {card.type === '순서' && tech !== undefined ? (
                      <List listStyle="decimal" density="compact">
                        {tech.steps.map((step) => (
                          <ListItem key={step} label={step} />
                        ))}
                      </List>
                    ) : card.type === '심상' ? (
                      <Text color="secondary">얼마나 선명했어?</Text>
                    ) : (
                      <VStack gap={2}>
                        <Text>{card.back ?? ''}</Text>
                        {card.type === '내 메모' && card.memoDate !== undefined ? (
                          <Text size="sm" color="secondary">
                            {card.memoDate}에 쓴 것
                          </Text>
                        ) : null}
                      </VStack>
                    )}
                  </VStack>
                ) : null}
              </VStack>
            )}
          </VStack>
        </XCard>

        {isRevealed ? (
          <HStack gap={2}>
            {GRADES.map((option) => (
              <VStack key={option.value} gap={1} hAlign="center" width="100%">
                <Button
                  label={option.label}
                  variant={option.variant}
                  width="100%"
                  onClick={() => grade(option.value)}
                />
                {/* 다음 복습 시점을 미리 보여줘야 사용자가 시스템을 신뢰한다 */}
                <Text size="xsm" color="secondary">
                  {nextIntervalDays(card.step, option.value)}일 후
                </Text>
              </VStack>
            ))}
          </HStack>
        ) : (
          <Button
            label={isMental ? '평가하기' : '답 확인'}
            variant="primary"
            width="100%"
            onClick={() => setIsRevealed(true)}
          />
        )}
      </VStack>
    </Section>
  );
}
