import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, Card, Grade, Session } from '../types';
import { byId } from '../data/techniques';
import { createId, loadState, saveState } from './storage';
import { applyGrade } from './scheduler';
import { todayISO } from './date';

export interface OrganizeEntry {
  techniqueId: string;
  memo: string;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  // 상태가 바뀔 때마다 통째로 저장한다. 데이터가 한 사람 몫이라 크지 않고,
  // "내릴 때 끄면 그 자리부터"를 보장하려면 지연 없이 써 두는 편이 안전하다.
  useEffect(() => {
    saveState(state);
  }, [state]);

  const pendingSessions = useMemo(() => state.sessions.filter((s) => s.organizedAt === undefined), [state.sessions]);

  /** 최근 세션에서 태그한 기술 — 수련일 보정에서 "또 나올 가능성이 높은 기술"로 본다. */
  const recentTechniqueIds = useMemo(() => {
    const recent = [...state.sessions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);
    return [...new Set(recent.flatMap((s) => s.techniqueIds))];
  }, [state.sessions]);

  const logSession = useCallback((techniqueIds: string[], unknownNotes: string[]) => {
    const session: Session = {
      id: createId('session'),
      date: todayISO(),
      techniqueIds,
      unknownNotes,
    };
    setState((prev) => {
      const reps = { ...prev.reps };
      techniqueIds.forEach((id) => {
        reps[id] = (reps[id] ?? 0) + 1;
      });
      return { ...prev, sessions: [...prev.sessions, session], reps };
    });
  }, []);

  /**
   * 정리 끝 → 카드 생성. 사용자가 쓴 문장이 그대로 '내 메모' 카드의 뒷면이 된다.
   * 이게 없으면 정리할 이유가 없어서 루프가 안 닫힌다.
   * 표준 단계가 있는 기술만 '순서' 카드를 함께 만든다.
   */
  const organizeSession = useCallback((sessionId: string, entries: OrganizeEntry[]) => {
    const today = todayISO();
    setState((prev) => {
      const added: Card[] = [];
      const notes = { ...prev.notes };

      entries.forEach((entry) => {
        const tech = byId(entry.techniqueId);
        if (tech === undefined) return;

        added.push({
          id: createId('card'),
          techniqueId: tech.id,
          type: '내 메모',
          front: `${tech.ko} — 내가 적어둔 포인트는?`,
          back: entry.memo,
          memoDate: today,
          // 정리하며 짜낸 것 자체가 1회차 복습이라, 첫 간격을 한 단계 앞선 데서 시작한다.
          step: 1,
          dueDate: today,
        });

        if (tech.steps.length > 0) {
          added.push({
            id: createId('card'),
            techniqueId: tech.id,
            type: '순서',
            front: `${tech.ko}를 ${tech.steps.length}단계로 떠올려봐`,
            step: 1,
            dueDate: today,
          });
        }

        notes[tech.id] = [{ memo: entry.memo, date: today }, ...(notes[tech.id] ?? [])];
      });

      return {
        ...prev,
        cards: [...prev.cards, ...added],
        notes,
        sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, organizedAt: today } : s)),
      };
    });
    return entries.length;
  }, []);

  const gradeCard = useCallback((cardId: string, grade: Grade) => {
    const today = todayISO();
    setState((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? applyGrade(c, grade, today) : c)),
      reviewLog: [...prev.reviewLog, { cardId, date: today, grade }],
      reviewProgress:
        prev.reviewProgress === null ? null : { ...prev.reviewProgress, index: prev.reviewProgress.index + 1 },
    }));
  }, []);

  /** 복습 큐를 고정해 둔다. 앱을 껐다 켜도 같은 순서로 그 자리부터 이어진다. */
  const startReview = useCallback((queue: string[]) => {
    const today = todayISO();
    setState((prev) => {
      const existing = prev.reviewProgress;
      if (existing !== null && existing.date === today && existing.index < existing.queue.length) {
        return prev;
      }
      return { ...prev, reviewProgress: { queue, index: 0, date: today } };
    });
  }, []);

  const setTrainingWeekdays = useCallback((weekdays: number[]) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, trainingWeekdays: weekdays } }));
  }, []);

  /** 자유 텍스트로 남겨둔 기록을 나중에 실제 기술과 맞춘다. */
  const matchUnknownNote = useCallback((sessionId: string, noteIndex: number, techniqueId: string) => {
    setState((prev) => {
      const reps = { ...prev.reps };
      reps[techniqueId] = (reps[techniqueId] ?? 0) + 1;
      return {
        ...prev,
        reps,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                techniqueIds: s.techniqueIds.includes(techniqueId) ? s.techniqueIds : [...s.techniqueIds, techniqueId],
                unknownNotes: s.unknownNotes.filter((_, i) => i !== noteIndex),
              }
            : s,
        ),
      };
    });
  }, []);

  return {
    state,
    pendingSessions,
    recentTechniqueIds,
    logSession,
    organizeSession,
    gradeCard,
    startReview,
    setTrainingWeekdays,
    matchUnknownNote,
  };
}
