# 독서노트 책별 그룹핑 + 홈 자기소개 섹션 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `/categories/[category]/` 페이지가 홈 화면처럼 `series`(책 제목) 단위로 글을 그룹핑해서 보여주고, 홈 화면 최상단에 `blog-drafts/about.md`에서 가져온 자기소개 섹션이 (있을 때만) 표시되게 한다.

**Architecture:** 새 개념을 추가하지 않고 기존 `groupPostsBySeries()`/`SeriesHeader`/`PostRow` 조합을 카테고리 페이지에서 재사용한다. about 콘텐츠는 포스트 파이프라인과 완전히 분리된 `content/about.md` 경로로 동기화하고, 파일이 없으면 조용히 섹션을 생략하는 작은 헬퍼(`getAboutContent()`)로 읽는다.

**Tech Stack:** Next.js 15 (App Router, `output: 'export'`), TypeScript, Vitest, bash(sync 스크립트)

---

### Task 1: `getAboutContent()` 헬퍼

**Files:**
- Create: `src/lib/about.ts`
- Test: `src/lib/about.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/about.test.ts
import { describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getAboutContent } from './about';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'about-test-'));
}

describe('getAboutContent', () => {
  it('about.md가 있으면 파일 내용을 문자열로 반환한다', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'about.md'), '# 안녕하세요\n\n반갑습니다.');

    expect(getAboutContent(dir)).toBe('# 안녕하세요\n\n반갑습니다.');
  });

  it('about.md가 없으면 null을 반환한다', () => {
    const dir = makeTempDir();

    expect(getAboutContent(dir)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/lib/about.test.ts`
Expected: FAIL — `Cannot find module './about'` (파일이 아직 없음)

**Step 3: Write minimal implementation**

```typescript
// src/lib/about.ts
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// dir 파라미터는 테스트에서 임시 디렉터리를 주입하기 위한 것 — 실제 호출부(page.tsx)는
// 인자 없이 호출해서 항상 CONTENT_DIR(= <repo>/content)을 읽는다.
export function getAboutContent(dir: string = CONTENT_DIR): string | null {
  const filePath = path.join(dir, 'about.md');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- --run src/lib/about.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/about.ts src/lib/about.test.ts
git commit -m "feat: add getAboutContent helper for optional homepage intro"
```

---

### Task 2: `about.md`를 posts 파이프라인과 분리해서 동기화

**Files:**
- Modify: `scripts/sync-content.sh`

**Step 1: Read the current script**

`scripts/sync-content.sh`는 현재 이렇게 되어 있다 (전체 파일):

```bash
#!/usr/bin/env bash
set -euo pipefail
DRAFTS_DIR="${BLOG_DRAFTS_DIR:-/Users/mando/blog-drafts}"
if [ ! -d "$DRAFTS_DIR" ]; then
  echo "blog-drafts directory not found at $DRAFTS_DIR" >&2
  exit 1
fi
mkdir -p posts
find posts -maxdepth 1 -name '*.md' -delete
cp "$DRAFTS_DIR"/*.md posts/
echo "Synced $(ls posts/*.md | wc -l | tr -d ' ') post(s) from $DRAFTS_DIR"
```

이 스크립트가 `blog-drafts/*.md`를 전부 `posts/`로 복사하기 때문에, `about.md`를 `blog-drafts`에 그냥 두면 `getAllPosts()`가 이걸 포스트로 읽으려다 필수 frontmatter(title/date) 누락으로 빌드가 깨진다. `about.md`만 별도로 `content/about.md`에 복사하도록 분리한다.

**Step 2: Edit the script**

`echo "Synced ..."` 줄 앞에 아래 블록을 추가한다:

```bash
mkdir -p posts
find posts -maxdepth 1 -name '*.md' -delete
# about.md는 포스트가 아니므로 posts/ 글로브에 포함시키지 않고 별도 경로로 복사한다.
cp "$DRAFTS_DIR"/*.md posts/
if [ -f "$DRAFTS_DIR/about.md" ]; then
  rm -f posts/about.md
  mkdir -p content
  cp "$DRAFTS_DIR/about.md" content/about.md
fi
echo "Synced $(ls posts/*.md | wc -l | tr -d ' ') post(s) from $DRAFTS_DIR"
```

`cp "$DRAFTS_DIR"/*.md posts/`가 `about.md`도 일단 `posts/`에 복사해버리므로, `about.md`가 존재하는 경우 `posts/about.md`를 지우고 `content/about.md`로 옮겨 쓴다. (이 머신은 `rm`이 포함된 모든 Bash 명령을 거부하는 permission rule이 있으니, `rm -f posts/about.md`는 Claude Code가 직접 실행할 땐 `find posts -maxdepth 1 -name 'about.md' -delete`로 바꿔서 실행할 것 — 스크립트 파일 자체에 `rm -f`를 적는 것은 스크립트가 bash로 직접 실행될 때 문제 없으므로 그대로 둬도 된다.)

**Step 3: Verify manually (no automated test — this is a shell script touching the filesystem)**

```bash
mkdir -p /tmp/fake-drafts
echo "테스트 소개" > /tmp/fake-drafts/about.md
echo "---
title: 더미 글
date: 2026-01-01
---
본문" > /tmp/fake-drafts/dummy-post.md

cd /Users/mando/kssumin.github.io
BLOG_DRAFTS_DIR=/tmp/fake-drafts bash scripts/sync-content.sh
cat content/about.md   # "테스트 소개"가 출력되어야 함
ls posts/               # dummy-post.md만 있어야 함 (about.md는 없어야 함)
```

Expected: `content/about.md`가 생성되고 "테스트 소개"를 담고 있음. `posts/`에는 `about.md`가 없음.

**Step 4: Clean up the manual test artifacts**

```bash
find posts -maxdepth 1 -name 'dummy-post.md' -delete
find content -maxdepth 1 -name 'about.md' -delete
find /tmp/fake-drafts -type f -delete
```

**Step 5: Commit**

```bash
git add scripts/sync-content.sh
git commit -m "feat: sync about.md to content/ separately from the posts pipeline"
```

---

### Task 3: 홈 화면에 자기소개 섹션 삽입

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Read the current file**

```tsx
import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export default function HomePage() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = groupPostsBySeries(posts);

  return (
    <main className="max-w-reading">
      <h1 className="text-h1 mb-s-8">기술 블로그</h1>

      {groups.map((group, index) => (
        <section
          key={group.series ?? group.posts[0].slug}
          className={index === 0 ? '' : 'mt-s-9'}
        >
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

**Step 2: Edit the file**

`about`가 있을 때만 제목 아래·시리즈 목록 위에 렌더링하고, 구분선(`hairline`)으로 나눈다:

```tsx
import { getAllPosts, getPublishedPosts, groupPostsBySeries } from '@/lib/posts';
import { getAboutContent } from '@/lib/about';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

export default function HomePage() {
  const posts = getPublishedPosts(getAllPosts());
  const groups = groupPostsBySeries(posts);
  const about = getAboutContent();

  return (
    <main className="max-w-reading">
      <h1 className="text-h1 mb-s-8">기술 블로그</h1>

      {about && (
        <div className="mb-s-9">
          <MarkdownRenderer content={about} />
          <div className="hairline mt-s-8" />
        </div>
      )}

      {groups.map((group, index) => (
        <section
          key={group.series ?? group.posts[0].slug}
          className={index === 0 ? '' : 'mt-s-9'}
        >
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

`about.md`가 없는 상태(지금 `content/` 디렉터리는 비어 있음)에서는 `about`이 `null`이라 이 블록 전체가 렌더링되지 않는다 — 기존 화면과 동일하게 유지된다.

**Step 3: Verify nothing broke when about.md is absent**

Run: `npm run test -- --run` (전체 스위트)
Expected: 기존 20개 테스트 전부 PASS (Task 1에서 추가한 2개 포함)

**Step 4: Manually verify the about section renders when present**

```bash
mkdir -p /Users/mando/kssumin.github.io/content
echo "## 안녕하세요, kssumin입니다

MongoDB/Redis/JVM 실험을 좋아하는 백엔드 엔지니어입니다." > /Users/mando/kssumin.github.io/content/about.md

cd /Users/mando/kssumin.github.io
npm run dev
```

브라우저(또는 Playwright)로 `http://localhost:3000`을 열어서 제목 아래에 자기소개 섹션과 구분선이 보이는지 확인한다. 확인 후 개발 서버를 끄고:

```bash
find /Users/mando/kssumin.github.io/content -maxdepth 1 -name 'about.md' -delete
```

(실제 배포용 `content/about.md`는 `npm run deploy`의 `predeploy` 훅이 Task 2의 스크립트로 자동 생성하므로, 로컬에 수동으로 남겨둘 필요가 없다 — 이 파일은 `.gitignore`에 이미 포함된 `content/` 아래에 있어서 커밋되지도 않는다.)

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: render optional about section at top of homepage"
```

---

### Task 4: 독서노트 카테고리 페이지 책별 그룹핑

**Files:**
- Modify: `src/app/categories/[category]/page.tsx`

**Step 1: Read the current file**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllCategories, getPostsByCategory, getPublishedPosts } from '@/lib/posts';
import { PostRow } from '@/components/PostRow';

// ... generateStaticParams 동일 ...

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const posts = getPublishedPosts(getAllPosts());
  const matched = getPostsByCategory(posts, category).sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : 0
  );

  if (matched.length === 0) notFound();

  return (
    <main className="max-w-reading">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">{category}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      <div>
        {matched.map((post) => (
          <PostRow key={post.slug} post={post} showEpisode={false} />
        ))}
      </div>
    </main>
  );
}
```

**Step 2: Edit the file**

날짜순 flat 리스트 대신 홈 화면과 동일하게 `groupPostsBySeries()`로 묶는다. `series`가 있는 글(예: 독서노트 카테고리에서 책 제목을 `series`로 쓴 글)은 책 단위로, `series`가 없는 글(단발성 학습정리 등)은 지금처럼 개별로 표시된다:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllPosts,
  getAllCategories,
  getPostsByCategory,
  getPublishedPosts,
  groupPostsBySeries,
} from '@/lib/posts';
import { SeriesHeader } from '@/components/SeriesHeader';
import { PostRow } from '@/components/PostRow';

// ... generateStaticParams 동일 (수정 없음) ...

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const posts = getPublishedPosts(getAllPosts());
  const matched = getPostsByCategory(posts, category);

  if (matched.length === 0) notFound();

  const groups = groupPostsBySeries(matched);

  return (
    <main className="max-w-reading">
      <Link href="/" className="text-sm text-ink-500 hover:underline">
        ← 목록으로
      </Link>
      <h1 className="text-h1 mt-s-5 mb-s-2">{category}</h1>
      <p className="eyebrow mb-s-7">{matched.length} POSTS</p>

      {groups.map((group, index) => (
        <section
          key={group.series ?? group.posts[0].slug}
          className={index === 0 ? '' : 'mt-s-9'}
        >
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

바뀐 점 요약:
- 수동 `date` 정렬을 제거했다 — `groupPostsBySeries()`가 그룹을 `latestDate` 내림차순으로, 그룹 내부는 `order` 오름차순으로 이미 정렬해준다.
- `PostRow`에 넘기던 `showEpisode={false}`를 제거했다 — 이제 카테고리 페이지도 홈 화면처럼 책(시리즈) 단위로 묶이므로 `EP.01` 배지가 다시 의미를 가진다(기본값 `true`를 그대로 씀).

**Step 3: Run the full test suite**

Run: `npm run test -- --run`
Expected: 기존 테스트 전부 PASS. (`groupPostsBySeries()` 자체의 정렬/그룹핑 동작은 `src/lib/posts.test.ts`에 이미 커버되어 있으므로, 이 페이지 레벨 변경에 대한 새 유닛 테스트는 추가하지 않는다 — 아래 Step 4의 수동 확인으로 충분하다.)

**Step 4: Manually verify book grouping with temporary fixture posts**

지금 `blog-drafts`에는 `독서노트` 카테고리 글이 없으므로, 로컬에서만 임시 더미 포스트 2개를 만들어 확인한다(커밋하지 않음):

```bash
cat > /Users/mando/kssumin.github.io/posts/temp-book-1.md << 'EOF'
---
title: "1장. 임시 테스트"
date: "2026-07-05"
series: "테스트책"
order: 1
tags: []
category: "독서노트"
draft: false
description: "그룹핑 확인용 임시 글"
---
본문.
EOF

cat > /Users/mando/kssumin.github.io/posts/temp-book-2.md << 'EOF'
---
title: "2장. 임시 테스트"
date: "2026-07-06"
series: "테스트책"
order: 2
tags: []
category: "독서노트"
draft: false
description: "그룹핑 확인용 임시 글"
---
본문.
EOF

npm run dev
```

브라우저(또는 Playwright)로 `http://localhost:3000/categories/독서노트/`를 열어서 "테스트책"이라는 `SeriesHeader` 아래에 1장/2장이 `EP.01`/`EP.02` 배지와 함께 묶여 보이는지 확인한다.

**Step 5: Clean up the temporary fixtures**

```bash
find /Users/mando/kssumin.github.io/posts -maxdepth 1 -name 'temp-book-*.md' -delete
```

(`posts/`는 `.gitignore`에 있으므로 애초에 커밋될 위험은 없지만, `npm run dev`를 계속 켜둔 상태로 다음 작업을 하면 홈 화면 등에도 더미 글이 계속 보이므로 확인이 끝나면 바로 지운다.)

**Step 6: Commit**

```bash
git add src/app/categories/\[category\]/page.tsx
git commit -m "feat: group category page posts by series (book) like the homepage"
```

---

### Task 5: 전체 검증 및 배포 전 최종 점검

**Files:** 없음 (검증만)

**Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 2: Full test suite**

Run: `npm run test -- --run`
Expected: 모든 테스트 PASS (Task 1에서 추가한 2개 포함, 총 20개)

**Step 3: Production build**

Run: `npm run build`
Expected: 정적 export가 에러 없이 완료됨. `content/about.md`가 없는 상태로 빌드해도(로컬 개발 중 지워뒀으므로) 실패하지 않는지 반드시 확인 — about 섹션이 optional이라는 설계의 핵심 전제다.

**Step 4: 실제 콘텐츠 작성은 이 플랜의 범위 밖**

`blog-drafts/about.md` 작성이나 `독서노트` 카테고리의 실제 책 리뷰 글 작성은 별도 작업이다. 이 플랜은 기능(코드) 구현까지만 다룬다. 실제로 화면에 반영하려면:
- 자기소개: `blog-drafts/about.md`를 작성해서 push
- 책별 그룹핑: `blog-drafts`의 독서노트 글에 `series`(책 제목)/`order`(챕터 순서) 채워서 push
- 이후 `kssumin.github.io`에서 `npm run deploy`
