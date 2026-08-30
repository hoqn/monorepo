import { useMemo, useState } from 'react';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

import type { Card, Grade, Technique } from './types';
import { useAppState } from './lib/use-app-state';
import { buildQueue } from './lib/scheduler';
import { todayISO } from './lib/date';
import Today from './screens/Today';
import Review from './screens/Review';
import Organize from './screens/Organize';
import Handoff from './screens/Handoff';
import QuickLog from './screens/QuickLog';
import Drawer from './screens/Drawer';
import Detail from './screens/Detail';
import Settings from './screens/Settings';

type Tab = 'today' | 'drawer';
type Flow = null | 'session' | 'log' | 'settings';
type Stage = 'organize' | 'handoff' | 'review';

export default function App() {
  const {
    state,
    pendingSessions,
    recentTechniqueIds,
    logSession,
    organizeSession,
    gradeCard,
    startReview,
    setTrainingWeekdays,
    matchUnknownNote,
  } = useAppState();

  const [tab, setTab] = useState<Tab>('today');
  const [flow, setFlow] = useState<Flow>(null);
  const [stage, setStage] = useState<Stage>('organize');
  const [made, setMade] = useState(0);
  const [detail, setDetail] = useState<Technique | null>(null);

  const today = todayISO();

  const queue = useMemo(
    () =>
      buildQueue(state.cards, {
        today,
        trainingWeekdays: state.settings.trainingWeekdays,
        recentTechniqueIds,
      }),
    [state.cards, state.settings.trainingWeekdays, recentTechniqueIds, today],
  );

  /**
   * 복습 중이던 큐가 남아 있으면 그 순서를 그대로 이어간다 ("내릴 때 끄면 그 자리부터").
   * 날짜가 바뀌었으면 오늘 큐로 새로 만든다.
   */
  const progress = state.reviewProgress;
  const isResumable = progress !== null && progress.date === today;
  const reviewCards: Card[] = useMemo(() => {
    if (!isResumable) return queue.cards;
    const byCardId = new Map(state.cards.map((c) => [c.id, c]));
    return progress.queue.map((id) => byCardId.get(id)).filter((c): c is Card => c !== undefined);
  }, [isResumable, progress, queue.cards, state.cards]);
  const reviewIndex = isResumable ? progress.index : 0;

  const enterReview = () => {
    startReview(queue.cards.map((c) => c.id));
    setStage('review');
  };

  const start = () => {
    setFlow('session');
    if (pendingSessions.length > 0) {
      setStage('organize');
      return;
    }
    enterReview();
  };

  const handleGrade = (card: Card, grade: Grade) => {
    gradeCard(card.id, grade);
  };

  const finishOrganize = (sessionId: string, entries: Array<{ techniqueId: string; memo: string }>) => {
    organizeSession(sessionId, entries);
    // 기술 하나당 '내 메모' + (표준 단계가 있으면) '순서' 카드가 생긴다
    setMade(entries.length);
    setStage('handoff');
  };

  const renderContent = () => {
    if (flow === 'settings') {
      return (
        <Settings
          trainingWeekdays={state.settings.trainingWeekdays}
          onChange={setTrainingWeekdays}
          onBack={() => setFlow(null)}
        />
      );
    }

    if (flow === 'log') {
      return (
        <QuickLog
          recentTechniqueIds={recentTechniqueIds}
          onSave={(ids, notes) => {
            logSession(ids, notes);
            setFlow(null);
          }}
          onExit={() => setFlow(null)}
        />
      );
    }

    if (flow === 'session') {
      const pending = pendingSessions[0];
      if (stage === 'organize' && pending !== undefined) {
        return (
          <Organize
            session={pending}
            onMatchUnknown={(noteIndex, techniqueId) => matchUnknownNote(pending.id, noteIndex, techniqueId)}
            onDone={(entries) => finishOrganize(pending.id, entries)}
            onExit={() => setFlow(null)}
          />
        );
      }
      if (stage === 'handoff') {
        return <Handoff made={made} due={queue.cards.length} onGo={enterReview} />;
      }
      return <Review cards={reviewCards} index={reviewIndex} onGrade={handleGrade} onExit={() => setFlow(null)} />;
    }

    if (detail !== null) {
      return (
        <Detail
          tech={detail}
          reps={state.reps[detail.id] ?? 0}
          notes={state.notes[detail.id] ?? []}
          onBack={() => setDetail(null)}
        />
      );
    }

    if (tab === 'drawer') {
      return <Drawer reps={state.reps} onOpen={setDetail} />;
    }

    return (
      <Today
        queue={queue}
        pendingSessions={pendingSessions}
        trainingWeekdays={state.settings.trainingWeekdays}
        onStart={start}
        onLog={() => setFlow('log')}
        onOpenSettings={() => setFlow('settings')}
      />
    );
  };

  return (
    <Theme theme={neutralTheme}>
      <AppShell
        height="fill"
        contentPadding={0}
        topNav={
          <TopNav
            label="주 메뉴"
            heading={<TopNavHeading heading="유도 복습" />}
            startContent={
              <>
                <TopNavItem
                  label="오늘"
                  isSelected={tab === 'today' && detail === null && flow === null}
                  onClick={() => {
                    setTab('today');
                    setDetail(null);
                    setFlow(null);
                  }}
                />
                <TopNavItem
                  label="서랍"
                  isSelected={tab === 'drawer' && flow === null}
                  onClick={() => {
                    setTab('drawer');
                    setDetail(null);
                    setFlow(null);
                  }}
                />
              </>
            }
          />
        }
      >
        {renderContent()}
      </AppShell>
    </Theme>
  );
}
