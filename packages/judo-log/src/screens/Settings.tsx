import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { weekdayLabel } from '../lib/date';

interface SettingsProps {
  trainingWeekdays: number[];
  onChange: (weekdays: number[]) => void;
  onBack: () => void;
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * 수련 요일 등록. 기획서 8장의 수련일 보정이 이 값 없이는 동작하지 않는다.
 * 목적이 시험 통과가 아니라 매트 위에서의 수행이라, 실전 직전 복습이 가장 값지다.
 */
export default function Settings({ trainingWeekdays, onChange, onBack }: SettingsProps) {
  const toggle = (day: number) => {
    onChange(
      trainingWeekdays.includes(day)
        ? trainingWeekdays.filter((d) => d !== day)
        : [...trainingWeekdays, day].sort((a, b) => a - b),
    );
  };

  return (
    <Section padding={4}>
      <VStack gap={4}>
        <HStack>
          <Button label="오늘" variant="ghost" size="sm" onClick={onBack} />
        </HStack>

        <VStack gap={1}>
          <Heading level={1}>수련 요일</Heading>
          <Text color="secondary">
            도장 가는 날 1~2일 전이면, 그날 나올 만한 기술 카드를 간격 무시하고 앞당겨 꺼내줄게.
          </Text>
        </VStack>

        <HStack gap={1} wrap="wrap">
          {WEEKDAYS.map((day) => (
            <Button
              key={day}
              label={weekdayLabel(day)}
              variant={trainingWeekdays.includes(day) ? 'primary' : 'secondary'}
              onClick={() => toggle(day)}
            />
          ))}
        </HStack>

        <Text size="sm" color="secondary">
          기록은 이 브라우저에만 저장돼. 서버로 보내지 않아.
        </Text>
      </VStack>
    </Section>
  );
}
