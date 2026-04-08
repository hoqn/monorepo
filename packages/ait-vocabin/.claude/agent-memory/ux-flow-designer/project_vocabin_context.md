---
name: VocaBin 프로젝트 컨텍스트
description: VocaBin 앱의 핵심 도메인, 기술 스택, 기존 화면 구조 요약
type: project
---

VocaBin은 독일어 단어를 게임화 방식으로 학습하는 모바일 앱이다 (Toss 앱 내 미니앱).

**핵심 게임 메카닉:**
- SM-2 스페이스드 리피티션으로 단어 복습 스케줄링
- 퀴즈 타입: 명사 관사 맞추기 (der/die/das), 복수형 맞추기
- 목숨(lives) 시스템: 세션당 MAX 5개, 오답 시 감소
- 게임화 요소: XP/레벨 (XP_PER_LEVEL=500), 스트릭, 배지, 주간 리더보드
- 세션: 12문제, 오답 시 목숨 감소, 목숨 0이면 recovery 플로우

**기술 스택:**
- React 18 + TypeScript + Vite
- React Router v7 (BrowserRouter)
- CSS Modules + CSS Variables
- @apps-in-toss/web-framework (appLogin, generateHapticFeedback)
- TDS Mobile (Toss Design System)

**현재 라우트 구조:**
- `/onboarding` — 4단계 마법사 (소개→진단→목표→알림)
- `/home` — 대시보드
- `/session` — 퀴즈 세션
- `/session/result` — 세션 결과
- `/session/recovery` — 실패 복구 (광고 시청)
- `/leaderboard` — 주간 랭킹
- `/profile` — 사용자 스탯/배지/설정

**인증:** Toss appLogin 기반, 토큰을 로컬에 저장. 온보딩 완료 여부는 localStorage `vocabin_onboarding_done`으로 관리.

**Why:** 재설계 시 기존 라우트/인증 구조는 유지해야 함 (Toss 프레임워크 의존). 화면 수, 컴포넌트 구조, 인터랙션 방식은 자유롭게 변경 가능.

**How to apply:** 새 UX 설계에서 라우트 경로 변경 제안 시, 기존 경로와의 호환 또는 마이그레이션 방법을 함께 제시할 것.
