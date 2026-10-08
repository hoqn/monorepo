import { Banner } from '@astryxdesign/core/Banner';
import { Code } from '@astryxdesign/core/Code';
import { Heading } from '@astryxdesign/core/Heading';
import { Layout, LayoutContent } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Stack } from '@astryxdesign/core/Stack';
import { proportional, Table, type TableColumn } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';

interface ExperimentRow extends Record<string, unknown> {
  name: string;
  learned: string;
  remaining: string;
}

const EXPERIMENTS: ExperimentRow[] = [
  {
    name: '① 기술 3D 뷰어',
    learned:
      '밭다리후리기·업어치기·안다리후리기를 키프레임으로 만들어 어느 각도에서든 보고, 슬로모션·단계별 이동이 가능하다. 손은 IK로 상대 깃·소매에 붙어 있어 보간 중에도 잡기가 풀리지 않는다. 두 사람의 몸을 캡슐 묶음으로 보고 겹침을 풀어, 실제로 맞닿는 지점(가슴과 등, 다리와 다리)을 짚어 줄 수 있다.',
    remaining:
      '수작업 키프레임은 기술 하나에 수 시간이 들고 정확도는 작업자 눈에 의존한다. 겹침 보정은 몸을 밀어낼 뿐, 잡고 당기는 힘이나 도복이 구겨지는 모습은 표현하지 못한다.',
  },
  {
    name: '② 자세·무게중심',
    learned:
      '분절 질량 표(de Leva 1996)로 전신 질량중심, 기저면, 안정 여유를 실시간 계산. 자연체와 자호체, 앞으로·뒤로 무너진 자세의 차이가 숫자와 그림으로 바로 보인다.',
    remaining:
      '표준 체형 기준 값이다. 체형·성별 보정과 함께, 잡기를 통해 오가는 힘(외력)까지 넣으려면 동역학 시뮬레이션이 필요하다.',
  },
  {
    name: '③ 영상 → 3D',
    learned: 'MediaPipe로 브라우저 안에서 한 사람의 3D 관절을 추정하고, 같은 분석을 그대로 재사용할 수 있다.',
    remaining:
      '카메라 한 대는 깊이 오차가 크다. 두 사람이 엉키면 관절이 가려져 추정이 무너지고, 두 사람의 상대 위치도 사라진다. 유도에는 그대로 쓰기 어렵다.',
  },
];

const EXPERIMENT_COLUMNS: TableColumn<ExperimentRow>[] = [
  { key: 'name', header: '실험', width: proportional(1, { minWidth: 120 }) },
  { key: 'learned', header: '확인한 것', width: proportional(3, { minWidth: 220 }) },
  { key: 'remaining', header: '남은 과제', width: proportional(3, { minWidth: 220 }) },
];

interface MethodRow extends Record<string, unknown> {
  method: string;
  accuracy: string;
  cost: string;
  fit: string;
}

const METHODS: MethodRow[] = [
  {
    method: '수작업 키프레임 (이 PoC)',
    accuracy: '중 (교육용 근사)',
    cost: '기술당 수 시간 · 도구 비용 없음',
    fit: '단계별 핵심 자세 설명에 적합. "정답 자세"를 의도대로 보여줄 수 있다.',
  },
  {
    method: '단안 영상 추정 (MediaPipe 등)',
    accuracy: '낮음 (특히 깊이)',
    cost: '매우 쌈',
    fit: '두 사람이 엉키는 장면에서 약하다. 혼자 하는 우치코미·자세 피드백 정도에 적합.',
  },
  {
    method: '단안 SMPL 계열 (4DHumans, WHAM, GVHMR 등)',
    accuracy: '중',
    cost: 'GPU 서버에서 오프라인 처리',
    fit: '여러 사람과 사람 형태 메시를 다룬다. 기존 기술 영상에서 초안을 뽑고 사람이 보정하는 용도로 쓸 만하다.',
  },
  {
    method: '다중 카메라 마커리스 (OpenCap 등)',
    accuracy: '중상',
    cost: '스마트폰 2~4대 · 촬영 세팅',
    fit: '도장에서 직접 촬영할 수 있다면 가성비가 가장 좋은 선택지.',
  },
  {
    method: '관성 센서 수트 (Rokoko, Xsens 등)',
    accuracy: '상',
    cost: '수트 2벌 · 수백만~수천만 원',
    fit: '가려짐 문제가 없어 두 사람 기술에 강하다. 낙법 충격과 도복 마찰에 대한 내구성은 확인이 필요하다.',
  },
  {
    method: '광학 모션 캡처 스튜디오',
    accuracy: '최상',
    cost: '스튜디오 대여',
    fit: '대표 기술 몇 개를 "정답 데이터"로 한 번에 수집할 때.',
  },
];

const METHOD_COLUMNS: TableColumn<MethodRow>[] = [
  { key: 'method', header: '방법', width: proportional(2, { minWidth: 160 }) },
  { key: 'accuracy', header: '정확도', width: proportional(1, { minWidth: 90 }) },
  { key: 'cost', header: '비용·노력', width: proportional(2, { minWidth: 140 }) },
  { key: 'fit', header: '유도 적합성', width: proportional(3, { minWidth: 220 }) },
];

const NEXT_STEPS: [string, string][] = [
  [
    '키프레임 편집 도구',
    '지금은 좌표를 코드로 적는다. 3D 화면에서 골반·발·손 목표를 끌어 옮기는 편집기를 만들면 기술 하나를 수십 분에 만들 수 있다.',
  ],
  [
    '마네킹 품질',
    '지금은 관절점 사이에 회전체를 이어 붙인 절차적 마네킹이다. 다음 단계는 리깅된 사람 메시(glTF, 예: MakeHuman의 CC0 모델)를 지금의 관절점에 맞춰 리타게팅하고, 도복은 천 시뮬레이션이나 셰이더로 표현하는 것이다.',
  ],
  [
    '분석 고도화',
    '상대와 연결된 "합성 질량중심", 쿠즈시 방향(8방향 핫포노쿠즈시)을 화살표로 시각화하고, 토리가 외발일 때의 안정 여유를 강조한다.',
  ],
  [
    '데이터 파이프라인 검증',
    '대표 기술 3~5개를 다중 카메라(OpenCap)나 대여한 센서 수트로 찍어, 키프레임 대비 품질과 비용을 비교한다.',
  ],
  [
    '기존 앱 연동',
    'packages/judo의 기술 상세 페이지에 "3D로 보기" 진입점을 붙인다. 기술 id(o-soto-gari 등)는 이미 맞춰 두었다.',
  ],
];

const LIMITS = [
  '세 기술의 키프레임은 모두 시범 영상을 참고한 수작업 근사입니다. 실측 데이터가 아니므로 숫자는 경향을 보는 용도로만 쓰세요.',
  '균형 지표는 각자 따로 계산합니다. 안다리후리기처럼 상대에게 기대어 미는 순간에는 토리 혼자의 지표가 음수로 나오니, "두 사람 합성 질량중심"을 함께 보세요.',
  '무게중심은 남성 표준 비율(de Leva 1996)을 썼습니다. 도복, 체형 차이, 잡기로 오가는 힘은 반영하지 않습니다.',
  '동적 안정 여유(XCoM)는 "지금 이 속도라면 발을 옮기지 않고 버틸 수 있는가"를 나타내는 지표입니다. 상대가 잡고 있는 힘은 고려하지 않습니다.',
];

/** 반응형 계약: 단일 본문 열, contentWidth 960으로 줄 길이를 제한한다. 표는 좁아지면 표 안에서 가로 스크롤 */
export function About() {
  return (
    <Layout
      contentWidth={960}
      content={
        <LayoutContent padding={6}>
          <Stack gap={8}>
            <Stack gap={3}>
              <Text type="supporting">PoC 정리</Text>
              <Heading level={1}>유도 기술을 3D로 보고, 무게중심을 분석할 수 있을까?</Heading>
              <Banner
                status="info"
                title="가능합니다. 어려운 것은 정확한 동작 데이터를 얻는 일입니다."
                description="3D 표시와 무게중심 분석은 이 PoC 수준의 코드로도 웹(모바일 포함)에서 충분히 돌아갑니다. 결국 데이터 확보 방법이 제품의 품질과 비용을 정합니다."
                collapsible={false}
              />
            </Stack>

            <Stack gap={3}>
              <Heading level={2}>세 가지 실험에서 확인한 것</Heading>
              <Table data={EXPERIMENTS} columns={EXPERIMENT_COLUMNS} idKey="name" verticalAlign="top" />
            </Stack>

            <Stack gap={3}>
              <Heading level={2}>핵심 설계: 모든 데이터를 "이름 붙은 3D 점"으로 통일</Heading>
              <Text as="p">
                키프레임 리그, 영상 추정, (앞으로의) 모션 캡처 모두 같은 <Code>BodyPoints</Code>(관절 23개)로
                변환합니다. 렌더링·무게중심·기저면 분석은 이 점들만 보므로, 데이터를 얻는 방법을 바꿔도 앱의 나머지
                부분은 그대로입니다. 그래서 수작업 키프레임으로 먼저 출시하고, 나중에 모션 캡처 데이터로 교체하는 순서가
                가능합니다.
              </Text>
            </Stack>

            <Stack gap={3}>
              <Heading level={2}>동작 데이터 확보 방법 비교</Heading>
              <Table data={METHODS} columns={METHOD_COLUMNS} idKey="method" verticalAlign="top" />
            </Stack>

            <Stack gap={3}>
              <Heading level={2}>추천 다음 단계</Heading>
              <List listStyle="decimal" hasDividers>
                {NEXT_STEPS.map(([title, detail]) => (
                  <ListItem key={title} label={title} description={<Text color="secondary">{detail}</Text>} />
                ))}
              </List>
            </Stack>

            <Stack gap={3}>
              <Heading level={2}>이 PoC 데이터의 한계</Heading>
              <Stack gap={2}>
                {LIMITS.map((l) => (
                  <Text key={l} as="p">
                    · {l}
                  </Text>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </LayoutContent>
      }
    />
  );
}
