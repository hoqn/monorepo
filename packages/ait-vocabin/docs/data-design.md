# 데이터 설계서

> 작성일: 2026-03-21
> 상태: 초안

---

## 1. 단어 데이터 파이프라인

### 소스 조합

| 필드 | 소스 |
|------|------|
| 단어 목록 + CEFR 레벨 | Goethe-Institut 단어 목록 (A1–B1) |
| 성 / 복수형 / IPA | 독일어 Wiktionary 덤프 (de.wiktionary.org) |
| 한국어 뜻 | krdict API (국립국어원 한국-독일어 사전) |
| 카테고리 | AI 자동 분류 후 수동 검수 |

### 파이프라인 흐름

```
Goethe 단어 목록 (기준 단어 선정 + CEFR)
    ↓
독일어 Wiktionary 덤프 매핑 (성/복수형/IPA 보강)
    ↓
krdict API 매핑 (한국어 뜻)
    ↓  크리딕트 미매핑 단어: AI 생성 + 검수
AI 분류 (카테고리) + 수동 검수
    ↓
DB 적재 (초기 배치)
    ↓
이후 incremental 업데이트
```

### 초기 목표 규모

- MVP: A1 (~600단어) + A2 (~900단어) = 약 1,500단어 (명사 위주)
- 이후: B1 추가, 동사/형용사 확장

---

## 2. DB 스키마

### 2-1. `words` — 단어 데이터

```sql
words
├── id              UUID        PK
├── word            TEXT        독일어 단어 (예: Hund)
├── article         ENUM        성: der / die / das
├── plural          TEXT        복수형 (예: Hunde)
├── meaning_ko      TEXT        한국어 뜻 (예: 개)
├── ipa             TEXT        발음 기호 (예: /hʊnt/)
├── cefr_level      ENUM        A1 / A2 / B1 / B2
├── category        TEXT        카테고리 (예: 동물, 음식, 여행 …)
├── example_sentence TEXT       예문 (MVP 이후 추가)
├── etymology_hint  TEXT        어원/어근 힌트 (MVP 이후 추가)
└── created_at      TIMESTAMP
```

### 2-2. `user_word_progress` — 사용자별 단어 학습 진행 (SM-2)

```sql
user_word_progress
├── id              UUID        PK
├── user_id         TEXT        토스 계정 ID
├── word_id         UUID        FK → words.id
├── easiness        FLOAT       SM-2 난이도 계수 (초기값: 2.5)
├── interval        INT         다음 복습까지 일수
├── repetitions     INT         복습 횟수
├── next_review_at  DATE        다음 복습 예정일
├── last_reviewed_at TIMESTAMP  마지막 복습 일시
└── UNIQUE (user_id, word_id)
```

### 2-3. `sessions` — 세션 기록

```sql
sessions
├── id              UUID        PK
├── user_id         TEXT
├── started_at      TIMESTAMP
├── ended_at        TIMESTAMP
├── total_questions INT         총 문항 수
├── correct_count   INT         정답 수
├── xp_earned       INT         획득 XP
├── is_recovery     BOOLEAN     복습 서브세션 여부
└── status          ENUM        completed / abandoned
```

### 2-4. `session_words` — 세션 내 단어별 결과

```sql
session_words
├── id              UUID        PK
├── session_id      UUID        FK → sessions.id
├── word_id         UUID        FK → words.id
├── question_type   ENUM        article / plural  (성 퀴즈 / 복수형 퀴즈)
├── is_correct      BOOLEAN
└── answered_at     TIMESTAMP
```

### 2-5. `user_badges` — 배지 획득 내역

```sql
user_badges
├── id              UUID        PK
├── user_id         TEXT
├── badge_id        TEXT        배지 식별자 (예: first_session, streak_7 …)
├── earned_at       TIMESTAMP
└── UNIQUE (user_id, badge_id)
```

### 2-6. `weekly_xp` — 주간 XP 집계 (리더보드용)

```sql
weekly_xp
├── id              UUID        PK
├── user_id         TEXT
├── week_start      DATE        주 시작일 (월요일 기준)
├── xp_total        INT         해당 주 누적 XP
└── UNIQUE (user_id, week_start)
```

> 매주 월요일 배치로 전주 데이터 집계 및 신규 주 레코드 생성.
> 리더보드 쿼리: `WHERE week_start = 이번주 월요일 ORDER BY xp_total DESC`

### 2-7. `users` — 사용자 프로필

```sql
users
├── id              TEXT        PK (토스 계정 ID)
├── display_name    TEXT
├── level           INT         현재 레벨 (초기값: 1)
├── total_xp        INT         누적 XP
├── current_streak  INT         현재 스트릭 일수
├── max_streak      INT         최장 스트릭 기록
├── last_active_date DATE       스트릭 계산용 마지막 활동일
├── cefr_level      ENUM        A1 / A2 / B1  (온보딩 진단 결과)
├── notify_time     ENUM        dawn / morning / lunch / afternoon / evening / night
├── created_at      TIMESTAMP
└── updated_at      TIMESTAMP
```

---

## 3. 주요 쿼리 패턴

### 오늘 복습할 단어 목록

```sql
SELECT w.*
FROM user_word_progress uwp
JOIN words w ON uwp.word_id = w.id
WHERE uwp.user_id = :userId
  AND uwp.next_review_at <= CURRENT_DATE
ORDER BY uwp.next_review_at ASC
LIMIT 15;
```

### 이번 주 리더보드

```sql
SELECT u.display_name, wx.xp_total
FROM weekly_xp wx
JOIN users u ON wx.user_id = u.id
WHERE wx.week_start = :thisMonday
ORDER BY wx.xp_total DESC
LIMIT 100;
```

### 스트릭 업데이트 (세션 완료 시)

```sql
UPDATE users
SET
  current_streak = CASE
    WHEN last_active_date = CURRENT_DATE - 1 THEN current_streak + 1
    WHEN last_active_date = CURRENT_DATE THEN current_streak
    ELSE 1
  END,
  max_streak = GREATEST(max_streak, current_streak),
  last_active_date = CURRENT_DATE
WHERE id = :userId;
```

---

## 4. 미결 사항

- [ ] DB 엔진 선택 (PostgreSQL 권장, 앱인토스 인프라 확인 필요)
- [ ] weekly_xp 배치 스케줄러 구현 방식
- [ ] 단어 카테고리 목록 확정 (AI 분류 후 검수)
- [ ] CEFR 레벨별 단어 비율 (세션 내 A1:A2 비율 등)
- [ ] 신규 단어 vs 복습 단어 세션 내 비율
