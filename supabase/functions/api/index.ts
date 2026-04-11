/**
 * VocaBin API — Supabase Edge Function (Deno)
 * Handles all API routes. Deploy with: supabase functions deploy api
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SignJWT, jwtVerify } from 'npm:jose@5';

// ── Env ───────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET')!);
const DEV_AUTH = Deno.env.get('DEV_AUTH') === 'true';
const AIT_CLIENT_ID = Deno.env.get('AIT_CLIENT_ID') ?? '';
const AIT_CLIENT_SECRET = Deno.env.get('AIT_CLIENT_SECRET') ?? '';
const AIT_TOKEN_URL =
  Deno.env.get('AIT_TOKEN_URL') ??
  'https://api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function db() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
}

async function signToken(payload: { userId: string; aitUserId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

async function getUser(req: Request): Promise<{ userId: string; aitUserId: string } | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const { payload } = await jwtVerify(auth.slice(7), JWT_SECRET);
    return payload as { userId: string; aitUserId: string };
  } catch {
    return null;
  }
}

// ── AIT auth ──────────────────────────────────────────────────────────────────
async function exchangeAuthCode(code: string): Promise<string> {
  const res = await fetch(AIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${AIT_CLIENT_ID}:${AIT_CLIENT_SECRET}`)}`,
    },
    body: JSON.stringify({ authorizationCode: code }),
  });
  if (!res.ok) throw new Error(`AIT exchange failed: ${res.status}`);
  const { accessToken } = await res.json() as { accessToken: string };
  const [, b64] = accessToken.split('.');
  const payload = JSON.parse(atob(b64)) as { sub?: string; userId?: string };
  return payload.sub ?? payload.userId ?? (() => { throw new Error('No userId in AIT token'); })();
}

// ── SM-2 ─────────────────────────────────────────────────────────────────────
function sm2(quality: number, easiness: number, interval: number, repetitions: number) {
  let e = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (e < 1.3) e = 1.3;
  let i: number, r: number;
  if (quality < 3) { r = 0; i = 1; }
  else {
    r = repetitions + 1;
    i = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(interval * e);
  }
  const next = new Date();
  next.setDate(next.getDate() + i);
  return { easiness: e, interval: i, repetitions: r, nextReviewAt: next };
}

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleLogin(req: Request): Promise<Response> {
  const body = await req.json() as {
    authorizationCode?: string;
    devUserId?: string;
    cefrLevel?: string;
    dailyGoal?: number;
    notifyTime?: string;
  };

  let aitUserId: string;
  if (DEV_AUTH && body.devUserId) {
    aitUserId = `dev_${body.devUserId}`;
  } else if (body.authorizationCode) {
    aitUserId = await exchangeAuthCode(body.authorizationCode);
  } else {
    return json({ error: 'authorizationCode required' }, 400);
  }

  const supabase = db();
  const { data: existing } = await supabase
    .from('users').select('id').eq('ait_user_id', aitUserId).single();

  let userId: string;
  if (existing) {
    userId = existing.id;
    const upd: Record<string, unknown> = {};
    if (body.cefrLevel) upd.cefr_level = body.cefrLevel;
    if (body.dailyGoal) upd.daily_goal = body.dailyGoal;
    if (body.notifyTime) upd.notify_time = body.notifyTime;
    if (Object.keys(upd).length) await supabase.from('users').update(upd).eq('id', userId);
  } else {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ ait_user_id: aitUserId, cefr_level: body.cefrLevel ?? 'A1', daily_goal: body.dailyGoal ?? 1, notify_time: body.notifyTime ?? null })
      .select('id').single();
    if (error || !newUser) return json({ error: 'Failed to create user' }, 500);
    userId = newUser.id;
  }

  return json({ token: await signToken({ userId, aitUserId }), isNewUser: !existing });
}

async function handleWordsReview(req: Request, user: { userId: string }): Promise<Response> {
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '12'), 50);
  const now = new Date().toISOString();
  const supabase = db();

  const { data: due } = await supabase
    .from('user_word_progress')
    .select('word_id, easiness, interval, repetitions, next_review_at')
    .eq('user_id', user.userId).lte('next_review_at', now).limit(limit);

  const dueIds = (due ?? []).map((p: { word_id: string }) => p.word_id);
  const remaining = limit - dueIds.length;
  let newIds: string[] = [];

  if (remaining > 0) {
    const { data: seen } = await supabase.from('user_word_progress').select('word_id').eq('user_id', user.userId);
    const seenIds = (seen ?? []).map((r: { word_id: string }) => r.word_id);
    let q = supabase.from('words').select('id').limit(remaining);
    if (seenIds.length > 0) q = q.not('id', 'in', `(${seenIds.join(',')})`);
    const { data } = await q;
    newIds = (data ?? []).map((w: { id: string }) => w.id);
  }

  const allIds = [...dueIds, ...newIds];
  if (allIds.length === 0) return json({ words: [], progress: [] });
  const { data: words } = await supabase.from('words').select('*').in('id', allIds);
  return json({ words: words ?? [], progress: due ?? [] });
}

async function handleCreateSession(user: { userId: string }): Promise<Response> {
  const { data, error } = await db()
    .from('sessions')
    .insert({ user_id: user.userId, total_questions: 0, correct_count: 0, xp_earned: 0, is_recovery: false })
    .select('id').single();
  if (error || !data) return json({ error: 'Failed to create session' }, 500);
  return json({ sessionId: data.id });
}

async function handleCompleteSession(
  req: Request,
  user: { userId: string },
  sessionId: string
): Promise<Response> {
  const { results } = await req.json() as {
    results: Array<{ wordId?: string; verbId?: string; questionType: string; correct: boolean }>;
  };

  const correctCount = results.filter((r) => r.correct).length;
  const xpEarned = correctCount * 10;
  const now = new Date().toISOString();
  const supabase = db();

  await supabase.from('sessions').update({
    total_questions: results.length, correct_count: correctCount,
    xp_earned: xpEarned, completed_at: now,
  }).eq('id', sessionId).eq('user_id', user.userId);

  // session_words: 명사 결과만 (word_id 있는 항목)
  const wordResults = results.filter((r) => r.wordId);
  if (wordResults.length > 0) {
    await supabase.from('session_words').insert(
      wordResults.map((r) => ({ session_id: sessionId, word_id: r.wordId, question_type: r.questionType, is_correct: r.correct }))
    );
  }

  // user_word_progress SM-2 업데이트 (명사)
  for (const r of wordResults) {
    const { data: existing } = await supabase
      .from('user_word_progress').select('*').eq('user_id', user.userId).eq('word_id', r.wordId!).single();
    const prev = existing ?? { easiness: 2.5, interval: 0, repetitions: 0 };
    const next = sm2(r.correct ? 5 : 1, prev.easiness, prev.interval, prev.repetitions);
    const progress = { easiness: next.easiness, interval: next.interval, repetitions: next.repetitions, next_review_at: next.nextReviewAt.toISOString(), last_reviewed_at: now };
    if (existing) {
      await supabase.from('user_word_progress').update(progress).eq('id', existing.id);
    } else {
      await supabase.from('user_word_progress').insert({ user_id: user.userId, word_id: r.wordId, ...progress });
    }
  }

  // verb_progress SM-2 업데이트 (동사)
  const verbResults = results.filter((r) => r.verbId);
  for (const r of verbResults) {
    const { data: existing } = await supabase
      .from('verb_progress').select('*').eq('user_id', user.userId).eq('verb_id', r.verbId!).single();
    const prev = existing ?? { easiness: 2.5, interval: 0, repetitions: 0 };
    const next = sm2(r.correct ? 5 : 1, prev.easiness, prev.interval, prev.repetitions);
    const progress = { easiness: next.easiness, interval: next.interval, repetitions: next.repetitions, next_review_at: next.nextReviewAt.toISOString() };
    if (existing) {
      await supabase.from('verb_progress').update(progress).eq('user_id', user.userId).eq('verb_id', r.verbId!);
    } else {
      await supabase.from('verb_progress').insert({ user_id: user.userId, verb_id: r.verbId, ...progress });
    }
  }

  // Streak + XP
  const today = new Date().toISOString().slice(0, 10);
  const { data: u } = await supabase.from('users').select('current_streak,max_streak,last_active_date,total_xp').eq('id', user.userId).single();
  if (u) {
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().slice(0, 10);
    const streak = u.last_active_date === today ? u.current_streak
      : u.last_active_date === yStr ? u.current_streak + 1 : 1;
    await supabase.from('users').update({ total_xp: u.total_xp + xpEarned, current_streak: streak, max_streak: Math.max(u.max_streak, streak), last_active_date: today }).eq('id', user.userId);
  }

  // weekly_xp
  const weekStart = getMonday(new Date());
  const { data: wx } = await supabase.from('weekly_xp').select('id,xp_total').eq('user_id', user.userId).eq('week_start', weekStart).single();
  if (wx) {
    await supabase.from('weekly_xp').update({ xp_total: wx.xp_total + xpEarned }).eq('id', wx.id);
  } else {
    await supabase.from('weekly_xp').insert({ user_id: user.userId, week_start: weekStart, xp_total: xpEarned });
  }

  // 미션 진행 업데이트
  const maxCombo = calcMaxCombo(results.map((r) => r.correct));
  await updateMissionProgress(supabase, user.userId, {
    correct_count: correctCount,
    question_count: results.length,
    combo_streak: maxCombo,
  });

  return json({ xpEarned, correctCount, total: results.length });
}

/** 연속 정답 최대값 계산 */
function calcMaxCombo(corrects: boolean[]): number {
  let max = 0, cur = 0;
  for (const c of corrects) { cur = c ? cur + 1 : 0; if (cur > max) max = cur; }
  return max;
}

// ── /verbs/review ─────────────────────────────────────────────────────────────
async function handleVerbsReview(req: Request, user: { userId: string }): Promise<Response> {
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '4'), 20);
  const now = new Date().toISOString();
  const supabase = db();

  // 복습 시점이 된 동사 먼저
  const { data: due } = await supabase
    .from('verb_progress')
    .select('verb_id')
    .eq('user_id', user.userId)
    .lte('next_review_at', now)
    .limit(limit);

  const dueIds = (due ?? []).map((p: { verb_id: string }) => p.verb_id);
  const remaining = limit - dueIds.length;
  let newIds: string[] = [];

  // 아직 한 번도 안 본 동사로 채우기
  if (remaining > 0) {
    const { data: seen } = await supabase
      .from('verb_progress').select('verb_id').eq('user_id', user.userId);
    const seenIds = (seen ?? []).map((r: { verb_id: string }) => r.verb_id);
    let q = supabase.from('verbs').select('id').limit(remaining);
    if (seenIds.length > 0) q = q.not('id', 'in', `(${seenIds.join(',')})`);
    const { data } = await q;
    newIds = (data ?? []).map((v: { id: string }) => v.id);
  }

  const allIds = [...dueIds, ...newIds];
  if (allIds.length === 0) return json({ verbs: [] });

  // 동사 + 변화형 join
  const { data: verbs } = await supabase
    .from('verbs')
    .select('*, forms:verb_forms(*)')
    .in('id', allIds);

  return json({ verbs: verbs ?? [] });
}

// ── /missions/today ────────────────────────────────────────────────────────────

const MISSION_DEFAULTS = [
  { type: 'correct_count',  target: 8  },
  { type: 'question_count', target: 12 },
  { type: 'combo_streak',   target: 3  },
] as const;

async function handleGetMissions(user: { userId: string }): Promise<Response> {
  const today = new Date().toISOString().slice(0, 10);
  const supabase = db();

  // 오늘 미션이 없으면 생성
  const { data: existing } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('user_id', user.userId)
    .eq('date', today);

  if (!existing || existing.length === 0) {
    await supabase.from('daily_missions').insert(
      MISSION_DEFAULTS.map((m) => ({ user_id: user.userId, date: today, ...m }))
    );
    const { data: fresh } = await supabase
      .from('daily_missions').select('*').eq('user_id', user.userId).eq('date', today);
    return json({ missions: fresh ?? [] });
  }

  return json({ missions: existing });
}

/** 세션 완료 후 미션 진행 업데이트 (fire-and-forget 실패는 무시) */
async function updateMissionProgress(
  supabase: ReturnType<typeof db>,
  userId: string,
  stats: { correct_count: number; question_count: number; combo_streak: number }
) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: missions } = await supabase
    .from('daily_missions').select('*').eq('user_id', userId).eq('date', today);

  if (!missions || missions.length === 0) return;

  for (const m of missions) {
    if (m.completed_at) continue;
    const value = stats[m.type as keyof typeof stats] ?? 0;
    // combo_streak: 세션 내 최대값과 비교 (누적 아님)
    const newProgress = m.type === 'combo_streak'
      ? Math.max(m.progress, value)
      : m.progress + value;
    const completed = newProgress >= m.target;
    await supabase.from('daily_missions').update({
      progress: Math.min(newProgress, m.target),
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    }).eq('id', m.id);
  }
}

async function handleGetMe(user: { userId: string }): Promise<Response> {
  const supabase = db();
  const { data: u, error } = await supabase
    .from('users').select('id,cefr_level,daily_goal,notify_time,display_name,current_streak,max_streak,total_xp,last_active_date,created_at')
    .eq('id', user.userId).single();
  if (error || !u) return json({ error: 'User not found' }, 404);

  const now = new Date().toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [
    { count: totalWords },
    { count: sessionsToday },
    { count: reviewPending },
    { data: progressRows },
  ] = await Promise.all([
    supabase.from('user_word_progress').select('*', { count: 'exact', head: true }).eq('user_id', user.userId),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId).gte('completed_at', todayStart.toISOString()).not('completed_at', 'is', null),
    supabase.from('user_word_progress').select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId).lte('next_review_at', now),
    supabase.from('user_word_progress').select('repetitions').eq('user_id', user.userId),
  ]);

  // 숙련도 분포: repetitions 기준
  const rows = progressRows ?? [];
  const learning = rows.filter((r: { repetitions: number }) => r.repetitions < 4).length;
  const mastered = rows.filter((r: { repetitions: number }) => r.repetitions >= 4).length;

  return json({
    user: u,
    stats: {
      totalWords: totalWords ?? 0,
      sessionsToday: sessionsToday ?? 0,
      reviewPending: reviewPending ?? 0,
      progressDistribution: { learning, mastered },
    },
  });
}

async function handlePatchMe(req: Request, user: { userId: string }): Promise<Response> {
  const body = await req.json() as Record<string, unknown>;
  const upd: Record<string, unknown> = {};
  if (body.cefrLevel !== undefined) upd.cefr_level = body.cefrLevel;
  if (body.dailyGoal !== undefined) upd.daily_goal = body.dailyGoal;
  if (body.notifyTime !== undefined) upd.notify_time = body.notifyTime;
  if (body.displayName !== undefined) upd.display_name = body.displayName;
  if (!Object.keys(upd).length) return json({ error: 'No fields to update' }, 400);
  const { error } = await db().from('users').update(upd).eq('id', user.userId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

async function handleLeaderboard(user: { userId: string }): Promise<Response> {
  const weekStart = getMonday(new Date());
  const { data } = await db().from('weekly_xp')
    .select('user_id, xp_total, users(display_name)')
    .eq('week_start', weekStart).order('xp_total', { ascending: false }).limit(100);

  const entries = (data ?? []).map((row: { user_id: string; xp_total: number; users: { display_name: string | null } | null }, i: number) => ({
    rank: i + 1,
    display_name: row.users?.display_name ?? null,
    xp_total: row.xp_total,
    is_me: row.user_id === user.userId,
  }));
  return json({ entries });
}

// ── Main router ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const path = new URL(req.url).pathname.replace(/^\/(functions\/v1\/)?api/, '') || '/';

  try {
    if (path === '/health') return json({ ok: true });
    if (req.method === 'POST' && path === '/auth/login') return handleLogin(req);

    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    if (req.method === 'GET'   && path === '/words/review')   return handleWordsReview(req, user);
    if (req.method === 'GET'   && path === '/verbs/review')   return handleVerbsReview(req, user);
    if (req.method === 'GET'   && path === '/missions/today') return handleGetMissions(user);
    if (req.method === 'POST'  && path === '/sessions')        return handleCreateSession(user);
    if (req.method === 'POST'  && /^\/sessions\/[^/]+\/complete$/.test(path)) {
      return handleCompleteSession(req, user, path.split('/')[2]);
    }
    if (req.method === 'GET'   && path === '/users/me')        return handleGetMe(user);
    if (req.method === 'PATCH' && path === '/users/me')        return handlePatchMe(req, user);
    if (req.method === 'GET'   && path === '/leaderboard')     return handleLeaderboard(user);

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    console.error(e);
    return json({ error: 'Internal server error' }, 500);
  }
});
