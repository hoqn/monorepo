/**
 * 모든 백엔드 연결을 제거하고 로컬 데이터만 사용하는 구현.
 * 인터페이스는 기존 코드와 동일하게 유지해 호출 측을 최소한으로 수정.
 */

import type { Word as FrontendWord, Verb as FrontendVerb, VerbForm as FrontendVerbForm } from '../types/word.ts';
import { sampleWords } from '../data/sample-words.ts';
import { sampleVerbs } from '../data/sample-verbs.ts';
import { getProfile, updateProfile } from './local-profile.ts';
import { shuffle } from 'es-toolkit';

// ── 타입 (기존 코드 호환) ─────────────────────────────────────────────────────

export interface Word {
  id: string;
  word: string;
  article: 'der' | 'die' | 'das';
  plural: string | null;
  meaning_ko: string;
  ipa: string | null;
  cefr_level: string;
  category: string | null;
}

export interface WordProgress {
  word_id: string;
  easiness: number;
  interval: number;
  repetitions: number;
  next_review_at: string;
}

export interface ReviewWordsResponse {
  words: Word[];
  progress: WordProgress[];
}

export interface ApiVerb {
  id: string;
  infinitive: string;
  meaning_ko: string;
  ipa: string | null;
  cefr_level: string;
  category: string | null;
  is_irregular: boolean;
}

export interface ApiVerbForm {
  pronoun: string;
  tense: string;
  form: string;
  example_sentence: string | null;
  example_sentence_ko: string | null;
}

export interface ReviewVerbsResponse {
  verbs: Array<ApiVerb & { forms: ApiVerbForm[] }>;
}

export interface UserProfile {
  id: string;
  cefr_level: string;
  daily_goal: number;
  notify_time: string | null;
  display_name: string | null;
  current_streak: number;
  max_streak: number;
  total_xp: number;
  last_active_date: string | null;
}

export interface UserStats {
  totalWords: number;
  sessionsToday: number;
  reviewPending?: number;
  progressDistribution?: { learning: number; mastered: number };
}

export interface MeResponse {
  user: UserProfile;
  stats: UserStats;
}

export interface SessionResult {
  wordId?: string;
  verbId?: string;
  questionType: 'article' | 'plural' | 'verb_conjugation';
  correct: boolean;
}

export interface CompleteSessionResponse {
  xpEarned: number;
  correctCount: number;
  total: number;
}

export interface LeaderboardEntry {
  rank: number;
  display_name: string | null;
  xp_total: number;
  is_me: boolean;
}

export type MissionType = 'correct_count' | 'combo_streak' | 'question_count';

export interface DailyMission {
  id: string;
  type: MissionType;
  target: number;
  progress: number;
  completed_at: string | null;
}

export interface TodayMissionsResponse {
  missions: DailyMission[];
}

export interface LoginResult {
  token: string;
  isNewUser: boolean;
}

// ── Auth (no-op) ───────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return 'local';
}

export async function login(_params: {
  authorizationCode?: string;
  devUserId?: string;
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2';
  dailyGoal?: number;
  notifyTime?: string;
}): Promise<LoginResult> {
  return { token: 'local', isNewUser: false };
}

// ── User ──────────────────────────────────────────────────────────────────────

export function getMe(): Promise<MeResponse> {
  const p = getProfile();
  return Promise.resolve({
    user: {
      id: 'local',
      cefr_level: p.cefrLevel,
      daily_goal: p.dailyGoal,
      notify_time: p.notifyTime,
      display_name: p.displayName,
      current_streak: p.currentStreak,
      max_streak: p.maxStreak,
      total_xp: p.totalXp,
      last_active_date: p.lastActiveDate,
    },
    stats: {
      totalWords: sampleWords.length,
      sessionsToday: p.sessionsToday,
    },
  });
}

export function updateMe(params: {
  cefrLevel?: string;
  dailyGoal?: number;
  notifyTime?: string;
  displayName?: string;
}): Promise<{ ok: boolean }> {
  const patch: Parameters<typeof updateProfile>[0] = {};
  if (params.cefrLevel) patch.cefrLevel = params.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2';
  if (params.dailyGoal !== undefined) patch.dailyGoal = params.dailyGoal;
  if (params.notifyTime !== undefined) patch.notifyTime = params.notifyTime;
  if (params.displayName !== undefined) patch.displayName = params.displayName;
  updateProfile(patch);
  return Promise.resolve({ ok: true });
}

// ── Words ─────────────────────────────────────────────────────────────────────

export function getReviewWords(limit = 12): Promise<ReviewWordsResponse> {
  const words: Word[] = shuffle(sampleWords)
    .slice(0, limit)
    .map((w) => ({
      id: w.id,
      word: w.word,
      article: w.article,
      plural: w.plural,
      meaning_ko: w.meaningKo,
      ipa: w.ipa,
      cefr_level: w.cefrLevel,
      category: w.category,
    }));

  return Promise.resolve({ words, progress: [] });
}

// ── Verbs ─────────────────────────────────────────────────────────────────────

export function getReviewVerbs(limit = 4): Promise<ReviewVerbsResponse> {
  const entries = shuffle(sampleVerbs).slice(0, limit);
  const verbs = entries.map((e) => ({
    id: e.verb.id,
    infinitive: e.verb.infinitive,
    meaning_ko: e.verb.meaningKo,
    ipa: e.verb.ipa,
    cefr_level: e.verb.cefrLevel,
    category: e.verb.category,
    is_irregular: e.verb.isIrregular,
    forms: e.forms.map((f) => ({
      pronoun: f.pronoun,
      tense: f.tense,
      form: f.form,
      example_sentence: f.exampleSentence,
      example_sentence_ko: f.exampleSentenceKo,
    })),
  }));
  return Promise.resolve({ verbs });
}

// ── Sessions ──────────────────────────────────────────────────────────────────

let _pendingResults: SessionResult[] = [];

export async function createSession(): Promise<{ sessionId: string }> {
  _pendingResults = [];
  return { sessionId: `local-${Date.now()}` };
}

export function completeSession(
  _sessionId: string,
  results: SessionResult[],
): Promise<CompleteSessionResponse> {
  const correctCount = results.filter((r) => r.correct).length;
  const xpEarned = correctCount * 10;
  return Promise.resolve({ xpEarned, correctCount, total: results.length });
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export function getLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  return Promise.resolve({ entries: [] });
}

// ── Missions ──────────────────────────────────────────────────────────────────

export function getTodayMissions(): Promise<TodayMissionsResponse> {
  return Promise.resolve({ missions: [] });
}

// ── Mappers ───────────────────────────────────────────────────────────────────

export function mapWord(w: Word): FrontendWord {
  return {
    id: w.id,
    word: w.word,
    article: w.article,
    plural: w.plural,
    meaningKo: w.meaning_ko,
    ipa: w.ipa ?? '',
    cefrLevel: w.cefr_level as FrontendWord['cefrLevel'],
    category: w.category ?? '',
  };
}

export function mapVerb(v: ApiVerb): FrontendVerb {
  return {
    id: v.id,
    infinitive: v.infinitive,
    meaningKo: v.meaning_ko,
    ipa: v.ipa ?? '',
    cefrLevel: v.cefr_level as FrontendVerb['cefrLevel'],
    category: v.category ?? '',
    isIrregular: v.is_irregular,
  };
}

export function mapVerbForm(f: ApiVerbForm): FrontendVerbForm {
  return {
    pronoun: f.pronoun,
    tense: f.tense,
    form: f.form,
    exampleSentence: f.example_sentence,
    exampleSentenceKo: f.example_sentence_ko,
  };
}
