import { VStack } from '@astryxdesign/core/VStack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';

interface HandoffProps {
  made: number;
  due: number;
  onGo: () => void;
}

export default function Handoff({ made, due, onGo }: HandoffProps) {
  return (
    <Section padding={4}>
      <VStack gap={4} hAlign="center" paddingBlock={10}>
        <Heading level={2}>카드 {made}장 추가됨</Heading>
        <Text color="secondary" justify="center">
          방금 짜낸 게 1회차라 다음은 3일 뒤
        </Text>
        <Button
          label={due > 0 ? `이어서 복습 ${due}장` : '오늘 복습할 건 없어'}
          variant="primary"
          width="100%"
          isDisabled={due === 0}
          onClick={onGo}
        />
      </VStack>
    </Section>
  );
}
