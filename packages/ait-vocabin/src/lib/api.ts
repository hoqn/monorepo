/**
 * VocaBin API client
 * Wraps all backend calls; stores the JWT in localStorage.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'vocabin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
  return request<ReviewWordsResponse>(`/words/review?limit=${limit}`);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionResult {
  wordId: string;
  questionType: 'article' | 'plural';
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

export function completeSession(
  sessionId: string,
  results: SessionResult[]
): Promise<CompleteSessionResponse> {
  return request<CompleteSessionResponse>(`/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ results }),
  });
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
