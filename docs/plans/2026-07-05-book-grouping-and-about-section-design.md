# 독서노트 책별 그룹핑 + 홈 자기소개 섹션 설계

## 배경

블로그 디자인 리뷰 세션 중 사용자가 두 가지 기능을 요청:
1. "토픽별로 따로 모아서 보는 기능" — 구체적으로는 `독서노트` 카테고리 안에서 어떤 책에 대한 글인지로 묶어서 보고 싶다는 것.
2. GitHub README 스타일의 자기소개를 홈 화면에 넣고 싶다는 것.

## 기능 1 — 독서노트 카테고리 책별 그룹핑

### 데이터 모델

새 필드를 추가하지 않고 기존 필드를 그대로 재사용한다.

- `series`: 책 제목을 값으로 사용 (예: `"클린 코드"`)
- `order`: 그 책에 대한 글의 순서(장 번호 등)

`series`는 이미 "여러 포스트를 하나의 그룹으로 묶고 회차 순서를 매기는" 용도로 홈 화면(실험 시리즈)에 쓰이고 있으므로, `독서노트` 카테고리에서 책 단위로 묶는 데도 동일한 의미로 맞아떨어진다. `series`가 없는 글(단발성 학습정리 등)은 기존 로직대로 개별 항목으로 표시된다.

### 구현

`src/app/categories/[category]/page.tsx`는 현재 날짜순으로 정렬한 flat 리스트를 `PostRow`로만 나열한다. 이를 홈 화면(`src/app/page.tsx`)과 동일한 패턴으로 바꾼다:

1. `getPostsByCategory()`로 필터링된 posts를 `groupPostsBySeries()`에 통과시킨다.
2. 각 그룹을 `SeriesHeader` + `PostRow`(`showEpisode` 기본값, 즉 표시)로 렌더링한다.
3. 그룹 정렬은 `groupPostsBySeries()`가 이미 처리하는 `latestDate` 내림차순을 그대로 따른다.

새로 작성할 코드는 없고, 기존 `lib/posts.ts`의 `groupPostsBySeries()`와 `SeriesHeader`/`PostRow` 컴포넌트를 카테고리 페이지에서도 재사용하는 것이 전부다. 리스크가 낮다.

### 범위 밖

- 특정 책만 골라 보는 별도 필터 페이지(예: `/series/[series]/`)는 이번 범위에 포함하지 않는다 — 한 카테고리 페이지 안에서 책별로 묶어 보여주는 것으로 충분하다는 확인을 받음.
- `독서노트`를 제외한 다른 카테고리(학습정리, 질문)에 대한 계층 구조는 다루지 않는다.

## 기능 2 — 홈 화면 자기소개 섹션

### 콘텐츠 소스

`/Users/mando/blog-drafts/about.md` — frontmatter 없는 순수 마크다운 파일. 포스트 파이프라인과 완전히 분리된 별도 파일로 관리한다.

### 동기화

`scripts/sync-content.sh`는 현재 `blog-drafts/*.md`를 전부 `posts/`로 복사하는데, 이 방식 그대로면 `about.md`가 `getAllPosts()`에 걸려 포스트로 취급되거나(필수 frontmatter 누락으로 빌드 에러) 글 목록에 잘못 노출된다.

`about.md`만 별도 경로로 동기화하도록 스크립트에 전용 복사 라인을 추가한다:

```bash
# posts/*.md 복사 로직과 별개로
if [ -f "$DRAFTS_DIR/about.md" ]; then
  mkdir -p content
  cp "$DRAFTS_DIR/about.md" content/about.md
fi
```

`content/about.md`는 `posts/`와 마찬가지로 git에 커밋하지 않는다(`.gitignore` 대상).

### 읽기 & 렌더링

- `src/lib/about.ts`(신규, 작은 헬퍼): `content/about.md`가 존재하면 raw 마크다운 문자열을 반환하고, 없으면 `null`을 반환한다.
- `src/app/page.tsx` 최상단, `<h1>기술 블로그</h1>` 바로 아래·시리즈 목록 위에 about 콘텐츠가 있을 때만 `<MarkdownRenderer content={about} />`를 렌더링하고, 아래에 `hairline` 구분선을 둔다.
- `about.md`가 없는 경우(예: 최초 배포, 아직 작성 전) 섹션 자체를 조용히 생략한다 — 에러를 던지지 않는다.

### 테스트

- `src/lib/about.test.ts`(신규): 파일이 있을 때 내용을 반환하는 케이스, 파일이 없을 때 `null`을 반환하는 케이스 2개를 vitest로 검증.
- 홈 화면 렌더링 자체는 기존처럼 수동 스크린샷 확인(Playwright)으로 검증한다.

## 영향받는 파일 요약

- `src/app/categories/[category]/page.tsx` — 수정 (그룹핑 렌더링으로 교체)
- `scripts/sync-content.sh` — 수정 (about.md 전용 복사 추가)
- `src/lib/about.ts` — 신규
- `src/lib/about.test.ts` — 신규
- `src/app/page.tsx` — 수정 (about 섹션 삽입)
- `blog-drafts/about.md` — 신규 (사용자가 직접 내용 작성)
