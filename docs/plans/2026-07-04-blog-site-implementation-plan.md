# 블로그 사이트 구현 계획 (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** `kmando01/kmando01.github.io` 저장소에 Next.js 블로그 사이트를 새로 만들어, `kmando01/tech-blog`의 포스트 11개를 복사해 시리즈별·태그별로 읽기 좋게 보여주고 GitHub Pages로 배포한다. `tech-blog`는 절대 수정하지 않는다.

**Architecture:** tech-blog의 원본 md를 복사해 frontmatter(title/date/series/order/description/tags)를 붙인다. `lib/posts.ts`가 gray-matter로 파싱하고 시리즈 그룹핑·태그 필터·이전/다음 글 탐색을 담당한다. App Router 서버 컴포넌트가 이를 읽어 홈(시리즈별 목록), 상세 페이지, 태그 페이지를 렌더링한다. 날짜는 정렬에만 쓰이고 화면에는 절대 출력하지 않는다. 비주얼 디자인은 참고 사이트(geongyu09.github.io)의 컬러/타이포/스페이싱 토큰을 그대로 가져오되, 원래 날짜가 있던 리스트의 좌측 mono 컬럼은 "EP.01" 형태의 시리즈 회차 배지로 대체한다.

**Tech Stack:** Next.js(App Router) + gray-matter + unified/remark/rehype(rehype-pretty-code+shiki 코드 하이라이팅) + Tailwind CSS(커스텀 디자인 토큰, typography 플러그인 미사용) + vitest(순수 로직 단위 테스트) + gh-pages(배포).

참고 설계 문서: `docs/plans/2026-07-04-blog-site-design.md`

---

## 사전 확인된 사실

- 작업 디렉터리는 `/Users/mando/kmando01.github.io` (새 git repo, origin: `kmando01/kmando01.github.io`, GitHub에 이미 public repo로 생성 완료, 로컬은 아직 커밋 없음).
- 원본 콘텐츠는 `/Users/mando/tech-blog/posts/*.md` 11개 — **읽기 전용으로만 참조**, 절대 수정하지 않는다.
- 포스트에는 frontmatter가 없다. 첫 줄이 `# 제목`(H1), 세 번째 줄이 `> **실험일**: ... | ... | **시리즈**: ... #N` 형태의 블록인용문이다.
- 시리즈는 3개, 태그는 4개(Java/Redis/MongoDB/Spring)이며 시리즈와 태그는 서로 다른 축이다.
- 참고 사이트의 디자인 토큰(색상/폰트/스페이싱/타이포 스케일)은 설계 문서 3절에 정리되어 있다.

### 콘텐츠 매핑 표 (전체 11개)

| slug (원본 파일명에서 확장자 제외) | title | series | order | date | tags | description |
|---|---|---|---|---|---|---|
| virtual-threads-nmt | 가상 스레드 10,000개의 OS 스레드는 몇 개인가 | JVM 가상 스레드 실증 실험 | 1 | 2026-06-18 | [Java] | OS 스레드 38배 절약, per-thread 78배 경량 |
| virtual-threads-hikaricp | 가상 스레드 400개를 켰을 때 p99에 무슨 일이 생기는가 | JVM 가상 스레드 실증 실험 | 2 | 2026-06-29 | [Java] | 커넥션 풀이 새 천장, p50은 거짓말한다 |
| virtual-threads-pinning | JEP 491이 고친 것과 고치지 못한 것 | JVM 가상 스레드 실증 실험 | 3 | 2026-06-29 | [Java] | synchronized 해결, JNI pinning은 JDK 25에서도 잔존 |
| virtual-threads-memory | 가상 스레드 10만 개를 띄우기 전에 계산해야 할 두 가지 | JVM 가상 스레드 실증 실험 | 4 | 2026-06-29 | [Java] | Continuation 힙 비용, ThreadLocal × vthread = OOM |
| redis-distributed-lock | Redis 분산락을 달았더니 처리량이 16배 떨어졌다 | 분산 시스템 실증 실험 | 1 | 2026-06-29 | [Redis] | 수학적 TPS 상한, writeConflict 제거의 역설 |
| mongodb-replace-vs-set | MongoDB replaceOne vs $set: 예측이 두 번 빗나갔다 | 분산 시스템 실증 실험 | 2 | 2026-06-29 | [MongoDB] | dirty bytes 1.9x(예측 33x), oplog 175x(예측 33x), 8.0 버전 주의사항 |
| mongodb-hot-document | 핫 도큐먼트는 자기만 느린 게 아니다 | 분산 시스템 실증 실험 | 3 | 2026-06-29 | [MongoDB] | cold worker -55% 피해, write ticket pool 인질 |
| mongodb-full-replace-replication | MongoDB replaceOne이 secondary를 '멈춘다'는 말은 절반만 맞다 | 분산 시스템 실증 실험 | 4 | 2026-06-29 | [MongoDB] | 공식 문서 5개 검증 — snapshot reads, oplog bloat, 8.0 변경사항 |
| mongodb-write-payload-dual-failure | MongoDB가 동시에 두 곳에서 무너지는 이유 | 분산 시스템 실증 실험 | 5 | 2026-06-30 | [MongoDB] | payload size가 WiredTiger dirty eviction과 chained applyOps를 동시에 압박하는 단일 변수 |
| mongodb-readonly-tx-silent-override | `@Transactional(readOnly = true)`가 MongoDB read replica 부하 분산을 조용히 망가뜨린다 | MongoDB 실증 실험 | 1 | 2026-06-29 | [MongoDB, Spring] | @Transactional(readOnly=true)가 MongoDB read replica 부하 분산을 조용히 망가뜨리는 원인 분석 |
| mongo-secondary-read-annotation | MongoDB secondary read 라우팅이 조용히 깨지는 이유 — @MongoSecondaryRead 로 봉인하기 | MongoDB 실증 실험 | 2 | 2026-06-29 | [MongoDB, Spring] | secondaryPreferred가 조용히 무시되는 원인과 @MongoSecondaryRead로 봉인하는 방법 |

원본 파일 경로는 `/Users/mando/tech-blog/posts/<date-prefix>-<slug>.md` (예: `2026-06-18-virtual-threads-nmt.md`). 새 저장소의 파일명은 날짜 접두어 없이 `<slug>.md`로 복사한다 (파일명에도 날짜를 남기지 않기 위함).

---

## Task 1: 프로젝트 스캐폴딩 & 의존성 설치

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `postcss.config.mjs`

**Step 1: package.json**

```json
{
  "name": "kmando01.github.io",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "deploy": "NEXT_PUBLIC_ENVIRONMENT=PRODUCTION next build && touch out/.nojekyll && npx gh-pages -d out --dotfiles"
  },
  "dependencies": {
    "next": "^15.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "gray-matter": "^4.0.3",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-rehype": "^11.1.2",
    "rehype-pretty-code": "^0.14.3",
    "rehype-react": "^8.0.0",
    "shiki": "^1.24.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.20",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5",
    "gh-pages": "^6.1.1",
    "vitest": "^2.1.4"
  }
}
```

**Step 2: 설치**

Run: `cd /Users/mando/kmando01.github.io && npm install`
Expected: 에러 없이 `node_modules/`, `package-lock.json` 생성

**Step 3: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: next.config.mjs** (유저 페이지 루트 배포 — basePath 불필요)

```js
/** @type {import('next').NextConfig} */
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'PRODUCTION';

const nextConfig = {
  trailingSlash: true,
  ...(isProd
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
```

**Step 5: postcss.config.mjs**

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};

export default config;
```

**Step 6: .gitignore**

```
node_modules
.next
out
.env*.local
next-env.d.ts
```

**Step 7: 커밋**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs .gitignore
git commit -m "chore: scaffold Next.js project for blog site"
```

---

## Task 2: 디자인 토큰 (tailwind.config.ts + globals.css)

참고 사이트의 Editorial 디자인 시스템에서 색상/폰트/스페이싱/타이포 스케일을 가져온다. 다크모드는 제외(라이트 전용, 고정 hex 값 사용).

**Files:**
- Create: `tailwind.config.ts`
- Create: `src/app/globals.css`

**Step 1: tailwind.config.ts**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f4',
          200: '#e8e8e8',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        blue: {
          50: '#e8eeff',
          600: '#2c5eff',
          800: '#1f43c2',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        h1: ['46px', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        h2: ['30px', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        h3: ['22px', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        lead: ['20px', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        body: ['19px', { lineHeight: '1.75', letterSpacing: '-0.005em' }],
        sm: ['16px', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        caption: ['13px', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        code: ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
      },
      spacing: {
        's-1': '4px',
        's-2': '8px',
        's-3': '12px',
        's-4': '16px',
        's-5': '24px',
        's-6': '32px',
        's-7': '48px',
        's-8': '64px',
      },
      maxWidth: {
        reading: '720px',
        article: '860px',
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: `src/app/globals.css`**

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendard-variable.min.css');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont,
    'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace;
}

@layer base {
  html {
    font-family: var(--font-sans);
    font-size: 18px;
    color: theme('colors.ink.950');
    background-color: theme('colors.ink.0');
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
  }
}

@layer utilities {
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: theme('colors.ink.500');
  }
  .section-rule {
    border-top: 1px solid theme('colors.ink.950');
  }
  .hairline {
    border-top: 1px solid theme('colors.ink.200');
  }
}
```

**Step 3: 커밋**

```bash
git add tailwind.config.ts src/app/globals.css
git commit -m "feat: add editorial design tokens (colors, type scale, spacing)"
```

---

## Task 3: `lib/posts.ts` — 시리즈 그룹핑 + 태그 로직 (TDD)

**Files:**
- Create: `src/lib/posts.ts`
- Test: `src/lib/posts.test.ts`

**Step 1: 실패하는 테스트 작성**

`src/lib/posts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { groupPostsBySeries, getAdjacentPosts, getAllTags, getPostsByTag, type PostMeta } from './posts';

const post = (overrides: Partial<PostMeta>): PostMeta => ({
  slug: 'slug',
  title: 'title',
  description: '',
  series: null,
  order: 0,
  date: '2026-01-01',
  tags: [],
  ...overrides,
});

describe('groupPostsBySeries', () => {
  it('시리즈가 있는 글은 order 오름차순으로 정렬한다', () => {
    const posts = [
      post({ slug: 'b', series: 'S', order: 2, date: '2026-06-02' }),
      post({ slug: 'a', series: 'S', order: 1, date: '2026-06-01' }),
    ];
    const [group] = groupPostsBySeries(posts);
    expect(group.posts.map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('그룹 간 배치는 시리즈 내 가장 최근 date 기준 내림차순이다', () => {
    const posts = [
      post({ slug: 'old-1', series: 'OLD', order: 1, date: '2026-01-01' }),
      post({ slug: 'new-1', series: 'NEW', order: 1, date: '2026-06-01' }),
    ];
    const groups = groupPostsBySeries(posts);
    expect(groups[0].series).toBe('NEW');
    expect(groups[1].series).toBe('OLD');
  });
});

describe('getAdjacentPosts', () => {
  const posts = [
    post({ slug: 'a', series: 'S', order: 1 }),
    post({ slug: 'b', series: 'S', order: 2 }),
    post({ slug: 'c', series: 'S', order: 3 }),
  ];

  it('중간 글은 prev/next가 모두 있다', () => {
    const { prev, next } = getAdjacentPosts('b', posts);
    expect(prev?.slug).toBe('a');
    expect(next?.slug).toBe('c');
  });

  it('첫 글은 prev가 없다', () => {
    expect(getAdjacentPosts('a', posts).prev).toBeNull();
  });
});

describe('tags', () => {
  const posts = [
    post({ slug: 'a', tags: ['Java'] }),
    post({ slug: 'b', tags: ['MongoDB', 'Spring'] }),
    post({ slug: 'c', tags: ['MongoDB'] }),
  ];

  it('getAllTags는 중복 없이 등장한 모든 태그를 반환한다', () => {
    expect(getAllTags(posts).sort()).toEqual(['Java', 'MongoDB', 'Spring']);
  });

  it('getPostsByTag는 해당 태그를 가진 글만 반환한다', () => {
    const result = getPostsByTag(posts, 'MongoDB');
    expect(result.map((p) => p.slug).sort()).toEqual(['b', 'c']);
  });

  it('존재하지 않는 태그는 빈 배열을 반환한다', () => {
    expect(getPostsByTag(posts, 'Kotlin')).toEqual([]);
  });
});
```

**Step 2: 테스트 실행 → 실패 확인**

Run: `npx vitest run src/lib/posts.test.ts`
Expected: FAIL — `Cannot find module './posts'`

**Step 3: `src/lib/posts.ts` 구현**

```ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const POSTS_DIR = path.join(process.cwd(), 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  series: string | null;
  order: number;
  date: string;
  tags: string[];
}

export interface Post extends PostMeta {
  content: string;
}

function readPostFile(filename: string): Post {
  const slug = filename.replace(/\.md$/, '');
  const fullPath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title,
    description: data.description ?? '',
    series: data.series ?? null,
    order: data.order ?? 0,
    date: data.date,
    tags: data.tags ?? [],
    content,
  };
}

export function getAllPosts(): Post[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map(readPostFile);
}

export function getPostBySlug(slug: string): Post {
  return readPostFile(`${slug}.md`);
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}

export interface SeriesGroup {
  series: string | null;
  posts: PostMeta[];
  latestDate: string;
}

export function groupPostsBySeries(posts: PostMeta[]): SeriesGroup[] {
  const groups = new Map<string, PostMeta[]>();

  for (const p of posts) {
    const key = p.series ?? `__solo__${p.slug}`;
    const existing = groups.get(key) ?? [];
    existing.push(p);
    groups.set(key, existing);
  }

  const result: SeriesGroup[] = [];
  for (const groupPosts of groups.values()) {
    const sorted = [...groupPosts].sort((a, b) => a.order - b.order);
    const latestDate = groupPosts.reduce(
      (latest, p) => (p.date > latest ? p.date : latest),
      groupPosts[0].date
    );
    result.push({ series: sorted[0].series, posts: sorted, latestDate });
  }

  return result.sort((a, b) => (a.latestDate > b.latestDate ? -1 : 1));
}

export function getAdjacentPosts(
  slug: string,
  allPosts: PostMeta[]
): { prev: PostMeta | null; next: PostMeta | null } {
  const current = allPosts.find((p) => p.slug === slug);
  if (!current || !current.series) return { prev: null, next: null };

  const seriesPosts = allPosts
    .filter((p) => p.series === current.series)
    .sort((a, b) => a.order - b.order);

  const index = seriesPosts.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? seriesPosts[index - 1] : null,
    next: index < seriesPosts.length - 1 ? seriesPosts[index + 1] : null,
  };
}

export function getAllTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  for (const p of posts) {
    for (const t of p.tags) tags.add(t);
  }
  return [...tags];
}

export function getPostsByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter((p) => p.tags.includes(tag));
}
```

**Step 4: 테스트 실행 → 통과 확인**

Run: `npx vitest run src/lib/posts.test.ts`
Expected: PASS — 8개 테스트 모두 통과

**Step 5: 커밋**

```bash
git add src/lib/posts.ts src/lib/posts.test.ts
git commit -m "feat: add posts data layer with series grouping and tag filtering"
```

---

## Task 4: tech-blog에서 콘텐츠 복사 + frontmatter 추가

**Files:**
- Create: `posts/virtual-threads-nmt.md` ~ `posts/mongo-secondary-read-annotation.md` (11개, tech-blog에서 복사)

**Step 1: 원본 복사 (날짜 접두어 없이)**

```bash
cd /Users/mando/kmando01.github.io
mkdir -p posts
cp /Users/mando/tech-blog/posts/2026-06-18-virtual-threads-nmt.md posts/virtual-threads-nmt.md
cp /Users/mando/tech-blog/posts/2026-06-29-virtual-threads-hikaricp.md posts/virtual-threads-hikaricp.md
cp /Users/mando/tech-blog/posts/2026-06-29-virtual-threads-pinning.md posts/virtual-threads-pinning.md
cp /Users/mando/tech-blog/posts/2026-06-29-virtual-threads-memory.md posts/virtual-threads-memory.md
cp /Users/mando/tech-blog/posts/2026-06-29-redis-distributed-lock.md posts/redis-distributed-lock.md
cp /Users/mando/tech-blog/posts/2026-06-29-mongodb-replace-vs-set.md posts/mongodb-replace-vs-set.md
cp /Users/mando/tech-blog/posts/2026-06-29-mongodb-hot-document.md posts/mongodb-hot-document.md
cp /Users/mando/tech-blog/posts/2026-06-29-mongodb-full-replace-replication.md posts/mongodb-full-replace-replication.md
cp /Users/mando/tech-blog/posts/2026-06-30-mongodb-write-payload-dual-failure.md posts/mongodb-write-payload-dual-failure.md
cp /Users/mando/tech-blog/posts/2026-06-29-mongodb-readonly-tx-silent-override.md posts/mongodb-readonly-tx-silent-override.md
cp /Users/mando/tech-blog/posts/2026-06-29-mongo-secondary-read-annotation.md posts/mongo-secondary-read-annotation.md
```

Expected: `posts/`에 파일 11개 생성. `ls posts | wc -l` → `11`

**Step 2: 각 파일에 frontmatter 삽입 + 블록인용문 삭제**

이 계획 상단 "콘텐츠 매핑 표"의 값을 그대로 사용해 각 파일 맨 앞에 삽입한다 (Edit 도구로 11회 반복). 형식:

```yaml
---
title: "<표의 title>"
date: "<표의 date>"
series: "<표의 series>"
order: <표의 order>
tags: [<표의 tags, 쉼표구분 문자열로 각각 큰따옴표>]
description: "<표의 description>"
---
```

예시 (`posts/virtual-threads-nmt.md`):

변경 전:
```
# 가상 스레드 10,000개의 OS 스레드는 몇 개인가

> **실험일**: 2026-06-18 | **JDK**: Amazon Corretto 21.0.6 | **시리즈**: JVM 가상 스레드 실증 실험 #1
```

변경 후:
```
---
title: "가상 스레드 10,000개의 OS 스레드는 몇 개인가"
date: "2026-06-18"
series: "JVM 가상 스레드 실증 실험"
order: 1
tags: ["Java"]
description: "OS 스레드 38배 절약, per-thread 78배 경량"
---

# 가상 스레드 10,000개의 OS 스레드는 몇 개인가

**JDK**: Amazon Corretto 21.0.6
```

날짜/시리즈/순번(`#1`)만 제거 대상이고, JDK 버전 같은 실험 조건은 본문에 일반 텍스트로 유지한다. `mongo-secondary-read-annotation.md`, `mongodb-readonly-tx-silent-override.md`는 블록인용문 문구가 `실험일` 대신 `작성일`, `JDK` 대신 `환경`으로 되어 있으니 그대로 반영한다.

**Step 3: 파싱 검증**

Run:
```bash
node -e "
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');
const dir = 'posts';
for (const f of fs.readdirSync(dir)) {
  const { data } = matter(fs.readFileSync(path.join(dir, f), 'utf-8'));
  if (!data.title || !data.date || data.order === undefined || !Array.isArray(data.tags)) {
    console.error('INVALID:', f, data);
    process.exit(1);
  }
}
console.log('all 11 posts have valid frontmatter');
"
```
Expected: `all 11 posts have valid frontmatter`

**Step 4: 커밋**

```bash
git add posts/
git commit -m "content: import 11 posts from tech-blog with frontmatter (series/order/tags)"
```

---

## Task 5: Markdown 렌더러 (코드 하이라이팅)

**Files:**
- Create: `src/components/MarkdownRenderer.tsx`

**Step 1: 구현**

```tsx
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeReact from 'rehype-react';
import * as prod from 'react/jsx-runtime';

export async function MarkdownRenderer({ content }: { content: string }) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePrettyCode, { theme: 'github-light' })
    .use(rehypeReact, {
      Fragment: prod.Fragment,
      jsx: prod.jsx,
      jsxs: prod.jsxs,
    })
    .process(content);

  return (
    <div className="max-w-none text-body [&_h2]:text-h2 [&_h2]:mt-s-7 [&_h2]:mb-s-4 [&_h3]:text-h3 [&_h3]:mt-s-6 [&_h3]:mb-s-3 [&_p]:mb-s-4 [&_pre]:rounded-md [&_pre]:p-s-4 [&_pre]:overflow-x-auto [&_pre]:my-s-5 [&_code]:text-code [&_ul]:list-disc [&_ul]:pl-s-5 [&_ol]:list-decimal [&_ol]:pl-s-5 [&_blockquote]:border-l-2 [&_blockquote]:border-ink-300 [&_blockquote]:pl-s-4 [&_blockquote]:text-ink-600 [&_table]:w-full [&_th]:text-left [&_th]:border-b [&_th]:border-ink-300 [&_th]:pb-s-2 [&_td]:border-b [&_td]:border-ink-100 [&_td]:py-s-2">
      {file.result as React.ReactElement}
    </div>
  );
}
```

**Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: 커밋**

```bash
git add src/components/MarkdownRenderer.tsx
git commit -m "feat: add markdown renderer with syntax highlighting"
```

---

## Task 6: 레이아웃, SeriesHeader/PostRow, 홈 페이지

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/components/SeriesHeader.tsx`
- Create: `src/components/PostRow.tsx`
- Create: `src/components/TagChip.tsx`
- Create: `src/app/page.tsx`

**Step 1: `src/app/layout.tsx`**

```tsx
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'kmando blog',
  description: '실험으로 검증한 기술 이야기를 씁니다.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto max-w-reading px-6 py-s-8">{children}</div>
      </body>
    </html>
  );
}
```

**Step 2: `src/components/TagChip.tsx`**

```tsx
import Link from 'next/link';

export function TagChip({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${tag}/`}
      className="eyebrow rounded-full border border-ink-200 px-s-3 py-1 hover:border-blue-600 hover:text-blue-600"
    >
      #{tag}
    </Link>
  );
}
```

**Step 3: `src/components/PostRow.tsx`** (좌측 mono 컬럼 = EP.01, 날짜 없음)

```tsx
import Link from 'next/link';
import type { PostMeta } from '@/lib/posts';

export function PostRow({ post }: { post: PostMeta }) {
  const episode = post.series ? `EP.${String(post.order).padStart(2, '0')}` : null;

  return (
    <Link
      href={`/posts/${post.slug}/`}
      className="grid grid-cols-[64px_1fr] gap-s-4 py-s-4 hairline group"
    >
      <div className="eyebrow pt-1">{episode}</div>
      <div>
        <h3 className="text-h3 group-hover:text-blue-600 transition-colors mb-1">
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm text-ink-500 mb-s-2">{post.description}</p>
        )}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-caption text-ink-500">
            {post.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

**Step 4: `src/components/SeriesHeader.tsx`**

```tsx
export function SeriesHeader({ series, count }: { series: string | null; count: number }) {
  if (!series) return null;

  return (
    <div className="section-rule pt-s-4 mt-s-7 first:mt-0">
      <h2 className="text-h2 mb-1">{series}</h2>
      <div className="eyebrow">{count} POSTS</div>
    </div>
  );
}
```

**Step 5: `src/app/page.tsx`**

```tsx
import { getAllPosts, groupPostsBySeries } from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export default function HomePage() {
  const posts = getAllPosts();
  const groups = groupPostsBySeries(posts);

  return (
    <main>
      <h1 className="text-h1 mb-2">기술 블로그</h1>
      <p className="text-ink-500 mb-s-8">실험으로 검증한 기술 이야기를 씁니다.</p>

      {groups.map((group) => (
        <section key={group.series ?? group.posts[0].slug}>
          <SeriesHeader series={group.series} count={group.posts.length} />
          <div>
            {group.posts.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
```

**Step 6: 개발 서버로 확인**

Run: `npm run dev` (백그라운드)
Run: `curl -s http://localhost:3000/ | grep -o 'EP\.[0-9][0-9]'`
Expected: `EP.01` 등 회차 배지가 최소 1개 이상 출력

Run: `curl -s http://localhost:3000/ | grep -o '2026-'`
Expected: 아무 출력 없음 (날짜 미노출 확인)

**Step 7: 커밋**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/SeriesHeader.tsx src/components/PostRow.tsx src/components/TagChip.tsx
git commit -m "feat: add home page with series grouping and EP badge (no dates)"
```

---

## Task 7: 포스트 상세 페이지

**Files:**
- Create: `src/app/posts/[slug]/page.tsx`

**Step 1: 구현**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllSlugs, getPostBySlug, getAdjacentPosts } from '@/lib/posts';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { TagChip } from '@/components/TagChip';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const allPosts = getAllPosts();
  const { prev, next } = getAdjacentPosts(slug, allPosts);

  return (
    <article className="max-w-article">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>

      {post.series && <div className="eyebrow text-blue-600 mt-s-5">{post.series}</div>}
      <h1 className="text-h1 mt-2 mb-s-5">{post.title}</h1>
      {post.description && (
        <p className="text-lead text-ink-500 mb-s-6">{post.description}</p>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-s-3 mb-s-6">
          {post.tags.map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      )}

      <div className="hairline mb-s-6" />

      <MarkdownRenderer content={post.content} />

      <nav className="mt-s-8 flex justify-between gap-s-4 hairline pt-s-5 text-sm">
        <span>{prev && <Link href={`/posts/${prev.slug}/`}>← {prev.title}</Link>}</span>
        <span>{next && <Link href={`/posts/${next.slug}/`}>{next.title} →</Link>}</span>
      </nav>
    </article>
  );
}
```

**Step 2: 확인**

Run: `curl -s http://localhost:3000/posts/virtual-threads-hikaricp/ | grep -o '<h1[^<]*'`
Expected: 제목 텍스트 포함

Run: `curl -s http://localhost:3000/posts/virtual-threads-hikaricp/ | grep -c 'href="/posts/'`
Expected: `2` 이상 (prev/next)

Run: `curl -s http://localhost:3000/posts/virtual-threads-nmt/ | grep -o '2026-06-18'`
Expected: 아무 출력 없음

**Step 3: 커밋**

```bash
git add src/app/posts/
git commit -m "feat: add post detail page with tags and series navigation"
```

---

## Task 8: 태그 페이지

**Files:**
- Create: `src/app/tags/[tag]/page.tsx`

**Step 1: 구현**

```tsx
import Link from 'next/link';
import { getAllPosts, getAllTags, getPostsByTag } from '@/lib/posts';
import { PostRow } from '@/components/PostRow';

export function generateStaticParams() {
  const posts = getAllPosts();
  return getAllTags(posts).map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const posts = getAllPosts();
  const matched = getPostsByTag(posts, tag);

  return (
    <main>
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">#{tag}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      <div>
        {matched.map((post) => (
          <PostRow key={post.slug} post={post} />
        ))}
      </div>
    </main>
  );
}
```

**Step 2: 확인**

Run: `curl -s http://localhost:3000/tags/MongoDB/ | grep -c 'href="/posts/'`
Expected: `7` (MongoDB 태그가 붙은 포스트 수)

**Step 3: 커밋**

```bash
git add src/app/tags/
git commit -m "feat: add tag filter page"
```

---

## Task 9: 프로덕션 빌드 검증

**Step 1: export 빌드**

Run: `NEXT_PUBLIC_ENVIRONMENT=PRODUCTION npm run build`
Expected: `/`, `/posts/[slug]`(11개), `/tags/[tag]`(4개) 정적 페이지 생성, 에러 없음. `out/` 생성.

**Step 2: 페이지 개수 확인**

Run: `find out/posts -name 'index.html' | wc -l` → `11`
Run: `find out/tags -name 'index.html' | wc -l` → `4`

**Step 3: 날짜 미노출 최종 확인**

Run: `grep -rl '2026-06\|2026-07' out/ | grep -v '\.txt$'`
Expected: 아무 출력 없음 (날짜 문자열이 어떤 렌더링된 HTML에도 없어야 함)

문제가 있으면 앞 태스크로 돌아가 원인을 고친다. 이 태스크는 순수 검증 — 커밋 없음.

---

## Task 10: GitHub Pages 배포

**Step 1: 배포**

Run: `npm run deploy`
Expected: `gh-pages` 브랜치 푸시 완료

**Step 2: Pages 활성화 확인/설정**

Run: `gh api repos/kmando01/kmando01.github.io/pages 2>&1`
- 404면: `gh api repos/kmando01/kmando01.github.io/pages -X POST -f source[branch]=gh-pages -f source[path]=/`

**Step 3: 접속 확인**

Run: `curl -s -o /dev/null -w "%{http_code}" https://kmando01.github.io/`
Expected: `200` (반영까지 1~2분 걸릴 수 있음)

**Step 4: README 작성 + 커밋**

`README.md`:
```markdown
# kmando blog

🔗 https://kmando01.github.io

실험으로 검증한 기술 이야기를 씁니다.

원본 실험 기록은 [kmando01/tech-blog](https://github.com/kmando01/tech-blog)에 있습니다.
```

```bash
git add README.md
git commit -m "docs: add README with site link"
git push -u origin main
```

---

## 완료 기준

- [ ] `npm run build`(PRODUCTION) 성공 — `/`, 포스트 11개, 태그 4개 정적 페이지
- [ ] 홈 화면이 시리즈 3개(JVM 가상 스레드 실증 실험 / 분산 시스템 실증 실험 / MongoDB 실증 실험)로 그룹핑
- [ ] 리스트 좌측 컬럼에 EP.01 형태 배지, 날짜 문자열은 어디에도 없음
- [ ] 태그 페이지(`/tags/Java`, `/tags/MongoDB`, `/tags/Redis`, `/tags/Spring`)에서 해당 태그 글만 노출
- [ ] 상세 페이지 이전/다음 글 네비게이션 동작, 코드 블록 syntax highlighting 적용
- [ ] `https://kmando01.github.io` 실제 접속 확인
- [ ] `kmando01/tech-blog`는 전혀 수정되지 않음
