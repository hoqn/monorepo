/**
 * VocaBin API client
 * Wraps all backend calls; stores the JWT in localStorage.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'vocabin_token';
const USE_SAMPLE_WORDS = import.meta.env.VITE_USE_SAMPLE_WORDS === 'true';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${init.method ?? 'GET'} ${path} failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResult {
  token: string;
  isNewUser: boolean;
}

export async function login(params: {
  authorizationCode?: string;
  devUserId?: string;
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2';
  dailyGoal?: number;
  notifyTime?: string;
}): Promise<LoginResult> {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  setToken(result.token);
  return result;
}

// ── User ──────────────────────────────────────────────────────────────────────

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
  reviewPending: number;
  progressDistribution: { learning: number; mastered: number };
}

export interface MeResponse {
  user: UserProfile;
  stats: UserStats;
}

export function getMe(): Promise<MeResponse> {
  return request<MeResponse>('/users/me');
}

export function updateMe(params: {
  cefrLevel?: string;
  dailyGoal?: number;
  notifyTime?: string;
  displayName?: string;
}): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

// ── Words ─────────────────────────────────────────────────────────────────────

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

export function getReviewWords(limit = 12): Promise<ReviewWordsResponse> {
  if (USE_SAMPLE_WORDS) {
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

  return request<ReviewWordsResponse>(`/words/review?limit=${limit}`);
}

// ── Verbs ─────────────────────────────────────────────────────────────────────

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

export function getReviewVerbs(limit = 4): Promise<ReviewVerbsResponse> {
  return request<ReviewVerbsResponse>(`/verbs/review?limit=${limit}`);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

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

export async function createSession(): Promise<{ sessionId: string }> {
  return request<{ sessionId: string }>('/sessions', { method: 'POST' });
}

export function completeSession(sessionId: string, results: SessionResult[]): Promise<CompleteSessionResponse> {
  return request<CompleteSessionResponse>(`/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ results }),
  });
}

// ── Mappers ───────────────────────────────────────────────────────────────────

import type { Word as FrontendWord, Verb as FrontendVerb, VerbForm as FrontendVerbForm } from '../types/word.ts';
import { sampleWords } from '../data/sample-words.ts';
import { shuffle } from 'es-toolkit';

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

// ── Missions ──────────────────────────────────────────────────────────────────

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

export function getTodayMissions(): Promise<TodayMissionsResponse> {
  return request<TodayMissionsResponse>('/missions/today');
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  display_name: string | null;
  xp_total: number;
  is_me: boolean;
}

export function getLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  return request<{ entries: LeaderboardEntry[] }>('/leaderboard');
}
