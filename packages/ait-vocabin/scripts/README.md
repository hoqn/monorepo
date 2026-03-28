# 데이터 파이프라인

독일어 단어 데이터를 수집·가공해 DB에 적재하는 스크립트 모음.

## 파이프라인 흐름

```
01-fetch-goethe.ts     Goethe-Institut 단어 목록 (CEFR A1-B1) 파싱
        ↓
02-enrich-wiktionary.ts  독일어 Wiktionary 덤프에서 성/복수형/IPA 보강
        ↓
03-enrich-krdict.ts    krdict API로 한국어 뜻 매핑
        ↓
04-classify-category.ts  AI로 카테고리 자동 분류 후 검수
        ↓
05-seed-db.ts          DB 적재 (초기 배치)
```

## 현재 상태

- [ ] 01-fetch-goethe.ts
- [ ] 02-enrich-wiktionary.ts
- [ ] 03-enrich-krdict.ts
- [ ] 04-classify-category.ts
- [ ] 05-seed-db.ts

## 개발 중에는

`src/data/sample-words.ts`의 샘플 데이터(30단어)를 사용해 UI를 개발한다.
파이프라인은 UI 구현 이후 단계적으로 완성한다.
