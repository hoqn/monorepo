-- ── 동사 기본 정보 ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verbs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  infinitive   TEXT UNIQUE NOT NULL,
  meaning_ko   TEXT NOT NULL,
  ipa          TEXT,
  cefr_level   TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2')),
  category     TEXT,
  is_irregular BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 동사 변화형 (인칭 × 시제) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verb_forms (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verb_id          UUID NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  pronoun          TEXT NOT NULL CHECK (pronoun IN ('ich', 'du', 'er', 'wir', 'ihr', 'sie')),
  tense            TEXT NOT NULL CHECK (tense IN ('Präsens', 'Präteritum', 'Perfekt')),
  form             TEXT NOT NULL,
  example_sentence TEXT,
  UNIQUE (verb_id, pronoun, tense)
);

-- ── 동사 SM-2 진행 상태 ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verb_progress (
  user_id        UUID NOT NULL,
  verb_id        UUID NOT NULL REFERENCES verbs(id) ON DELETE CASCADE,
  easiness       FLOAT NOT NULL DEFAULT 2.5,
  interval       INT NOT NULL DEFAULT 1,
  repetitions    INT NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, verb_id)
);

-- ── 데일리 미션 ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_missions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  date         DATE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('correct_count', 'combo_streak', 'question_count')),
  target       INT NOT NULL,
  progress     INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, date, type)
);

-- ── 인덱스 ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS verb_forms_verb_id_idx ON verb_forms(verb_id);
CREATE INDEX IF NOT EXISTS verb_progress_next_review_idx ON verb_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS daily_missions_user_date_idx ON daily_missions(user_id, date);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE verbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verb_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE verb_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

-- verbs / verb_forms: 누구나 읽기 가능 (공개 어휘 데이터)
CREATE POLICY "verbs_select_all" ON verbs FOR SELECT USING (true);
CREATE POLICY "verb_forms_select_all" ON verb_forms FOR SELECT USING (true);

-- verb_progress: 자신의 데이터만 접근
CREATE POLICY "verb_progress_own" ON verb_progress
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- daily_missions: 자신의 데이터만 접근
CREATE POLICY "daily_missions_own" ON daily_missions
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
