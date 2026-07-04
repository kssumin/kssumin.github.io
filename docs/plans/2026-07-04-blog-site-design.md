# 블로그 사이트 설계 (v2 — 별도 저장소)

## 배경

당초 `kmando01/tech-blog` 안에 사이트 코드를 통합할 계획이었으나, tech-blog는 실험 기록 전용 저장소로 그대로 두고 싶다는 요청에 따라 **완전히 별도의 저장소** `kmando01/kmando01.github.io`(GitHub 유저 페이지, public)에 블로그 사이트를 새로 만든다.

- `kmando01/tech-blog`: 원본 실험 기록 저장소. **수정하지 않음.** 이 프로젝트의 "소스"로만 읽는다.
- `kmando01/kmando01.github.io`: 새 블로그 사이트. tech-blog의 포스트 11개를 복사해와 frontmatter를 붙이고 렌더링한다. 주소는 `https://kmando01.github.io` (커스텀 도메인은 아직 없음 — 나중에 도메인을 구매하면 CNAME으로 붙이는 것을 후속 작업으로 남겨둔다).

핵심 요구사항:
- 가독성 최우선
- 날짜(작성일 등 구체적인 날짜)는 화면에 노출하지 않음
- 참고 사이트 [geongyu09/geongyu09.github.io](https://github.com/geongyu09/geongyu09.github.io)의 **비주얼 디자인**을 최대한 참고 (색상/타이포/여백/구분선 시스템)
- 시리즈 그룹핑 + 기술 태그(Java/MongoDB/Redis/Spring) 필터를 모두 지원

## 1. 저장소 구조

```
kmando01.github.io/
├── posts/                         # tech-blog에서 복사 + frontmatter 추가 (11개)
├── src/
│   ├── app/
│   │   ├── page.tsx               # 홈: 시리즈별 목록
│   │   ├── posts/[slug]/page.tsx  # 글 상세
│   │   ├── tags/[tag]/page.tsx    # 태그별 목록
│   │   └── layout.tsx
│   ├── components/
│   │   ├── SeriesHeader.tsx       # 시리즈 제목 + hairline rule
│   │   ├── PostRow.tsx            # EP.01 mono 컬럼 + 제목/설명 (날짜 없음)
│   │   ├── TagChip.tsx
│   │   └── MarkdownRenderer.tsx
│   └── lib/
│       └── posts.ts               # gray-matter 파싱 + 시리즈/태그 로직
├── next.config.mjs                # output:'export' (유저 페이지라 basePath 불필요)
└── package.json
```

## 2. 콘텐츠 임포트 전략

`tech-blog/posts/*.md` 11개 파일을 **복사**해온다 (원본은 건드리지 않음). 복사한 파일에:
- frontmatter 추가: `title`, `date`(정렬 전용, 미노출), `series`, `order`, `description`, `tags`(배열)
- 본문 첫머리의 `> **실험일**: ... | 시리즈: ... #N` 블록인용문 제거 (정보가 frontmatter로 이동). 날짜가 아닌 실험 조건(JDK 버전 등)은 본문에 유지.

시리즈는 3개(README 기준 2개 + 조사 중 발견한 `MongoDB 실증 실험` 1개), 태그는 4개(Java/Redis/MongoDB/Spring)로 시리즈와 별도 축으로 관리한다. 정확한 매핑은 구현 계획 문서의 표를 참조.

## 3. 비주얼 디자인 — 참고 사이트의 "Editorial" 시스템 반영

참고 사이트 컴포넌트 코드를 직접 확인해 아래 토큰/패턴을 그대로 가져온다:

- **폰트**: Pretendard Variable(본문, CDN), JetBrains Mono(캡션/eyebrow/EP 배지)
- **컬러**: 중립 회색 12단계(`ink-0`~`ink-950`) + 블루 액센트 1개(`blue-600`). 다크모드는 이번 범위에서 제외(라이트 전용).
- **타이포 스케일**: h1 46px / h2 30px / h3 22px / body 19px / sm 16px / caption 13px, 자간 미세하게 좁힘, 줄간격 넉넉하게(본문 1.75)
- **spacing 스케일**: `s-1`(4px) ~ `s-8`(64px)
- **레이아웃**: 리스트는 좌측 mono 컬럼 + 우측 제목/설명 그리드. 원래 날짜가 있던 좌측 컬럼 자리는 **시리즈 내 회차 배지("EP.01")**로 대체 — 날짜는 절대 노출하지 않되 참고 사이트의 그리드 리듬은 유지.
- **구분선**: 시리즈 섹션 시작은 `ds-section-rule`(1px, ink-950), 리스트 아이템 사이는 hairline(1px, ink-200)
- **본문 폭**: 상세 페이지 본문은 720~860px로 제한

참고 사이트에 있는 giscus 댓글, RSS, github 잔디, 다크모드, SideTableOfContent, 페이지 전환 애니메이션(ssgoi)은 이번 범위에서 제외 — 순수 비주얼 디자인 언어(컬러/타이포/스페이싱/그리드)만 가져온다.

## 4. 배포

`next build` → static export → `gh-pages` 브랜치 (유저 페이지라 `basePath` 없이 루트로 나감). GitHub Pages 소스를 `gh-pages` 브랜치로 지정하면 `https://kmando01.github.io`로 바로 공개된다. 커스텀 도메인은 나중에 구매하면 `public/CNAME` 파일 추가 + DNS 설정으로 연결(이번 계획 범위 밖, 후속 작업으로 남김).
